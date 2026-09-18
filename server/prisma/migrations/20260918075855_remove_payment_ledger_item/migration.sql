-- AlterEnum
ALTER TYPE "PdLifeIpeakMethod" ADD VALUE 'PolicyInquiry';

-- DropForeignKey
ALTER TABLE "PaymentLedgerItem" DROP CONSTRAINT "PaymentLedgerItem_paymentId_fkey";

-- DropTable
DROP TABLE "PaymentLedgerItem";

