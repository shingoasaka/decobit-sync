/*
  Warnings:

  - You are about to drop the column `currentClicks` on the `ClickLogSnapshot` table. All the data in the column will be lost.
  - Made the column `clickDateTime` on table `AspClickLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `affiliateLinkName` on table `AspClickLog` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `currentTotalClicks` to the `ClickLogSnapshot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AspClickLog" ALTER COLUMN "clickDateTime" SET NOT NULL,
ALTER COLUMN "affiliateLinkName" SET NOT NULL;

-- AlterTable
ALTER TABLE "ClickLogSnapshot" DROP COLUMN "currentClicks",
ADD COLUMN     "currentTotalClicks" INTEGER NOT NULL;
