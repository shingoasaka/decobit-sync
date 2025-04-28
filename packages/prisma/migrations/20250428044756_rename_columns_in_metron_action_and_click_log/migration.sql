/*
  Warnings:

  - You are about to drop the column `actionOs` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionReferrer` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adId` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adName` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `adminDateTime` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clInformation1` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clInformation2` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clInformation3` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clInformation4` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clInformation5` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickDateTime` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `siteName` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `MetronActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionCareer` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionDateTime` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionId` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionIpAddress` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionOs` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionReferrer` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionType` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `actionUserAgent` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `admitDateTime` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clickPartnerInfo` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clientActionCost` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clientClickCost` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clientCommissionCost` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clientInfo` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `clientName` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `contentBannerNum` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `contentId` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `contentName` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `groupName` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `partnerActionCost` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `partnerClickCost` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `partnerCommissionCost` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `partnerId` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `partnerName` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `queryString` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `siteId` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `siteName` on the `MetronClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `MetronClickLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MetronActionLog" DROP COLUMN "actionOs",
DROP COLUMN "actionReferrer",
DROP COLUMN "adId",
DROP COLUMN "adName",
DROP COLUMN "adminDateTime",
DROP COLUMN "amount",
DROP COLUMN "clInformation1",
DROP COLUMN "clInformation2",
DROP COLUMN "clInformation3",
DROP COLUMN "clInformation4",
DROP COLUMN "clInformation5",
DROP COLUMN "clickDateTime",
DROP COLUMN "siteName",
DROP COLUMN "status",
ADD COLUMN     "affiliateLinkName" TEXT,
ADD COLUMN     "referrerUrl" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "uid" TEXT;

-- AlterTable
ALTER TABLE "MetronClickLog" DROP COLUMN "actionCareer",
DROP COLUMN "actionDateTime",
DROP COLUMN "actionId",
DROP COLUMN "actionIpAddress",
DROP COLUMN "actionOs",
DROP COLUMN "actionReferrer",
DROP COLUMN "actionType",
DROP COLUMN "actionUserAgent",
DROP COLUMN "admitDateTime",
DROP COLUMN "amount",
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
DROP COLUMN "siteId",
DROP COLUMN "siteName",
DROP COLUMN "status",
ADD COLUMN     "affiliateLinkName" TEXT,
ADD COLUMN     "referrerUrl" TEXT;
