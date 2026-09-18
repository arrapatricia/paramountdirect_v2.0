-- AlterTable
ALTER TABLE "OfwApplication" ADD COLUMN     "policyNumber" TEXT,
ADD COLUMN     "referenceNo" TEXT;

-- AlterTable
ALTER TABLE "CtplApplication" ADD COLUMN     "policyNumber" TEXT,
ADD COLUMN     "referenceNo" TEXT;

-- AlterTable
ALTER TABLE "GtpApplication" ADD COLUMN     "policyNumber" TEXT,
ADD COLUMN     "referenceNo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "OfwApplication_policyNumber_key" ON "OfwApplication"("policyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OfwApplication_referenceNo_key" ON "OfwApplication"("referenceNo");

-- CreateIndex
CREATE UNIQUE INDEX "CtplApplication_policyNumber_key" ON "CtplApplication"("policyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CtplApplication_referenceNo_key" ON "CtplApplication"("referenceNo");

-- CreateIndex
CREATE UNIQUE INDEX "GtpApplication_policyNumber_key" ON "GtpApplication"("policyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GtpApplication_referenceNo_key" ON "GtpApplication"("referenceNo");
