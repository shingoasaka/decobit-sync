-- CreateTable
CREATE TABLE "TikTokReport" (
    "id" SERIAL NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "statTimeDay" TEXT NOT NULL,
    "budget" INTEGER,
    "spend" INTEGER,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "videoPlayActions" INTEGER,
    "videoWatched2s" INTEGER,
    "videoWatched6s" INTEGER,
    "videoViewsP100" INTEGER,
    "reach" INTEGER,
    "conversion" INTEGER,
    "campaignId" TEXT,
    "campaignName" TEXT,
    "adgroupId" TEXT,
    "adgroupName" TEXT,
    "adName" TEXT,
    "adUrl" TEXT,
    "statTimeDayDimension" TEXT,
    "adIdDimension" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TikTokReport_pkey" PRIMARY KEY ("id")
);
