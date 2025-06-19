/*
  Warnings:

  - Made the column `opt_status` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status_updated_time` on table `TikTokRawReportAd` required. This step will fail if there are existing NULL values in that column.
  - Made the column `opt_status` on table `TikTokRawReportAdGroup` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `TikTokRawReportAdGroup` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status_updated_time` on table `TikTokRawReportAdGroup` required. This step will fail if there are existing NULL values in that column.

*/

-- Update existing NULL values in TikTokRawReportAd
UPDATE "TikTokRawReportAd" SET 
  "opt_status" = 'UNKNOWN',
  "status" = 'UNKNOWN',
  "status_updated_time" = CURRENT_TIMESTAMP
WHERE "opt_status" IS NULL OR "status" IS NULL OR "status_updated_time" IS NULL;

-- Update existing NULL values in TikTokRawReportAdGroup
UPDATE "TikTokRawReportAdGroup" SET 
  "opt_status" = 'UNKNOWN',
  "status" = 'UNKNOWN',
  "status_updated_time" = CURRENT_TIMESTAMP
WHERE "opt_status" IS NULL OR "status" IS NULL OR "status_updated_time" IS NULL;

-- AlterTable
ALTER TABLE "TikTokRawReportAd" ALTER COLUMN "opt_status" SET NOT NULL,
ALTER COLUMN "opt_status" SET DEFAULT 'UNKNOWN',
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'UNKNOWN',
ALTER COLUMN "status_updated_time" SET NOT NULL,
ALTER COLUMN "status_updated_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TikTokRawReportAdGroup" ALTER COLUMN "opt_status" SET NOT NULL,
ALTER COLUMN "opt_status" SET DEFAULT 'UNKNOWN',
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'UNKNOWN',
ALTER COLUMN "status_updated_time" SET NOT NULL,
ALTER COLUMN "status_updated_time" SET DEFAULT CURRENT_TIMESTAMP;
