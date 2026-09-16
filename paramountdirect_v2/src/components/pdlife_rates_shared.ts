// Tiny shared helper used by each PD Life product's own rate-table module
// (pdlife_rates_hcp.ts, pdlife_rates_hip.ts, ...) - kept separate rather than
// folding all products into one file, since each product's real rate card
// has its own age bands, tiers, and structure.

export interface AgeBand {
  min: number;
  max: number;
}

export function findAgeBandIndex(age: number, bands: AgeBand[]): number {
  const idx = bands.findIndex((b) => age >= b.min && age <= b.max);
  if (idx !== -1) return idx;
  return age < bands[0].min ? 0 : bands.length - 1;
}
