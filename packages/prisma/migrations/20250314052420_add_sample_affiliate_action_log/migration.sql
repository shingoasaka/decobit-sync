/*
  Warnings:

  - You are about to drop the column `accessCount` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionCount` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `confirmedActionAmount` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `confirmedActionCount` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `ctr` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `cvr` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `impCount` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `rewardAmount` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SampleAffiliateActionLog" DROP COLUMN "accessCount",
DROP COLUMN "actionCount",
DROP COLUMN "confirmedActionAmount",
DROP COLUMN "confirmedActionCount",
DROP COLUMN "ctr",
DROP COLUMN "cvr",
DROP COLUMN "impCount",
DROP COLUMN "rewardAmount",
ADD COLUMN     "actionDate" TIMESTAMP(3),
ADD COLUMN     "actionDetails" TEXT,
ADD COLUMN     "actionId" TEXT,
ADD COLUMN     "adMaterial" TEXT,
ADD COLUMN     "approvalStatus" TEXT,
ADD COLUMN     "clickDate" TIMESTAMP(3),
ADD COLUMN     "confirmedDate" TIMESTAMP(3),
ADD COLUMN     "mediaName" TEXT,
ADD COLUMN     "referrerUrl" TEXT;
