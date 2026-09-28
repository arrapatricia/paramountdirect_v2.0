-- CreateEnum
CREATE TYPE "PremiumRateUnit" AS ENUM ('Flat', 'PerDay', 'PerMonth', 'AddOn', 'Percent');

-- CreateTable
CREATE TABLE "premium_rates" (
    "id" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "unit" "PremiumRateUnit" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "premium_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "premium_rates_product_key_key" ON "premium_rates"("product", "key");
