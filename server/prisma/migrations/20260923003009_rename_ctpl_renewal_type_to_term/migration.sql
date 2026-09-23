-- Renames CtplRenewalType's values from New_1_Year/Renewal (new-business vs
-- renewal) to One_Year/Three_Years (actual policy term length), remapping
-- existing rows 1:1 since none of them represent a real 3-year policy yet.
-- Postgres enums can't have values renamed/dropped in place while rows still
-- reference them, so this creates a new type, migrates the column across,
-- then drops the old type.
BEGIN;
CREATE TYPE "CtplRenewalType_new" AS ENUM ('One_Year', 'Three_Years');
ALTER TABLE "CtplApplication" ALTER COLUMN "renewalType" DROP DEFAULT;
ALTER TABLE "CtplApplication" ALTER COLUMN "renewalType" TYPE "CtplRenewalType_new" USING (
  CASE "renewalType"::text
    WHEN 'New_1_Year' THEN 'One_Year'
    WHEN 'Renewal' THEN 'Three_Years'
  END
)::"CtplRenewalType_new";
DROP TYPE "CtplRenewalType";
ALTER TYPE "CtplRenewalType_new" RENAME TO "CtplRenewalType";
COMMIT;
