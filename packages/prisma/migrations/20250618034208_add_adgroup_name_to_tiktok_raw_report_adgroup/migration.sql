/*
  Warnings:

  - Added the required column `adgroup_name` to the `TikTokRawReportAdGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TikTokRawReportAd" ADD COLUMN     "opt_status" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "status_updated_time" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TikTokRawReportAdGroup" ADD COLUMN     "adgroup_name" TEXT NOT NULL;
