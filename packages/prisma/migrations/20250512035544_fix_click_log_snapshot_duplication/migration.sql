/*
  Warnings:

  - You are about to drop the column `clickCount` on the `AspClickLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AspClickLog" DROP COLUMN "clickCount";

-- CreateTable
CREATE TABLE "ClickLogSnapshot" (
    "id" SERIAL NOT NULL,
    "aspType" "AspType" NOT NULL,
    "affiliateLinkName" TEXT NOT NULL,
    "currentClicks" INTEGER NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClickLogSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClickLogSnapshot_aspType_affiliateLinkName_snapshotDate_key" ON "ClickLogSnapshot"("aspType", "affiliateLinkName", "snapshotDate");
