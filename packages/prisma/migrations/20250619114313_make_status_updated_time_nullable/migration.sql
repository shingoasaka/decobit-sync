-- AlterTable
ALTER TABLE "TikTokRawReportAd" ALTER COLUMN "status_updated_time" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TikTokRawReportAdGroup" ALTER COLUMN "status_updated_time" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TikTokRawReportCampaign" ALTER COLUMN "status_updated_time" DROP NOT NULL;
