-- AlterTable
ALTER TABLE "RentracksClickLog" ADD COLUMN     "adCategory" TEXT,
ADD COLUMN     "adName" TEXT,
ADD COLUMN     "campaignName" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "landingPageName" TEXT,
ADD COLUMN     "lpUrl" TEXT,
ADD COLUMN     "osType" TEXT,
ADD COLUMN     "referrerUrl" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "trackingParams" TEXT;

-- CreateTable
CREATE TABLE "QuorizaActionLog" (
    "id" SERIAL NOT NULL,
    "actionId" INTEGER,
    "actionIdentifier" INTEGER,
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
    "approvalStatus" TEXT,
    "referrerUrl" TEXT,
    "trackingParams" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuorizaActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SampleAffiliateActionLog" (
    "id" SERIAL NOT NULL,
    "adName" TEXT,
    "impCount" INTEGER,
    "accessCount" INTEGER,
    "ctr" DOUBLE PRECISION,
    "actionCount" INTEGER,
    "actionAmount" INTEGER,
    "confirmedActionCount" INTEGER,
    "confirmedActionAmount" INTEGER,
    "cvr" DOUBLE PRECISION,
    "rewardAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SampleAffiliateActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SampleAffiliateClickLog" (
    "id" SERIAL NOT NULL,
    "mediaName" TEXT,
    "impCount" INTEGER,
    "accessCount" INTEGER,
    "ctr" DOUBLE PRECISION,
    "actionCount" INTEGER,
    "actionAmount" INTEGER,
    "confirmedActionCount" INTEGER,
    "confirmedActionAmount" INTEGER,
    "cvr" DOUBLE PRECISION,
    "rewardAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SampleAffiliateClickLog_pkey" PRIMARY KEY ("id")
);
