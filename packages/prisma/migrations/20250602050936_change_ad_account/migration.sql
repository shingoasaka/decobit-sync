/*
  Warnings:

  - Made the column `ad_account_id` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ad_account_id` on table `TikTokRawReportAdGroup` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ad_account_id` on table `TikTokRawReportCampaign` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "TikTokRawReportAd" DROP CONSTRAINT "TikTokRawReportAd_ad_account_id_fkey";

-- DropForeignKey
ALTER TABLE "TikTokRawReportAdGroup" DROP CONSTRAINT "TikTokRawReportAdGroup_ad_account_id_fkey";

-- DropForeignKey
ALTER TABLE "TikTokRawReportCampaign" DROP CONSTRAINT "TikTokRawReportCampaign_ad_account_id_fkey";

-- AlterTable
ALTER TABLE "AspClickLog" ADD COLUMN     "referrer_link_id" INTEGER;

-- AlterTable
ALTER TABLE "ClickLogSnapshot" ADD COLUMN     "referrer_link_id" INTEGER;

-- AlterTable
ALTER TABLE "LinkMatcher" ADD COLUMN     "referrer_link_id" INTEGER;

-- AlterTable
ALTER TABLE "TikTokRawReportAd" ALTER COLUMN "ad_account_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "TikTokRawReportAdGroup" ALTER COLUMN "ad_account_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "TikTokRawReportCampaign" ALTER COLUMN "ad_account_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "TikTokRawReportCampaign" ADD CONSTRAINT "TikTokRawReportCampaign_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TikTokRawReportAdGroup" ADD CONSTRAINT "TikTokRawReportAdGroup_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TikTokRawReportAd" ADD CONSTRAINT "TikTokRawReportAd_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
