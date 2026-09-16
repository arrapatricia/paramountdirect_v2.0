-- CreateEnum
CREATE TYPE "PdLifeIpeakMethod" AS ENUM ('NewBusiness', 'UpdateStatus');

-- AlterTable
ALTER TABLE "PdLifeApplication" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "birthdate" TIMESTAMP(3),
ADD COLUMN     "civilStatus" "CivilStatus",
ADD COLUMN     "companyAddress" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "heightCm" DOUBLE PRECISION,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "mobileNumber" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "otherName" TEXT,
ADD COLUMN     "placeOfBirth" TEXT,
ADD COLUMN     "policyNumber" TEXT,
ADD COLUMN     "residingAddress" TEXT,
ADD COLUMN     "sourceOfFunds" TEXT,
ADD COLUMN     "sssNo" TEXT,
ADD COLUMN     "telephoneNumber" TEXT,
ADD COLUMN     "tin" TEXT,
ADD COLUMN     "weightKg" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "PdLifeBeneficiary" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "relationship" TEXT NOT NULL,
    "sharePercent" DOUBLE PRECISION,
    "designation" TEXT,
    "trusteeName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdLifeBeneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdLifeIpeakRequest" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "method" "PdLifeIpeakMethod" NOT NULL,
    "requestPayload" JSONB NOT NULL,
    "responseBody" JSONB,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PdLifeIpeakRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PdLifeBeneficiary_applicationId_idx" ON "PdLifeBeneficiary"("applicationId");

-- CreateIndex
CREATE INDEX "PdLifeIpeakRequest_applicationId_idx" ON "PdLifeIpeakRequest"("applicationId");

-- CreateIndex
CREATE INDEX "PdLifeIpeakRequest_policyNumber_idx" ON "PdLifeIpeakRequest"("policyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PdLifeApplication_policyNumber_key" ON "PdLifeApplication"("policyNumber");

-- AddForeignKey
ALTER TABLE "PdLifeBeneficiary" ADD CONSTRAINT "PdLifeBeneficiary_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PdLifeApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdLifeIpeakRequest" ADD CONSTRAINT "PdLifeIpeakRequest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PdLifeApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

