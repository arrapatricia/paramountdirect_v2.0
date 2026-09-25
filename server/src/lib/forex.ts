// USD->PHP forex rate for OFW's premium conversion (see
// OfwApplication.fxRate/premiumPhp) - pulled from a free, no-key exchange
// rate API. Cached briefly so every premium edit doesn't refetch; a fetch
// failure falls back to the last rate seen this process, or a rough default.
const FOREX_API_URL = 'https://open.er-api.com/v6/latest/USD';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour - this API itself only updates once a day.
const FALLBACK_USD_TO_PHP = 58;

let cachedRate: number | null = null;
let cachedAt = 0;

export async function getUsdToPhpRate(): Promise<number> {
  const now = Date.now();
  if (cachedRate !== null && now - cachedAt < CACHE_TTL_MS) return cachedRate;

  try {
    const res = await fetch(FOREX_API_URL);
    if (!res.ok) throw new Error(`Forex API returned ${res.status}`);
    const data = (await res.json()) as { rates?: Record<string, number> };
    const rate = data.rates?.PHP;
    if (typeof rate !== 'number' || !Number.isFinite(rate)) throw new Error('Forex API response missing PHP rate');
    cachedRate = rate;
    cachedAt = now;
    return rate;
  } catch (err) {
    console.error('Failed to fetch USD->PHP forex rate, using fallback', err);
    return cachedRate ?? FALLBACK_USD_TO_PHP;
  }
}

// `premium` is stored as a formatted string, e.g. "$42.00".
export function parseUsdPremium(premium: string): number {
  return Number(premium.replace(/[^0-9.]/g, '')) || 0;
}

export function formatPhp(amount: number): string {
  return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
