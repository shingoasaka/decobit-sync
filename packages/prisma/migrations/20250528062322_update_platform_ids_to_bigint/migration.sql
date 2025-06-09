-- AlterTable
ALTER TABLE "AdGroup" ALTER COLUMN "platform_adgroup_id" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Campaign" ALTER COLUMN "platform_campaign_id" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "TikTokRawReportAd" ALTER COLUMN "platform_ad_id" SET DATA TYPE BIGINT,
ALTER COLUMN "platform_adgroup_id" SET DATA TYPE BIGINT,
ALTER COLUMN "platform_campaign_id" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "TikTokRawReportCampaign" ALTER COLUMN "platform_campaign_id" SET DATA TYPE BIGINT;
