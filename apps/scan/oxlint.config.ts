import next from "@merit-systems/oxlint-config/next";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [next],
  rules: {
    // AI Elements uses these as group/prose markers, not Tailwind utilities.
    "tailwindcss/no-unknown-classes": [
      "warn",
      {
        ignorePrefixes: ["type-"],
        allowlist: ["is-assistant", "is-user", "not-prose"],
      },
    ],
  },
  overrides: [
    {
      // Mirror Foundation registry's AI Elements composition boundary. These
      // exact installed sources are independently enforced by ui:integrity;
      // application callsites must still use the primitives' public variants.
      files: [
        "src/components/ai-elements/conversation.tsx",
        "src/components/ai-elements/message.tsx",
        "src/components/ai-elements/prompt-input.tsx",
        "src/components/ai-elements/reasoning.tsx",
        "src/components/ai-elements/tool.tsx",
      ],
      rules: {
        "merit-brand/no-visual-component-overrides": "off",
      },
    },
    {
      // Foundation's prompt input owns the hidden native file picker.
      files: ["src/components/ai-elements/prompt-input.tsx"],
      rules: { "merit-brand/no-raw-interactive-elements": "off" },
    },
  ],
  settings: {
    tailwindcss: {
      entryPoint: "src/app/globals.css",
    },
  },
});
