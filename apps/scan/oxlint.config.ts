import next from "@merit-systems/oxlint-config/next";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [next],
  // Keep Foundation's adoption warnings visible while existing callsites move
  // to the registry variants; errors remain blocking.
  options: { denyWarnings: false },
  settings: {
    tailwindcss: {
      entryPoint: "src/app/globals.css",
    },
  },
});
