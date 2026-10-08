import { useEffect, useState } from 'react';
import {
  getBarangays,
  getCities,
  getProvinces,
  getRegions,
  regionLabel,
  type PsgcBarangay,
  type PsgcCity,
  type PsgcProvince,
  type PsgcRegion,
} from '../lib/psgc';

// Region -> Province -> City/Municipality -> Barangay pickers backed by the
// PSGC API (lib/psgc.ts), shared by every product's address form. Renders its
// fields as bare grid cells (a fragment), so each form keeps its own layout.
//
// Values are plain names, not PSGC codes - that's what every application
// already stores, so edit forms holding an older saved address still render:
// the component resolves codes from the names itself, and a saved value the
// current dataset doesn't contain (e.g. an old "Makati City" vs PSGC's
// "City of Makati") stays selectable instead of silently vanishing.
//
// If PSGC can't be reached, the affected level degrades to a plain text box
// with a notice - an outage must never make the form un-submittable.

export interface PhAddressValue {
  region: string;
  province: string;
  city: string;
  barangay: string;
}

export const EMPTY_PH_ADDRESS: PhAddressValue = { region: '', province: '', city: '', barangay: '' };

interface Props {
  value: PhAddressValue;
  onChange: (next: PhAddressValue) => void;
  inputClass: string;
  labelClass: string;
  required?: boolean;
  // Domestic-trip destinations only need down to the city.
  showBarangay?: boolean;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function withCurrent(names: { key: string; name: string }[], current: string) {
  const known = !current || names.some((n) => n.name === current);
  return known ? names : [{ key: '__current', name: current }, ...names];
}

export default function PhAddressFields({
  value,
  onChange,
  inputClass,
  labelClass,
  required = false,
  showBarangay = true,
}: Props) {
  const [regions, setRegions] = useState<PsgcRegion[]>([]);
  const [provinces, setProvinces] = useState<PsgcProvince[]>([]);
  const [provinceStatus, setProvinceStatus] = useState<Status>('loading');
  const [cities, setCities] = useState<PsgcCity[]>([]);
  const [cityStatus, setCityStatus] = useState<Status>('idle');
  const [barangays, setBarangays] = useState<PsgcBarangay[]>([]);
  const [barangayStatus, setBarangayStatus] = useState<Status>('idle');

  useEffect(() => {
    let cancelled = false;
    getRegions().then((r) => !cancelled && setRegions(r));
    getProvinces()
      .then((p) => {
        if (cancelled) return;
        setProvinces(p);
        setProvinceStatus('ready');
      })
      .catch(() => !cancelled && setProvinceStatus('error'));
    return () => {
      cancelled = true;
    };
  }, []);

  const region = regions.find((r) => sameText(regionLabel(r), value.region));
  const regionCode = region?.code;
  const regionProvinces = regionCode ? provinces.filter((p) => p.regionCode === regionCode) : [];
  // NCR has no provinces; for every other region the province narrows the
  // city list from ~100 rows to ~20.
  const needProvince = provinceStatus === 'ready' && regionProvinces.length > 0;
  const province = needProvince ? regionProvinces.find((p) => sameText(p.name, value.province)) : undefined;
  const provinceCode = province?.code;
  const hasCity = Boolean(value.city);

  useEffect(() => {
    if (!regionCode || provinceStatus === 'loading') {
      setCities([]);
      setCityStatus('idle');
      return;
    }
    // Province not chosen yet and no saved city to resolve: nothing to list.
    if (needProvince && !provinceCode && !hasCity) {
      setCities([]);
      setCityStatus('idle');
      return;
    }
    let cancelled = false;
    setCityStatus('loading');
    getCities(regionCode, needProvince ? provinceCode : undefined)
      .then((list) => {
        if (cancelled) return;
        setCities(list);
        setCityStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setCities([]);
        setCityStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [regionCode, provinceCode, needProvince, provinceStatus, hasCity]);

  // A saved address with a city but no province (older records, or one of the
  // forms that doesn't persist province): work the province out from the city.
  useEffect(() => {
    if (!needProvince || value.province || !value.city || cities.length === 0) return;
    const match = cities.find((c) => sameText(c.name, value.city));
    const owner = match && match.provinceCode ? provinces.find((p) => p.code === match.provinceCode) : undefined;
    if (owner) onChange({ ...value, province: owner.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, needProvince]);

  const city = cities.find((c) => sameText(c.name, value.city));
  const cityCode = city?.code;

  useEffect(() => {
    if (!showBarangay || !cityCode) {
      setBarangays([]);
      setBarangayStatus('idle');
      return;
    }
    let cancelled = false;
    setBarangayStatus('loading');
    getBarangays(cityCode)
      .then((list) => {
        if (cancelled) return;
        setBarangays(list);
        setBarangayStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setBarangays([]);
        setBarangayStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [cityCode, showBarangay]);

  const regionOptions = withCurrent(
    regions.map((r) => ({ key: r.code, name: regionLabel(r) })),
    value.region,
  );
  const provinceOptions = withCurrent(
    regionProvinces.map((p) => ({ key: p.code, name: p.name })),
    value.province,
  );
  const cityOptions = withCurrent(
    cities.map((c) => ({ key: c.code, name: c.name })),
    value.city,
  );
  const barangayOptions = withCurrent(
    barangays.map((b) => ({ key: b.code, name: b.name })),
    value.barangay,
  );

  const provinceManual = provinceStatus === 'error';
  const cityManual = cityStatus === 'error';
  // A saved city PSGC doesn't list can't be resolved to a code, so its
  // barangays can't be looked up either - fall back to typing.
  // A manually typed city has no PSGC code either.
  const barangayManual = barangayStatus === 'error' || cityManual || (hasCity && cityStatus === 'ready' && !city);
  const showProvince = needProvince || provinceManual || Boolean(value.province);
  const lookupFailed = provinceManual || cityManual || barangayStatus === 'error';

  const loadingOption = (loading: boolean, idle: string) => (
    <option value="">{loading ? 'Loading…' : idle}</option>
  );

  return (
    <>
      <div>
        <label className={labelClass}>Region</label>
        <select
          required={required}
          value={value.region}
          onChange={(e) => onChange({ region: e.target.value, province: '', city: '', barangay: '' })}
          className={inputClass}
        >
          {loadingOption(regions.length === 0, 'Select region')}
          {regionOptions.map((o) => (
            <option key={o.key} value={o.name}>{o.name}</option>
          ))}
        </select>
      </div>

      {showProvince && (
        <div>
          <label className={labelClass}>Province</label>
          {provinceManual ? (
            <input
              required={required}
              value={value.province}
              onChange={(e) => onChange({ ...value, province: e.target.value })}
              className={inputClass}
            />
          ) : (
            <select
              required={required}
              value={value.province}
              disabled={!region}
              onChange={(e) => onChange({ ...value, province: e.target.value, city: '', barangay: '' })}
              className={inputClass}
            >
              {loadingOption(false, region ? 'Select province' : 'Select region first')}
              {provinceOptions.map((o) => (
                <option key={o.key} value={o.name}>{o.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <div>
        <label className={labelClass}>City/Municipality</label>
        {cityManual ? (
          <input
            required={required}
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value, barangay: '' })}
            className={inputClass}
          />
        ) : (
          <select
            required={required}
            value={value.city}
            disabled={!region || (needProvince && !province && !hasCity)}
            onChange={(e) => onChange({ ...value, city: e.target.value, barangay: '' })}
            className={inputClass}
          >
            {loadingOption(
              cityStatus === 'loading',
              !region ? 'Select region first' : needProvince && !province ? 'Select province first' : 'Select city/municipality',
            )}
            {cityOptions.map((o) => (
              <option key={o.key} value={o.name}>{o.name}</option>
            ))}
          </select>
        )}
      </div>

      {showBarangay && (
        <div>
          <label className={labelClass}>Barangay</label>
          {barangayManual ? (
            <input
              required={required}
              value={value.barangay}
              onChange={(e) => onChange({ ...value, barangay: e.target.value })}
              className={inputClass}
            />
          ) : (
            <select
              required={required}
              value={value.barangay}
              disabled={!cityCode}
              onChange={(e) => onChange({ ...value, barangay: e.target.value })}
              className={inputClass}
            >
              {loadingOption(barangayStatus === 'loading', cityCode ? 'Select barangay' : 'Select city first')}
              {barangayOptions.map((o) => (
                <option key={o.key} value={o.name}>{o.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {lookupFailed && (
        <p className="col-span-full text-[11px] font-bold text-amber-600 dark:text-amber-400">
          The address lookup (PSGC) couldn&apos;t be reached - type the missing address parts manually.
        </p>
      )}
    </>
  );
}
