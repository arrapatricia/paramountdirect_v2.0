-- CreateEnum
CREATE TYPE "DocumentApplicationType" AS ENUM ('PdLife', 'OFW', 'CTPL', 'GTP');

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "applicationType" "DocumentApplicationType" NOT NULL,
    "applicationId" TEXT NOT NULL,
    "docKey" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'application/pdf',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedDocument_s3Key_key" ON "GeneratedDocument"("s3Key");

-- CreateIndex
CREATE INDEX "GeneratedDocument_applicationType_applicationId_idx" ON "GeneratedDocument"("applicationType", "applicationId");
