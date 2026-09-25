// Fills the two CTPL fillable-PDF templates (COC, Service Invoice) with a
// CtplApplication's data and the reconciled premium-breakdown formula from
// premium_rates.ts (Base + DST + LGT + VAT + flat Other Fees). Called once,
// from applications.ctpl.ts's PUT handler, the moment isPaid first flips
// true and a policyNumber is assigned - see storeGeneratedDocument for the
// immutable-record contract this feeds into.
import { readFileSync } from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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

const CTPL_POLICY_JACKET_TEMPLATE: Record<string, { booklet: string; background: string; lowerBlock: boolean }> = {
  P: { booklet: 'ctpl-policy-jacket-pcoc.pdf', background: 'ctpl-policy-jacket-first-pcoc.png', lowerBlock: false },
  M: { booklet: 'ctpl-policy-jacket-mcoc.pdf', background: 'ctpl-policy-jacket-first-mcoc.png', lowerBlock: false },
  C: { booklet: 'ctpl-policy-jacket-ccoc.pdf', background: 'ctpl-policy-jacket-first-ccoc.png', lowerBlock: false },
  // The public-use ("habal-habal") layout has an extra section above the
  // signature block, so its representative/date fields sit noticeably
  // higher on the page than the other three - matches the legacy Rails
  // app's `policy_jacket.html.erb` `line == 'lcoc'` branch.
  L: { booklet: 'ctpl-policy-jacket-lcoc.pdf', background: 'ctpl-policy-jacket-first-lcoc.png', lowerBlock: true },
};

// A4 in PDF points vs. the background PNGs' native pixel size (1654x2339,
// i.e. A4 at 200dpi) - the legacy app's HTML template positioned these
// fields against a canvas at half that resolution (~827x1170), so the same
// ratio converts its CSS-pixel coordinates into PDF points here.
const JACKET_CSS_PX_TO_PT = 595.28 / (1654 / 2);

interface JacketField { left: number; top: number; width: number }
const JACKET_FIELDS = {
  representative: { left: 200, top: 868, width: 200 } as JacketField,
  dayOf: { left: 539, top: 868, width: 40 } as JacketField,
  month: { left: 635, top: 868, width: 148 } as JacketField,
  year: { left: 810, top: 868, width: 40 } as JacketField,
};
const JACKET_FIELD_TOP_LOWER = 755; // lcoc's raised signature block

// Unlike the COC/Invoice/Schedule, the Policy Jacket's first page is a
// scanned letterhead background (not a fillable PDF form) with a handful of
// values overlaid on top - the signing city/date - and everything after it
// is the static per-policy-type terms-and-conditions booklet. Recreates the
// legacy Rails app's `generate_policy_jacket` (HTML-over-PNG via WickedPdf,
// then combined with the booklet PDF) using pdf-lib instead, since this
// stack has no WickedPdf/wkhtmltopdf - the QR code that app also draws here
// comes from an external verification service (QrService) we don't have
// access to, so it's omitted rather than guessed.
export async function fillCtplPolicyJacket(app: CtplApplication): Promise<Buffer> {
  const prefix = ctplPolicyPrefix(app.policyType, app.forPublicUse);
  const template = CTPL_POLICY_JACKET_TEMPLATE[prefix] ?? CTPL_POLICY_JACKET_TEMPLATE.P;

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const pngBytes = readFileSync(path.join(TEMPLATES_DIR, template.background));
  const background = await pdf.embedPng(pngBytes);
  const A4_WIDTH_PT = 595.28;
  const A4_HEIGHT_PT = 841.89;
  const pageWidth = A4_WIDTH_PT;
  const pageHeight = A4_HEIGHT_PT;
  const page = pdf.addPage([pageWidth, pageHeight]);
  page.drawImage(background, { x: 0, y: 0, width: pageWidth, height: pageHeight });

  const now = new Date();
  const values: Record<keyof typeof JACKET_FIELDS, string> = {
    representative: 'Makati City',
    dayOf: String(now.getDate()),
    month: now.toLocaleDateString('en-PH', { month: 'long' }),
    year: String(now.getFullYear()),
  };
  const topOverride = template.lowerBlock ? JACKET_FIELD_TOP_LOWER : null;
  const fontSize = 13;
  for (const key of Object.keys(JACKET_FIELDS) as (keyof typeof JACKET_FIELDS)[]) {
    const field = JACKET_FIELDS[key];
    const top = topOverride ?? field.top;
    const text = values[key];
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const centerX = (field.left + field.width / 2) * JACKET_CSS_PX_TO_PT;
    const x = centerX - textWidth / 2;
    const y = pageHeight - top * JACKET_CSS_PX_TO_PT - fontSize * 0.8;
    page.drawText(text, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
  }

  const bookletBytes = readFileSync(path.join(TEMPLATES_DIR, template.booklet));
  const booklet = await PDFDocument.load(bookletBytes);
  const bookletPages = await pdf.copyPages(booklet, booklet.getPageIndices());
  bookletPages.forEach((p) => pdf.addPage(p));

  const filled = await pdf.save();
  return Buffer.from(filled);
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
