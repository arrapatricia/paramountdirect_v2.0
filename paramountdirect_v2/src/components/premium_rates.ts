// Shared premium/rate table across all four product lines. Previously each
// product's create-application form had its own hardcoded rate constant
// (PREMIUM_BY_COVERAGE, PREMIUM_TABLE, DAILY_RATE, PREMIUM_BY_PLAN_CODE) -
// this centralizes them into one editable table (see premium_maintenance.tsx)
// so rates can be maintained without touching code, while each create form
// keeps its own calculation shape (which rate(s) apply, and how they combine)
// and only looks up the numeric amount from here.

export type PremiumProduct = 'PD Life' | 'OFW' | 'CTPL' | 'GTP';
export type PremiumUnit = 'flat' | 'per day' | 'per month' | 'add-on';

export interface PremiumRate {
  id: string;
  product: PremiumProduct;
  key: string; // lookup key used by the matching create-application form
  label: string;
  amount: number;
  currency: 'PHP' | 'USD';
  unit: PremiumUnit;
}

export function getPremiumRate(rates: PremiumRate[], product: PremiumProduct, key: string, fallback = 0): number {
  return rates.find((r) => r.product === product && r.key === key)?.amount ?? fallback;
}

export type GtpDestinationCategory = 'Including' | 'Excluding' | 'Domestic';

const GTP_DAY_BRACKETS = [4, 8, 15, 24, 31, 45, 60];

// GTP Single Trip pricing: graduated day brackets up to 60 days, then a flat
// per-10-days increment beyond that - matches the sheet's own "Each addtl
// 10 days" row.
export function getGtpSingleTripRate(
  rates: PremiumRate[],
  category: GtpDestinationCategory,
  applicationType: 'Individual' | 'Family',
  days: number
): number {
  const bracket = GTP_DAY_BRACKETS.find((b) => days <= b);
  if (bracket) {
    return getPremiumRate(rates, 'GTP', `Single Trip|${category}|${applicationType}|${bracket}`);
  }
  const base = getPremiumRate(rates, 'GTP', `Single Trip|${category}|${applicationType}|60`);
  const addtl = getPremiumRate(rates, 'GTP', `Single Trip|${category}|${applicationType}|addtl10`);
  const increments = Math.ceil((days - 60) / 10);
  return base + increments * addtl;
}

// GTP Multi-Trip annual plans are one flat premium per destination category,
// not split by Individual/Family.
export function getGtpMultiTripRate(
  rates: PremiumRate[],
  planVariant: 'Multi-Trip 90' | 'Multi-Trip 180',
  category: GtpDestinationCategory
): number {
  return getPremiumRate(rates, 'GTP', `${planVariant}|${category}`);
}

