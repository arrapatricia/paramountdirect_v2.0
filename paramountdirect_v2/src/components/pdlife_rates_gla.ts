// Real Golden Life Advantage (GLA) rate card, verified directly against the
// live paramountdirect.com premium calculator (calculate_premium_text) via
// the "My insurance needs match" dropdown on
// https://paramountdirect.com/apply/golden-life-advantage-plan.
//
// IMPORTANT: the real sellable unit counts are only 1, 2, 3, 5, 8, 10, 15, 20
// (confirmed from the live dropdown's plan_id options below) - NOT a
// continuous 1-18 scale. An earlier version of this file wrongly modeled GLA
// as 18 continuous unit tiers with entirely different (and wrong) premium
// values; every value below was re-queried from the live API and replaced.
//
// Premium does NOT vary by age within GLA's eligible range - confirmed by
// querying the same plan_id/period_id across ages 40-75 (all identical) -
// only eligibility does (0.00 / invalid outside roughly 40-75), which this
// mock defers to the create-application form's own age-eligibility check
// rather than the rate table.
//
// Live plan_id map: 1u=9, 2u=10, 3u=11, 5u=12, 8u=13, 10u=14, 15u=15, 20u=16.

export type GlaPaymentMode = 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';

// The 8 real sellable unit counts.
export const GLA_UNITS = [1, 2, 3, 5, 8, 10, 15, 20];

// Indexed to match GLA_UNITS order.
const GLA_PREMIUM_BY_UNITS: Record<GlaPaymentMode, number[]> = {
  Monthly: [413.0, 826.0, 1239.0, 2066.0, 3305.0, 4132.0, 6198.0, 8264.0],
  Quarterly: [1235.0, 2470.0, 3706.0, 6177.0, 9883.0, 12354.0, 18531.0, 24708.0],
  'Semi-Annual': [2300.0, 4600.0, 6901.0, 11502.0, 18403.0, 23004.0, 34506.0, 46008.0],
  Annual: [4260.0, 8520.0, 12780.0, 21300.0, 34080.0, 42600.0, 63900.0, 85200.0],
};

export function getGlaPremium(units: number, mode: GlaPaymentMode): number {
  const idx = GLA_UNITS.indexOf(units);
  const safeIdx = idx === -1 ? 0 : idx;
  return GLA_PREMIUM_BY_UNITS[mode][safeIdx];
}
