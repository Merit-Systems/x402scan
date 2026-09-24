// foundation:package-install:v1
// Standalone because hosted package setup runs before dependencies exist.
/* eslint-disable merit-core/no-runtime-typeof -- The pre-install bootstrap cannot import a schema library. */

import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";

const broker = "https://credentials.merit.engineering";
// Hosted identity is injected by the platform before dependencies can be installed.
// eslint-disable-next-line no-restricted-properties
const hostEnvironment = process.env;
const repository = readRepository();
const identity = await readIdentity();
const headers = {
  authorization: identity.token,
  "content-type": "application/json",
};
if (identity.trustedToken) {
  headers["x-vercel-trusted-oidc-idp-token"] = identity.trustedToken;
}
const response = await fetch(`${broker}/api/v1/auth/registry/session`, {
  body: JSON.stringify({ repository }),
  headers,
  method: "POST",
  redirect: "error",
  signal: AbortSignal.timeout(15_000),
});
if (!response.ok) {
  throw new Error(`Hosted package authorization failed (${response.status}).`);
}
const session = await response.json();
if (
  typeof session?.token !== "string" ||
  typeof session?.registry !== "string" ||
  session.registry !== `${broker}/api/v1/npm/`
) {
  throw new Error("The broker returned an invalid package session.");
}

const directory = await mkdtemp(join(tmpdir(), "merit-packages-"));
const userConfig = join(directory, ".npmrc");
const emptyConfig = join(directory, "empty.npmrc");
try {
  await writeFile(
    userConfig,
    `//credentials.merit.engineering/api/v1/npm/:_authToken=${session.token}\n`,
    { mode: 0o600 }
  );
  await writeFile(emptyConfig, "", { mode: 0o600 });
  const childEnvironment = sanitizedEnvironment();
  run(
    "pnpm",
    [
      `--config.@merit-systems:registry=${session.registry}`,
      "install",
      "--frozen-lockfile",
      "--ignore-scripts",
    ],
    { ...childEnvironment, NPM_CONFIG_USERCONFIG: userConfig }
  );
  run("pnpm", ["rebuild"], {
    ...childEnvironment,
    NPM_CONFIG_USERCONFIG: emptyConfig,
  });
} finally {
  await rm(directory, { force: true, recursive: true });
}

function readRepository() {
  const remote = spawnSync("git", ["config", "--get", "remote.origin.url"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (remote.status === 0) {
    const match =
      /^(?:git@github\.com:|https:\/\/github\.com\/)(Merit-Systems)\/([A-Za-z\d_.-]+?)(?:\.git)?$/i.exec(
        remote.stdout.trim()
      );
    if (match) return { owner: match[1], name: match[2] };
  }
  if (
    hostEnvironment.VERCEL_GIT_REPO_OWNER?.toLowerCase() === "merit-systems" &&
    /^[A-Za-z\d_.-]+$/.test(hostEnvironment.VERCEL_GIT_REPO_SLUG ?? "")
  ) {
    return {
      owner: hostEnvironment.VERCEL_GIT_REPO_OWNER,
      name: hostEnvironment.VERCEL_GIT_REPO_SLUG,
    };
  }
  throw new Error("Hosted package setup requires a Merit GitHub repository.");
}

async function readIdentity() {
  if (hostEnvironment.CURSOR_AGENT_SOCKET) {
    const token = await cursorToken(hostEnvironment.CURSOR_AGENT_SOCKET);
    return { token: `Bearer ${token}`, trustedToken: token };
  }
  if (hostEnvironment.MERIT_CODEX_BOOTSTRAP_CREDENTIAL) {
    return {
      token: `Foundation-Bootstrap ${hostEnvironment.MERIT_CODEX_BOOTSTRAP_CREDENTIAL}`,
    };
  }
  if (hostEnvironment.VERCEL_OIDC_TOKEN) {
    return {
      token: `Bearer ${hostEnvironment.VERCEL_OIDC_TOKEN}`,
      trustedToken: hostEnvironment.VERCEL_OIDC_TOKEN,
    };
  }
  throw new Error("No hosted package setup identity is available.");
}

function cursorToken(socketPath) {
  if (!isAbsolute(socketPath)) {
    throw new Error("CURSOR_AGENT_SOCKET must be an absolute path.");
  }
  const body = JSON.stringify({ aud: broker, sub_claim: "team_id" });
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      {
        agent: false,
        headers: {
          connection: "close",
          "content-length": Buffer.byteLength(body),
          "content-type": "application/json",
        },
        method: "POST",
        path: "/v1/tokens/oidc",
        socketPath,
      },
      (response) => {
        const chunks = [];
        let size = 0;
        response.on("data", (chunk) => {
          size += chunk.byteLength;
          if (size > 16 * 1024) {
            response.destroy();
            reject(new Error("Cursor identity response is too large."));
          } else {
            chunks.push(chunk);
          }
        });
        response.on("end", () => {
          try {
            if (response.statusCode !== 200) throw new Error();
            const token = JSON.parse(
              Buffer.concat(chunks).toString("utf8")
            ).token;
            if (typeof token !== "string" || token.split(".").length !== 3) {
              throw new Error();
            }
            resolve(token);
          } catch {
            reject(new Error("Cursor identity request failed."));
          }
        });
        response.on("error", () =>
          reject(new Error("Cursor identity request failed."))
        );
      }
    );
    request.setTimeout(5_000, () => request.destroy());
    request.on("error", () =>
      reject(new Error("Cursor identity request failed."))
    );
    request.end(body);
  });
}

function sanitizedEnvironment() {
  const environment = { ...hostEnvironment };
  delete environment.CURSOR_AGENT_SOCKET;
  delete environment.MERIT_CODEX_BOOTSTRAP_CREDENTIAL;
  delete environment.VERCEL_OIDC_TOKEN;
  delete environment.NODE_AUTH_TOKEN;
  delete environment.NPM_TOKEN;
  delete environment.NPM_AUTH_TOKEN;
  delete environment.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  delete environment.ACTIONS_ID_TOKEN_REQUEST_URL;
  return environment;
}

function run(command, arguments_, environment) {
  const result = spawnSync(command, arguments_, {
    env: environment,
    stdio: "inherit",
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} failed during hosted package setup.`);
  }
}
