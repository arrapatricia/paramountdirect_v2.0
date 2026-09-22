// Shared by applications.ctpl.ts (staff-facing CRUD) and ingest.ctpl.ts
// (ctpl.ph webhook) so both assign numbers the same way.
//
// Reference No. is assigned to every CTPL application as soon as it exists,
// paid or not - it's the number staff use to look an application up before
// a policy is ever issued. Policy Number is assigned later, only once the
// policy is actually issued (isPaid), and is prefixed by policy type -
// {PREFIX}COC-{10 digits} (COC = Certificate of Cover), e.g.
// PCOC-0000298718, MCOC-0005794584. A for-public-use Motorcycle (e.g.
// habal-habal) gets its own "L" series instead of "M".
import { prisma } from './prisma';
import type { CtplPolicyType } from '@prisma/client';

const CTPL_POLICY_PREFIX: Record<CtplPolicyType, string> = {
  Private_Car: 'P',
  Commercial_Vehicle: 'C',
  Motorcycle: 'M',
};

export const ctplPolicyPrefix = (policyType: CtplPolicyType, forPublicUse: boolean) =>
  policyType === 'Motorcycle' && forPublicUse ? 'L' : CTPL_POLICY_PREFIX[policyType];

const randomDigits = (length: number) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

export async function generateUniqueCtplPolicyNumber(policyType: CtplPolicyType, forPublicUse: boolean): Promise<string> {
  const prefix = ctplPolicyPrefix(policyType, forPublicUse);
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `${prefix}COC-${randomDigits(10)}`;
    if (!(await prisma.ctplApplication.findUnique({ where: { policyNumber: candidate } }))) return candidate;
  }
  throw new Error('Failed to generate a unique CTPL policy number');
}

export async function generateUniqueCtplReferenceNo(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `2600${randomDigits(6)}`;
    if (!(await prisma.ctplApplication.findUnique({ where: { referenceNo: candidate } }))) return candidate;
  }
  throw new Error('Failed to generate a unique CTPL reference number');
}
