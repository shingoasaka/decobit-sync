-- CreateTable
CREATE TABLE "MonkeyActionLog" (
    "id" SERIAL NOT NULL,
    "clickDate" TIMESTAMP(3),
    "actionDate" TIMESTAMP(3),
    "projectName" TEXT,
    "orderId" INTEGER,
    "tagName" TEXT,
    "actionRewardAmount" INTEGER,
    "referrerUrl" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonkeyActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonkeyClickLog" (
    "id" SERIAL NOT NULL,
    "tagName" TEXT,
    "clickData" TEXT,
    "cvData" TEXT,
    "cvrData" DOUBLE PRECISION,
    "rewardAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonkeyClickLog_pkey" PRIMARY KEY ("id")
);
