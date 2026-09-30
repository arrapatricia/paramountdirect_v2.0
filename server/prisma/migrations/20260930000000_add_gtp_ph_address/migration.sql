-- AlterTable
ALTER TABLE "gtp_applications" ADD COLUMN     "phAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "phBarangay" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "phCity" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "phRegion" TEXT NOT NULL DEFAULT '';
