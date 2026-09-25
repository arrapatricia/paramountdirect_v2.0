// Fills OFW's real Service Invoice template (the fillable PDF Bernadette
// sent - PascalCase "_SVI"-suffixed fields, a different template revision
// from CTPL's, not the shared lowercase-field one an earlier pass here
// assumed). The premium breakdown is reverse-engineered and verified
// against the legacy Rails app (github.com/plgic/paramountdirect,
// app/models/ofw/application.rb's DocStamp/life_premium/non_life_premium/
// premium_tax/lg_tax, and payment_transaction.rb's `invoice_data` 'ofw'
// branch) - checked against a real sample invoice (₱/₱ gross 64.681 ->
// 63.113 net + 0.600 DST + 0.088 LGT + 0.880 other fees, all USD) and
// matches to the thousandth. OFW premiums are entirely VAT-exempt (no
// VATable/zero-rated/VAT-amount portion at all), unlike CTPL.
// Called once, from applications.ofw.ts, the moment isPaid first flips true.
import { readFileSync } from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import type { OfwApplication } from '@prisma/client';
import { generateUniqueInvoiceNumber } from '../lib/invoiceNumbering';

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'ofw');

// Flat, fixed per real Service Invoices - not proportional to premium (see
// Ofw::Application::DocStamp in the legacy model).
const OFW_DOC_STAMP = 0.6;

