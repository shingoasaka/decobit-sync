/*
  Warnings:

  - You are about to drop the column `affiliate_name` on the `AffiliateLink` table. All the data in the column will be lost.
  - You are about to drop the column `affiliateLinkName` on the `AspActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `affiliateLinkName` on the `AspClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `affiliateLinkName` on the `ClickLogSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `regex_pattern` on the `LinkMatcher` table. All the data in the column will be lost.
  - You are about to drop the column `target_dim` on the `LinkMatcher` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[asp_type,affiliate_link_name]` on the table `AffiliateLink` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[asp_type,affiliate_link_id,snapshot_date]` on the table `ClickLogSnapshot` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ad_account_id,asp_type,target_dim_id]` on the table `LinkMatcher` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `affiliate_link_name` to the `AffiliateLink` table without a default value. This is not possible if the table is not empty.
  - Made the column `affiliate_link_id` on table `AspActionLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `affiliate_link_id` on table `AspClickLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `affiliate_link_id` on table `ClickLogSnapshot` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `target_dim_id` to the `LinkMatcher` table without a default value. This is not possible if the table is not empty.
  - Made the column `affiliate_link_id` on table `LinkMatcher` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `match_type` on the `LinkMatcher` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `media_level` on the `LinkMatcher` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `UserPermissionRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "UserPermissionRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('AFFILIATE_LINK', 'REFERRER_URL');

-- CreateEnum
CREATE TYPE "MediaLevel" AS ENUM ('Campaign', 'AdGroup', 'Ad');

-- DropForeignKey
ALTER TABLE "AspActionLog" DROP CONSTRAINT "AspActionLog_affiliate_link_id_fkey";

-- DropForeignKey
ALTER TABLE "AspClickLog" DROP CONSTRAINT "AspClickLog_affiliate_link_id_fkey";

-- DropForeignKey
ALTER TABLE "ClickLogSnapshot" DROP CONSTRAINT "ClickLogSnapshot_affiliate_link_id_fkey";

-- DropForeignKey
ALTER TABLE "LinkMatcher" DROP CONSTRAINT "LinkMatcher_affiliate_link_id_fkey";

-- DropIndex
DROP INDEX "ClickLogSnapshot_asp_type_affiliateLinkName_snapshot_date_key";

-- AlterTable
ALTER TABLE "Ad" ALTER COLUMN "platform_ad_id" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "AffiliateLink" DROP COLUMN "affiliate_name",
ADD COLUMN     "affiliate_link_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AspActionLog" DROP COLUMN "affiliateLinkName",
ALTER COLUMN "affiliate_link_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "AspClickLog" DROP COLUMN "affiliateLinkName",
ALTER COLUMN "affiliate_link_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "ClickLogSnapshot" DROP COLUMN "affiliateLinkName",
ALTER COLUMN "affiliate_link_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "LinkMatcher" DROP COLUMN "regex_pattern",
DROP COLUMN "target_dim",
ADD COLUMN     "target_dim_id" INTEGER NOT NULL,
ALTER COLUMN "affiliate_link_id" SET NOT NULL,
DROP COLUMN "match_type",
ADD COLUMN     "match_type" "MatchType" NOT NULL,
DROP COLUMN "media_level",
ADD COLUMN     "media_level" "MediaLevel" NOT NULL;

-- AlterTable
ALTER TABLE "TikTokRawReportAdGroup" ALTER COLUMN "platform_adgroup_id" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL;

-- AlterTable
ALTER TABLE "UserPermissionRequest" DROP COLUMN "status",
ADD COLUMN     "status" "UserPermissionRequestStatus" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLink_asp_type_affiliate_link_name_key" ON "AffiliateLink"("asp_type", "affiliate_link_name");

-- CreateIndex
CREATE UNIQUE INDEX "ClickLogSnapshot_asp_type_affiliate_link_id_snapshot_date_key" ON "ClickLogSnapshot"("asp_type", "affiliate_link_id", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "LinkMatcher_ad_account_id_asp_type_target_dim_id_key" ON "LinkMatcher"("ad_account_id", "asp_type", "target_dim_id");

-- AddForeignKey
ALTER TABLE "AspActionLog" ADD CONSTRAINT "AspActionLog_affiliate_link_id_fkey" FOREIGN KEY ("affiliate_link_id") REFERENCES "AffiliateLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AspClickLog" ADD CONSTRAINT "AspClickLog_affiliate_link_id_fkey" FOREIGN KEY ("affiliate_link_id") REFERENCES "AffiliateLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClickLogSnapshot" ADD CONSTRAINT "ClickLogSnapshot_affiliate_link_id_fkey" FOREIGN KEY ("affiliate_link_id") REFERENCES "AffiliateLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkMatcher" ADD CONSTRAINT "LinkMatcher_affiliate_link_id_fkey" FOREIGN KEY ("affiliate_link_id") REFERENCES "AffiliateLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
