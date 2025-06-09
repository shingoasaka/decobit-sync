/*
  Warnings:

  - A unique constraint covering the columns `[ad_account_id,asp_type,media_level,target_dim_id]` on the table `LinkMatcher` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "LinkMatcher" DROP CONSTRAINT "LinkMatcher_affiliate_link_id_fkey";

-- DropIndex
DROP INDEX "LinkMatcher_ad_account_id_asp_type_target_dim_id_key";

-- AlterTable
ALTER TABLE "LinkMatcher" ALTER COLUMN "affiliate_link_id" DROP NOT NULL,
ALTER COLUMN "target_dim_id" SET DATA TYPE BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "LinkMatcher_ad_account_id_asp_type_media_level_target_dim_i_key" ON "LinkMatcher"("ad_account_id", "asp_type", "media_level", "target_dim_id");

-- AddForeignKey
ALTER TABLE "LinkMatcher" ADD CONSTRAINT "LinkMatcher_affiliate_link_id_fkey" FOREIGN KEY ("affiliate_link_id") REFERENCES "AffiliateLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
