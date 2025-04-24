/*
  Warnings:

  - You are about to drop the column `createdDate` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `updatedDate` on the `ladActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `createdDate` on the `ladClickLog` table. All the data in the column will be lost.
  - You are about to drop the column `updatedDate` on the `ladClickLog` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `ladActionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ladClickLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ladActionLog" DROP COLUMN "createdDate",
DROP COLUMN "updatedDate",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ladClickLog" DROP COLUMN "createdDate",
DROP COLUMN "updatedDate",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
