// Generates PD Life policy numbers in the real Paramount format
// PLANCODE-NNNNNN-D (e.g. "HCP-043385-0"), confirmed against the actual
// AS400 "New Application for Upload" queue. The sequential number is
// per-plan-code and PD 2.0-generated (not assigned by iPeak); the trailing
// digit is a check digit iPeak doesn't validate (cosmetic only), and it is
// always 0 or 1 (a parity bit), never 0-9.
import { prisma } from '../../lib/prisma';

async function nextSequenceNumber(planCode: string): Promise<number> {
  const rows = await prisma.$queryRaw<{ lastNumber: number }[]>`
    INSERT INTO "PdLifePolicyNumberSequence" ("planCode", "lastNumber")
    VALUES (${planCode}, 1)
    ON CONFLICT ("planCode")
    DO UPDATE SET "lastNumber" = "PdLifePolicyNumberSequence"."lastNumber" + 1
    RETURNING "lastNumber"
  `;
  return rows[0].lastNumber;
}

export async function generatePolicyNumber(planCode: string): Promise<string> {
  const n = await nextSequenceNumber(planCode);
  const padded = String(n).padStart(6, '0');
  const checkDigit = n % 2;
  return `${planCode}-${padded}-${checkDigit}`;
}
