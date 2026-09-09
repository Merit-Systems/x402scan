import { defineConfig } from "@merit-systems/foundation";

export default defineConfig({
  schemaVersion: 1,
  profiles: ["base", "pnpm-workspace", "next", "ui", "library", "service"],
  units: [
    {
      path: "apps/proxy",
      kind: "service",
      capabilities: ["build", "dev-server", "start", "types"],
    },
    {
      path: "apps/rpcs/solana",
      kind: "service",
      capabilities: ["deploy", "dev-server", "types"],
    },
    {
      path: "apps/scan",
      kind: "service",
      capabilities: ["build", "dev-server", "start", "test", "types", "ui"],
    },
    {
      path: "packages/external/facilitators",
      kind: "library",
      capabilities: ["build", "publish", "types"],
    },
    {
      path: "packages/internal/databases/partners",
      kind: "library",
      capabilities: ["build", "types"],
    },
    {
      path: "packages/internal/databases/scan",
      kind: "library",
      capabilities: ["types"],
      generated: [
        { path: "generated", generator: "db:generate", policy: "ephemeral" },
      ],
    },
    {
      path: "packages/internal/databases/transfers",
      kind: "library",
      capabilities: ["types"],
      generated: [
        { path: "generated", generator: "db:generate", policy: "ephemeral" },
      ],
    },
    {
      path: "packages/internal/neverthrow",
      kind: "library",
      capabilities: ["build", "types"],
    },
    {
      path: "sync/alerts",
      kind: "service",
      capabilities: ["deploy", "types"],
      generated: [
        {
          path: ".trigger",
          generator: "deploy",
          policy: "ephemeral",
        },
      ],
    },
    {
      path: "sync/transfers",
      kind: "service",
      capabilities: ["deploy", "test", "types"],
      generated: [
        {
          path: ".trigger",
          generator: "deploy",
          policy: "ephemeral",
        },
      ],
    },
  ],
  ui: {
    stylesheets: ["src/app/globals.css"],
  },
  development: { managed: false },
});
