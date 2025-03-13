-- CreateTable
CREATE TABLE "HanikamuClickLog" (
    "id" SERIAL NOT NULL,
    "landingPageName" TEXT,
    "linkUrl" TEXT,
    "click" INTEGER,
    "actionData" INTEGER,
    "cvr" DOUBLE PRECISION,
    "approvedCount" INTEGER,
    "approvalRate" DOUBLE PRECISION,
    "unapprovedCount" INTEGER,
    "rejectionsCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HanikamuClickLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuorizaClickLog" (
    "id" SERIAL NOT NULL,
    "adCategory" TEXT,
    "click" INTEGER,
    "actionData" INTEGER,
    "cvr" DOUBLE PRECISION,
    "approvedCount" INTEGER,
    "approvalRate" DOUBLE PRECISION,
    "unapprovedCount" INTEGER,
    "rejectionsCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuorizaClickLog_pkey" PRIMARY KEY ("id")
);
