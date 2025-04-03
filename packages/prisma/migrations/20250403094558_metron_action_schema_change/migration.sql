/*
  Warnings:

  - You are about to drop the column `actionCareer` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionId` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionIpAddress` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionType` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionUserAgent` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickPartnerInfo` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clientActionCost` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clientClickCost` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clientCommissionCost` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clientInfo` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clientName` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `contentBannerNum` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `contentId` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `contentName` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `groupName` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `partnerActionCost` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `partnerClickCost` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `partnerCommissionCost` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `partnerId` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `partnerName` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `queryString` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `siteId` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `tierCommissionCost` on the `MetronActionLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MetronActionLog" DROP COLUMN "actionCareer",
DROP COLUMN "actionId",
DROP COLUMN "actionIpAddress",
DROP COLUMN "actionType",
DROP COLUMN "actionUserAgent",
DROP COLUMN "clickPartnerInfo",
DROP COLUMN "clientActionCost",
DROP COLUMN "clientClickCost",
DROP COLUMN "clientCommissionCost",
DROP COLUMN "clientId",
DROP COLUMN "clientInfo",
DROP COLUMN "clientName",
DROP COLUMN "comment",
DROP COLUMN "contentBannerNum",
DROP COLUMN "contentId",
DROP COLUMN "contentName",
DROP COLUMN "groupId",
DROP COLUMN "groupName",
DROP COLUMN "partnerActionCost",
DROP COLUMN "partnerClickCost",
DROP COLUMN "partnerCommissionCost",
DROP COLUMN "partnerId",
DROP COLUMN "partnerName",
DROP COLUMN "queryString",
DROP COLUMN "sessionId",
DROP COLUMN "siteId",
DROP COLUMN "tierCommissionCost",
ADD COLUMN     "adId" INTEGER,
ADD COLUMN     "adName" TEXT,
ADD COLUMN     "clInformation1" TEXT,
ADD COLUMN     "clInformation2" TEXT,
ADD COLUMN     "clInformation3" TEXT,
ADD COLUMN     "clInformation4" TEXT,
ADD COLUMN     "clInformation5" TEXT,
ALTER COLUMN "amount" SET DATA TYPE TEXT;
