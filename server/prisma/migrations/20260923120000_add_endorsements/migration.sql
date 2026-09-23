-- CreateEnum
CREATE TYPE "EndorsementType" AS ENUM ('Non_Financial', 'Term_Extension', 'Cancellation_Flat', 'Cancellation_Pro_Rata');

-- CreateEnum
CREATE TYPE "EndorsementStatus" AS ENUM ('Pending', 'Reviewed', 'Approved', 'Denied');

-- AlterTable
ALTER TABLE "GeneratedDocument" ADD COLUMN     "endorsementId" TEXT;

-- CreateTable
CREATE TABLE "Endorsement" (
    "id" TEXT NOT NULL,
    "product" "NonLifeProduct" NOT NULL,
    "ctplApplicationId" TEXT,
    "ofwApplicationId" TEXT,
    "gtpApplicationId" TEXT,
    "policyNumber" TEXT NOT NULL,
    "type" "EndorsementType" NOT NULL,
    "status" "EndorsementStatus" NOT NULL DEFAULT 'Pending',
    "endorsementNumber" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "changes" JSONB,
    "withDeedOfSale" BOOLEAN NOT NULL DEFAULT false,
    "previousExpiryDate" TIMESTAMP(3),
    "newExpiryDate" TIMESTAMP(3),
    "premium" DOUBLE PRECISION,
    "dst" DOUBLE PRECISION,
    "vat" DOUBLE PRECISION,
    "lgt" DOUBLE PRECISION,
    "otherFees" DOUBLE PRECISION,
    "total" DOUBLE PRECISION,
    "invoiceNumber" TEXT,
    "creditMemoNumber" TEXT,
    "requestedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewRemarks" TEXT,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Endorsement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberSequence" (
    "key" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Endorsement_endorsementNumber_key" ON "Endorsement"("endorsementNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Endorsement_invoiceNumber_key" ON "Endorsement"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Endorsement_creditMemoNumber_key" ON "Endorsement"("creditMemoNumber");

-- CreateIndex
CREATE INDEX "Endorsement_product_status_idx" ON "Endorsement"("product", "status");

-- CreateIndex
CREATE INDEX "Endorsement_ctplApplicationId_idx" ON "Endorsement"("ctplApplicationId");

-- CreateIndex
CREATE INDEX "Endorsement_ofwApplicationId_idx" ON "Endorsement"("ofwApplicationId");

-- CreateIndex
CREATE INDEX "Endorsement_gtpApplicationId_idx" ON "Endorsement"("gtpApplicationId");

-- CreateIndex
CREATE INDEX "GeneratedDocument_endorsementId_idx" ON "GeneratedDocument"("endorsementId");

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_endorsementId_fkey" FOREIGN KEY ("endorsementId") REFERENCES "Endorsement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endorsement" ADD CONSTRAINT "Endorsement_ctplApplicationId_fkey" FOREIGN KEY ("ctplApplicationId") REFERENCES "CtplApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endorsement" ADD CONSTRAINT "Endorsement_ofwApplicationId_fkey" FOREIGN KEY ("ofwApplicationId") REFERENCES "OfwApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endorsement" ADD CONSTRAINT "Endorsement_gtpApplicationId_fkey" FOREIGN KEY ("gtpApplicationId") REFERENCES "GtpApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

