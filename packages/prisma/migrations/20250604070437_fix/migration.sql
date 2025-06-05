/*
  Warnings:

  - You are about to drop the column `referrerUrl` on the `AspActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `referrerUrl` on the `AspClickLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AspActionLog" DROP COLUMN "referrerUrl",
ADD COLUMN     "referrer_url" TEXT;

-- AlterTable
ALTER TABLE "AspClickLog" DROP COLUMN "referrerUrl",
ADD COLUMN     "referrer_url" TEXT;
