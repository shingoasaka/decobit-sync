/*
  Warnings:

  - You are about to drop the `ActionLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClickLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ActionLog";

-- DropTable
DROP TABLE "ClickLog";

-- CreateTable
CREATE TABLE "MetronActionLog" (
    "id" SERIAL NOT NULL,
    "actionDateTime" TIMESTAMP(3),
    "clickDateTime" TIMESTAMP(3),
    "adminDateTime" TIMESTAMP(3),
    "clientId" TEXT,
    "clientName" TEXT,
    "contentId" INTEGER,
    "contentName" TEXT,
    "partnerId" INTEGER,
    "partnerName" TEXT,
    "groupId" INTEGER,
    "groupName" TEXT,
    "siteId" INTEGER,
    "siteName" TEXT,
    "actionCareer" TEXT,
    "actionOs" TEXT,
    "actionUserAgent" TEXT,
    "actionIpAddress" TEXT,
    "actionReferrer" TEXT,
    "queryString" TEXT,
    "clickPartnerInfo" TEXT,
    "clientInfo" TEXT,
    "sessionId" TEXT,
    "actionId" TEXT,
    "contentBannerNum" TEXT,
    "clientClickCost" INTEGER,
    "partnerClickCost" INTEGER,
    "clientCommissionCost" INTEGER,
    "partnerCommissionCost" INTEGER,
    "clientActionCost" INTEGER,
    "partnerActionCost" INTEGER,
    "actionType" INTEGER,
    "tierCommissionCost" DECIMAL(10,2),
    "status" TEXT,
    "amount" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetronActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetronClickLog" (
    "id" SERIAL NOT NULL,
    "actionDateTime" TIMESTAMP(3),
    "clickDateTime" TIMESTAMP(3),
    "admitDateTime" TIMESTAMP(3),
    "clientId" INTEGER,
    "clientName" TEXT,
    "contentId" INTEGER,
    "contentName" TEXT,
    "partnerId" INTEGER,
    "partnerName" TEXT,
    "groupId" INTEGER,
    "groupName" TEXT,
    "siteId" INTEGER,
    "siteName" TEXT,
    "actionCareer" TEXT,
    "actionOs" TEXT,
    "actionUserAgent" TEXT,
    "actionIpAddress" TEXT,
    "actionReferrer" TEXT,
    "queryString" TEXT,
    "clickPartnerInfo" TEXT,
    "clientInfo" TEXT,
    "sessionId" TEXT,
    "actionId" TEXT,
    "contentBannerNum" TEXT,
    "clientClickCost" INTEGER,
    "partnerClickCost" INTEGER,
    "clientCommissionCost" INTEGER,
    "partnerCommissionCost" INTEGER,
    "clientActionCost" INTEGER,
    "partnerActionCost" INTEGER,
    "actionType" INTEGER,
    "status" TEXT,
    "amount" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetronClickLog_pkey" PRIMARY KEY ("id")
);
