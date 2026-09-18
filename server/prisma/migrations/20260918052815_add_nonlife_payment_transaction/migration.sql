-- CreateEnum
CREATE TYPE "NonLifeProduct" AS ENUM ('CTPL', 'OFW', 'GTP');

-- CreateTable
CREATE TABLE "NonLifePaymentTransaction" (
    "id" TEXT NOT NULL,
    "product" "NonLifeProduct" NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "payorName" TEXT NOT NULL,
    "planLabel" TEXT NOT NULL,
    "premium" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3) NOT NULL,
    "ctplApplicationId" TEXT,
    "ofwApplicationId" TEXT,
    "gtpApplicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NonLifePaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NonLifePaymentTransaction_product_idx" ON "NonLifePaymentTransaction"("product");

-- CreateIndex
CREATE INDEX "NonLifePaymentTransaction_policyNumber_idx" ON "NonLifePaymentTransaction"("policyNumber");

-- CreateIndex
CREATE INDEX "NonLifePaymentTransaction_referenceNo_idx" ON "NonLifePaymentTransaction"("referenceNo");

-- AddForeignKey
ALTER TABLE "NonLifePaymentTransaction" ADD CONSTRAINT "NonLifePaymentTransaction_ctplApplicationId_fkey" FOREIGN KEY ("ctplApplicationId") REFERENCES "CtplApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonLifePaymentTransaction" ADD CONSTRAINT "NonLifePaymentTransaction_ofwApplicationId_fkey" FOREIGN KEY ("ofwApplicationId") REFERENCES "OfwApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonLifePaymentTransaction" ADD CONSTRAINT "NonLifePaymentTransaction_gtpApplicationId_fkey" FOREIGN KEY ("gtpApplicationId") REFERENCES "GtpApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