export const INITIAL_PREMIUM_RATES: PremiumRate[] = [
  // PD Life - flat premium per plan code
  { id: 'pdlife-HCP', product: 'PD Life', key: 'HCP', label: 'HealthCARE Cash Plan (HCP)', amount: 500, currency: 'PHP', unit: 'flat' },
  { id: 'pdlife-HIP', product: 'PD Life', key: 'HIP', label: 'Hospital Income Benefit Plan (HIP)', amount: 350, currency: 'PHP', unit: 'flat' },
  { id: 'pdlife-PCP', product: 'PD Life', key: 'PCP', label: 'PrimeCARE Cash Plan (PCP)', amount: 420, currency: 'PHP', unit: 'flat' },
  { id: 'pdlife-PHC', product: 'PD Life', key: 'PHC', label: 'Premium HealthCare Plus Plan (PHC)', amount: 680, currency: 'PHP', unit: 'flat' },
  { id: 'pdlife-GLP', product: 'PD Life', key: 'GLP', label: 'Guaranteed Life Plan (GLP)', amount: 450, currency: 'PHP', unit: 'flat' },
  { id: 'pdlife-GLA', product: 'PD Life', key: 'GLA', label: 'Golden Life Advantage (GLA)', amount: 600, currency: 'PHP', unit: 'flat' },
  { id: 'pdlife-GPR', product: 'PD Life', key: 'GPR', label: 'Go Protect Plan (GPR)', amount: 380, currency: 'PHP', unit: 'flat' },
  { id: 'pdlife-MPR', product: 'PD Life', key: 'MPR', label: 'MoneyPlus Protection Plan (MPR)', amount: 500, currency: 'PHP', unit: 'flat' },
  { id: 'pdlife-SSP', product: 'PD Life', key: 'SSP', label: 'Sure Savings Plan (SSP)', amount: 892, currency: 'PHP', unit: 'flat' },
  { id: 'pdlife-PHP', product: 'PD Life', key: 'PHP', label: 'PrimeHealth Cash Plan (PHP)', amount: 620, currency: 'PHP', unit: 'flat' },
  { id: 'pdlife-DRE', product: 'PD Life', key: 'DRE', label: 'Dream College Plan (DRE)', amount: 750, currency: 'PHP', unit: 'flat' },

  // OFW - flat rate per month of the employment contract (No. of Months is
  // the actual pricing driver on the live ofwinsurance.ph form, computed
  // from Term of Employment From/To, with a 6-month minimum) - $2.90/month
  // per Paramount's own OFW premium computation sheet and published rate
  // table (e.g. 12 months = $34.80), same rate regardless of land/sea
  // coverage type.
  { id: 'ofw-monthly-rate', product: 'OFW', key: 'monthlyRate', label: 'Premium rate per month of the employment contract', amount: 2.90, currency: 'USD', unit: 'per month' },

  // CTPL - 1-year (Renewal) flat premium by policy type + vehicle type.
  // Each amount is Base + DST(ceil(Base/4)*0.50) + LGT(0.75% of Base) +
  // VAT(12% of Base) + Other Fees (₱46 flat) - reconciled to the peso
  // against real Service Invoices for the Private Car/Jeep/UV (₱447.01
  // base) and Motorcycle/Tricycle/Trailer (₱199.55 base) classes; the
  // other bases come from Paramount's official 1-year rate card and use
  // the same verified formula.
  { id: 'ctpl-car', product: 'CTPL', key: 'Private Car|Car', label: 'Private Car - Car', amount: 666, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-jeep', product: 'CTPL', key: 'Private Car|Jeep', label: 'Private Car - Jeep', amount: 666, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-suv', product: 'CTPL', key: 'Private Car|Sports Utility Vehicle', label: 'Private Car - Sports Utility Vehicle', amount: 666, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-utility', product: 'CTPL', key: 'Private Car|Utility Vehicle', label: 'Private Car - Utility Vehicle', amount: 666, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-ac-tourist', product: 'CTPL', key: 'Private Car|AC / Tourist Car', label: 'Private Car - AC / Tourist Car', amount: 785.96, currency: 'PHP', unit: 'flat' },

  { id: 'ctpl-light-truck', product: 'CTPL', key: 'Commercial Vehicle|Light/Medium Truck (Own Goods, ≤ 3,930kg)', label: 'Commercial Vehicle - Light/Medium Truck (≤ 3,930kg)', amount: 656, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-heavy-truck', product: 'CTPL', key: 'Commercial Vehicle|Heavy Truck (Own Goods) / Private Bus (> 3,930kg)', label: 'Commercial Vehicle - Heavy Truck / Private Bus (> 3,930kg)', amount: 1246.01, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-taxi-puj', product: 'CTPL', key: 'Commercial Vehicle|Taxi / PUJ / Mini Bus', label: 'Commercial Vehicle - Taxi / PUJ / Mini Bus', amount: 1146.01, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-pub-tourist-bus', product: 'CTPL', key: 'Commercial Vehicle|PUB / Tourist Bus', label: 'Commercial Vehicle - PUB / Tourist Bus', amount: 1496, currency: 'PHP', unit: 'flat' },

  { id: 'ctpl-mc', product: 'CTPL', key: 'Motorcycle|Motorcycle', label: 'Motorcycle - Motorcycle', amount: 296, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-mc-side', product: 'CTPL', key: 'Motorcycle|Motorcycle with Side Car', label: 'Motorcycle - with Side Car', amount: 296, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-tricycle', product: 'CTPL', key: 'Motorcycle|Tricycle', label: 'Motorcycle - Tricycle', amount: 296, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-mc-trailer', product: 'CTPL', key: 'Motorcycle|Trailer', label: 'Motorcycle - Trailer', amount: 296, currency: 'PHP', unit: 'flat' },

  { id: 'ctpl-default', product: 'CTPL', key: 'default', label: 'Default (any combination not listed above)', amount: 666, currency: 'PHP', unit: 'flat' },

  // GTP - Single Trip prices off two factors: destination category
  // (Including USA/Canada/HK vs Excluding vs Domestic, auto-detected from
  // the chosen destinations) and days of travel (graduated brackets), split
  // by Individual/Family. Verified against Paramount's own GTPH
  // Computation sheet, Economy tier (P500,000 Intl / P250,000 Domestic).
  { id: 'gtp-st-incl-4-ind', product: 'GTP', key: 'Single Trip|Including|Individual|4', label: 'Single Trip, Including USA/Canada/HK, Individual, up to 4 days', amount: 450.00, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-4-fam', product: 'GTP', key: 'Single Trip|Including|Family|4', label: 'Single Trip, Including USA/Canada/HK, Family, up to 4 days', amount: 1102.50, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-8-ind', product: 'GTP', key: 'Single Trip|Including|Individual|8', label: 'Single Trip, Including USA/Canada/HK, Individual, up to 8 days', amount: 711.25, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-8-fam', product: 'GTP', key: 'Single Trip|Including|Family|8', label: 'Single Trip, Including USA/Canada/HK, Family, up to 8 days', amount: 1756.25, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-15-ind', product: 'GTP', key: 'Single Trip|Including|Individual|15', label: 'Single Trip, Including USA/Canada/HK, Individual, up to 15 days', amount: 1013.75, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-15-fam', product: 'GTP', key: 'Single Trip|Including|Family|15', label: 'Single Trip, Including USA/Canada/HK, Family, up to 15 days', amount: 2523.75, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-24-ind', product: 'GTP', key: 'Single Trip|Including|Individual|24', label: 'Single Trip, Including USA/Canada/HK, Individual, up to 24 days', amount: 1316.25, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-24-fam', product: 'GTP', key: 'Single Trip|Including|Family|24', label: 'Single Trip, Including USA/Canada/HK, Family, up to 24 days', amount: 3302.50, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-31-ind', product: 'GTP', key: 'Single Trip|Including|Individual|31', label: 'Single Trip, Including USA/Canada/HK, Individual, up to 31 days', amount: 1603.75, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-31-fam', product: 'GTP', key: 'Single Trip|Including|Family|31', label: 'Single Trip, Including USA/Canada/HK, Family, up to 31 days', amount: 4056.25, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-45-ind', product: 'GTP', key: 'Single Trip|Including|Individual|45', label: 'Single Trip, Including USA/Canada/HK, Individual, up to 45 days', amount: 2208.75, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-45-fam', product: 'GTP', key: 'Single Trip|Including|Family|45', label: 'Single Trip, Including USA/Canada/HK, Family, up to 45 days', amount: 5631.25, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-60-ind', product: 'GTP', key: 'Single Trip|Including|Individual|60', label: 'Single Trip, Including USA/Canada/HK, Individual, up to 60 days', amount: 2813.75, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-60-fam', product: 'GTP', key: 'Single Trip|Including|Family|60', label: 'Single Trip, Including USA/Canada/HK, Family, up to 60 days', amount: 7230.00, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-incl-addtl10-ind', product: 'GTP', key: 'Single Trip|Including|Individual|addtl10', label: 'Single Trip, Including USA/Canada/HK, Individual, each additional 10 days beyond 60', amount: 257.50, currency: 'PHP', unit: 'add-on' },
  { id: 'gtp-st-incl-addtl10-fam', product: 'GTP', key: 'Single Trip|Including|Family|addtl10', label: 'Single Trip, Including USA/Canada/HK, Family, each additional 10 days beyond 60', amount: 643.75, currency: 'PHP', unit: 'add-on' },

  { id: 'gtp-st-excl-4-ind', product: 'GTP', key: 'Single Trip|Excluding|Individual|4', label: 'Single Trip, Excluding USA/Canada/HK, Individual, up to 4 days', amount: 378.75, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-4-fam', product: 'GTP', key: 'Single Trip|Excluding|Family|4', label: 'Single Trip, Excluding USA/Canada/HK, Family, up to 4 days', amount: 926.25, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-8-ind', product: 'GTP', key: 'Single Trip|Excluding|Individual|8', label: 'Single Trip, Excluding USA/Canada/HK, Individual, up to 8 days', amount: 635.00, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-8-fam', product: 'GTP', key: 'Single Trip|Excluding|Family|8', label: 'Single Trip, Excluding USA/Canada/HK, Family, up to 8 days', amount: 1568.75, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-15-ind', product: 'GTP', key: 'Single Trip|Excluding|Individual|15', label: 'Single Trip, Excluding USA/Canada/HK, Individual, up to 15 days', amount: 907.50, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-15-fam', product: 'GTP', key: 'Single Trip|Excluding|Family|15', label: 'Single Trip, Excluding USA/Canada/HK, Family, up to 15 days', amount: 2258.75, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-24-ind', product: 'GTP', key: 'Single Trip|Excluding|Individual|24', label: 'Single Trip, Excluding USA/Canada/HK, Individual, up to 24 days', amount: 1180.00, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-24-fam', product: 'GTP', key: 'Single Trip|Excluding|Family|24', label: 'Single Trip, Excluding USA/Canada/HK, Family, up to 24 days', amount: 2961.25, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-31-ind', product: 'GTP', key: 'Single Trip|Excluding|Individual|31', label: 'Single Trip, Excluding USA/Canada/HK, Individual, up to 31 days', amount: 1452.50, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-31-fam', product: 'GTP', key: 'Single Trip|Excluding|Family|31', label: 'Single Trip, Excluding USA/Canada/HK, Family, up to 31 days', amount: 3673.75, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-45-ind', product: 'GTP', key: 'Single Trip|Excluding|Individual|45', label: 'Single Trip, Excluding USA/Canada/HK, Individual, up to 45 days', amount: 1981.25, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-45-fam', product: 'GTP', key: 'Single Trip|Excluding|Family|45', label: 'Single Trip, Excluding USA/Canada/HK, Family, up to 45 days', amount: 5053.75, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-60-ind', product: 'GTP', key: 'Single Trip|Excluding|Individual|60', label: 'Single Trip, Excluding USA/Canada/HK, Individual, up to 60 days', amount: 2526.25, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-60-fam', product: 'GTP', key: 'Single Trip|Excluding|Family|60', label: 'Single Trip, Excluding USA/Canada/HK, Family, up to 60 days', amount: 6491.25, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-excl-addtl10-ind', product: 'GTP', key: 'Single Trip|Excluding|Individual|addtl10', label: 'Single Trip, Excluding USA/Canada/HK, Individual, each additional 10 days beyond 60', amount: 227.50, currency: 'PHP', unit: 'add-on' },
  { id: 'gtp-st-excl-addtl10-fam', product: 'GTP', key: 'Single Trip|Excluding|Family|addtl10', label: 'Single Trip, Excluding USA/Canada/HK, Family, each additional 10 days beyond 60', amount: 567.50, currency: 'PHP', unit: 'add-on' },

  { id: 'gtp-st-dom-4-ind', product: 'GTP', key: 'Single Trip|Domestic|Individual|4', label: 'Single Trip, Domestic, Individual, up to 4 days', amount: 272.25, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-4-fam', product: 'GTP', key: 'Single Trip|Domestic|Family|4', label: 'Single Trip, Domestic, Family, up to 4 days', amount: 667.13, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-8-ind', product: 'GTP', key: 'Single Trip|Domestic|Individual|8', label: 'Single Trip, Domestic, Individual, up to 8 days', amount: 505.13, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-8-fam', product: 'GTP', key: 'Single Trip|Domestic|Family|8', label: 'Single Trip, Domestic, Family, up to 8 days', amount: 1247.63, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-15-ind', product: 'GTP', key: 'Single Trip|Domestic|Individual|15', label: 'Single Trip, Domestic, Individual, up to 15 days', amount: 721.13, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-15-fam', product: 'GTP', key: 'Single Trip|Domestic|Family|15', label: 'Single Trip, Domestic, Family, up to 15 days', amount: 1796.63, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-24-ind', product: 'GTP', key: 'Single Trip|Domestic|Individual|24', label: 'Single Trip, Domestic, Individual, up to 24 days', amount: 939.38, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-24-fam', product: 'GTP', key: 'Single Trip|Domestic|Family|24', label: 'Single Trip, Domestic, Family, up to 24 days', amount: 2358.00, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-31-ind', product: 'GTP', key: 'Single Trip|Domestic|Individual|31', label: 'Single Trip, Domestic, Individual, up to 31 days', amount: 1157.63, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-31-fam', product: 'GTP', key: 'Single Trip|Domestic|Family|31', label: 'Single Trip, Domestic, Family, up to 31 days', amount: 2928.38, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-45-ind', product: 'GTP', key: 'Single Trip|Domestic|Individual|45', label: 'Single Trip, Domestic, Individual, up to 45 days', amount: 1584.00, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-45-fam', product: 'GTP', key: 'Single Trip|Domestic|Family|45', label: 'Single Trip, Domestic, Family, up to 45 days', amount: 4041.00, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-60-ind', product: 'GTP', key: 'Single Trip|Domestic|Individual|60', label: 'Single Trip, Domestic, Individual, up to 60 days', amount: 2017.13, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-60-fam', product: 'GTP', key: 'Single Trip|Domestic|Family|60', label: 'Single Trip, Domestic, Family, up to 60 days', amount: 5185.13, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-st-dom-addtl10-ind', product: 'GTP', key: 'Single Trip|Domestic|Individual|addtl10', label: 'Single Trip, Domestic, Individual, each additional 10 days beyond 60', amount: 181.13, currency: 'PHP', unit: 'add-on' },
  { id: 'gtp-st-dom-addtl10-fam', product: 'GTP', key: 'Single Trip|Domestic|Family|addtl10', label: 'Single Trip, Domestic, Family, each additional 10 days beyond 60', amount: 453.38, currency: 'PHP', unit: 'add-on' },

  // GTP - Multi-Trip annual plans: one flat premium per destination
  // category (not split by Individual/Family), for the given per-trip day
  // cap (90 or 180 days), Economy tier.
  { id: 'gtp-mt90-incl', product: 'GTP', key: 'Multi-Trip 90|Including', label: 'Multi-Trip 90, Including USA/Canada/HK', amount: 6404.00, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-mt90-excl', product: 'GTP', key: 'Multi-Trip 90|Excluding', label: 'Multi-Trip 90, Excluding USA/Canada/HK', amount: 5765.00, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-mt90-dom', product: 'GTP', key: 'Multi-Trip 90|Domestic', label: 'Multi-Trip 90, Domestic', amount: 5124.00, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-mt180-incl', product: 'GTP', key: 'Multi-Trip 180|Including', label: 'Multi-Trip 180, Including USA/Canada/HK', amount: 12331.00, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-mt180-excl', product: 'GTP', key: 'Multi-Trip 180|Excluding', label: 'Multi-Trip 180, Excluding USA/Canada/HK', amount: 10920.63, currency: 'PHP', unit: 'flat' },
  { id: 'gtp-mt180-dom', product: 'GTP', key: 'Multi-Trip 180|Domestic', label: 'Multi-Trip 180, Domestic', amount: 9706.38, currency: 'PHP', unit: 'flat' },

  { id: 'gtp-cruise', product: 'GTP', key: 'cruiseCoverage', label: 'Cruise Coverage add-on', amount: 150, currency: 'PHP', unit: 'add-on' },
  { id: 'gtp-hazardous', product: 'GTP', key: 'hazardousSportsCoverage', label: 'Hazardous Sports Coverage add-on', amount: 200, currency: 'PHP', unit: 'add-on' },
];
