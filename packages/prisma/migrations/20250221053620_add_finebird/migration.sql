-- CreateTable
CREATE TABLE "FinebirdActionLog" (
    "id" SERIAL NOT NULL,
    "approvalDate" TIMESTAMP(3),
    "clickDate" TIMESTAMP(3),
    "orderDate" TIMESTAMP(3),
    "adId" INTEGER,
    "adName" TEXT,
    "siteName" TEXT,
    "urlName" TEXT,
    "urlNumber" INTEGER,
    "osType" TEXT,
    "referrer" TEXT,
    "rewardAmount" INTEGER,
    "status" TEXT,
    "clData1" TEXT,
    "clData2" TEXT,
    "clData3" TEXT,
    "clData4" TEXT,
    "clData5" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinebirdActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinebirdClickLog" (
    "id" SERIAL NOT NULL,
    "siteName" TEXT,
    "siteUrl" TEXT,
    "adName" TEXT,
    "adId" INTEGER,
    "clickData" INTEGER,
    "actionCvr" DOUBLE PRECISION,
    "approvalCvr" DOUBLE PRECISION,
    "acquisitionCount" INTEGER,
    "approvalCount" INTEGER,
    "rejectedCount" INTEGER,
    "rewardAmount" INTEGER,
    "clickCost" INTEGER,
    "clickRewardAmount" INTEGER,
    "totalRewardAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinebirdClickLog_pkey" PRIMARY KEY ("id")
);
