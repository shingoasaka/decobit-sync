/*
  Warnings:

  - The `actionDateTime` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `clickDateTime` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `admitDateTime` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `clientId` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `contentId` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `partnerId` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `groupId` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `siteId` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `clientClickCost` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `partnerClickCost` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `clientCommissionCost` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `partnerCommissionCost` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `clientActionCost` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `partnerActionCost` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `actionType` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `amount` column on the `ClickLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ActionLog" ALTER COLUMN "clientId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ClickLog" DROP COLUMN "actionDateTime",
ADD COLUMN     "actionDateTime" TIMESTAMP(3),
DROP COLUMN "clickDateTime",
ADD COLUMN     "clickDateTime" TIMESTAMP(3),
DROP COLUMN "admitDateTime",
ADD COLUMN     "admitDateTime" TIMESTAMP(3),
DROP COLUMN "clientId",
ADD COLUMN     "clientId" INTEGER,
DROP COLUMN "contentId",
ADD COLUMN     "contentId" INTEGER,
DROP COLUMN "partnerId",
ADD COLUMN     "partnerId" INTEGER,
DROP COLUMN "groupId",
ADD COLUMN     "groupId" INTEGER,
DROP COLUMN "siteId",
ADD COLUMN     "siteId" INTEGER,
DROP COLUMN "clientClickCost",
ADD COLUMN     "clientClickCost" DECIMAL(10,2),
DROP COLUMN "partnerClickCost",
ADD COLUMN     "partnerClickCost" DECIMAL(10,2),
DROP COLUMN "clientCommissionCost",
ADD COLUMN     "clientCommissionCost" DECIMAL(10,2),
DROP COLUMN "partnerCommissionCost",
ADD COLUMN     "partnerCommissionCost" DECIMAL(10,2),
DROP COLUMN "clientActionCost",
ADD COLUMN     "clientActionCost" DECIMAL(10,2),
DROP COLUMN "partnerActionCost",
ADD COLUMN     "partnerActionCost" DECIMAL(10,2),
DROP COLUMN "actionType",
ADD COLUMN     "actionType" INTEGER,
DROP COLUMN "amount",
ADD COLUMN     "amount" INTEGER;
