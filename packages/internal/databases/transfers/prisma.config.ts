import "dotenv/config";
import { defineConfig } from "prisma/config";
import { env } from "./src/env";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env.TRANSFERS_DB_URL ?? "",
  },
});
