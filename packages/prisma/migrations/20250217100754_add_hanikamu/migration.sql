-- CreateTable
CREATE TABLE "HanikamuActionLog" (
    "id" SERIAL NOT NULL,
    "actionId" INTEGER,
    "clickDateTime" TIMESTAMP(3),
    "actionDateTime" TIMESTAMP(3),
    "approvalDateTime" TIMESTAMP(3),
    "adName" TEXT,
    "adCategory" TEXT,
    "campaignName" TEXT,
    "landingPageName" TEXT,
    "lpUrl" TEXT,
    "deviceType" TEXT,
    "osType" TEXT,
    "status" TEXT,
    "referrerUrl" TEXT,
    "trackingParams" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HanikamuActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentracksActionLog" (
    "id" SERIAL NOT NULL,
    "clickDateTime" TIMESTAMP(3),
    "salesDateTime" TIMESTAMP(3),
    "salesNumber" INTEGER,
    "advertiserName" TEXT,
    "productName" TEXT,
    "salesAmount" INTEGER,
    "rewardAmount" INTEGER,
    "status" TEXT,
    "actionDeadline" TIMESTAMP(3),
    "approvalDateTime" TIMESTAMP(3),
    "remarks" TEXT,
    "adSiteId" INTEGER,
    "adSiteName" TEXT,
    "deviceType" TEXT,
    "referrerUrl" TEXT,
    "deviceIinfo" TEXT,
    "reasonRrefusal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentracksActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentracksClickLog" (
    "id" SERIAL NOT NULL,
    "remarks" TEXT,
    "click" INTEGER,
    "selesNumber" INTEGER,
    "ocRate" DOUBLE PRECISION,
    "approvedNnumber" INTEGER,
    "approvedRewardAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentracksClickLog_pkey" PRIMARY KEY ("id")
);
