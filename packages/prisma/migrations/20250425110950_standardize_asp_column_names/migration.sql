/*
  Warnings:

  - You are about to drop the column `actionDate` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `redirectAdUrlName` on the `CatsActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adName` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickDate` on the `CatsClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `orderDate` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `referrer` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `siteName` on the `FinebirdActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `siteName` on the `FinebirdClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `landingPageName` on the `HanikamuActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `click` on the `HanikamuClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `landingPageName` on the `HanikamuClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionDate` on the `MonkeyActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `tagName` on the `MonkeyActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `tagName` on the `MonkeyClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `salesDateTime` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `click` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `RentracksClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionDate` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaName` on the `SampleAffiliateActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `accessCount` on the `SampleAffiliateClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `mediaName` on the `SampleAffiliateClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionDate` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `redirectAdUrlName` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `referrerClickUrl` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adName` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickDate` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `referrer` on the `ladClickLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CatsActionLog" DROP COLUMN "actionDate",
DROP COLUMN "redirectAdUrlName",
ADD COLUMN     "actionDateTime" TIMESTAMP(3),
ADD COLUMN     "affiliateLinkName" TEXT;

-- AlterTable
ALTER TABLE "CatsClickLog" DROP COLUMN "adName",
DROP COLUMN "clickDate",
ADD COLUMN     "affiliateLinkName" TEXT,
ADD COLUMN     "clickDateTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FinebirdActionLog" DROP COLUMN "orderDate",
DROP COLUMN "referrer",
DROP COLUMN "siteName",
ADD COLUMN     "actionDateTime" TIMESTAMP(3),
ADD COLUMN     "affiliateLinkName" TEXT,
ADD COLUMN     "referrerUrl" TEXT;

-- AlterTable
ALTER TABLE "FinebirdClickLog" DROP COLUMN "siteName",
ADD COLUMN     "affiliateLinkName" TEXT;

-- AlterTable
ALTER TABLE "HanikamuActionLog" DROP COLUMN "landingPageName",
ADD COLUMN     "affiliateLinkName" TEXT;

-- AlterTable
ALTER TABLE "HanikamuClickLog" DROP COLUMN "click",
DROP COLUMN "landingPageName",
ADD COLUMN     "affiliateLinkName" TEXT,
ADD COLUMN     "clickData" INTEGER;

-- AlterTable
ALTER TABLE "MonkeyActionLog" DROP COLUMN "actionDate",
DROP COLUMN "tagName",
ADD COLUMN     "actionDateTime" TIMESTAMP(3),
ADD COLUMN     "affiliateLinkName" TEXT;

-- AlterTable
ALTER TABLE "MonkeyClickLog" DROP COLUMN "tagName",
ADD COLUMN     "affiliateLinkName" TEXT;

-- AlterTable
ALTER TABLE "RentracksActionLog" DROP COLUMN "remarks",
DROP COLUMN "salesDateTime",
ADD COLUMN     "actionDateTime" TIMESTAMP(3),
ADD COLUMN     "affiliateLinkName" TEXT;

-- AlterTable
ALTER TABLE "RentracksClickLog" DROP COLUMN "click",
DROP COLUMN "remarks",
ADD COLUMN     "affiliateLinkName" TEXT,
ADD COLUMN     "clickData" INTEGER;

-- AlterTable
ALTER TABLE "SampleAffiliateActionLog" DROP COLUMN "actionDate",
DROP COLUMN "mediaName",
ADD COLUMN     "actionDateTime" TIMESTAMP(3),
ADD COLUMN     "affiliateLinkName" TEXT;

-- AlterTable
ALTER TABLE "SampleAffiliateClickLog" DROP COLUMN "accessCount",
DROP COLUMN "mediaName",
ADD COLUMN     "affiliateLinkName" TEXT,
ADD COLUMN     "clickData" INTEGER;

-- AlterTable
ALTER TABLE "ladActionLog" DROP COLUMN "actionDate",
DROP COLUMN "redirectAdUrlName",
DROP COLUMN "referrerClickUrl",
ADD COLUMN     "actionDateTime" TIMESTAMP(3),
ADD COLUMN     "affiliateLinkName" TEXT,
ADD COLUMN     "referrerUrl" TEXT;

-- AlterTable
ALTER TABLE "ladClickLog" DROP COLUMN "adName",
DROP COLUMN "clickDate",
DROP COLUMN "referrer",
ADD COLUMN     "affiliateLinkName" TEXT,
ADD COLUMN     "clickDateTime" TIMESTAMP(3),
ADD COLUMN     "referrerUrl" TEXT;
