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
    sourceIntegrity: {
      deviations: [
        {
          item: "accordion",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "alert-dialog",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "avatar",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "badge",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "button",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "card",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "collapsible",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "command",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "conversation",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "copy-button",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "dialog",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "dropdown-menu",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "field",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "input",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "label",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "message",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "prompt-input",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "reasoning",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "select",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "separator",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "sheet",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "skeleton",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "sonner",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "table",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "tabs",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "textarea",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "tool",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
        {
          item: "tooltip",
          reason:
            "Existing x402scan source must migrate independently with its callsites and behavior verified.",
          owner: "x402scan maintainers",
          expires: "2027-03-01",
        },
      ],
    },
  },
  development: { managed: false },
});
