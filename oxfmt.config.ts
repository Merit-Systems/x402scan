import { createOxfmtConfig } from "@merit-systems/oxfmt-config";

export default createOxfmtConfig({
  workspacePrefixes: ["@x402scan/", "facilitators"],
  tailwindStylesheet: "./apps/scan/src/app/globals.css",
});
