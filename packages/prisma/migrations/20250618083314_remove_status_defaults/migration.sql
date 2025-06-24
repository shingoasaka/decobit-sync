-- AlterTable
ALTER TABLE "TikTokRawReportAd" ALTER COLUMN "opt_status" DROP DEFAULT,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status_updated_time" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TikTokRawReportAdGroup" ALTER COLUMN "opt_status" DROP DEFAULT,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status_updated_time" DROP DEFAULT;
