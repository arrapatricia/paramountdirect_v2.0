-- CreateEnum
CREATE TYPE "EmploymentVerifiedStatus" AS ENUM ('Pending', 'Yes', 'No');

-- AlterTable
ALTER TABLE "CtplApplication" ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownerAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ownerBarangay" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ownerCity" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ownerRegion" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "GtpApplication" ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OfwApplication" ADD COLUMN     "employmentVerified" "EmploymentVerifiedStatus" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentInstructionSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phBarangay" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "phRegion" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "OfwBeneficiary" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfwBeneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfwBeneficiary_applicationId_idx" ON "OfwBeneficiary"("applicationId");

-- AddForeignKey
ALTER TABLE "OfwBeneficiary" ADD CONSTRAINT "OfwBeneficiary_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "OfwApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
