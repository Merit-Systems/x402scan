import { defineLibraryConfig } from "@merit-systems/tsdown-config";

export default defineLibraryConfig({
  entry: {
    index: "src/index.ts",
    types: "src/types.ts",
  },
  platform: "neutral",
  target: "es2022",
});
