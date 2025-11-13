-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "public"."ResourceType" AS ENUM ('http');

-- CreateEnum
CREATE TYPE "public"."AcceptsScheme" AS ENUM ('exact');

-- CreateEnum
CREATE TYPE "public"."AcceptsNetwork" AS ENUM ('base_sepolia', 'avalanche_fuji', 'base', 'sei', 'sei_testnet', 'avalanche', 'iotex', 'solana_devnet', 'solana');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "public"."Resources" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "type" "public"."ResourceType" NOT NULL,
    "x402Version" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "originId" TEXT NOT NULL,

    CONSTRAINT "Resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Accepts" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "scheme" "public"."AcceptsScheme" NOT NULL,
    "description" TEXT NOT NULL,
    "network" "public"."AcceptsNetwork" NOT NULL,
    "maxAmountRequired" BIGINT NOT NULL,
    "resource" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "payTo" TEXT NOT NULL,
    "maxTimeoutSeconds" INTEGER NOT NULL,
    "asset" TEXT NOT NULL,
    "outputSchema" JSONB,
    "extra" JSONB,

    CONSTRAINT "Accepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."News" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "favicon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResourceOrigin" (
    "id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "favicon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceOrigin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OgImage" (
    "id" TEXT NOT NULL,
    "originId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "height" INTEGER,
    "width" INTEGER,
    "title" TEXT,
    "description" TEXT,

    CONSTRAINT "OgImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Resources_resource_key" ON "public"."Resources"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "Accepts_resourceId_scheme_network_key" ON "public"."Accepts"("resourceId", "scheme", "network");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceOrigin_origin_key" ON "public"."ResourceOrigin"("origin");

-- CreateIndex
CREATE UNIQUE INDEX "OgImage_url_key" ON "public"."OgImage"("url");

-- CreateIndex
CREATE UNIQUE INDEX "OgImage_originId_url_key" ON "public"."OgImage"("originId", "url");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Resources" ADD CONSTRAINT "Resources_origin_fkey" FOREIGN KEY ("originId") REFERENCES "public"."ResourceOrigin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Accepts" ADD CONSTRAINT "Accepts_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OgImage" ADD CONSTRAINT "OgImage_origin_fkey" FOREIGN KEY ("originId") REFERENCES "public"."ResourceOrigin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
