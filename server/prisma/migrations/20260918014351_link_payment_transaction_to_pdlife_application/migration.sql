-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_policyNo_fkey" FOREIGN KEY ("policyNo") REFERENCES "PdLifeApplication"("policyNumber") ON DELETE RESTRICT ON UPDATE CASCADE;
