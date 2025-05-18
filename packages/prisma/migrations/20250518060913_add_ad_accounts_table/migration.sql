-- CreateTable
CREATE TABLE "AdAccount" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ad_platform_account_id" TEXT NOT NULL,
    "ad_platform_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdAccount_name_key" ON "AdAccount"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AdAccount_ad_platform_account_id_ad_platform_id_key" ON "AdAccount"("ad_platform_account_id", "ad_platform_id");
