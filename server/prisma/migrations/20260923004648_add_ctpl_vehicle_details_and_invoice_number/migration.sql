-- AlterTable
ALTER TABLE "CtplApplication" ADD COLUMN     "authorizedCapacity" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "effectiveDate" TIMESTAMP(3),
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "motorNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "unladenWeight" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "vehicleBodyType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "vehicleColor" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "vehicleMake" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "vehicleModel" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "GeneratedDocument" ADD COLUMN     "invoiceNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedDocument_invoiceNumber_key" ON "GeneratedDocument"("invoiceNumber");

