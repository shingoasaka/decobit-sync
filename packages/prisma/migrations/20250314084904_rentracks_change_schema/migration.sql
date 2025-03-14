/*
  Warnings:

  - You are about to drop the column `deviceIinfo` on the `RentracksActionLog` table. All the data in the column will be lost.
  - You are about to drop the column `reasonRrefusal` on the `RentracksActionLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RentracksActionLog" DROP COLUMN "deviceIinfo",
DROP COLUMN "reasonRrefusal",
ADD COLUMN     "deviceInfo" TEXT,
ADD COLUMN     "reasonRefusal" TEXT;
