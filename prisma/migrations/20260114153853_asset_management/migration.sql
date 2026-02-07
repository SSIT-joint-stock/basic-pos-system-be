/*
  Warnings:

  - You are about to drop the column `providerId` on the `user` table. All the data in the column will be lost.
  - The `provider` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."provider_type" AS ENUM ('GOOGLE', 'FACEBOOK', 'GITHUB', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."AssetVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'TEMP');

-- CreateEnum
CREATE TYPE "public"."AssetAction" AS ENUM ('READ', 'WRITE', 'DELETE');

-- AlterTable
ALTER TABLE "public"."user" DROP COLUMN "providerId",
ADD COLUMN     "provider_id" TEXT,
DROP COLUMN "provider",
ADD COLUMN     "provider" "public"."provider_type" DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "public"."asset" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "visibility" "public"."AssetVisibility" NOT NULL DEFAULT 'PUBLIC',
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."asset_permission" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "public"."AssetAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."asset_link" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_storeId_idx" ON "public"."asset"("storeId");

-- CreateIndex
CREATE INDEX "asset_storeId_visibility_idx" ON "public"."asset"("storeId", "visibility");

-- CreateIndex
CREATE INDEX "asset_storeId_createdBy_idx" ON "public"."asset"("storeId", "createdBy");

-- CreateIndex
CREATE INDEX "asset_storeId_deletedAt_idx" ON "public"."asset"("storeId", "deletedAt");

-- CreateIndex
CREATE INDEX "asset_storeId_expiresAt_idx" ON "public"."asset"("storeId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "asset_storeId_storageKey_key" ON "public"."asset"("storeId", "storageKey");

-- CreateIndex
CREATE INDEX "asset_permission_storeId_userId_idx" ON "public"."asset_permission"("storeId", "userId");

-- CreateIndex
CREATE INDEX "asset_permission_storeId_assetId_idx" ON "public"."asset_permission"("storeId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_permission_storeId_assetId_userId_action_key" ON "public"."asset_permission"("storeId", "assetId", "userId", "action");

-- CreateIndex
CREATE INDEX "asset_link_storeId_entityType_entityId_idx" ON "public"."asset_link"("storeId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "asset_link_storeId_assetId_idx" ON "public"."asset_link"("storeId", "assetId");

-- AddForeignKey
ALTER TABLE "public"."asset_permission" ADD CONSTRAINT "asset_permission_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_link" ADD CONSTRAINT "asset_link_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
