// foundation:cursor-install:v1

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { constants, existsSync } from "node:fs";
import {
  access,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

if (process.platform === "linux" && process.env.CURSOR_AGENT_SOCKET) {
  const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
  await selectRepositoryNode(repositoryRoot);
  const corepack = join(dirname(process.execPath), "corepack");
  await access(corepack, constants.X_OK).catch(() => {
    throw new Error(
      "Cursor package setup requires Corepack in the selected Node installation."
    );
  });
  run(corepack, [
    "enable",
    "--install-directory",
    await writablePathDirectory(),
  ]);
  const packageBootstrap = join(repositoryRoot, ".foundation/install.mjs");
  if (existsSync(packageBootstrap)) {
    run(process.execPath, [packageBootstrap]);
    process.exit(0);
  }
  const installEnvironment = { ...process.env };
  delete installEnvironment.CURSOR_AGENT_SOCKET;
  delete installEnvironment.MERIT_CODEX_BOOTSTRAP_CREDENTIAL;
  delete installEnvironment.VERCEL_OIDC_TOKEN;
  run("pnpm", ["install", "--frozen-lockfile"], installEnvironment);
}

async function selectRepositoryNode(repositoryRoot) {
  const requested = (
    await readFile(join(repositoryRoot, ".node-version"), "utf8")
  ).trim();
  const majorMatch = /^(\d+)(?:\.x)?$/.exec(requested);
  const exactMatch = /^v?(\d+\.\d+\.\d+)$/.exec(requested);
  if (!majorMatch && !exactMatch) {
    throw new Error(`Unsupported .node-version value: ${requested}`);
  }
  if (
    (majorMatch && process.versions.node.split(".")[0] === majorMatch[1]) ||
    (exactMatch && process.versions.node === exactMatch[1])
  ) {
    return;
  }

  const linkDirectory = await writablePathDirectory(true);

  if (!["x64", "arm64"].includes(process.arch)) {
    throw new Error(`Unsupported Node platform: linux-${process.arch}.`);
  }
  const version = exactMatch?.[1] ?? (await latestNodeVersion(majorMatch[1]));
  const installation = join(homedir(), ".local/share/foundation/node", version);
  const selectedNode = join(installation, "bin/node");
  try {
    await access(selectedNode, constants.X_OK);
  } catch {
    await installNode(version, installation);
  }
  await access(selectedNode, constants.X_OK);
  for (const command of ["node", "npm", "npx", "corepack"]) {
    const link = join(linkDirectory, command);
    const target = join(installation, "bin", command);
    try {
      await lstat(link);
      const existing = await readlink(link).catch(() => undefined);
      if (existing === target) continue;
      if (
        !existing?.startsWith(
          join(homedir(), ".local/share/foundation/node") + "/"
        )
      ) {
        throw new Error(
          `Refusing to replace non-Foundation PATH entry ${link}.`
        );
      }
      await rm(link);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await symlink(target, link);
  }
  run(join(installation, "bin/corepack"), [
    "enable",
    "--install-directory",
    linkDirectory,
  ]);
  const result = spawnSync(selectedNode, process.argv.slice(1), {
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

async function writablePathDirectory(beforeCurrentNode = false) {
  const paths = (process.env.PATH ?? "").split(":");
  const currentDirectory = dirname(process.execPath);
  const currentIndex = paths.findIndex(
    (path) => resolve(path || ".") === currentDirectory
  );
  const candidates = beforeCurrentNode
    ? paths.slice(0, currentIndex < 0 ? 0 : currentIndex)
    : paths;
  for (const path of candidates) {
    if (!path) continue;
    try {
      await access(path, constants.W_OK);
      return path;
    } catch {
      // Try the next PATH entry before the currently selected Node.
    }
  }
  throw new Error(
    beforeCurrentNode
      ? `Cannot select Node: no writable PATH directory precedes ${process.execPath}.`
      : "Cannot expose pnpm: no writable PATH directory is available."
  );
}

async function latestNodeVersion(major) {
  const response = await fetch("https://nodejs.org/dist/index.json");
  if (!response.ok)
    throw new Error(`Could not list Node releases (${response.status}).`);
  const releases = await response.json();
  const versions = releases
    .map((release) => /^v(\d+)\.(\d+)\.(\d+)$/.exec(release.version))
    .filter((match) => match?.[1] === major)
    .map((match) => [Number(match[1]), Number(match[2]), Number(match[3])]);
  versions.sort((left, right) => right[1] - left[1] || right[2] - left[2]);
  if (!versions[0]) throw new Error(`No Node ${major} release was found.`);
  return versions[0].join(".");
}

async function installNode(version, installation) {
  const archiveName = `node-v${version}-linux-${process.arch}.tar.gz`;
  const origin = `https://nodejs.org/dist/v${version}`;
  const [archiveResponse, sumsResponse] = await Promise.all([
    fetch(`${origin}/${archiveName}`),
    fetch(`${origin}/SHASUMS256.txt`),
  ]);
  if (!archiveResponse.ok || !sumsResponse.ok) {
    throw new Error(
      `Could not download Node ${version} for linux-${process.arch}.`
    );
  }
  const archive = Buffer.from(await archiveResponse.arrayBuffer());
  const checksum = (await sumsResponse.text())
    .split("\n")
    .find((line) => line.endsWith(`  ${archiveName}`))
    ?.split(" ")[0];
  if (
    !checksum ||
    createHash("sha256").update(archive).digest("hex") !== checksum
  ) {
    throw new Error(`Node ${version} download failed checksum verification.`);
  }

  const parent = dirname(installation);
  await mkdir(parent, { recursive: true });
  const temporary = await mkdtemp(join(parent, `.node-${version}-`));
  try {
    const archivePath = join(temporary, archiveName);
    const extracted = join(temporary, "extracted");
    await mkdir(extracted);
    await writeFile(archivePath, archive);
    const result = spawnSync("tar", ["-xzf", archivePath, "-C", extracted]);
    if (result.error || result.status !== 0) {
      throw new Error(
        `Could not extract Node ${version}: ${result.error?.message ?? result.stderr?.toString() ?? result.status}`
      );
    }
    try {
      await rename(join(extracted, archiveName.slice(0, -7)), installation);
    } catch (error) {
      if (error.code !== "EEXIST" && error.code !== "ENOTEMPTY") throw error;
    }
  } finally {
    await rm(temporary, { force: true, recursive: true });
  }
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} failed with status ${String(result.status)}.`);
  }
}
