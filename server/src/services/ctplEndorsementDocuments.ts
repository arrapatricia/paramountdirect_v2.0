// Fills the CTPL endorsement PDF templates (ported from the legacy system's
// bin/ctpl/ - DM_CTPL_Endorsement, DM_Endorsement_Financial and the
// electronic Credit Memo - plus the Flat/Pro Rata cancellation forms) for an
// approved Endorsement, and stores them via storeGeneratedDocument linked
// back to it. Called once, right after approval.
import type { CtplApplication, Endorsement } from '@prisma/client';
import { CTPL_POLICY_TYPE_LABEL, fillFields, formatCurrency, formatDate, insuredNameAndAddress } from './ctplDocumentFill';
import { ctplBreakdownFromGross, parsePremium } from './ctplEndorsementCalc';
import { storeGeneratedDocument } from './documentStorage';
import { prisma } from '../lib/prisma';

// CTPL's bodily injury/death limit per victim, printed as the policy's Sum
// Insured on the financial endorsement forms (the legacy system's
// "new benefit" amount).
const CTPL_SUM_INSURED = 200000;

export interface EndorsementChange {
  field: string;
  label: string;
  from: string;
  to: string;
}

const fmt = (n: number | null | undefined) => formatCurrency(Math.abs(n ?? 0));

// The invoice/credit memo "Term of Insurance" fields are too narrow for a
// spelled-out month - legacy printed these as e.g. "JAN 10, 2026".
const shortDate = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase() : '';

function fullAddress(app: CtplApplication): string {
  return [app.ownerAddress, app.ownerBarangay !== 'N/A' ? app.ownerBarangay : '', app.ownerCity, app.ownerRegion]
    .filter(Boolean)
    .join(', ');
}

const vehicleUnit = (app: CtplApplication) => `${app.vehicleYear} ${app.vehicleMake} ${app.vehicleSeries}`.replace(/\s+/g, ' ').trim();

function headerFields(app: CtplApplication, e: Endorsement) {
  return {
    PolicyNo: (app.policyNumber ?? '').toUpperCase(),
    InsuredName: insuredNameAndAddress(app).name.toUpperCase(),
    IssueDate: formatDate(e.decidedAt ?? new Date()),
    ExpiryDate: formatDate(app.expiryDate),
    EffectiveDate: formatDate(e.effectiveDate),
  };
}

// Mirrors the legacy C2cEndorsement#generate_fields wording: a list of the
// corrected fields, or - for a transfer of ownership with a Deed of Sale -
// the "insurable interest transferred" clause instead.
function nonFinancialDetails(app: CtplApplication, e: Endorsement): string {
  if (e.withDeedOfSale) {
    const { name } = insuredNameAndAddress(app);
    return (
      '\nThe insurable interest under this policy is now transferred/vested to ' +
      `${name.toUpperCase()} with address at ${fullAddress(app).toUpperCase()}, ` +
      'who shall be the lawful owner/insured herein.'
    );
  }
  const changes = (e.changes as unknown as EndorsementChange[] | null) ?? [];
  const labels = changes.map((c) => c.label);
  const joined = labels.length > 1 ? `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}` : labels[0] ?? '';
  const lines = changes.map((c) => `      ${c.label}:  ${(c.to || '-').toUpperCase().replace(/\s+/g, ' ').trim()}`);
  return `\nThe correct ${joined} of the vehicle insured under this policy should be read as:\n\n${lines.join('\n')}\n\nAnd not as previously stated.`;
}

async function fillNonFinancial(app: CtplApplication, e: Endorsement) {
  return fillFields('ctpl-endorsement.pdf', {
    ...headerFields(app, e),
    EndorsementNo: e.endorsementNumber ?? '',
    EndDetails: nonFinancialDetails(app, e),
  });
}

