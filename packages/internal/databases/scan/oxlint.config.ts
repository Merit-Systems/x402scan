import base from "@merit-systems/oxlint-config/base";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [base],
  overrides: [
    {
      // Node runs this script directly and requires the source .ts extension.
      files: ["scripts/wait-for-db.mjs"],
      rules: {
        "import/extensions": ["error", "ignorePackages", { ts: "always" }],
      },
    },
  ],
});
