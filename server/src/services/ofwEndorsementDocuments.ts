// Fills the OFW cancellation letter and credit memo PDF templates (ported
// from the legacy system's bin/ofw/OFW_Cancellation.pdf and
// ELECTRONIC_CREDITMEMO_DMOFW.pdf) for an approved cancellation Endorsement,
// and stores them via storeGeneratedDocument linked back to it. Called once,
// right after approval - mirrors ctplEndorsementDocuments.ts.
import type { Endorsement, OfwApplication } from '@prisma/client';
import { fillFields, formatDate, formatUsd } from './ofwDocumentFill';
import { storeGeneratedDocument } from './documentStorage';
import { prisma } from '../lib/prisma';

// Same master policy number ofwDocumentFill.ts's COI uses.
const OFW_MASTER_POLICY_NUMBER = 'G-3083';

function insuredName(app: OfwApplication): string {
  return `${app.firstName} ${app.middleName} ${app.lastName}`.replace(/\s+/g, ' ').trim();
}

function insuredAddress(app: OfwApplication): string {
  return [app.phAddress, app.phBarangay, app.phCity, app.phRegion].filter(Boolean).join(' ');
}

// Mirrors Ofw::EmploymentInfo#months (see ofwDocumentFill.ts's computeMonths) -
// the ORIGINAL coverage term length, not the remaining term.
function originalMonths(app: OfwApplication): number {
  if (app.coverageType === 'Sea_based') {
    const days = Math.floor((app.contractEnd.getTime() - app.insuranceStart.getTime()) / 86400000) + 1;
    return Math.ceil(days / 30);
  }
  return (
    (app.contractEnd.getFullYear() * 12 + app.contractEnd.getMonth()) -
    (app.insuranceStart.getFullYear() * 12 + app.insuranceStart.getMonth())
  );
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

// Mirrors Ofw::CancellationRequest#compute_months_remaining - whole months
// USED between coverage start and the cancellation date (the opposite
// direction from ofwEndorsementCalc's monthsRemaining, which counts what's
// left). Printed on the credit memo's item description.
function monthsUsed(insuranceStart: Date, cancellationDate: Date): number {
  if (cancellationDate <= insuranceStart) return 0;
  let months = (cancellationDate.getFullYear() - insuranceStart.getFullYear()) * 12 + (cancellationDate.getMonth() - insuranceStart.getMonth());
  if (addMonths(insuranceStart, months) > cancellationDate) months -= 1;
  if (months === 0) months = 1;
  return Math.max(months, 0);
}

async function originalInvoiceNumber(applicationId: string): Promise<string> {
  const doc = await prisma.generatedDocument.findFirst({
    where: { applicationType: 'OFW', applicationId, docKey: 'ofw-service-invoice', invoiceNumber: { not: null } },
    orderBy: { generatedAt: 'asc' },
  });
  return doc?.invoiceNumber ?? '';
}

async function fillCancellationLetter(app: OfwApplication, e: Endorsement) {
  return fillFields('ofw-cancellation.pdf', {
    COINo: app.policyNumber ?? '',
    EndorsementNo: e.endorsementNumber ?? '',
    SINo: e.creditMemoNumber ?? '',
    InsuredName: insuredName(app).toUpperCase(),
    IssuedDate: formatDate(e.decidedAt ?? new Date()),
    EffectiveDate: formatDate(e.effectiveDate),
  });
}

// Credit Memo - same SVI field layout as the Service Invoice, carrying the
// refund amount (legacy CreditMemo#credit_memo_data 'ofw' branch).
async function fillCreditMemo(app: OfwApplication, e: Endorsement) {
  const refund = Math.abs(e.total ?? 0);
  const premiumMinusTaxes = Math.abs(e.premium ?? 0);
  const docStamp = Math.abs(e.dst ?? 0);
  const lgTax = Math.abs(e.lgt ?? 0);
  const premiumTax = Math.abs(e.otherFees ?? 0);

  const natureLabel = app.natureOfEmployment === 'Direct_hired' ? 'DIRECT HIRE' : 'BALIKMANGGAGAWA';
  const packageLabel = app.coverageType === 'Sea_based' ? 'SEA-BASED' : 'LAND-BASED';
  const itemDesc = [
    '',
    natureLabel,
    packageLabel,
    `COI# ${app.policyNumber ?? ''}`,
    `NO. OF MONTHS: ${monthsUsed(app.insuranceStart, e.effectiveDate)}`,
    'CANCELLATION',
  ]
    .join('\n')
    .toUpperCase();

  return fillFields('ofw-credit-memo.pdf', {
    PayorName_SVI: insuredName(app).toUpperCase(),
    PayorAddress_SVI: insuredAddress(app).toUpperCase(),
    TIN_SVI: '',
    InvoiceNo_SVI: await originalInvoiceNumber(app.id),
    InvoiceDate_SVI: formatDate(e.decidedAt ?? new Date()),
    PaymentRef_SVI: app.referenceNo ?? '',
    PolNo_SVI: OFW_MASTER_POLICY_NUMBER,
    EndtNo_SVI: e.endorsementNumber ?? '',
    EffectiveDate_SVI: `${originalMonths(app)} MONTHS`,
    OldPolNo_SVI: '',
    ItemDesc_SVI: itemDesc,
    Qty_SVI: '1',
    UnitCost_SVI: `${formatUsd(refund)} -`,
    TotalCost_SVI: `${formatUsd(refund)} -`,
    Vatable_Sales_SVI: '-',
    ZeroRated_Sales_SVI: '-',
    Vat_Exempt_SVI: `${formatUsd(refund)} -`,
    Vat_Amount_SVI: '-',
    Vat_Amount_L_SVI: '-',
    Premium_SVI: `${formatUsd(premiumMinusTaxes)} -`,
    DocStamp_SVI: `${docStamp.toFixed(3)} -`,
    LGT_SVI: `${lgTax.toFixed(3)} -`,
    OtherFees_SVI: `${premiumTax.toFixed(3)} -`,
    Total_Sales_SVI: `${formatUsd(refund)} -`,
    WTax_SVI: '-',
    SCPWD_disc_SVI: '-',
    Total_AmtDue_SVI: `${formatUsd(refund)} -`,
    ScPwd_Id_SVI: '',
    AgentCode_SVI: '',
    Curr_SVI: 'USD',
    Premium_Curr_SVI: 'USD',
  });
}

// Generates the cancellation letter + credit memo for an approved OFW
// cancellation endorsement - mirrors generateCtplEndorsementDocuments. A
// failure here doesn't undo the approval; POST /api/endorsements/:id/documents
// can regenerate.
export async function generateOfwEndorsementDocuments(app: OfwApplication, e: Endorsement, generatedBy?: string) {
  const store = (docKey: string, body: Buffer) =>
    storeGeneratedDocument({
      applicationType: 'OFW',
      applicationId: app.id,
      docKey,
      contentType: 'application/pdf',
      body,
      generatedBy,
      endorsementId: e.id,
    });

  if (e.type !== 'Cancellation') return; // only cancellation is supported for OFW so far
  await store('ofw-cancellation', await fillCancellationLetter(app, e));
  await store('ofw-credit-memo', await fillCreditMemo(app, e));
}
