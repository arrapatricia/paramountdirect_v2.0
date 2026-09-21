// One-off data fix-up: PdLifeApplication.premium is meant to be a plain
// numeric string ("500.00"), but a few rows created before the create-
// application form was fixed still have a leading currency sign baked in
// ("₱500.00"). Strips it from any row that has one.
//
// Dry run by default; pass --confirm to actually update. Run with
// `npx tsx prisma/stripPremiumCurrencySign.ts` from server/.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const confirm = process.argv.includes('--confirm');

  const affected = await prisma.pdLifeApplication.findMany({
    where: { premium: { startsWith: '₱' } },
    select: { id: true, policyNumber: true, premium: true },
  });

  console.log(`Found ${affected.length} PdLifeApplication row(s) with a currency sign in premium:`);
  affected.forEach((row) => {
    console.log(`  ${row.policyNumber ?? row.id}: "${row.premium}" -> "${row.premium.replace(/^₱/, '')}"`);
  });

  if (!confirm) {
    console.log('\nDry run only - pass --confirm to actually update.');
    return;
  }

  console.log('\n--confirm passed - updating now...');
  for (const row of affected) {
    await prisma.pdLifeApplication.update({
      where: { id: row.id },
      data: { premium: row.premium.replace(/^₱/, '') },
    });
  }
  console.log(`Done. Updated ${affected.length} row(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
