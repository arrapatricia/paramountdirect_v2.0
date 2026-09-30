// Fills the Official Receipt (OR) for OFW and GTP - unlike every other
// document in this system, the legacy OR isn't a fillable PDF form; it's
// HTML text absolutely-positioned over a background letterhead image,
// rendered with WickedPdf (see the legacy repo's
// app/views/admin/payment_transactions/pdf/generate_new_or.pdf.erb, and its
// CSS - .or-details/.policy-details/.app-info/.code/.breakdown/
// .cashier-container blocks). Ported here as an embedded PNG + drawn text at
// the same relative positions (CSS px at 96dpi -> pt, factor 0.75), on the
// same 8.5in x 3.6in page WickedPdf rendered it at.
//
// Called once per application, alongside the Service Invoice, the moment
// isPaid first flips true (see applications.ofw.ts / applications.gtp.ts).
import { readFileSync } from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { GtpApplication, OfwApplication } from '@prisma/client';

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'nonlife');

const PAGE_WIDTH = 612; // 8.5in
const PAGE_HEIGHT = 259.2; // 3.6in
const PX_TO_PT = 0.75; // CSS px at 96dpi -> pt (72dpi)
const LINE_HEIGHT = 13 * PX_TO_PT;
const FONT_SIZE = 9;

// OR No. shares the same digits as the Service Invoice number (the shared
// "6"-prefixed electronic series - see invoiceNumbering.ts), just with a
// leading "5" instead of "6" to mark it as an Official Receipt rather than
// an Invoice - this system's own convention, not a legacy one.
export function orNumberFromInvoiceNumber(invoiceNumber: string): string {
  return `5${invoiceNumber.slice(1)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function drawBackground(page: PDFPage, pdf: PDFDocument, backgroundFile: string) {
  const bytes = readFileSync(path.join(TEMPLATES_DIR, backgroundFile));
  const png = await pdf.embedPng(bytes);
  // background-size: cover, background-position: bottom - the image
  // (2550x1102) is wider than the page's aspect ratio, so it's scaled to
  // the page's full width and bottom-aligned, cropping a sliver off the top.
  const drawWidth = PAGE_WIDTH;
  const drawHeight = (png.height / png.width) * drawWidth;
  page.drawImage(png, { x: 0, y: PAGE_HEIGHT - drawHeight, width: drawWidth, height: drawHeight });
}

function drawLeftLines(page: PDFPage, font: PDFFont, lines: string[], x: number, topY: number) {
  lines.forEach((line, i) => {
    if (!line) return;
    page.drawText(line, { x, y: topY - i * LINE_HEIGHT, size: FONT_SIZE, font, color: rgb(0.1, 0.1, 0.1) });
  });
}

function drawRightLines(page: PDFPage, font: PDFFont, lines: string[], rightX: number, topY: number) {
  lines.forEach((line, i) => {
    if (!line) return;
    const width = font.widthOfTextAtSize(line, FONT_SIZE);
    page.drawText(line, { x: rightX - width, y: topY - i * LINE_HEIGHT, size: FONT_SIZE, font, color: rgb(0.1, 0.1, 0.1) });
  });
}

export interface OrFields {
  orNumber: string;
  date: string;
  paymentRef: string;
  coiNumber: string;
  insuredLines: string[]; // name + address lines (3-4 lines)
  qtyUnitTotalLine?: string; // OFW only - "1     US $ 63.113     US $ 63.113"
  totalSalesLine: string;
  vatExemptLine: string;
  totalLine: string;
  cashierName: string;
}

async function fillOfficialReceipt(backgroundFile: string, fields: OrFields): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  await drawBackground(page, pdf, backgroundFile);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // .or-details (top:65px, right:35px)
  drawRightLines(page, font, [
    `No.  :  ${fields.orNumber}`,
    `Date  :  ${fields.date}`,
    `Payment Ref.  :  ${fields.paymentRef}`,
  ], PAGE_WIDTH - 35 * PX_TO_PT, PAGE_HEIGHT - 65 * PX_TO_PT);

  // .policy-details (top:130px, left:65px)
  drawLeftLines(page, font, [
    `O.R. No.: ${fields.orNumber}`,
    'Particulars / Item Description',
    `COI # ${fields.coiNumber}`,
  ], 65 * PX_TO_PT, PAGE_HEIGHT - 130 * PX_TO_PT);

  // .app-info (top:220px, left:80px)
  drawLeftLines(page, font, fields.insuredLines, 80 * PX_TO_PT, PAGE_HEIGHT - 220 * PX_TO_PT);

  // .breakdown-qty (top:175px, right:80px) - OFW only
  if (fields.qtyUnitTotalLine) {
    drawRightLines(page, font, [fields.qtyUnitTotalLine], PAGE_WIDTH - 80 * PX_TO_PT, PAGE_HEIGHT - 175 * PX_TO_PT);
  }

  // .breakdown (top:220px, right:80px) - legacy prints several always-blank
  // rows (Vatable/Zero-Rated/VAT Amount/Withholding Tax - none of these
  // products carry those) - only the 3 rows that actually have a value are
  // drawn, both for legibility and to clear the background art's lower
  // security-pattern/signature band on this page's short height.
  drawRightLines(page, font, [
    `TOTAL SALES  :  ${fields.totalSalesLine}`,
    `VAT-EXEMPT  :  ${fields.vatExemptLine}`,
    `T O T A L  :  ${fields.totalLine}`,
  ], PAGE_WIDTH - 80 * PX_TO_PT, PAGE_HEIGHT - 220 * PX_TO_PT);

  // .code (top:345px, left:68px) - the legacy position lands right at this
  // page's bottom edge, colliding with the background art's own baked-in
  // footer text, so it's nudged up to sit just above it.
  drawLeftLines(page, bold, [
    'THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX',
    'Series Range: 000000000001 to 9999999999999',
  ], 68 * PX_TO_PT, 48);

  // .cashier-container (bottom:20px, right:39px)
  drawRightLines(page, font, [fields.cashierName], PAGE_WIDTH - 39 * PX_TO_PT, 15 + FONT_SIZE * 0.3);

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