async function fillExtension(app: CtplApplication, e: Endorsement) {
  const details =
    '\nExtension of insurance under this policy should be read as follows:\n\n' +
    `            Effectivity Date:   ${formatDate(app.effectiveDate)}\n\n` +
    `            Expiry Date:          ${formatDate(e.newExpiryDate)}\n\n` +
    'and not as previously stated.';
  return fillFields('ctpl-endorsement-financial.pdf', {
    ...headerFields(app, e),
    EndtNo: e.endorsementNumber ?? '',
    SumInsured: `PHP ${formatCurrency(CTPL_SUM_INSURED)}`,
    InvoiceNo: e.invoiceNumber ?? '',
    EndDetails: details,
    PHP: fmt(e.total),
    AddtlPremium: fmt(e.premium),
    DST: fmt(e.dst),
    VAT: fmt(e.vat),
    LGT: fmt(e.lgt),
    Total: fmt(e.total),
  });
}

async function fillExtensionServiceInvoice(app: CtplApplication, e: Endorsement) {
  const { name } = insuredNameAndAddress(app);
  const vatExempt = (e.dst ?? 0) + (e.lgt ?? 0);
  const amounts = {
    ctpl_premium: fmt(e.premium),
    doc_stamps: fmt(e.dst),
    lgt: fmt(e.lgt),
    verification_fee: fmt(0),
    vat: fmt(e.vat),
    total_sales: fmt(e.total),
    withholding_tax: fmt(0),
    scpwd_discount: fmt(0),
    total_amount_due: fmt(e.total),
  };
  return fillFields('ctpl-service-invoice.pdf', {
    insured_name: name,
    insured_address: fullAddress(app),
    invoice_number: e.invoiceNumber ?? '',
    payment_ref: app.referenceNo ?? '',
    invoice_date: formatDate(e.decidedAt ?? new Date()),
    policy_number: app.policyNumber ?? '',
    endorsement_number: e.endorsementNumber ?? '',
    // The invoice covers only the added days, previous expiry -> new expiry.
    effectivity_date: shortDate(e.previousExpiryDate),
    expiration_date: shortDate(e.newExpiryDate),
    quantity: '1',
    unit_cost: fmt(e.premium),
    total_cost: fmt(e.premium),
    unit: vehicleUnit(app),
    plate_number: app.plateNumber,
    serial_chassis: app.chassisNumber,
    motor_number: app.motorNumber,
    coc_number: app.policyNumber ?? '',
    line_of_insurance: `${CTPL_POLICY_TYPE_LABEL[app.policyType] ?? app.policyType} - TERM EXTENSION`,
    vatable_sales: fmt(e.premium),
    zero_rated_sales: fmt(0),
    vat_exempt: fmt(vatExempt),
    ...amounts,
    ...Object.fromEntries(Object.entries(amounts).map(([k, v]) => [`curr_${k}`, v])),
    insured_tin: '',
    sc_pwd_id: '',
    agents_code: '',
    old_pol_no: '',
    vat_breakdown: fmt(e.vat),
  });
}

async function fillCancellation(app: CtplApplication, e: Endorsement) {
  const isFlat = e.type === 'Cancellation_Flat';
  const b = ctplBreakdownFromGross(parsePremium(app.premium), app.requiresCOV);
  const refundPremium = Math.abs(e.premium ?? 0);
  const common = {
    ...headerFields(app, e),
    EndorsementNo: e.endorsementNumber ?? '',
    SumInsured: `PHP ${formatCurrency(CTPL_SUM_INSURED)}`,
    InvoiceNo: e.creditMemoNumber ?? '',
    // Continues the template's "...is deemed cancelled effective" sentence.
    ReasonContinuation: `${formatDate(e.effectiveDate)}.\n\nReason for cancellation: ${e.reason.toUpperCase()}`,
    PremiumCharged: formatCurrency(b.base),
    PremiumEarned: formatCurrency(Math.max(b.base - refundPremium, 0)),
    RefundPremium: formatCurrency(refundPremium),
    TotalAmount: `PHP ${fmt(e.total)}`,
    Remarks: e.decisionRemarks ?? '',
  };
  if (isFlat) {
    return fillFields('ctpl-cancellation-flat.pdf', {
      ...common,
      RefundPremium_Flat: `PHP ${fmt(e.total)}`,
      DST: fmt(e.dst),
      VAT: fmt(e.vat),
      LGT: fmt(e.lgt),
      VerificationFee: formatCurrency(b.verificationFee),
      CertificationFee: formatCurrency(b.certificationFee),
    });
  }
  return fillFields('ctpl-cancellation-prorata.pdf', { ...common, RefundPremium_ProRata: `PHP ${fmt(e.total)}` });
}

