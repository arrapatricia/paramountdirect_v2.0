// Small parsing helpers shared by the product dashboards, which all compute
// their stats from the same application records the list screens use
// (ScreeningItem / OfwApplication / CtplApplication / GtpApplication) rather
// than any mock data of their own.

// Every "premium" field in this app is a pre-formatted display string (e.g.
// "₱500.00", "$42.00") - strip everything but digits/dot/minus to get a number.
export function parsePremium(premium: string): number {
  const n = parseFloat(premium.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// dateReceived is always a short display date - either "MM/DD/YYYY" (every
// create-application form) or the default en-US "M/D/YYYY" (mapApiToScreeningItem)
// - both split cleanly on '/' with the year last. Some older rows carry a
// " at <time>" suffix (e.g. "9/21/2026 at 3:14 PM") - strip that first,
// matching life_screened_applications.tsx's own defensive handling.
export function parseDateParts(dateReceived: string): { year: number; monthIndex: number } | null {
  const parts = dateReceived.split(' at ')[0].split('/');
  if (parts.length !== 3) return null;
  const monthIndex = parseInt(parts[0], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (!Number.isFinite(monthIndex) || !Number.isFinite(year)) return null;
  return { year, monthIndex };
}

export const CURRENT_YEAR = new Date().getFullYear();
export const CURRENT_MONTH_INDEX = new Date().getMonth();
export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Groups records into one bucket per month of the current year, Jan through
// the current month only (no fabricated future months) - the shared building
// block for the Statistics module's monthly breakdowns, which (unlike the
// product dashboards' bar charts) don't do a prior-year comparison.
export function bucketByMonth<T>(records: T[], getDateReceived: (r: T) => string): T[][] {
  const buckets: T[][] = Array.from({ length: CURRENT_MONTH_INDEX + 1 }, () => []);
  for (const r of records) {
    const parts = parseDateParts(getDateReceived(r));
    if (!parts || parts.year !== CURRENT_YEAR) continue;
    if (parts.monthIndex >= 0 && parts.monthIndex <= CURRENT_MONTH_INDEX) {
      buckets[parts.monthIndex].push(r);
    }
  }
  return buckets;
}

// One bucket per calendar day actually present in `records` (no fabricated
// rolling window), sorted chronologically - the daily counterpart to
// bucketByMonth, matching life_screened_applications.tsx's existing
// day-bucketing pattern.
export function bucketByDay<T>(records: T[], getDateReceived: (r: T) => string): { date: string; records: T[] }[] {
  const buckets = new Map<string, T[]>();
  for (const r of records) {
    const day = getDateReceived(r).split(' at ')[0];
    const existing = buckets.get(day);
    if (existing) existing.push(r);
    else buckets.set(day, [r]);
  }
  return Array.from(buckets.entries())
    .map(([date, recs]) => ({ date, records: recs }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function countByField<T>(records: T[], getKey: (r: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of records) {
    const key = getKey(r);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

// Builds the { month, y{prevYear}, y{currentYear} } series every dashboard's
// bar chart uses, summing premium per month/year from the raw records.
export function buildMonthlyPremiumSeries<T>(
  records: T[],
  getDateReceived: (r: T) => string,
  getPremium: (r: T) => string
): { month: string; y2025: number; y2026: number | null }[] {
  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const prevYear = CURRENT_YEAR - 1;
  const totals: Record<number, { prev: number; curr: number }> = {};
  for (let i = 0; i < 12; i++) totals[i] = { prev: 0, curr: 0 };

  for (const r of records) {
    const parts = parseDateParts(getDateReceived(r));
    if (!parts) continue;
    const amount = parsePremium(getPremium(r));
    if (parts.year === prevYear) totals[parts.monthIndex].prev += amount;
    else if (parts.year === CURRENT_YEAR) totals[parts.monthIndex].curr += amount;
  }

  return MONTH_LABELS.map((month, i) => ({
    month,
    y2025: totals[i].prev,
    y2026: i <= CURRENT_MONTH_INDEX ? totals[i].curr : null,
  }));
}
