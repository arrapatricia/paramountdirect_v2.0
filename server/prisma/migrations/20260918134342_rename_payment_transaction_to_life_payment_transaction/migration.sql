-- RenameTable
ALTER TABLE "PaymentTransaction" RENAME TO "LifePaymentTransaction";

-- RenameConstraint (primary key)
ALTER TABLE "LifePaymentTransaction" RENAME CONSTRAINT "PaymentTransaction_pkey" TO "LifePaymentTransaction_pkey";

-- RenameForeignKey (LifePaymentTransaction.policyNo -> PdLifeApplication.policyNumber)
ALTER TABLE "LifePaymentTransaction" RENAME CONSTRAINT "PaymentTransaction_policyNo_fkey" TO "LifePaymentTransaction_policyNo_fkey";

-- RenameIndex (unique index on policyNo)
ALTER INDEX "PaymentTransaction_policyNo_key" RENAME TO "LifePaymentTransaction_policyNo_key";
