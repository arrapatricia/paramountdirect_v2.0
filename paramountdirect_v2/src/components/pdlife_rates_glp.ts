// Guaranteed Life Plan (GLP) premium rates, transcribed from Paramount's
// "GLP PREMIUMS RATES AND BENEFITS" sheets (GLP PREMIUM RATES.pdf and PART 2).
// Premium does not vary by age - the same units/mode figures repeat under every
// age block in those sheets. Units run 1-20 (the website sells 1, 2, 3, 5, 7,
// 10, 15 and 20).

export type GlpPaymentMode = 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';

export const GLP_UNITS = [1, 2, 3, 5, 7, 10, 15, 20];

// Index 0 = 1 unit ... index 19 = 20 units.
const GLP_PREMIUM_BY_UNITS: Record<GlpPaymentMode, number[]> = {
  Monthly: [150.95, 300.95, 451.95, 602.95, 752.95, 903.95, 1054.95, 1204.95, 1355.95, 1505.95, 1656.95, 1807.95, 1957.95, 2108.95, 2259.95, 2409.95, 2560.95, 2711.95, 2861.95, 3012.95],
  Quarterly: [440.95, 879.95, 1320.95, 1762.95, 2201.95, 2643.95, 3084.95, 3523.95, 3965.95, 4403.95, 4845.95, 5287.95, 5726.95, 6167.95, 6609.95, 7048.95, 7489.95, 7931.95, 8370.95, 8811.95],
  'Semi-Annual': [859.95, 1714.95, 2575.95, 3436.95, 4291.95, 5152.95, 6012.95, 6867.95, 7728.95, 8583.95, 9444.95, 10304.95, 11159.95, 12020.95, 12881.95, 13736.95, 14596.95, 15457.95, 16312.95, 17173.95],
  Annual: [1629.95, 3249.95, 4880.95, 6511.95, 8131.95, 9762.95, 11392.95, 13012.95, 14643.95, 16263.95, 17894.95, 19525.95, 21145.95, 22776.95, 24406.95, 26026.95, 27657.95, 29288.95, 30908.95, 32539.95],
};

export function getGlpPremium(units: number, mode: GlpPaymentMode): number {
  const idx = Math.min(20, Math.max(1, Math.round(units))) - 1;
  return GLP_PREMIUM_BY_UNITS[mode][idx];
}
