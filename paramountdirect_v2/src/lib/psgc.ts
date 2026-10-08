// Client for the public PSGC (Philippine Standard Geographic Code) cloud API -
// https://psgc.gitlab.io/api/ - the single source for every region / province /
// city-municipality / barangay dropdown in the app, replacing the ~7,000-line
// hardcoded lists that used to live in components/ph_geography.ts.
//
// It's a static-file API on GitLab Pages: CORS-open, no key, fast (~250ms-1s)
// but occasionally stalls on a single object. So every call is time-boxed,
// retried (the retry adds a throwaway query param to dodge a stuck edge copy),
// and cached - in memory for the session and in localStorage for a week, since
// the PSGC masterlist only changes a few times a year. Callers must treat a
// rejected promise as "fall back to manual typing", never as a dead form.

const BASE = 'https://psgc.gitlab.io/api';
const TIMEOUT_MS = 6000;
const ATTEMPTS = 3;
const CACHE_PREFIX = 'psgc:v1:';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface PsgcRegion {
  code: string;
  name: string;
  regionName: string;
}

export interface PsgcProvince {
  code: string;
  name: string;
  regionCode: string;
}

export interface PsgcCity {
  code: string;
  name: string;
  isCity: boolean;
  isMunicipality: boolean;
  // `false` (not undefined) for NCR cities, which belong to no province.
  provinceCode: string | false;
  regionCode: string;
}

export interface PsgcBarangay {
  code: string;
  name: string;
}

// The 17 regions are fixed by law and only their display names ever differ
// between datasets, so these stand in if (and only if) /regions/ can't be
// reached - the one list a form can't start without. Everything below region
// level has no fallback here; it degrades to manual typing instead.
const FALLBACK_REGIONS: PsgcRegion[] = [
  { code: '130000000', name: 'NCR', regionName: 'National Capital Region' },
  { code: '140000000', name: 'CAR', regionName: 'Cordillera Administrative Region' },
  { code: '010000000', name: 'Ilocos Region', regionName: 'Region I' },
  { code: '020000000', name: 'Cagayan Valley', regionName: 'Region II' },
  { code: '030000000', name: 'Central Luzon', regionName: 'Region III' },
  { code: '040000000', name: 'CALABARZON', regionName: 'Region IV-A' },
  { code: '170000000', name: 'MIMAROPA Region', regionName: 'MIMAROPA Region' },
  { code: '050000000', name: 'Bicol Region', regionName: 'Region V' },
  { code: '060000000', name: 'Western Visayas', regionName: 'Region VI' },
  { code: '070000000', name: 'Central Visayas', regionName: 'Region VII' },
  { code: '080000000', name: 'Eastern Visayas', regionName: 'Region VIII' },
  { code: '090000000', name: 'Zamboanga Peninsula', regionName: 'Region IX' },
  { code: '100000000', name: 'Northern Mindanao', regionName: 'Region X' },
  { code: '110000000', name: 'Davao Region', regionName: 'Region XI' },
  { code: '120000000', name: 'SOCCSKSARGEN', regionName: 'Region XII' },
  { code: '160000000', name: 'Caraga', regionName: 'Region XIII' },
  { code: '150000000', name: 'BARMM', regionName: 'Bangsamoro Autonomous Region in Muslim Mindanao' },
];

const memory = new Map<string, Promise<unknown>>();

function readStored<T>(path: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + path);
    if (!raw) return null;
    const { t, d } = JSON.parse(raw) as { t: number; d: T };
    return Date.now() - t < CACHE_TTL_MS ? d : null;
  } catch {
    return null;
  }
}

function writeStored(path: string, data: unknown) {
  try {
    localStorage.setItem(CACHE_PREFIX + path, JSON.stringify({ t: Date.now(), d: data }));
  } catch {
    // Quota exceeded or storage disabled - the in-memory cache still works.
  }
}

function get<T>(path: string): Promise<T> {
  const inMemory = memory.get(path);
  if (inMemory) return inMemory as Promise<T>;

  const stored = readStored<T>(path);
  if (stored) {
    const resolved = Promise.resolve(stored);
    memory.set(path, resolved);
    return resolved;
  }

  const request = (async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      try {
        const res = await fetch(`${BASE}/${path}${attempt > 0 ? `?r=${attempt}` : ''}`, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`PSGC responded ${res.status} for ${path}`);
        const data = (await res.json()) as T;
        writeStored(path, data);
        return data;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  })();

  memory.set(path, request);
  // A failure must not be cached, or one bad moment would break the form
  // until a full page reload.
  request.catch(() => memory.delete(path));
  return request;
}

const byName = <T extends { name: string }>(a: T, b: T) =>
  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

// Stored/displayed region text, e.g. "NCR - National Capital Region" or
// "Region I - Ilocos Region": the short code (NCR, CAR, Region IV-A) first,
// matching what applications saved before this API was wired in already hold.
export function regionLabel(region: PsgcRegion): string {
  if (region.name === region.regionName) return region.name;
  // "Region IV-A" is the code for CALABARZON, "NCR" the code for National
  // Capital Region - whichever of the two is the short code leads.
  return /^Region /i.test(region.regionName) || region.name.length > region.regionName.length
    ? `${region.regionName} - ${region.name}`
    : `${region.name} - ${region.regionName}`;
}

export async function getRegions(): Promise<PsgcRegion[]> {
  try {
    const regions = await get<PsgcRegion[]>('regions/');
    return regions.length ? regions : FALLBACK_REGIONS;
  } catch {
    return FALLBACK_REGIONS;
  }
}

// All provinces at once (~80 rows) - cheaper than one request per region, and
// it also tells the caller whether a region has provinces at all (NCR has none).
export async function getProvinces(): Promise<PsgcProvince[]> {
  return [...(await get<PsgcProvince[]>('provinces/'))].sort(byName);
}

// Cities and municipalities of a province, or - for a region with no provinces
// (NCR) - of the region directly.
export async function getCities(regionCode: string, provinceCode?: string): Promise<PsgcCity[]> {
  if (provinceCode) {
    try {
      return [...(await get<PsgcCity[]>(`provinces/${provinceCode}/cities-municipalities/`))].sort(byName);
    } catch {
      // Fall through to the region-wide list, narrowed client-side.
      const all = await get<PsgcCity[]>(`regions/${regionCode}/cities-municipalities/`);
      return all.filter((c) => c.provinceCode === provinceCode).sort(byName);
    }
  }
  return [...(await get<PsgcCity[]>(`regions/${regionCode}/cities-municipalities/`))].sort(byName);
}

export async function getBarangays(cityCode: string): Promise<PsgcBarangay[]> {
  return [...(await get<PsgcBarangay[]>(`cities-municipalities/${cityCode}/barangays/`))].sort(byName);
}
