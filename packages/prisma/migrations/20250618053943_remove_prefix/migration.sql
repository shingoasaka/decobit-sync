/*
  Warnings:

  - You are about to drop the column `platform_adgroup_name` on the `AdGroup` table. All the data in the column will be lost.
  - You are about to drop the column `platform_campaign_name` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `platform_ad_name` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `platform_adgroup_name` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `platform_campaign_name` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - Added the required column `adgroup_name` to the `AdGroup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform_name` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ad_name` to the `TikTokRawReportAd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adgroup_name` to the `TikTokRawReportAd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campaign_name` to the `TikTokRawReportAd` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AdGroup" DROP COLUMN "platform_adgroup_name",
ADD COLUMN     "adgroup_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "platform_campaign_name",
ADD COLUMN     "platform_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TikTokRawReportAd" DROP COLUMN "platform_ad_name",
DROP COLUMN "platform_adgroup_name",
DROP COLUMN "platform_campaign_name",
ADD COLUMN     "ad_name" TEXT NOT NULL,
ADD COLUMN     "adgroup_name" TEXT NOT NULL,
ADD COLUMN     "campaign_name" TEXT NOT NULL;
