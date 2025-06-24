/*
  Warnings:

  - Added the required column `campaign_name` to the `TikTokRawReportCampaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TikTokRawReportCampaign" ADD COLUMN     "campaign_name" TEXT NOT NULL;
