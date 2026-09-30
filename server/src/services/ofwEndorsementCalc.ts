// Premium math for OFW cancellations. Ported from the legacy Rails app's
// Ofw::CancellationRequest#compute_refund_premium/life_premium/
// non_life_premium/premium_tax/lg_tax (app/models/ofw/cancellation_request.rb),
// reusing the exact same life/non-life split OFW's own Service Invoice uses
// (see ofwDocumentFill.ts's computeOfwBreakdown) - just applied to the
// refund amount instead of the full premium.
//
// Unlike CTPL, this isn't a day-prorated calc: the legacy formula refunds
// one monthly-rate unit (PremiumRate 'monthlyRate') per whole remaining month (capped at the original premium),
// with two flat cutoffs - full refund if cancelled on/before the coverage
// start date, and zero refund if cancelled on/after the coverage end date.
import type { OfwApplication } from '@prisma/client';
import { getOfwMonthlyRate } from '../lib/premiumCalc';

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function parsePremium(premium: string): number {
  const n = parseFloat(premium.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// Flat, fixed per real Service Invoices - not proportional to premium (same
// constant ofwDocumentFill.ts uses).
const OFW_DOC_STAMP = 0.6;

// Same life/non-life/tax split as ofwDocumentFill.ts's computeOfwBreakdown,
// applied here to a refund amount rather than the gross premium.
function splitOfwPremium(base: number) {
  const lifePremium = base * 0.3 - 0.3;
  const nonLifePremium = (base * 0.7 + 0.3 - OFW_DOC_STAMP) / 1.022;
  const premiumMinusTaxes = lifePremium + nonLifePremium;
  const premiumTax = round3(nonLifePremium * 0.02);
  const lgTax = round3(nonLifePremium * 0.002);
  return { base, docStamp: OFW_DOC_STAMP, premiumMinusTaxes, premiumTax, lgTax };
}

export class EndorsementCalcError extends Error {}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

// Whole calendar months between `from` and `to`, rounded to whichever of
// (months, months+1) lands closest without undershooting - mirrors the
// legacy `(start_date >> months)` adjustment exactly.
function monthsRemaining(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (addMonths(from, months) > to) months -= 1;
  if (addMonths(from, months) < to) months += 1;
  return months;
}

function requireCoverageWindow(app: OfwApplication) {
  if (!app.insuranceStart || !app.contractEnd) throw new Error('Policy has no coverage start/end date on file');
  return { insuranceStart: app.insuranceStart, insuranceEnd: app.contractEnd };
}

// Returns the refund amount (unsigned) and its life/non-life/tax breakdown,
// plus the "months earned" figure the credit memo and cancellation letter
// both print.
export async function computeOfwCancellation(app: OfwApplication, cancellationDate: Date) {
  const { insuranceStart, insuranceEnd } = requireCoverageWindow(app);
  const premium = round3(parsePremium(app.premium));

  if (cancellationDate >= insuranceEnd) {
    throw new EndorsementCalcError('Cancellation date must be before the policy coverage end date');
  }

  let refund: number;
  if (cancellationDate <= insuranceStart) {
    refund = premium;
  } else {
    const months = monthsRemaining(cancellationDate, insuranceEnd);
    refund = Math.min(round3(months * (await getOfwMonthlyRate())), premium);
  }

  const premiumEarned = Math.max(round3(premium - refund), 0);
  const breakdown = splitOfwPremium(refund);
  // Amounts are returned negative (premium returned to the client), matching
  // how they're stored on Endorsement (see ctplEndorsementCalc.ts).
  const amounts = {
    premium: -breakdown.premiumMinusTaxes,
    dst: -breakdown.docStamp,
    vat: 0,
    lgt: -breakdown.lgTax,
    otherFees: -breakdown.premiumTax,
    total: -refund,
  };

  return { type: 'Cancellation' as const, amounts, refund, premiumEarned, breakdown };
}
