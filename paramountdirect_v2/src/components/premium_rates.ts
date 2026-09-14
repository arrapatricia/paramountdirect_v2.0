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

  // CTPL - flat premium by policy type + vehicle type
  { id: 'ctpl-car', product: 'CTPL', key: 'Private Car|Car', label: 'Private Car - Car', amount: 606, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-nonconv', product: 'CTPL', key: 'Private Car|Non-Conventional MV', label: 'Private Car - Non-Conventional MV', amount: 650, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-suv', product: 'CTPL', key: 'Private Car|Sports Utility Vehicle', label: 'Private Car - Sports Utility Vehicle', amount: 730, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-mc', product: 'CTPL', key: 'Motorcycle|Motorcycle', label: 'Motorcycle - Motorcycle', amount: 260, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-mc-side', product: 'CTPL', key: 'Motorcycle|Motorcycle with Side Car', label: 'Motorcycle - with Side Car', amount: 300, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-truck', product: 'CTPL', key: 'Commercial Vehicle|Truck', label: 'Commercial Vehicle - Truck', amount: 1200, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-trailer', product: 'CTPL', key: 'Commercial Vehicle|Trailer', label: 'Commercial Vehicle - Trailer', amount: 1500, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-tourist-bus', product: 'CTPL', key: 'Commercial Vehicle|Tourist Bus', label: 'Commercial Vehicle - Tourist Bus', amount: 2200, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-school-bus', product: 'CTPL', key: 'Commercial Vehicle|School Bus', label: 'Commercial Vehicle - School Bus', amount: 1800, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-utility', product: 'CTPL', key: 'Commercial Vehicle|Utility Vehicle', label: 'Commercial Vehicle - Utility Vehicle', amount: 850, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-tricycle', product: 'CTPL', key: 'Commercial Vehicle|Tricycle', label: 'Commercial Vehicle - Tricycle', amount: 400, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-shuttle', product: 'CTPL', key: 'Commercial Vehicle|Shuttle Bus', label: 'Commercial Vehicle - Shuttle Bus', amount: 1600, currency: 'PHP', unit: 'flat' },
  { id: 'ctpl-default', product: 'CTPL', key: 'default', label: 'Default (any combination not listed above)', amount: 606, currency: 'PHP', unit: 'flat' },

  // GTP - per-day rate by plan variant, plus flat add-on fees
  { id: 'gtp-single', product: 'GTP', key: 'Single Trip', label: 'Single Trip', amount: 55, currency: 'PHP', unit: 'per day' },
  { id: 'gtp-multi90', product: 'GTP', key: 'Multi-Trip 90', label: 'Multi-Trip 90', amount: 42, currency: 'PHP', unit: 'per day' },
  { id: 'gtp-multi180', product: 'GTP', key: 'Multi-Trip 180', label: 'Multi-Trip 180', amount: 38, currency: 'PHP', unit: 'per day' },
  { id: 'gtp-cruise', product: 'GTP', key: 'cruiseCoverage', label: 'Cruise Coverage add-on', amount: 150, currency: 'PHP', unit: 'add-on' },
  { id: 'gtp-hazardous', product: 'GTP', key: 'hazardousSportsCoverage', label: 'Hazardous Sports Coverage add-on', amount: 200, currency: 'PHP', unit: 'add-on' },
];
