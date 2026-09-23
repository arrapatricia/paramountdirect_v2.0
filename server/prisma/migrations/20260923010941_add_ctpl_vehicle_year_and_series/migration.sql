-- Rename rather than drop+add: vehicleModel was renamed to vehicleSeries to
-- match ctpl.ph's own "Series" terminology, and vehicleYear is new.
ALTER TABLE "CtplApplication" RENAME COLUMN "vehicleModel" TO "vehicleSeries";
ALTER TABLE "CtplApplication" ADD COLUMN "vehicleYear" TEXT NOT NULL DEFAULT '';
