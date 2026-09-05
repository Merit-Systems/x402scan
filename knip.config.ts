import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      entry: [
        "foundation.config.ts",
        "oxfmt.config.ts",
        "oxlint.config.ts",
        "taze.config.ts",
      ],
      ignoreDependencies: ["@merit-systems/typescript-config"],
    },
    "apps/scan": {
      entry: [
        "oxlint.config.ts",
        "src/app/**/{error,layout,loading,not-found,page,template,default,forbidden,global-not-found,global-error}.{js,jsx,ts,tsx,mdx}",
        "src/app/**/route.{js,jsx,ts,tsx}",
      ],
      project: ["src/**/*.{ts,tsx,mdx}", "*.{ts,tsx,js,mjs}"],
      ignoreDependencies: [
        "@merit-systems/brand",
        "postcss",
        "redis",
        "shadcn",
        "tailwindcss",
        "tw-animate-css",
      ],
      ignore: [
        "src/scripts/**",
        "src/app/(app)/(home)/_components/v2-announcement-banner.tsx",
      ],
    },
    "apps/proxy": {
      entry: ["oxlint.config.ts"],
    },
    "apps/rpcs/solana": {
      entry: ["oxlint.config.mts"],
    },
    "packages/external/facilitators": {
      entry: ["oxlint.config.ts"],
      project: ["src/**/*.ts"],
    },
    "packages/internal/databases/scan": {
      entry: ["oxlint.config.ts"],
      project: ["src/**/*.ts"],
      ignoreDependencies: ["rimraf", "@prisma/client"],
      ignore: ["generated/**"],
    },
    "packages/internal/databases/partners": {
      entry: ["oxlint.config.ts", "src/index.ts"],
      project: ["src/**/*.ts"],
    },
    "packages/internal/databases/transfers": {
      entry: ["oxlint.config.mts"],
      project: ["src/**/*.ts"],
      ignoreDependencies: ["rimraf", "@prisma/client"],
      ignore: ["generated/**"],
    },
    "packages/internal/neverthrow": {
      entry: ["oxlint.config.ts"],
    },
    "sync/transfers": {
      entry: ["oxlint.config.mts", "trigger/**/*.ts", "db/**/*.ts"],
      project: ["trigger/**/*.ts", "db/**/*.ts"],
      ignoreDependencies: ["p-limit", "@trigger.dev/build"],
      ignore: ["generated/**"],
    },
    "sync/alerts": {
      entry: ["oxlint.config.mts", "trigger/**/*.ts"],
      project: ["trigger/**/*.ts"],
      ignoreDependencies: ["@trigger.dev/build"],
    },
  },
  ignore: [
    "**/*.test.{ts,tsx,js,jsx}",
    "**/*.spec.{ts,tsx,js,jsx}",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/node_modules/**",
    "**/generated/**",
    "**/*.d.ts",
    ".github/**",
    "packages/internal/configurations/typescript/**",
  ],
  // Registry-owned components intentionally expose the complete Foundation API.
  ignoreIssues: {
    "apps/scan/src/components/ui/{accordion,alert-dialog,avatar,badge,button,button-group,card,collapsible,command,copy-button,data-list,data-table,dialog,dropdown-menu,field,input-group,input,interactive-row,label,logo,motion-tabs,origin-avatar,origin-summary,responsive-view,select,separator,sheet,sidebar,skeleton,sonner,spinner,stats-card,table,tabs,textarea,tooltip,typeset}.tsx":
      ["exports", "types"],
    "apps/scan/src/components/ui/chart/*.{ts,tsx}": ["exports", "types"],
    "apps/scan/src/components/ai-elements/{conversation,message,prompt-input,reasoning,shimmer,tool}.tsx":
      ["exports", "types"],
    "apps/scan/src/components/responsive-collection.tsx": ["types"],
  },
};

export default config;