function formatUsd(amount: number): string {
  return `USD ${amount.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function parsePremium(premium: string): number {
  const n = parseFloat(premium.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// Mirrors Ofw::EmploymentInfo#months: whole calendar months for land-based,
// 30-day blocks (rounded up) for sea-based.
function computeMonths(app: OfwApplication): number {
  if (app.coverageType === 'Sea_based') {
    const days = Math.floor((app.contractEnd.getTime() - app.insuranceStart.getTime()) / 86400000) + 1;
    return Math.ceil(days / 30);
  }
  return (
    (app.contractEnd.getFullYear() * 12 + app.contractEnd.getMonth()) -
    (app.insuranceStart.getFullYear() * 12 + app.insuranceStart.getMonth())
  );
}

// Base + DocStamp(flat) -> life/non-life split -> premium tax + LGT, exactly
// as the legacy model computes it (see file header). `base` is the gross
// premium already charged (this system's existing $2.90/month rate card),
// matching what the legacy code calls `computed_premium`.
function computeOfwBreakdown(base: number) {
  const lifePremium = base * 0.3 - 0.3;
  const nonLifePremium = (base * 0.7 + 0.3 - OFW_DOC_STAMP) / 1.022;
  const premiumMinusTaxes = lifePremium + nonLifePremium;
  const premiumTax = Math.round(nonLifePremium * 0.02 * 1000) / 1000;
  const lgTax = Math.round(nonLifePremium * 0.002 * 1000) / 1000;
  return { base, docStamp: OFW_DOC_STAMP, premiumMinusTaxes, premiumTax, lgTax };
}

// A handful of fields on this template ship with an auto-size (0pt) default
// appearance that pdf-lib can't always recompute correctly, which renders as
// blank rather than an error - EffectiveDate_SVI is the one caught so far.
// Forcing a fixed font size sidesteps it; not applied to every field since a
// couple (e.g. multi-line ItemDesc_SVI) rely on auto-sizing to fit their box.
const FIXED_FONT_SIZE_FIELDS: Record<string, number> = {
  EffectiveDate_SVI: 10, // matches this template's other fields' own default appearance (/Helv 10 Tf)
};

async function fillFields(templateFile: string, values: Record<string, string>): Promise<Buffer> {
  const bytes = readFileSync(path.join(TEMPLATES_DIR, templateFile));
  const pdf = await PDFDocument.load(bytes);
  const form = pdf.getForm();

  for (const [name, value] of Object.entries(values)) {
    const field = form.getFieldMaybe(name);
    if (!field) continue; // template revision may not have every field - skip rather than throw
    try {
      const textField = form.getTextField(name);
      if (FIXED_FONT_SIZE_FIELDS[name]) textField.setFontSize(FIXED_FONT_SIZE_FIELDS[name]);
      textField.setText(value);
    } catch {
      // Not a text field (or otherwise unsettable) - leave it untouched.
    }
  }
  form.updateFieldAppearances();
  // Bake the values into the page content and drop the form fields - a
  // generated invoice must not stay editable by whoever opens it (matches
  // the legacy Rails app's `pdftk.fill_form(..., flatten: true)`).
  form.flatten();

  const filled = await pdf.save();
  return Buffer.from(filled);
}

export async function fillOfwServiceInvoice(app: OfwApplication): Promise<{ buffer: Buffer; invoiceNumber: string }> {
  const name = `${app.firstName} ${app.middleName} ${app.lastName}`.replace(/\s+/g, ' ').trim();
  const address = [app.phAddress, app.phBarangay, app.phCity, app.phRegion].filter(Boolean).join(' ');
  const invoiceNumber = await generateUniqueInvoiceNumber();

  const months = computeMonths(app);
  const breakdown = computeOfwBreakdown(parsePremium(app.premium));

  const natureLabel = app.natureOfEmployment === 'Direct_hired' ? 'DIRECT HIRE' : 'BALIKMANGGAGAWA';
  const packageLabel = app.coverageType === 'Sea_based' ? 'SEA-BASED' : 'LAND-BASED';
  const itemDesc = ['', natureLabel, '', packageLabel, '', `COI# ${app.policyNumber ?? ''}`, '', `NO. OF MONTHS: ${months} MONTHS`]
    .join('\n')
    .toUpperCase();

  const buffer = await fillFields('ofw-service-invoice.pdf', {
    PayorName_SVI: name.toUpperCase(),
    PayorAddress_SVI: address.toUpperCase(),
    TIN_SVI: '',
    InvoiceNo_SVI: invoiceNumber,
    InvoiceDate_SVI: formatDate(app.dateIssued ?? new Date()),
    PaymentRef_SVI: app.referenceNo ?? '',
    // Policy No. on this invoice is the COI number itself, not the legacy
    // Rails app's master-policy code (confirmed by direct request).
    PolNo_SVI: app.policyNumber ?? '',
    EndtNo_SVI: '',
    EffectiveDate_SVI: `${formatDate(app.insuranceStart)} to ${formatDate(app.contractEnd)}`,
    OldPolNo_SVI: '',
    ItemDesc_SVI: itemDesc,
    Qty_SVI: '1',
    UnitCost_SVI: formatUsd(breakdown.base),
    TotalCost_SVI: formatUsd(breakdown.base),
    // OFW is entirely VAT-exempt - no VATable/zero-rated/VAT portion at all.
    Vatable_Sales_SVI: '-',
    ZeroRated_Sales_SVI: '-',
    Vat_Exempt_SVI: formatUsd(breakdown.base),
    Vat_Amount_SVI: '-',
    Vat_Amount_L_SVI: '-',
    Premium_SVI: formatUsd(breakdown.premiumMinusTaxes),
    DocStamp_SVI: breakdown.docStamp.toFixed(3),
    LGT_SVI: breakdown.lgTax.toFixed(3),
    OtherFees_SVI: breakdown.premiumTax.toFixed(3),
    Total_Sales_SVI: formatUsd(breakdown.base),
    WTax_SVI: '-',
    SCPWD_disc_SVI: '-',
    Total_AmtDue_SVI: formatUsd(breakdown.base),
    ScPwd_Id_SVI: '',
    AgentCode_SVI: '',
    Curr_SVI: 'USD',
    Premium_Curr_SVI: 'USD',
  });

  return { buffer, invoiceNumber };
}

// The DM (Domestic Migrant / OFW Compulsory Insurance) master policy number,
// same for both the BM and DH variants - confirmed by the business side.
const OFW_MASTER_POLICY_NUMBER = 'G-3083';

// Fills the real Certificate of Insurance template - two variants of the
// same 5-field form (DM_Certificate of Insurance BM/DH_withFields.pdf),
// selected by natureOfEmployment. Field names are identical between the two
// ("BM_..." even on the DH template - not a typo, that's how the template
// was built).
export async function fillOfwCoi(app: OfwApplication): Promise<Buffer> {
  const name = `${app.firstName} ${app.middleName} ${app.lastName}`.replace(/\s+/g, ' ').trim();
  const template = app.natureOfEmployment === 'Direct_hired' ? 'ofw-coi-dh.pdf' : 'ofw-coi-bm.pdf';

  return fillFields(template, {
    BM_Fullname: name.toUpperCase(),
    BM_COIno: app.policyNumber ?? '',
    BM_MasterPolNo: OFW_MASTER_POLICY_NUMBER,
    BM_DateIssued: formatDate(app.dateIssued ?? new Date()),
    BM_Term: `${formatDate(app.insuranceStart)} to ${formatDate(app.contractEnd)}`,
  });
}
