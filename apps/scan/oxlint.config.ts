import next from "@merit-systems/oxlint-config/next";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [next],
  settings: {
    tailwindcss: {
      entryPoint: "src/app/globals.css",
    },
  },
});
