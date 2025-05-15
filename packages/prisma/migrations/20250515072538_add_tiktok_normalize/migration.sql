/*
  Warnings:

  - You are about to drop the `TikTokReport` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "TikTokReport";

-- CreateTable
CREATE TABLE "TikTokRawReportAd" (
    "id" SERIAL NOT NULL,
    "advertiser_id" TEXT NOT NULL,
    "ad_id" TEXT NOT NULL,
    "stat_time_day" TEXT,
    "budget" INTEGER,
    "spend" INTEGER,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "video_play_actions" INTEGER,
    "video_watched_2s" INTEGER,
    "video_watched_6s" INTEGER,
    "video_views_p100" INTEGER,
    "reach" INTEGER,
    "conversion" INTEGER,
    "campaign_id" TEXT NOT NULL,
    "campaign_name" TEXT,
    "adgroup_id" TEXT NOT NULL,
    "adgroup_name" TEXT,
    "ad_name" TEXT,
    "ad_url" TEXT,
    "stat_time_day_dim" TEXT,
    "ad_id_dim" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TikTokRawReportAd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiktokFactReportAd" (
    "advertiser_id" TEXT NOT NULL,
    "ad_id" TEXT NOT NULL,
    "adgroup_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "stat_time_day" TEXT NOT NULL,
    "budget" INTEGER,
    "spend" INTEGER,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "video_play_actions" INTEGER,
    "video_watched_2s" INTEGER,
    "video_watched_6s" INTEGER,
    "video_views_p100" INTEGER,
    "reach" INTEGER,
    "campaign_name" TEXT,
    "adgroup_name" TEXT,
    "ad_name" TEXT,
    "ad_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiktokFactReportAd_pkey" PRIMARY KEY ("stat_time_day","ad_id")
);

-- CreateTable
CREATE TABLE "TiktokDimensionCampaign" (
    "campaign_id" TEXT NOT NULL,
    "advertiser_id" TEXT NOT NULL,
    "campaign_name" TEXT,

    CONSTRAINT "TiktokDimensionCampaign_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateTable
CREATE TABLE "TiktokDimensionAdgroup" (
    "adgroup_id" TEXT NOT NULL,
    "adgroup_name" TEXT NOT NULL,
    "advertiser_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,

    CONSTRAINT "TiktokDimensionAdgroup_pkey" PRIMARY KEY ("adgroup_id")
);

-- CreateTable
CREATE TABLE "TiktokDimensionAd" (
    "ad_id" TEXT NOT NULL,
    "ad_name" TEXT NOT NULL,
    "advertiser_id" TEXT NOT NULL,
    "adgroup_id" TEXT NOT NULL,

    CONSTRAINT "TiktokDimensionAd_pkey" PRIMARY KEY ("ad_id")
);

-- AddForeignKey
ALTER TABLE "TiktokFactReportAd" ADD CONSTRAINT "TiktokFactReportAd_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "TiktokDimensionCampaign"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TiktokDimensionAdgroup" ADD CONSTRAINT "TiktokDimensionAdgroup_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "TiktokDimensionCampaign"("campaign_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TiktokDimensionAd" ADD CONSTRAINT "TiktokDimensionAd_adgroup_id_fkey" FOREIGN KEY ("adgroup_id") REFERENCES "TiktokDimensionAdgroup"("adgroup_id") ON DELETE RESTRICT ON UPDATE CASCADE;
