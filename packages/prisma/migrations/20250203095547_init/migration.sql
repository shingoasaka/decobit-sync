/*
  Warnings:

  - You are about to alter the column `clientClickCost` on the `ActionLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `partnerClickCost` on the `ActionLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `clientCommissionCost` on the `ActionLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `partnerCommissionCost` on the `ActionLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `clientActionCost` on the `ActionLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `partnerActionCost` on the `ActionLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `clientClickCost` on the `ClickLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `partnerClickCost` on the `ClickLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `clientCommissionCost` on the `ClickLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `partnerCommissionCost` on the `ClickLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `clientActionCost` on the `ClickLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `partnerActionCost` on the `ClickLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "ActionLog" ALTER COLUMN "clientClickCost" SET DATA TYPE INTEGER,
ALTER COLUMN "partnerClickCost" SET DATA TYPE INTEGER,
ALTER COLUMN "clientCommissionCost" SET DATA TYPE INTEGER,
ALTER COLUMN "partnerCommissionCost" SET DATA TYPE INTEGER,
ALTER COLUMN "clientActionCost" SET DATA TYPE INTEGER,
ALTER COLUMN "partnerActionCost" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "ClickLog" ALTER COLUMN "clientClickCost" SET DATA TYPE INTEGER,
ALTER COLUMN "partnerClickCost" SET DATA TYPE INTEGER,
ALTER COLUMN "clientCommissionCost" SET DATA TYPE INTEGER,
ALTER COLUMN "partnerCommissionCost" SET DATA TYPE INTEGER,
ALTER COLUMN "clientActionCost" SET DATA TYPE INTEGER,
ALTER COLUMN "partnerActionCost" SET DATA TYPE INTEGER;
