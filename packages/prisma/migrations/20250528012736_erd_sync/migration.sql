/*
  Warnings:

  - You are about to drop the column `actionDateTime` on the `AspActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `aspType` on the `AspActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `AspActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AspActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `aspType` on the `AspClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickDateTime` on the `AspClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `AspClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AspClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `aspType` on the `ClickLogSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ClickLogSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `snapshotDate` on the `ClickLogSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ClickLogSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `ad_id` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `ad_id_dim` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `ad_name` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `adgroup_id` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `adgroup_name` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `advertiser_id` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `campaign_id` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `campaign_name` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `stat_time_day_dim` on the `TikTokRawReportAd` table. All the data in the column will be lost.
  - You are about to drop the column `advertiser_id` on the `TikTokRawReportCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `campaign_id` on the `TikTokRawReportCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `campaign_name` on the `TikTokRawReportCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `stat_time_day_dim` on the `TikTokRawReportCampaign` table. All the data in the column will be lost.
  - You are about to drop the `TikTokRawReportAdgroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TiktokDimensionAd` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TiktokDimensionAdgroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TiktokDimensionCampaign` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TiktokFactReportAd` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TiktokFactReportAdgroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TiktokFactReportCampaign` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[asp_type,affiliateLinkName,snapshot_date]` on the table `ClickLogSnapshot` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `action_date_time` to the `AspActionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `asp_type` to the `AspActionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `AspActionLog` table without a default value. This is not possible if the table is not empty.
  - Made the column `affiliateLinkName` on table `AspActionLog` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `asp_type` to the `AspClickLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `click_date_time` to the `AspClickLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `AspClickLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `asp_type` to the `ClickLogSnapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `snapshot_date` to the `ClickLogSnapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `ClickLogSnapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ad_platform_account_id` to the `TikTokRawReportAd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform_ad_id` to the `TikTokRawReportAd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform_adgroup_id` to the `TikTokRawReportAd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform_campaign_id` to the `TikTokRawReportAd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stat_time_day` to the `TikTokRawReportAd` table without a default value. This is not possible if the table is not empty.
  - Made the column `budget` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Made the column `spend` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Made the column `impressions` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Made the column `clicks` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Made the column `video_play_actions` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Made the column `video_watched_2s` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Made the column `video_watched_6s` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Made the column `video_views_p100` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reach` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Made the column `conversion` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `ad_platform_account_id` to the `TikTokRawReportCampaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `budget` to the `TikTokRawReportCampaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform_campaign_id` to the `TikTokRawReportCampaign` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `stat_time_day` on the `TikTokRawReportCampaign` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "TiktokDimensionAd" DROP CONSTRAINT "TiktokDimensionAd_adgroup_id_fkey";

-- DropForeignKey
ALTER TABLE "TiktokDimensionAdgroup" DROP CONSTRAINT "TiktokDimensionAdgroup_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "TiktokFactReportAd" DROP CONSTRAINT "TiktokFactReportAd_campaign_id_fkey";

-- DropIndex
DROP INDEX "AspActionLog_aspType_actionDateTime_affiliateLinkName_key";

-- DropIndex
DROP INDEX "AspClickLog_aspType_clickDateTime_affiliateLinkName_key";

-- DropIndex
DROP INDEX "ClickLogSnapshot_aspType_affiliateLinkName_snapshotDate_key";

-- AlterTable
ALTER TABLE "AspActionLog" DROP COLUMN "actionDateTime",
DROP COLUMN "aspType",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "action_date_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "affiliate_link_id" INTEGER,
ADD COLUMN     "asp_type" "AspType" NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "affiliateLinkName" SET NOT NULL;

-- AlterTable
ALTER TABLE "AspClickLog" DROP COLUMN "aspType",
DROP COLUMN "clickDateTime",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "affiliate_link_id" INTEGER,
ADD COLUMN     "asp_type" "AspType" NOT NULL,
ADD COLUMN     "click_date_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ClickLogSnapshot" DROP COLUMN "aspType",
DROP COLUMN "createdAt",
DROP COLUMN "snapshotDate",
DROP COLUMN "updatedAt",
ADD COLUMN     "affiliate_link_id" INTEGER,
ADD COLUMN     "asp_type" "AspType" NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "snapshot_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "TikTokRawReportAd" DROP COLUMN "ad_id",
DROP COLUMN "ad_id_dim",
DROP COLUMN "ad_name",
DROP COLUMN "adgroup_id",
DROP COLUMN "adgroup_name",
DROP COLUMN "advertiser_id",
DROP COLUMN "campaign_id",
DROP COLUMN "campaign_name",
DROP COLUMN "stat_time_day_dim",
ADD COLUMN     "ad_account_id" INTEGER,
ADD COLUMN     "ad_platform_account_id" TEXT NOT NULL,
ADD COLUMN     "platform_ad_id" INTEGER NOT NULL,
ADD COLUMN     "platform_ad_name" TEXT,
ADD COLUMN     "platform_adgroup_id" INTEGER NOT NULL,
ADD COLUMN     "platform_adgroup_name" TEXT,
ADD COLUMN     "platform_campaign_id" INTEGER NOT NULL,
ADD COLUMN     "platform_campaign_name" TEXT,
DROP COLUMN "stat_time_day",
ADD COLUMN     "stat_time_day" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "budget" SET NOT NULL,
ALTER COLUMN "spend" SET NOT NULL,
ALTER COLUMN "impressions" SET NOT NULL,
ALTER COLUMN "clicks" SET NOT NULL,
ALTER COLUMN "video_play_actions" SET NOT NULL,
ALTER COLUMN "video_watched_2s" SET NOT NULL,
ALTER COLUMN "video_watched_6s" SET NOT NULL,
ALTER COLUMN "video_views_p100" SET NOT NULL,
ALTER COLUMN "reach" SET NOT NULL,
ALTER COLUMN "conversion" SET NOT NULL;

-- AlterTable
ALTER TABLE "TikTokRawReportCampaign" DROP COLUMN "advertiser_id",
DROP COLUMN "campaign_id",
DROP COLUMN "campaign_name",
DROP COLUMN "stat_time_day_dim",
ADD COLUMN     "ad_account_id" INTEGER,
ADD COLUMN     "ad_platform_account_id" TEXT NOT NULL,
ADD COLUMN     "budget" INTEGER NOT NULL,
ADD COLUMN     "platform_campaign_id" INTEGER NOT NULL,
DROP COLUMN "stat_time_day",
ADD COLUMN     "stat_time_day" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "TikTokRawReportAdgroup";

-- DropTable
DROP TABLE "TiktokDimensionAd";

-- DropTable
DROP TABLE "TiktokDimensionAdgroup";

-- DropTable
DROP TABLE "TiktokDimensionCampaign";

-- DropTable
DROP TABLE "TiktokFactReportAd";

-- DropTable
DROP TABLE "TiktokFactReportAdgroup";

-- DropTable
DROP TABLE "TiktokFactReportCampaign";

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdPlatform" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdPlatformDisplaySetting" (
    "id" SERIAL NOT NULL,
    "ad_platform_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPlatformDisplaySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDisplaySettingVisibility" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ad_platform_display_setting_id" INTEGER NOT NULL,
    "is_visible" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDisplaySettingVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "can_manage_ad_account" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermissionRequest" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "can_manage_ad_account" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "approved_by" INTEGER,
    "rejected_by" INTEGER,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPermissionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "platform_campaign_id" INTEGER NOT NULL,
    "platform_campaign_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdGroup" (
    "id" SERIAL NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "platform_adgroup_id" INTEGER NOT NULL,
    "platform_adgroup_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" SERIAL NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "adgroup_id" INTEGER NOT NULL,
    "platform_ad_id" INTEGER NOT NULL,
    "ad_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TikTokRawReportAdGroup" (
    "id" SERIAL NOT NULL,
    "ad_account_id" INTEGER,
    "stat_time_day" TIMESTAMP(3) NOT NULL,
    "ad_platform_account_id" TEXT NOT NULL,
    "platform_adgroup_id" INTEGER NOT NULL,
    "budget" INTEGER NOT NULL,
    "spend" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "video_play_actions" INTEGER NOT NULL,
    "video_watched_2s" INTEGER NOT NULL,
    "video_watched_6s" INTEGER NOT NULL,
    "video_views_p100" INTEGER NOT NULL,
    "reach" INTEGER NOT NULL,
    "conversion" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TikTokRawReportAdGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateLink" (
    "id" SERIAL NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "asp_type" "AspType" NOT NULL,
    "affiliate_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkMatcher" (
    "id" SERIAL NOT NULL,
    "affiliate_link_id" INTEGER,
    "ad_account_id" INTEGER NOT NULL,
    "asp_type" "AspType" NOT NULL,
    "match_type" TEXT NOT NULL,
    "target_dim" TEXT NOT NULL,
    "media_level" TEXT NOT NULL,
    "regex_pattern" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkMatcher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_firebase_uid_key" ON "User"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Project_name_client_id_key" ON "Project"("name", "client_id");

-- CreateIndex
CREATE UNIQUE INDEX "AdPlatform_name_key" ON "AdPlatform"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserDisplaySettingVisibility_user_id_ad_platform_display_se_key" ON "UserDisplaySettingVisibility"("user_id", "ad_platform_display_setting_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_user_id_ad_account_id_key" ON "UserPermission"("user_id", "ad_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "ClickLogSnapshot_asp_type_affiliateLinkName_snapshot_date_key" ON "ClickLogSnapshot"("asp_type", "affiliateLinkName", "snapshot_date");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdAccount" ADD CONSTRAINT "AdAccount_ad_platform_id_fkey" FOREIGN KEY ("ad_platform_id") REFERENCES "AdPlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdAccount" ADD CONSTRAINT "AdAccount_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdAccount" ADD CONSTRAINT "AdAccount_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdPlatformDisplaySetting" ADD CONSTRAINT "AdPlatformDisplaySetting_ad_platform_id_fkey" FOREIGN KEY ("ad_platform_id") REFERENCES "AdPlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDisplaySettingVisibility" ADD CONSTRAINT "UserDisplaySettingVisibility_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDisplaySettingVisibility" ADD CONSTRAINT "UserDisplaySettingVisibility_ad_platform_display_setting_i_fkey" FOREIGN KEY ("ad_platform_display_setting_id") REFERENCES "AdPlatformDisplaySetting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermissionRequest" ADD CONSTRAINT "UserPermissionRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermissionRequest" ADD CONSTRAINT "UserPermissionRequest_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdGroup" ADD CONSTRAINT "AdGroup_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdGroup" ADD CONSTRAINT "AdGroup_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_adgroup_id_fkey" FOREIGN KEY ("adgroup_id") REFERENCES "AdGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TikTokRawReportCampaign" ADD CONSTRAINT "TikTokRawReportCampaign_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TikTokRawReportAdGroup" ADD CONSTRAINT "TikTokRawReportAdGroup_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TikTokRawReportAd" ADD CONSTRAINT "TikTokRawReportAd_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AspActionLog" ADD CONSTRAINT "AspActionLog_affiliate_link_id_fkey" FOREIGN KEY ("affiliate_link_id") REFERENCES "AffiliateLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AspClickLog" ADD CONSTRAINT "AspClickLog_affiliate_link_id_fkey" FOREIGN KEY ("affiliate_link_id") REFERENCES "AffiliateLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClickLogSnapshot" ADD CONSTRAINT "ClickLogSnapshot_affiliate_link_id_fkey" FOREIGN KEY ("affiliate_link_id") REFERENCES "AffiliateLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkMatcher" ADD CONSTRAINT "LinkMatcher_affiliate_link_id_fkey" FOREIGN KEY ("affiliate_link_id") REFERENCES "AffiliateLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkMatcher" ADD CONSTRAINT "LinkMatcher_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
