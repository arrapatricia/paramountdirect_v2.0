// Trims each product line's application table down to its 5 most recent
// rows (by dateReceived), for clearing out accumulated test data now that
// the real database is in use. Run with `npm run db:trim-applications` (dry
// run - prints what it would delete) or `npm run db:trim-applications --
// --confirm` (actually deletes).
//
// PdLifeApplication has two child tables: PdLifeBeneficiary cascades
// automatically (onDelete: Cascade in schema.prisma), but PdLifeIpeakRequest
// does not, so its rows for any application being removed are deleted
// explicitly first to avoid a foreign-key violation. Everything for a given
// table runs inside one transaction, so a failure partway through leaves
// that table untouched rather than half-trimmed.
//
// Adjust KEEP_PER_TABLE below if you want a different number, or comment
// out a table in TABLES if you only want to trim specific product lines.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_PER_TABLE = 5;

const TABLES = ['pdLifeApplication', 'ofwApplication', 'ctplApplication', 'gtpApplication'] as const;

async function idsToDelete(table: (typeof TABLES)[number]): Promise<string[]> {
  const model = (prisma as any)[table];
  const rows: { id: string }[] = await model.findMany({
    select: { id: true },
    orderBy: { dateReceived: 'desc' },
    skip: KEEP_PER_TABLE,
  });
  return rows.map((r) => r.id);
}

async function main() {
  const confirm = process.argv.includes('--confirm');

  const plan: Record<string, string[]> = {};
  for (const table of TABLES) {
    plan[table] = await idsToDelete(table);
  }

  console.log(`Keeping the ${KEEP_PER_TABLE} most recent rows per table.\n`);
  for (const table of TABLES) {
    console.log(`${table}: ${plan[table].length} row(s) would be deleted`);
  }

  if (!confirm) {
    console.log('\nDry run only - nothing was deleted. Re-run with --confirm to actually delete these rows.');
    return;
  }

  console.log('\n--confirm passed - deleting now...');

  for (const table of TABLES) {
    const ids = plan[table];
    if (ids.length === 0) continue;

    await prisma.$transaction(async (tx) => {
      if (table === 'pdLifeApplication') {
        await tx.pdLifeIpeakRequest.deleteMany({ where: { applicationId: { in: ids } } });
      }
      const model = (tx as any)[table];
      await model.deleteMany({ where: { id: { in: ids } } });
    });

    console.log(`${table}: deleted ${ids.length} row(s)`);
  }

  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
