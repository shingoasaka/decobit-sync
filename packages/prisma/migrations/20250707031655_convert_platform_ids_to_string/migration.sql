-- AlterTable
ALTER TABLE "Ad" ALTER COLUMN "platform_ad_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Adgroup" ALTER COLUMN "platform_adgroup_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Campaign" ALTER COLUMN "platform_campaign_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TikTokAdStatusHistory" ALTER COLUMN "platform_ad_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TikTokAdgroupStatusHistory" ALTER COLUMN "platform_adgroup_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TikTokCampaignStatusHistory" ALTER COLUMN "platform_campaign_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TikTokRawReportAd" ALTER COLUMN "platform_ad_id" SET DATA TYPE TEXT,
ALTER COLUMN "platform_adgroup_id" SET DATA TYPE TEXT,
ALTER COLUMN "platform_campaign_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TikTokRawReportAdgroup" ALTER COLUMN "platform_adgroup_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TikTokRawReportCampaign" ALTER COLUMN "platform_campaign_id" SET DATA TYPE TEXT;
