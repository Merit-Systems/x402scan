import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      entry: [
        "foundation.config.ts",
        "oxfmt.config.ts",
        "taze.config.ts",
        "tools/oxlint/anti-slop/index.ts",
      ],
      project: ["tools/oxlint/**/*.ts"],
      ignoreDependencies: [
        "@merit-systems/oxlint-config",
        "@merit-systems/typescript-config",
      ],
    },
    "apps/scan": {
      entry: [
        "src/app/**/{error,layout,loading,not-found,page,template,default,forbidden,global-not-found,global-error}.{js,jsx,ts,tsx}",
        "src/app/**/route.{js,jsx,ts,tsx}",
      ],
      project: ["src/**/*.{ts,tsx}", "*.{ts,tsx,js,mjs}"],
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
        "src/components/ui/charts/chart/**",
        "src/app/(app)/(home)/_components/v2-announcement-banner.tsx",
      ],
    },
    "apps/proxy": {},
    "apps/rpcs/solana": {},
    "packages/external/facilitators": {
      project: ["src/**/*.ts"],
    },
    "packages/internal/databases/scan": {
      project: ["src/**/*.ts"],
      ignoreDependencies: ["rimraf", "@prisma/client"],
      ignore: ["generated/**"],
    },
    "packages/internal/databases/partners": {
      project: ["src/**/*.ts"],
    },
    "packages/internal/databases/transfers": {
      project: ["src/**/*.ts"],
      ignoreDependencies: ["rimraf", "@prisma/client"],
      ignore: ["generated/**"],
    },
    "sync/transfers": {
      entry: ["trigger/**/*.ts", "db/**/*.ts"],
      project: ["trigger/**/*.ts", "db/**/*.ts"],
      ignoreDependencies: ["p-limit", "@trigger.dev/build"],
      ignore: ["generated/**"],
    },
    "sync/alerts": {
      entry: ["trigger/**/*.ts"],
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
    "apps/scan/src/components/ui/{accordion,alert-dialog,avatar,badge,button,card,collapsible,command,copy-button,data-list,data-table,dialog,dropdown-menu,field,input-group,input,interactive-row,label,motion-tabs,responsive-view,select,separator,sheet,skeleton,sonner,spinner,table,tabs,textarea,tooltip}.tsx":
      ["exports", "types"],
    "apps/scan/src/components/responsive-collection.tsx": ["types"],
  },
};

export default config;
