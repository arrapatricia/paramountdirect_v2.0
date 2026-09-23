// Premium math for CTPL financial endorsements (Term Extension and
// Cancellation). Everything is derived from the application's own gross
// premium, split back into the same Base + DST + LGT + VAT + fees parts the
// Service Invoice uses (see premium_rates.ts for the forward formula).
//
// Both computations are proportional to the policy's actual term in days, so
// they work the same for 1-year and 3-year policies - unlike the legacy
// system's hard-coded 365-day divisor.
import type { CtplApplication } from '@prisma/client';

const VERIFICATION_FEE = 46;
// Certificate of Validation fee (COV_FEE in ctpl_types.ts), included in the
// gross premium when requiresCOV is set.
const COV_FEE = 60;
const DAY_MS = 24 * 60 * 60 * 1000;
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function parsePremium(premium: string): number {
  const n = parseFloat(premium.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// Calendar day in Manila, as a UTC-midnight timestamp - so a policy issued at
// 11pm and a cancellation dated the next morning count as 1 day apart, not 0.
function manilaDay(date: Date): number {
  const shifted = new Date(date.getTime() + MANILA_OFFSET_MS);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((manilaDay(to) - manilaDay(from)) / DAY_MS);
}

export interface CtplPremiumBreakdown {
  base: number;
  dst: number;
  lgt: number;
  vat: number;
  verificationFee: number;
  certificationFee: number;
  total: number;
}

// Inverse of premium_rates.ts's Base + ceil(Base/4)*0.50 + 0.75% + 12% + fees.
// DST steps every ₱4 of base, so iterate to a fixed point, then put the
// last-centavo rounding into base so the parts add up to the gross exactly.
export function ctplBreakdownFromGross(gross: number, requiresCOV: boolean): CtplPremiumBreakdown {
  const certificationFee = requiresCOV ? COV_FEE : 0;
  const taxable = gross - VERIFICATION_FEE - certificationFee;

  let base = taxable / 1.2525;
  for (let i = 0; i < 5; i++) base = (taxable - Math.ceil(base / 4) * 0.5) / 1.1275;
  base = round2(base);

  const dst = Math.ceil(base / 4) * 0.5;
  const lgt = round2(base * 0.0075);
  const vat = round2(base * 0.12);
  base = round2(taxable - dst - lgt - vat);

  return { base, dst, lgt, vat, verificationFee: VERIFICATION_FEE, certificationFee, total: round2(gross) };
}

export interface FinancialAmounts {
  premium: number;
  dst: number;
  vat: number;
  lgt: number;
  otherFees: number;
  total: number;
}

function requireTerm(app: CtplApplication) {
  if (!app.effectiveDate || !app.expiryDate) throw new Error('Policy has no effective/expiry date on file');
  const termDays = daysBetween(app.effectiveDate, app.expiryDate);
  if (termDays <= 0) throw new Error('Policy term is invalid');
  return { effective: app.effectiveDate, expiry: app.expiryDate, termDays };
}

export class EndorsementCalcError extends Error {}

// Additional premium for the added days, at the policy's own daily rate -
// each tax component prorated the same way (as the legacy system did). The
// one-off verification/COV fees aren't charged again.
export function computeCtplExtension(app: CtplApplication, newExpiryDate: Date) {
  const { expiry, termDays } = requireTerm(app);
  const addedDays = daysBetween(expiry, newExpiryDate);
  if (addedDays <= 0) throw new EndorsementCalcError('New expiry date must be after the current expiry date');

  const b = ctplBreakdownFromGross(parsePremium(app.premium), app.requiresCOV);
  const factor = addedDays / termDays;
  const premium = round2(b.base * factor);
  const dst = round2(b.dst * factor);
  const vat = round2(b.vat * factor);
  const lgt = round2(b.lgt * factor);
  const amounts: FinancialAmounts = { premium, dst, vat, lgt, otherFees: 0, total: round2(premium + dst + vat + lgt) };
  return { amounts, addedDays, termDays, breakdown: b };
}

// Flat when cancelled on/before the effectivity date (nothing consumed yet):
// the full gross is returned, taxes and fees included. Otherwise Pro Rata:
// only the unexpired share of the base premium is returned - taxes and fees
// are not refundable once coverage has started.
//
// Amounts are returned negative (premium returned to the client), matching
// how they're stored on Endorsement.
export function computeCtplCancellation(app: CtplApplication, cancellationDate: Date) {
  const { effective, expiry, termDays } = requireTerm(app);
  const b = ctplBreakdownFromGross(parsePremium(app.premium), app.requiresCOV);
  const daysUsed = daysBetween(effective, cancellationDate);

  if (daysUsed <= 0) {
    const amounts: FinancialAmounts = {
      premium: -b.base,
      dst: -b.dst,
      vat: -b.vat,
      lgt: -b.lgt,
      otherFees: -(b.verificationFee + b.certificationFee),
      total: -b.total,
    };
    return { type: 'Cancellation_Flat' as const, amounts, daysUsed: 0, unexpiredDays: termDays, termDays, breakdown: b };
  }

  const unexpiredDays = daysBetween(cancellationDate, expiry);
  if (unexpiredDays <= 0) throw new EndorsementCalcError('Cancellation date must be before the policy expiry date');

  const refund = round2((b.base * unexpiredDays) / termDays);
  const amounts: FinancialAmounts = { premium: -refund, dst: 0, vat: 0, lgt: 0, otherFees: 0, total: -refund };
  return { type: 'Cancellation_Pro_Rata' as const, amounts, daysUsed, unexpiredDays, termDays, breakdown: b };
}
