// Shared by applications.ofw.ts (staff-facing CRUD) and ingest.ofw.ts
// (ofwinsurance.ph webhook) so both assign numbers the same way - mirrors
// ctplNumbering.ts's split between Reference No. and policy identifier.
//
// Reference No. is assigned to every OFW application as soon as it exists,
// paid or not - it's the number staff use to look an application up before
// a policy is ever issued, e.g. 3000044047 (3000 + 6 digits). COI Number
// (Certificate of Insurance - OFW's equivalent of a policy number) is
// assigned later, only once the policy is actually issued (isPaid), e.g.
// 80035231 (800 + 5 digits).
import { prisma } from './prisma';

const randomDigits = (length: number) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

export async function generateUniqueOfwReferenceNo(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `3000${randomDigits(6)}`;
    if (!(await prisma.ofwApplication.findUnique({ where: { referenceNo: candidate } }))) return candidate;
  }
  throw new Error('Failed to generate a unique OFW reference number');
}

export async function generateUniqueOfwCoiNumber(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `800${randomDigits(5)}`;
    if (!(await prisma.ofwApplication.findUnique({ where: { policyNumber: candidate } }))) return candidate;
  }
  throw new Error('Failed to generate a unique OFW COI number');
}