function money(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function fillOfwOfficialReceipt(app: OfwApplication, invoiceNumber: string): Promise<Buffer> {
  const premium = parseFloat(app.premium.replace(/[^0-9.]/g, '')) || 0;
  const name = `${app.firstName} ${app.middleName} ${app.lastName}`.replace(/\s+/g, ' ').trim();
  const address = [app.phAddress, app.phBarangay, app.phCity, app.phRegion].filter(Boolean).join(' ');
  const usd = (n: number) => `US $ ${n.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;

  return fillOfficialReceipt('or-background-ofw.png', {
    orNumber: orNumberFromInvoiceNumber(invoiceNumber),
    date: formatDate(app.dateIssued ?? new Date()),
    paymentRef: app.referenceNo ?? '',
    coiNumber: app.policyNumber ?? '',
    insuredLines: [name.toUpperCase(), address.toUpperCase(), 'PHILIPPINES'],
    qtyUnitTotalLine: `1     ${usd(premium)}     ${usd(premium)}`,
    totalSalesLine: usd(premium),
    vatExemptLine: usd(premium),
    totalLine: usd(premium),
    cashierName: (app.paymentInstructionSentBy ?? '').toUpperCase(),
  });
}

export async function fillGtpOfficialReceipt(app: GtpApplication, invoiceNumber: string): Promise<Buffer> {
  const premium = parseFloat(app.premium.replace(/[^0-9.]/g, '')) || 0;
  const name = `${app.travelerFirstName} ${app.travelerSurname}`.replace(/\s+/g, ' ').trim();
  const address = [app.phAddress, app.phBarangay, app.phCity, app.phRegion].filter(Boolean).join(' ');

  return fillOfficialReceipt('or-background-gtp.png', {
    orNumber: orNumberFromInvoiceNumber(invoiceNumber),
    date: formatDate(new Date()),
    paymentRef: app.referenceNo ?? '',
    coiNumber: app.policyNumber ?? '',
    insuredLines: [name.toUpperCase(), address.toUpperCase(), 'PHILIPPINES'],
    totalSalesLine: money(premium, 'PHP'),
    vatExemptLine: money(premium, 'PHP'),
    totalLine: money(premium, 'PHP'),
    cashierName: '',
  });
}
