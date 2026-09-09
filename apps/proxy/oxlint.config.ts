import base from "@merit-systems/oxlint-config/base";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [base],
  // tsc emits native Node ESM, which requires runtime .js extensions.
  rules: { "import/extensions": ["error", "ignorePackages", { js: "always" }] },
});
