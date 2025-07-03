/*
  Warnings:

  - You are about to drop the `TikTokStatusHistoryAd` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TikTokStatusHistoryAdgroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TikTokStatusHistoryCampaign` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "ReferrerLink" ADD COLUMN     "original_url" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "TikTokStatusHistoryAd";

-- DropTable
DROP TABLE "TikTokStatusHistoryAdgroup";

-- DropTable
DROP TABLE "TikTokStatusHistoryCampaign";

-- CreateTable
CREATE TABLE "TikTokCampaignStatusHistory" (
    "id" SERIAL NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "ad_platform_account_id" TEXT NOT NULL,
    "platform_campaign_id" BIGINT NOT NULL,
    "operation_status" TEXT NOT NULL,
    "secondary_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TikTokCampaignStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TikTokAdgroupStatusHistory" (
    "id" SERIAL NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "ad_platform_account_id" TEXT NOT NULL,
    "platform_adgroup_id" BIGINT NOT NULL,
    "operation_status" TEXT NOT NULL,
    "secondary_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TikTokAdgroupStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TikTokAdStatusHistory" (
    "id" SERIAL NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "ad_platform_account_id" TEXT NOT NULL,
    "platform_ad_id" BIGINT NOT NULL,
    "operation_status" TEXT NOT NULL,
    "secondary_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TikTokAdStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TikTokCampaignStatusHistory_platform_campaign_id_created_at_idx" ON "TikTokCampaignStatusHistory"("platform_campaign_id", "created_at");

-- CreateIndex
CREATE INDEX "TikTokAdgroupStatusHistory_platform_adgroup_id_created_at_idx" ON "TikTokAdgroupStatusHistory"("platform_adgroup_id", "created_at");

-- CreateIndex
CREATE INDEX "TikTokAdStatusHistory_platform_ad_id_created_at_idx" ON "TikTokAdStatusHistory"("platform_ad_id", "created_at");

-- CreateIndex
CREATE INDEX "TikTokRawReportAd_platform_ad_id_stat_time_day_created_at_idx" ON "TikTokRawReportAd"("platform_ad_id", "stat_time_day", "created_at");

-- CreateIndex
CREATE INDEX "TikTokRawReportAdgroup_platform_adgroup_id_stat_time_day_cr_idx" ON "TikTokRawReportAdgroup"("platform_adgroup_id", "stat_time_day", "created_at");

-- CreateIndex
CREATE INDEX "TikTokRawReportCampaign_platform_campaign_id_stat_time_day__idx" ON "TikTokRawReportCampaign"("platform_campaign_id", "stat_time_day", "created_at");
