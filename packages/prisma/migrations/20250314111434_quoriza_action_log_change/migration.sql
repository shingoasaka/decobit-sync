/*
  Warnings:

  - You are about to drop the column `approvalDateTime` on the `QuorizaActionLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "QuorizaActionLog" DROP COLUMN "approvalDateTime",
ADD COLUMN     "approval" TEXT;