// Credit Memo - same field layout as the Service Invoice, carrying the
// returned amounts (legacy C2cEndorsement#generate_credit_memo).
async function fillCreditMemo(app: CtplApplication, e: Endorsement) {
  const { name } = insuredNameAndAddress(app);
  const vatExempt = Math.abs(e.dst ?? 0) + Math.abs(e.lgt ?? 0) + Math.abs(e.otherFees ?? 0);
  const amounts = {
    ctpl_premium: fmt(e.premium),
    doc_stamps: fmt(e.dst),
    lgt: fmt(e.lgt),
    verification_fee: fmt(e.otherFees),
    vat: fmt(e.vat),
    total_sales: fmt(e.total),
    total_amount_due: fmt(e.total),
  };
  return fillFields('ctpl-credit-memo.pdf', {
    insured_name: name.toUpperCase(),
    insured_address: fullAddress(app).toUpperCase(),
    invoice_number: e.creditMemoNumber ?? '',
    payment_ref: app.referenceNo ?? '-',
    invoice_date: formatDate(e.decidedAt ?? new Date()),
    policy_number: app.policyNumber ?? '',
    endorsement_number: e.endorsementNumber ?? '',
    effectivity_date: shortDate(app.effectiveDate),
    expiration_date: shortDate(app.expiryDate),
    old_pol_no: '',
    vatable_sales: fmt(e.premium),
    zero_rated_sales: '-',
    vat_exempt: fmt(vatExempt),
    withholding_tax: '-',
    scpwd_discount: '-',
    ...amounts,
    ...Object.fromEntries(Object.keys(amounts).map((k) => [`curr_${k}`, 'PHP'])),
    vat_breakdown: fmt(e.vat),
    ItemDesc_SVI: `\n${e.type === 'Cancellation_Flat' ? 'FLAT' : 'PRO RATA'} CANCELLATION\nREMARKS:\n${e.reason.toUpperCase()}\nEFFECTIVITY DATE:\n${formatDate(e.effectiveDate)}`,
    Qty_SVI: '\n1',
    UnitCost_SVI: `\n${fmt(e.total)}`,
    TotalCost_SVI: `\n${fmt(e.total)}`,
    insured_tin: '',
    sc_pwd_id: '',
    agents_code: '',
  });
}

// Generates every document an approved endorsement issues. Like the
// issuance documents, a failure here doesn't undo the approval - it's
// logged, and POST /api/endorsements/:id/documents can regenerate.
export async function generateCtplEndorsementDocuments(app: CtplApplication, e: Endorsement, generatedBy?: string) {
  const store = async (docKey: string, body: Buffer, invoiceNumber?: string) => {
    // A regenerated extension invoice keeps its number on the Endorsement,
    // but GeneratedDocument.invoiceNumber is unique - only the first copy
    // carries it.
    if (invoiceNumber && (await prisma.generatedDocument.findUnique({ where: { invoiceNumber } }))) invoiceNumber = undefined;
    return storeGeneratedDocument({
      applicationType: 'CTPL',
      applicationId: app.id,
      docKey,
      contentType: 'application/pdf',
      body,
      generatedBy,
      invoiceNumber,
      endorsementId: e.id,
    });
  };

  switch (e.type) {
    case 'Non_Financial':
      await store('ctpl-endorsement', await fillNonFinancial(app, e));
      break;
    case 'Term_Extension':
      await store('ctpl-endorsement', await fillExtension(app, e));
      await store('ctpl-endorsement-service-invoice', await fillExtensionServiceInvoice(app, e), e.invoiceNumber ?? undefined);
      break;
    case 'Cancellation_Flat':
    case 'Cancellation_Pro_Rata':
      await store('ctpl-endorsement', await fillCancellation(app, e));
      await store('ctpl-credit-memo', await fillCreditMemo(app, e));
      break;
  }
}
