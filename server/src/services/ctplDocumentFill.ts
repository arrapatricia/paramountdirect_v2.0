// Fills the two CTPL fillable-PDF templates (COC, Service Invoice) with a
// CtplApplication's data and the reconciled premium-breakdown formula from
// premium_rates.ts (Base + DST + LGT + VAT + flat Other Fees). Called once,
// from applications.ctpl.ts's PUT handler, the moment isPaid first flips
// true and a policyNumber is assigned - see storeGeneratedDocument for the
// immutable-record contract this feeds into.
import { readFileSync } from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import type { CtplApplication } from '@prisma/client';
import { generateUniqueInvoiceNumber } from '../lib/invoiceNumbering';

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'ctpl');

const CTPL_POLICY_TYPE_LABEL: Record<string, string> = {
  Private_Car: 'PRIVATE CAR',
  Commercial_Vehicle: 'COMMERCIAL VEHICLE',
  Motorcycle: 'MOTORCYCLE',
};

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

// Reconciled against real Service Invoices - see premium_rates.ts:82-87.
// `base` is the Premium line itself; everything else is derived from it.
function computeCtplBreakdown(base: number) {
  const dst = Math.ceil(base / 4) * 0.5;
  const lgt = Math.round(base * 0.0075 * 100) / 100;
  const vat = Math.round(base * 0.12 * 100) / 100;
  const otherFees = 46;
  const vatExempt = Math.round((dst + lgt + otherFees) * 100) / 100;
  const total = Math.round((base + dst + lgt + otherFees + vat) * 100) / 100;
  return { base, dst, lgt, otherFees, vat, vatExempt, total };
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

function insuredNameAndAddress(app: CtplApplication) {
  const name = app.sameAsOwner
    ? `${app.ownerFirstName} ${app.ownerMiddleName} ${app.ownerSurname}`.replace(/\s+/g, ' ').trim()
    : `${app.applicantFirstName} ${app.applicantSurname}`.replace(/\s+/g, ' ').trim();
  return { name, address: app.ownerAddress };
}

export async function fillCtplCoc(app: CtplApplication): Promise<Buffer> {
  const { name, address } = insuredNameAndAddress(app);
  const breakdown = computeCtplBreakdown(parsePremium(app.premium));

  return fillFields('ctpl-coc.pdf', {
    policy_number: app.policyNumber ?? '',
    coc_number: app.policyNumber ?? '',
    date_issued: formatDate(new Date()),
    inception_date_1: formatDate(app.effectiveDate),
    inception_date_2: formatDate(app.expiryDate),
    model: app.vehicleModel,
    make: app.vehicleMake,
    type_of_body: app.vehicleBodyType,
    color: app.vehicleColor,
    mv_file_number: app.mvFileNumber,
    plate_number: app.plateNumber,
    serial_chassis: app.chassisNumber,
    motor_number: app.motorNumber,
    authorized_capacity: app.authorizedCapacity,
    unladen_weight: app.unladenWeight,
    coc_total_amount_due_new: formatCurrency(breakdown.total),
    insured_name_address: `${name}, ${address}`,
    // Not tracked yet - left blank rather than guessed:
    authentication_number: '',
    business_profession: '',
    official_receipt_no: '',
  });
}

export async function fillCtplServiceInvoice(app: CtplApplication): Promise<{ buffer: Buffer; invoiceNumber: string }> {
  const { name, address } = insuredNameAndAddress(app);
  const breakdown = computeCtplBreakdown(parsePremium(app.premium));
  const invoiceNumber = await generateUniqueInvoiceNumber();

  const fmt = (n: number) => formatCurrency(n);

  const buffer = await fillFields('ctpl-service-invoice.pdf', {
    insured_name: name,
    insured_address: address,
    invoice_number: invoiceNumber,
    payment_ref: app.referenceNo ?? '',
    invoice_date: formatDate(new Date()),
    policy_number: app.policyNumber ?? '',
    effectivity_date: formatDate(app.effectiveDate),
    expiration_date: formatDate(app.expiryDate),
    quantity: '1',
    unit_cost: fmt(breakdown.base),
    total_cost: fmt(breakdown.base),
    unit: `${app.vehicleMake} ${app.vehicleModel}`.trim(),
    plate_number: app.plateNumber,
    serial_chassis: app.chassisNumber,
    motor_number: app.motorNumber,
    coc_number: app.policyNumber ?? '',
    line_of_insurance: CTPL_POLICY_TYPE_LABEL[app.policyType] ?? app.policyType,
    vatable_sales: fmt(breakdown.base),
    zero_rated_sales: fmt(0),
    vat_exempt: fmt(breakdown.vatExempt),
    vat: fmt(breakdown.vat),
    ctpl_premium: fmt(breakdown.base),
    doc_stamps: fmt(breakdown.dst),
    lgt: fmt(breakdown.lgt),
    verification_fee: fmt(breakdown.otherFees),
    total_sales: fmt(breakdown.total),
    withholding_tax: fmt(0),
    scpwd_discount: fmt(0),
    total_amount_due: fmt(breakdown.total),
    // "curr_*" fields mirror a multi-year (Three_Years) policy's current-year
    // charge on the real form; per-year proration isn't implemented, so for
    // now these just mirror the full totals above rather than being left
    // blank on the printed document.
    curr_ctpl_premium: fmt(breakdown.base),
    curr_doc_stamps: fmt(breakdown.dst),
    curr_lgt: fmt(breakdown.lgt),
    curr_verification_fee: fmt(breakdown.otherFees),
    curr_vat: fmt(breakdown.vat),
    curr_total_sales: fmt(breakdown.total),
    curr_withholding_tax: fmt(0),
    curr_scpwd_discount: fmt(0),
    curr_total_amount_due: fmt(breakdown.total),
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
