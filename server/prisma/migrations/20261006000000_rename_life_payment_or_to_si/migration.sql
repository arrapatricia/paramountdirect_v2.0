-- Life issues a Service Invoice, never an Official Receipt. Pure column
-- renames (no data change).
ALTER TABLE "life_payment_transactions" RENAME COLUMN "orDate" TO "siDate";
ALTER TABLE "life_payment_transactions" RENAME COLUMN "orNumber" TO "siNumber";
