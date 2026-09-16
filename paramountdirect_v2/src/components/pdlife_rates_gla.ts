// Real Golden Life Advantage (GLA) rate card, transcribed from the
// company's "GLA.xlsx" master rate sheet ("Table of Face Amounts/Fixed
// Monthly Premiums"). Unlike HCP/HIP, GLA's premium depends only on units
// purchased and payment mode - age only affects the resulting face amount
// (benefit), not the premium itself, so there's no age-banding here.

export type GlaPaymentMode = 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';

export const GLA_MAX_UNITS = 18;

// Indexed by units - 1 (units run 1..18).
const GLA_PREMIUM_BY_UNITS: Record<GlaPaymentMode, number[]> = {
  Monthly: [
    223.95, 446.95, 670.95, 894.95, 1118.95, 1342.95, 1566.95, 1790.95, 2014.95,
    2238.95, 2462.95, 2686.95, 2910.95, 3134.95, 3358.95, 3582.95, 3806.95, 4030.95,
  ],
  Quarterly: [
    654.95, 1306.95, 1961.95, 2616.95, 3271.95, 3927.95, 4582.95, 5237.95, 5892.95,
    6547.95, 7203.95, 7858.95, 8513.95, 9168.95, 9823.95, 10479.95, 11134.95, 11789.95,
  ],
  'Semi-Annual': [
    1275.95, 2546.95, 3823.95, 5100.95, 6377.95, 7653.95, 8930.95, 10207.95, 11484.95,
    12761.95, 14037.95, 15314.95, 16591.95, 17868.95, 19145.95, 20421.95, 21698.95, 22975.95,
  ],
  Annual: [
    2417.95, 4826.95, 7245.95, 9664.95, 12083.95, 14502.95, 16922.95, 19341.95, 21760.95,
    24179.95, 26598.95, 29018.95, 31437.95, 33856.95, 36275.95, 38694.95, 41114.95, 43533.95,
  ],
};

export function getGlaPremium(units: number, mode: GlaPaymentMode): number {
  const idx = Math.min(Math.max(units, 1), GLA_MAX_UNITS) - 1;
  return GLA_PREMIUM_BY_UNITS[mode][idx];
}
