// Server-side mirror of premium_rates.ts's lookup helpers and each product's
// create-application premium formula (ctpl_create_application.tsx /
// ofw_create_application.tsx / gtp_create_application.tsx) - always computed
// from the PremiumRate table, never trusted from the client, since CTPL
// endorsements are priced off the resulting application's base premium and a
// client-supplied number can't be relied on for that.
import { prisma } from './prisma';

async function ratesFor(product: string): Promise<Map<string, number>> {
  const rows = await prisma.premiumRate.findMany({ where: { product } });
  return new Map(rows.map((r) => [r.key, r.amount]));
}

function rate(rates: Map<string, number>, key: string, fallback = 0): number {
  return rates.get(key) ?? fallback;
}

// PremiumRate keys are stored in the frontend's display format (e.g.
// "Private Car", "1 Year" - see premium_rates.ts's CTPL keys), but the
// application row itself stores the Prisma enum form ("Private_Car",
// "One_Year" - see lib/api.ts's toApiCtplPolicyType/toApiCtplRenewalType on
// the frontend side of this same translation). Convert back before building
// the lookup key, or every lookup here silently misses and falls through to
// the 'default' rate.
const CTPL_POLICY_TYPE_TO_LABEL: Record<string, string> = {
  Private_Car: 'Private Car',
  Commercial_Vehicle: 'Commercial Vehicle',
  Motorcycle: 'Motorcycle',
};
const CTPL_RENEWAL_TO_LABEL: Record<string, string> = { One_Year: '1 Year', Three_Years: '3 Years' };

// Mirrors ctpl_create_application.tsx: base rate-card premium for the
// policyType|mvType|renewalType combination, plus the flat COV fee if the
// applicant opted into Certificate of Validation.
export async function computeCtplPremium(
  policyType: string,
  mvType: string,
  renewalType: string,
  requiresCOV: boolean
): Promise<number> {
  const rates = await ratesFor('CTPL');
  const policyTypeLabel = CTPL_POLICY_TYPE_TO_LABEL[policyType] ?? policyType;
  const renewalTypeLabel = CTPL_RENEWAL_TO_LABEL[renewalType] ?? renewalType;
  // mvType is already required by the caller's zod schema by this point, so
  // (unlike the frontend's live-editing form) there's no "not selected yet"
  // case to fall back to 0 for here.
  const base = rate(rates, `${policyTypeLabel}|${mvType}|${renewalTypeLabel}`, rate(rates, 'default', 666));
  const covFee = rate(rates, 'covFee', 60);
  return base + (requiresCOV ? covFee : 0);
}

export interface CtplTaxParams {
  dstAmountPerUnit: number;
  lgtPercent: number;
  vatPercent: number;
  otherFees: number;
  covFee: number;
}

// The DST/LGT/VAT/Other Fees/COV formula parameters are government-set (or,
// for COV, Paramount's own fee) and change over time, so they live in the
// PremiumRate table rather than being hardcoded constants - shared by the
// printed document breakdown (ctplDocumentFill.ts) and the endorsement math
// that inverts this same formula (ctplEndorsementCalc.ts), so a rate change
// stays consistent across both instead of only updating one of two
// hardcoded copies.
export async function getCtplTaxParams(): Promise<CtplTaxParams> {
  const rates = await ratesFor('CTPL');
  return {
    dstAmountPerUnit: rate(rates, 'dstAmountPerUnit', 0.5),
    lgtPercent: rate(rates, 'lgtPercent', 0.75),
    vatPercent: rate(rates, 'vatPercent', 12),
    otherFees: rate(rates, 'otherFees', 46),
    covFee: rate(rates, 'covFee', 60),
  };
}

export interface CtplBreakdown {
  base: number;
  dst: number;
  lgt: number;
  otherFees: number;
  vat: number;
  vatExempt: number;
  total: number;
}

