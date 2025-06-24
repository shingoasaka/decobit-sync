/*
  Warnings:

  - Added the required column `opt_status` to the `TikTokRawReportCampaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `TikTokRawReportCampaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status_updated_time` to the `TikTokRawReportCampaign` table without a default value. This is not possible if the table is not empty.

*/

-- まずオプショナルなカラムとして追加
ALTER TABLE "TikTokRawReportCampaign" ADD COLUMN     "is_smart_performance_campaign" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "opt_status" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "status_updated_time" TIMESTAMP(3);

-- 既存データにデフォルト値を設定
UPDATE "TikTokRawReportCampaign" SET 
  "opt_status" = 'UNKNOWN',
  "status" = 'UNKNOWN',
  "status_updated_time" = CURRENT_TIMESTAMP
WHERE "opt_status" IS NULL OR "status" IS NULL OR "status_updated_time" IS NULL;

-- NOT NULL制約を追加
ALTER TABLE "TikTokRawReportCampaign" ALTER COLUMN "opt_status" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status_updated_time" SET NOT NULL;
