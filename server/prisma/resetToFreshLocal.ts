// Wipes every application/payment/audit row so the database looks like a
// fresh install, while keeping the Users listed in KEEP_USER_EMAILS able to
// log in. Branch/Role/RolePermission are left alone - they're reference/
// config data, not the transactional "data" this is meant to clear.
//
// Dry run by default; pass --confirm to actually delete. Run with
// `npx tsx prisma/resetToFreshLocal.ts` (see trimApplications.ts's README
// note on `npm run <script> -- --confirm` sometimes failing to forward the
// flag on Windows/PowerShell - call this directly with npx if that happens).
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_USER_EMAILS = ['admin@paramount.com.ph'];

async function main() {
  const confirm = process.argv.includes('--confirm');

  const [pdLifeCount, ofwCount, ctplCount, gtpCount, paymentCount, auditCount, seqCount, usersToDelete] =
    await Promise.all([
      prisma.pdLifeApplication.count(),
      prisma.ofwApplication.count(),
      prisma.ctplApplication.count(),
      prisma.gtpApplication.count(),
      prisma.paymentTransaction.count(),
      prisma.auditLog.count(),
      prisma.pdLifePolicyNumberSequence.count(),
      prisma.user.findMany({ where: { email: { notIn: KEEP_USER_EMAILS } }, select: { email: true } }),
    ]);

  console.log('This will permanently delete:');
  console.log(`  PD Life applications (+ beneficiaries, iPeak request trail): ${pdLifeCount}`);
  console.log(`  OFW applications: ${ofwCount}`);
  console.log(`  CTPL applications: ${ctplCount}`);
  console.log(`  GTP applications: ${gtpCount}`);
  console.log(`  Payment transactions (+ their ledger items): ${paymentCount}`);
  console.log(`  Audit log entries: ${auditCount}`);
  console.log(`  Policy number sequence counters: ${seqCount}`);
  console.log(`  Users NOT in the keep-list (${KEEP_USER_EMAILS.join(', ')}): ${usersToDelete.length}`);
  if (usersToDelete.length > 0) {
    console.log(`    -> ${usersToDelete.map((u) => u.email).join(', ')}`);
  }
  console.log('\nBranch, Role, and RolePermission rows are left untouched.');

  if (!confirm) {
    console.log('\nDry run only - pass --confirm to actually delete.');
    return;
  }

  console.log('\n--confirm passed - deleting now...');

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany();
    await tx.pdLifeIpeakRequest.deleteMany();
    await tx.pdLifeBeneficiary.deleteMany();
    await tx.pdLifeApplication.deleteMany();
    await tx.pdLifePolicyNumberSequence.deleteMany();
    await tx.ofwApplication.deleteMany();
    await tx.ctplApplication.deleteMany();
    await tx.gtpApplication.deleteMany();
    await tx.paymentLedgerItem.deleteMany();
    await tx.paymentTransaction.deleteMany();
    await tx.user.deleteMany({ where: { email: { notIn: KEEP_USER_EMAILS } } });
  });

  console.log(`\nDone. All application/payment/audit data cleared. Remaining Users: ${KEEP_USER_EMAILS.join(', ')}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