export async function computeCtplBreakdown(base: number): Promise<CtplBreakdown> {
  const { dstAmountPerUnit, lgtPercent, vatPercent, otherFees } = await getCtplTaxParams();

  const dst = Math.ceil(base / 4) * dstAmountPerUnit;
  const lgt = Math.round(base * (lgtPercent / 100) * 100) / 100;
  const vat = Math.round(base * (vatPercent / 100) * 100) / 100;
  const vatExempt = Math.round((dst + lgt + otherFees) * 100) / 100;
  const total = Math.round((base + dst + lgt + otherFees + vat) * 100) / 100;
  return { base, dst, lgt, otherFees, vat, vatExempt, total };
}

// --- OFW -----------------------------------------------------------------
// Mirrors ofw_create_application.tsx: monthly rate x full calendar months
// between the contract's start/end dates (no minimum enforced server-side,
// same as the frontend - the 6-month minimum there is a UI warning only).
export async function computeOfwPremium(contractStart: Date, contractEnd: Date): Promise<number> {
  const rates = await ratesFor('OFW');
  const monthlyRate = rate(rates, 'monthlyRate', 2.9);
  let months = (contractEnd.getFullYear() - contractStart.getFullYear()) * 12 + (contractEnd.getMonth() - contractStart.getMonth());
  if (contractEnd.getDate() < contractStart.getDate()) months -= 1;
  months = Math.max(0, months);
  return Number((months * monthlyRate).toFixed(2));
}

// --- GTP -------------------------------------------------------------------
const GTP_HIGH_COST_DESTINATIONS = ['Hong Kong', 'United States', 'Canada'];
const GTP_DAY_BRACKETS = [4, 8, 15, 24, 31, 45, 60];

function gtpSingleTripRate(rates: Map<string, number>, category: string, applicationType: string, days: number): number {
  const bracket = GTP_DAY_BRACKETS.find((b) => days <= b);
  if (bracket) return rate(rates, `Single Trip|${category}|${applicationType}|${bracket}`);
  const base = rate(rates, `Single Trip|${category}|${applicationType}|60`);
  const addtl = rate(rates, `Single Trip|${category}|${applicationType}|addtl10`);
  const increments = Math.ceil((days - 60) / 10);
  return base + increments * addtl;
}

// Mirrors gtp_create_application.tsx: destination category is auto-detected
// (Domestic travel type, else Including if a high-cost destination was
// picked, else Excluding), Single Trip prices off day brackets while
// Multi-Trip is one flat premium per category, then cruise/hazardous-sports
// add-ons priced as a % of the base premium (PremiumRate's amount is the
// percentage, e.g. 21.9 means 21.9%) - matches the frontend exactly.
export async function computeGtpPremium(params: {
  travelType: 'International' | 'Domestic';
  destinations: string[];
  planVariant: 'Single_Trip' | 'Multi_Trip_90' | 'Multi_Trip_180';
  applicationType: 'Individual' | 'Family';
  daysOfTravel: number;
  cruiseCoverage: boolean;
  hazardousSportsCoverage: boolean;
}): Promise<number> {
  const rates = await ratesFor('GTP');
  const isHighCostDestination = params.destinations.some((d) => GTP_HIGH_COST_DESTINATIONS.includes(d));
  const category = params.travelType === 'Domestic' ? 'Domestic' : isHighCostDestination ? 'Including' : 'Excluding';

  const basePremium =
    params.planVariant === 'Single_Trip'
      ? gtpSingleTripRate(rates, category, params.applicationType, params.daysOfTravel)
      : rate(rates, `${params.planVariant === 'Multi_Trip_90' ? 'Multi-Trip 90' : 'Multi-Trip 180'}|${category}`);

  const addOnFee = basePremium * (
    (params.cruiseCoverage ? rate(rates, 'cruiseCoveragePercent', 21.9) : 0) +
    (params.hazardousSportsCoverage ? rate(rates, 'hazardousSportsCoveragePercent', 126.3) : 0)
  ) / 100;

  return Number((basePremium + addOnFee).toFixed(2));
}
