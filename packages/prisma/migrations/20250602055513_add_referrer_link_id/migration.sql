-- AlterTable
ALTER TABLE "AspActionLog" ADD COLUMN     "referrer_link_id" INTEGER;

-- CreateTable
CREATE TABLE "ReferrerLink" (
    "id" SERIAL NOT NULL,
    "ad_account_id" INTEGER NOT NULL,
    "creative_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferrerLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferrerLink_creative_value_key" ON "ReferrerLink"("creative_value");

-- AddForeignKey
ALTER TABLE "ReferrerLink" ADD CONSTRAINT "ReferrerLink_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "AdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AspActionLog" ADD CONSTRAINT "AspActionLog_referrer_link_id_fkey" FOREIGN KEY ("referrer_link_id") REFERENCES "ReferrerLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AspClickLog" ADD CONSTRAINT "AspClickLog_referrer_link_id_fkey" FOREIGN KEY ("referrer_link_id") REFERENCES "ReferrerLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClickLogSnapshot" ADD CONSTRAINT "ClickLogSnapshot_referrer_link_id_fkey" FOREIGN KEY ("referrer_link_id") REFERENCES "ReferrerLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkMatcher" ADD CONSTRAINT "LinkMatcher_referrer_link_id_fkey" FOREIGN KEY ("referrer_link_id") REFERENCES "ReferrerLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
