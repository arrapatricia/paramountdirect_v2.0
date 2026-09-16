// Real HealthCARE Cash Plan (HCP) "10 Years to Pay" rate card, transcribed
// from the company's "Online - Repriced HCP.xlsx" master rate sheet.
//
// Structure: base premium at the 500 benefit tier, per insured option / age
// band / payment mode. Every other tier scales linearly off that (tier /
// 500), which matches the source sheet exactly - verified column by column.
// Older ages and larger household options are capped at a lower max tier
// (insurer's own eligibility limit), enforced via HCP_TIER_CAP below.

import { findAgeBandIndex, type AgeBand } from './pdlife_rates_shared';

export type HcpInsuredOption = 'Individual' | 'Married Couple' | 'Family';
export type HcpPaymentMode = 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';

const HCP_AGE_BANDS: AgeBand[] = [
  { min: 20, max: 29 },
  { min: 30, max: 34 },
  { min: 35, max: 39 },
  { min: 40, max: 44 },
  { min: 45, max: 49 },
  { min: 50, max: 150 },
];

export const HCP_TIERS = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];

// Base premium at the 500 tier, indexed [ageBandIndex] per mode/option.
const HCP_BASE: Record<HcpPaymentMode, Record<HcpInsuredOption, number[]>> = {
  Annual: {
    Individual: [2462.95, 2759.95, 3114.95, 3543.95, 4061.95, 4432.95],
    'Married Couple': [4925.95, 5519.95, 6229.95, 7087.95, 8123.95, 8865.95],
    Family: [7538.95, 8158.95, 8887.95, 9798.95, 10871.95, 11644.95],
  },
  'Semi-Annual': {
    Individual: [1329.99, 1490.37, 1682.07, 1913.73, 2193.45, 2393.79],
    'Married Couple': [2660.01, 2980.77, 3364.17, 3827.49, 4386.93, 4787.61],
    Family: [4071.03, 4405.83, 4799.49, 5291.43, 5870.85, 6288.27],
  },
  Quarterly: {
    Individual: [714.26, 800.39, 903.34, 1027.75, 1177.97, 1285.56],
    'Married Couple': [1428.53, 1600.79, 1806.69, 2055.51, 2355.95, 2571.13],
    Family: [2186.30, 2366.10, 2577.51, 2841.70, 3152.87, 3377.04],
  },
  Monthly: {
    Individual: [238.91, 267.72, 302.15, 343.76, 394.01, 430.00],
    'Married Couple': [477.82, 535.44, 604.31, 687.53, 788.02, 860.00],
    Family: [731.28, 791.42, 862.13, 950.50, 1054.58, 1129.56],
  },
};

// Highest tier each insured option / age band is eligible for.
const HCP_TIER_CAP: Record<HcpInsuredOption, number[]> = {
  Individual: [4000, 4000, 4000, 4000, 4000, 4000],
  'Married Couple': [4000, 4000, 4000, 3500, 3000, 2500],
  Family: [3000, 3000, 2500, 2500, 2000, 2000],
};

export function getHcpMaxTier(insuredOption: HcpInsuredOption, age: number): number {
  const bandIdx = findAgeBandIndex(age, HCP_AGE_BANDS);
  return HCP_TIER_CAP[insuredOption][bandIdx];
}

export function getHcpAvailableTiers(insuredOption: HcpInsuredOption, age: number): number[] {
  const maxTier = getHcpMaxTier(insuredOption, age);
  return HCP_TIERS.filter((t) => t <= maxTier);
}

export function getHcpPremium(insuredOption: HcpInsuredOption, age: number, tier: number, mode: HcpPaymentMode): number {
  const bandIdx = findAgeBandIndex(age, HCP_AGE_BANDS);
  const base = HCP_BASE[mode][insuredOption][bandIdx];
  return Math.round(base * (tier / 500) * 100) / 100;
}
