/*
  Warnings:

  - You are about to drop the column `platform_name` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `currentTotalClicks` on the `ClickLogSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `opt_status` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `status_updated_time` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `is_smart_performance_campaign` on the `TikTokRawReportCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `opt_status` on the `TikTokRawReportCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `TikTokRawReportCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `status_updated_time` on the `TikTokRawReportCampaign` table. All the data in the column will be lost.
  - You are about to drop the `AdGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TikTokRawReportAdGroup` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[platform_ad_id]` on the table `Ad` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[platform_campaign_id]` on the table `Campaign` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ad_account_id,asp_type,target_dim_id]` on the table `LinkMatcher` will be added. If there are existing duplicate values, this will fail.
  - Made the column `department_id` on table `AdAccount` required. This step will fail if there are existing NULL values in that column.
  - Made the column `project_id` on table `AdAccount` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `category` to the `AdPlatformDisplaySetting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campaign_name` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_total_clicks` to the `ClickLogSnapshot` table without a default value. This is not possible if the table is not empty.
  - Made the column `ad_url` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Ad" DROP CONSTRAINT "Ad_adgroup_id_fkey";

-- DropForeignKey
ALTER TABLE "AdAccount" DROP CONSTRAINT "AdAccount_department_id_fkey";

-- DropForeignKey
ALTER TABLE "AdAccount" DROP CONSTRAINT "AdAccount_project_id_fkey";

-- DropForeignKey
ALTER TABLE "AdGroup" DROP CONSTRAINT "AdGroup_ad_account_id_fkey";

-- DropForeignKey
ALTER TABLE "AdGroup" DROP CONSTRAINT "AdGroup_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "TikTokRawReportAdGroup" DROP CONSTRAINT "TikTokRawReportAdGroup_ad_account_id_fkey";

-- DropIndex
DROP INDEX "AdAccount_name_key";

-- DropIndex
DROP INDEX "LinkMatcher_ad_account_id_asp_type_media_level_target_dim_i_key";

-- AlterTable
ALTER TABLE "Ad" ALTER COLUMN "created_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AdAccount" ALTER COLUMN "department_id" SET NOT NULL,
ALTER COLUMN "project_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "AdPlatformDisplaySetting" ADD COLUMN     "category" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "platform_name",
ADD COLUMN     "campaign_name" TEXT NOT NULL,
ALTER COLUMN "created_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ClickLogSnapshot" DROP COLUMN "currentTotalClicks",
ADD COLUMN     "current_total_clicks" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TikTokRawReportAd" DROP COLUMN "opt_status",
DROP COLUMN "status",
DROP COLUMN "status_updated_time",
ALTER COLUMN "ad_url" SET NOT NULL,
ALTER COLUMN "created_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TikTokRawReportCampaign" DROP COLUMN "is_smart_performance_campaign",
DROP COLUMN "opt_status",
DROP COLUMN "status",
DROP COLUMN "status_updated_time",
ALTER COLUMN "created_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserDisplaySettingVisibility" ADD COLUMN     "display_order" INTEGER;

-- AlterTable
ALTER TABLE "UserPermissionRequest" ALTER COLUMN "requested_at" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "AdGroup";

-- DropTable
DROP TABLE "TikTokRawReportAdGroup";

-- CreateTable
CREATE TABLE "Adgroup" (
    "id" SERIAL NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "platform_adgroup_id" BIGINT NOT NULL,
    "adgroup_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Adgroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TikTokRawReportAdgroup" (
    "id" SERIAL NOT NULL,
    "stat_time_day" TIMESTAMP(3) NOT NULL,
    "ad_platform_account_id" TEXT NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "platform_adgroup_id" BIGINT NOT NULL,
    "adgroup_name" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "spend" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "video_play_actions" INTEGER NOT NULL,
    "video_watched_2s" INTEGER NOT NULL,
    "video_watched_6s" INTEGER NOT NULL,
    "video_views_p100" INTEGER NOT NULL,
    "reach" INTEGER NOT NULL,
    "conversion" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TikTokRawReportAdgroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TikTokStatusHistoryCampaign" (
    "id" SERIAL NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "ad_platform_account_id" TEXT NOT NULL,
    "platform_campaign_id" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "opt_status" TEXT NOT NULL,
    "status_updated_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TikTokStatusHistoryCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TikTokStatusHistoryAdgroup" (
    "id" SERIAL NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "ad_platform_account_id" TEXT NOT NULL,
    "platform_adgroup_id" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "opt_status" TEXT NOT NULL,
    "status_updated_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TikTokStatusHistoryAdgroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TikTokStatusHistoryAd" (
    "id" SERIAL NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "ad_platform_account_id" TEXT NOT NULL,
    "platform_ad_id" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "opt_status" TEXT NOT NULL,
    "status_updated_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TikTokStatusHistoryAd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Adgroup_platform_adgroup_id_key" ON "Adgroup"("platform_adgroup_id");

-- CreateIndex
CREATE INDEX "TikTokStatusHistoryCampaign_platform_campaign_id_status_upd_idx" ON "TikTokStatusHistoryCampaign"("platform_campaign_id", "status_updated_time");

-- CreateIndex
CREATE INDEX "TikTokStatusHistoryAdgroup_platform_adgroup_id_status_updat_idx" ON "TikTokStatusHistoryAdgroup"("platform_adgroup_id", "status_updated_time");

-- CreateIndex
CREATE INDEX "TikTokStatusHistoryAd_platform_ad_id_status_updated_time_idx" ON "TikTokStatusHistoryAd"("platform_ad_id", "status_updated_time");

-- CreateIndex
CREATE UNIQUE INDEX "Ad_platform_ad_id_key" ON "Ad"("platform_ad_id");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_platform_campaign_id_key" ON "Campaign"("platform_campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "LinkMatcher_ad_account_id_asp_type_target_dim_id_key" ON "LinkMatcher"("ad_account_id", "asp_type", "target_dim_id");

-- AddForeignKey
ALTER TABLE "AdAccount" ADD CONSTRAINT "AdAccount_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdAccount" ADD CONSTRAINT "AdAccount_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermissionRequest" ADD CONSTRAINT "UserPermissionRequest_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermissionRequest" ADD CONSTRAINT "UserPermissionRequest_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adgroup" ADD CONSTRAINT "Adgroup_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adgroup" ADD CONSTRAINT "Adgroup_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_adgroup_id_fkey" FOREIGN KEY ("adgroup_id") REFERENCES "Adgroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TikTokRawReportAdgroup" ADD CONSTRAINT "TikTokRawReportAdgroup_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
