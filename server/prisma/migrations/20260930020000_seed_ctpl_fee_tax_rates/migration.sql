-- Seed the CTPL fee/tax parameters that premiumCalc.ts now requires from the
-- premium_rates table (previously silent hardcoded fallbacks). Idempotent:
-- existing rows (and any edits made in Premium Maintenance) are left alone.
INSERT INTO "premium_rates" ("id", "product", "key", "label", "amount", "currency", "unit", "updatedAt") VALUES
  ('ctpl-cov-fee', 'CTPL', 'covFee', 'Certificate of Validation (COV) fee', 60, 'PHP', 'AddOn', CURRENT_TIMESTAMP),
  ('ctpl-dst-per-unit', 'CTPL', 'dstAmountPerUnit', 'Documentary Stamp Tax per P4 of premium', 0.5, 'PHP', 'Flat', CURRENT_TIMESTAMP),
  ('ctpl-lgt-percent', 'CTPL', 'lgtPercent', 'Local Government Tax (% of premium)', 0.75, '%', 'Percent', CURRENT_TIMESTAMP),
  ('ctpl-vat-percent', 'CTPL', 'vatPercent', 'VAT (% of premium)', 12, '%', 'Percent', CURRENT_TIMESTAMP),
  ('ctpl-other-fees', 'CTPL', 'otherFees', 'Other Fees/Charges (flat)', 46, 'PHP', 'Flat', CURRENT_TIMESTAMP)
ON CONFLICT ("product", "key") DO NOTHING;
