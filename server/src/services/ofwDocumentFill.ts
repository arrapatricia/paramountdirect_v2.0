// Fills OFW's Service Invoice - the same fillable-PDF template and BIR-style
// layout as ctplDocumentFill.ts's Service Invoice (confirmed: OFW, CTPL, and
// GTP share one Invoice No. series and one invoice template), copied to its
// own template path so it can diverge later if the business ever needs it
// to. Unlike CTPL's motor-insurance-specific Doc Stamps/LGT/Verification
// Fee breakdown, OFW premiums carry no such itemization here - the fields
// that only make sense for a CTPL policy (plate/chassis/motor number, COC
// number, DST/LGT, three-year proration) are left blank rather than guessed.
// Called once, from applications.ofw.ts, the moment isPaid first flips true.
import { readFileSync } from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import type { OfwApplication } from '@prisma/client';
import { generateUniqueInvoiceNumber } from '../lib/invoiceNumbering';

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'ofw');

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: '2-digit' }).toUpperCase();
}

function parsePremium(premium: string): number {
  const n = parseFloat(premium.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

async function fillFields(templateFile: string, values: Record<string, string>): Promise<Buffer> {
  const bytes = readFileSync(path.join(TEMPLATES_DIR, templateFile));
  const pdf = await PDFDocument.load(bytes);
  const form = pdf.getForm();

  for (const [name, value] of Object.entries(values)) {
    const field = form.getFieldMaybe(name);
    if (!field) continue; // template revision may not have every field - skip rather than throw
    try {
      form.getTextField(name).setText(value);
    } catch {
      // Not a text field (or otherwise unsettable) - leave it untouched.
    }
  }
  form.updateFieldAppearances();

  const filled = await pdf.save();
  return Buffer.from(filled);
}

export async function fillOfwServiceInvoice(app: OfwApplication): Promise<{ buffer: Buffer; invoiceNumber: string }> {
  const name = `${app.firstName} ${app.middleName} ${app.lastName}`.replace(/\s+/g, ' ').trim();
  const premium = parsePremium(app.premium);
  const invoiceNumber = await generateUniqueInvoiceNumber();

  const fmt = (n: number) => formatCurrency(n);

  const buffer = await fillFields('ofw-service-invoice.pdf', {
    insured_name: name,
    insured_address: app.phAddress,
    invoice_number: invoiceNumber,
    payment_ref: app.referenceNo ?? '',
    invoice_date: formatDate(new Date()),
    policy_number: app.policyNumber ?? '',
    quantity: '1',
    unit_cost: fmt(premium),
    total_cost: fmt(premium),
    unit: `${app.coverageType.replace('_', '-')} OFW Insurance`,
    line_of_insurance: 'OFW COMPULSORY INSURANCE',
    // OFW premiums carry no itemized VAT/DST breakdown in this system - the
    // full premium is treated as VAT-exempt rather than guessing a VAT split.
    vatable_sales: fmt(0),
    zero_rated_sales: fmt(0),
    vat_exempt: fmt(premium),
    vat: fmt(0),
    total_sales: fmt(premium),
    withholding_tax: fmt(0),
    scpwd_discount: fmt(0),
    total_amount_due: fmt(premium),
    // CTPL-only fields on this shared template - not applicable to OFW:
    plate_number: '',
    serial_chassis: '',
    motor_number: '',
    coc_number: '',
    ctpl_premium: '',
    doc_stamps: '',
    lgt: '',
    verification_fee: '',
    curr_ctpl_premium: '',
    curr_doc_stamps: '',
    curr_lgt: '',
    curr_verification_fee: '',
    curr_vat: '',
    curr_total_sales: '',
    curr_withholding_tax: '',
    curr_scpwd_discount: '',
    curr_total_amount_due: '',
    // Not tracked yet - left blank rather than guessed:
    insured_tin: '',
    sc_pwd_id: '',
    agents_code: '',
    endorsement_number: '',
    old_pol_no: '',
    vat_breakdown: '',
  });

  return { buffer, invoiceNumber };
}
