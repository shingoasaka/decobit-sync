/*
  Warnings:

  - You are about to drop the column `ad_account_id` on the `AffiliateLink` table. All the data in the column will be lost.
  - You are about to drop the column `ad_account_id` on the `ReferrerLink` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AffiliateLink" DROP CONSTRAINT "AffiliateLink_ad_account_id_fkey";

-- DropForeignKey
ALTER TABLE "ReferrerLink" DROP CONSTRAINT "ReferrerLink_ad_account_id_fkey";

-- AlterTable
ALTER TABLE "AffiliateLink" DROP COLUMN "ad_account_id";

-- AlterTable
ALTER TABLE "ReferrerLink" DROP COLUMN "ad_account_id";
