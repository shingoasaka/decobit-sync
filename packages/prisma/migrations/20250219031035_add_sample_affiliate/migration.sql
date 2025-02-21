
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
