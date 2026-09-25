-- fxRate was a floating-point double precision; switched to a fixed
-- NUMERIC(12,3) per dev request to avoid binary float rounding drift.
-- Existing values are cast in place - no rows are dropped or recreated.
ALTER TABLE "ofw_applications" ALTER COLUMN "fxRate" TYPE numeric(12,3);
