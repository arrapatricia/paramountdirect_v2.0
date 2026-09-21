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
// - both split cleanly on '/' with the year last.
export function parseDateParts(dateReceived: string): { year: number; monthIndex: number } | null {
  const parts = dateReceived.split('/');
  if (parts.length !== 3) return null;
  const monthIndex = parseInt(parts[0], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (!Number.isFinite(monthIndex) || !Number.isFinite(year)) return null;
  return { year, monthIndex };
}

export const CURRENT_YEAR = new Date().getFullYear();
export const CURRENT_MONTH_INDEX = new Date().getMonth();

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
