// Endorsement and Credit Memo numbers are sequential (not random like the
// policy/reference/invoice numbers), same as the legacy system's
// c2c_endorsement_series / ofw_endorsement_numbers / credit_memos series -
// backed by one NumberSequence row per series, incremented atomically so
// two approvals at once never get the same number.
//
//   Endorsement No. - EN-{PRODUCT}-{8 digits}, e.g. EN-CTPL-00000001
//   Credit Memo No. - CM{11 digits}, e.g. CM00000000001 (one series shared
//                     by all non-life products, like the Service Invoice)
import type { NonLifeProduct, Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

async function nextInSequence(tx: Tx, key: string): Promise<number> {
  const row = await tx.numberSequence.upsert({
    where: { key },
    create: { key, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return row.lastNumber;
}

export async function nextEndorsementNumber(tx: Tx, product: NonLifeProduct): Promise<string> {
  const n = await nextInSequence(tx, `endorsement-${product}`);
  return `EN-${product}-${String(n).padStart(8, '0')}`;
}

export async function nextCreditMemoNumber(tx: Tx): Promise<string> {
  const n = await nextInSequence(tx, 'credit-memo');
  return `CM${String(n).padStart(11, '0')}`;
}
