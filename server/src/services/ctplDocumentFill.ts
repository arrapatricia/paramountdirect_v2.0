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
import { ctplPolicyPrefix } from '../lib/ctplNumbering';

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'ctpl');

export const CTPL_POLICY_TYPE_LABEL: Record<string, string> = {
  Private_Car: 'PRIVATE CAR',
  Commercial_Vehicle: 'COMMERCIAL VEHICLE',
  Motorcycle: 'MOTORCYCLE',
};

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(date: Date | null): string {
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

// The templates' fields use the standard Helvetica font, which can only
// encode WinAnsi - map the few common characters outside it (peso sign,
// curly quotes, dashes) and drop anything else rather than throw mid-fill.
function toWinAnsi(value: string): string {
  return value
    .replace(/\u20B1/g, 'PHP ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\t/g, '    ')
    .replace(/[^\n\x20-\x7E\xA0-\xFF]/g, '');
}

export async function fillFields(templateFile: string, values: Record<string, string>): Promise<Buffer> {
  const bytes = readFileSync(path.join(TEMPLATES_DIR, templateFile));
  const pdf = await PDFDocument.load(bytes);
  const form = pdf.getForm();

  for (const [name, value] of Object.entries(values)) {
    const field = form.getFieldMaybe(name);
    if (!field) continue; // template revision may not have every field - skip rather than throw
    try {
      form.getTextField(name).setText(toWinAnsi(value));
    } catch {
      // Not a text field (or otherwise unsettable) - leave it untouched.
    }
  }
  form.updateFieldAppearances();
  // Bake the values into the page content and drop the form fields - a
  // generated document must not stay editable by whoever opens it (matches
  // the legacy Rails app's `pdftk.fill_form(..., flatten: true)`).
  form.flatten();

  const filled = await pdf.save();
  return Buffer.from(filled);
}

export function insuredNameAndAddress(app: CtplApplication) {
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
    model: app.vehicleSeries,
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

export async function fillCtplPolicySchedule(app: CtplApplication): Promise<Buffer> {
  const { name, address } = insuredNameAndAddress(app);
  const breakdown = computeCtplBreakdown(parsePremium(app.premium));

  return fillFields('ctpl-policy-schedule.pdf', {
    policy_number: app.policyNumber ?? '',
    coc_number: app.policyNumber ?? '',
    date_issued: formatDate(new Date()),
    inception_date_1: formatDate(app.effectiveDate),
    inception_date_2: formatDate(app.expiryDate),
    model: app.vehicleSeries,
    make: app.vehicleMake,
    type_of_body: app.vehicleBodyType,
    color: app.vehicleColor,
    mv_file_number: app.mvFileNumber,
    plate_number: app.plateNumber,
    serial_chassis: app.chassisNumber,
    motor_number: app.motorNumber,
    authorized_capacity: app.authorizedCapacity,
    'UNLADEN WEIGHT': app.unladenWeight,
    ctpl_premium: formatCurrency(breakdown.base),
    total_premium: formatCurrency(breakdown.total),
    doc_stamps: formatCurrency(breakdown.dst),
    doc_stamps_2: formatCurrency(breakdown.dst),
    vat: formatCurrency(breakdown.vat),
    lgt: formatCurrency(breakdown.lgt),
    verification_fee: formatCurrency(breakdown.otherFees),
    total_amount_due: formatCurrency(breakdown.total),
    invoice_number: app.policyNumber ?? '',
    insured_name_address: `${name}, ${address}`,
    // Not tracked yet - left blank rather than guessed:
    authentication_number: '',
    business_profession: '',
    official_receipt_no: '',
    assignee: '',
  });
}

const CTPL_POLICY_JACKET_TEMPLATE: Record<string, string> = {
  P: 'ctpl-policy-jacket-pcoc.pdf',
  M: 'ctpl-policy-jacket-mcoc.pdf',
  C: 'ctpl-policy-jacket-ccoc.pdf',
  L: 'ctpl-policy-jacket-lcoc.pdf',
};

// Unlike the COC/Invoice/Schedule, the Policy Jacket is the printed
// terms-and-conditions booklet - it carries no per-application fields, only
// boilerplate text that differs by policy-type prefix (same P/M/C/L split
// ctplNumbering.ts uses for the policy number itself), so this just returns
// the matching static template's bytes rather than filling a form.
export async function fillCtplPolicyJacket(app: CtplApplication): Promise<Buffer> {
  const prefix = ctplPolicyPrefix(app.policyType, app.forPublicUse);
  const templateFile = CTPL_POLICY_JACKET_TEMPLATE[prefix] ?? CTPL_POLICY_JACKET_TEMPLATE.P;
  return readFileSync(path.join(TEMPLATES_DIR, templateFile));
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
    // Unit/Total Cost show the grand total, not the base premium - confirmed
    // against both the CTPL and OFW real sample invoices (see
    // ofwDocumentFill.ts and the legacy payment_transaction.rb#invoice_data).
    unit_cost: fmt(breakdown.total),
    total_cost: fmt(breakdown.total),
    unit: `${app.vehicleYear} ${app.vehicleMake} ${app.vehicleSeries}`.replace(/\s+/g, ' ').trim(),
    plate_number: app.plateNumber,
    serial_chassis: app.chassisNumber,
    motor_number: app.motorNumber,
    coc_number: app.policyNumber ?? '',
    line_of_insurance: CTPL_POLICY_TYPE_LABEL[app.policyType] ?? app.policyType,
    vatable_sales: fmt(breakdown.base),
    zero_rated_sales: '-',
    vat_exempt: fmt(breakdown.vatExempt),
    vat: fmt(breakdown.vat),
    ctpl_premium: fmt(breakdown.base),
    doc_stamps: fmt(breakdown.dst),
    lgt: fmt(breakdown.lgt),
    verification_fee: fmt(breakdown.otherFees),
    total_sales: fmt(breakdown.total),
    withholding_tax: '-',
    scpwd_discount: '-',
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
    curr_withholding_tax: '-',
    curr_scpwd_discount: '-',
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
