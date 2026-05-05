-- Store arbitrary x402 payment schemes instead of constraining to the v1-only
-- AcceptsScheme enum.
ALTER TABLE "public"."Accepts"
  ALTER COLUMN "scheme" TYPE TEXT USING "scheme"::text;

DROP TYPE "public"."AcceptsScheme";
