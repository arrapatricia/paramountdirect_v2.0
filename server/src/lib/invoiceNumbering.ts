// Invoice numbers use Paramount's "6000000" e-invoice series (e.g.
// 6000000277501) - same random-digits-plus-uniqueness-check convention as
// ctplNumbering.ts's policy/reference numbers, just checked against
// GeneratedDocument.invoiceNumber instead.
import { prisma } from './prisma';

const randomDigits = (length: number) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

export async function generateUniqueInvoiceNumber(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `6000000${randomDigits(6)}`;
    if (!(await prisma.generatedDocument.findUnique({ where: { invoiceNumber: candidate } }))) return candidate;
  }
  throw new Error('Failed to generate a unique invoice number');
}
