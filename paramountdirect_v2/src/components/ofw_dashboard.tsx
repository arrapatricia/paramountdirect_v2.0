import { useMemo, useState } from 'react';
import { ChevronDown, TrendingUp, ShieldAlert } from 'lucide-react';
import type { OfwApplication } from './ofw_types';
import { CURRENT_MONTH_INDEX, CURRENT_YEAR, buildMonthlyPremiumSeries, parseDateParts } from '../lib/dashboardStats';

interface OfwDashboardProps {
  data: OfwApplication[];
  annualTarget: number;
}

const usd = (n: number) => `$${n.toLocaleString('en-US')}`;
const safePct = (numerator: number, denominator: number) => (denominator === 0 ? 0 : (numerator / denominator) * 100);

const FULL_MONTH_NAME: Record<string, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
  Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
};

const EMPLOYMENT_LABELS: Record<OfwApplication['natureOfEmployment'], string> = {
  'Direct-hired': 'Direct-hired',
  'Balik-Manggagawa': 'Balik-Manggagawa (returning worker)',
};

export default function OfwDashboard({ data, annualTarget }: OfwDashboardProps) {
  const [selectedYear, setSelectedYear] = useState<'2026' | '2025'>('2026');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  const monthlyPremium = useMemo(
    () => buildMonthlyPremiumSeries(data, (r) => r.dateReceived, (r) => r.premium),
    [data]
  );

  const recordsByYear = useMemo(() => {
    const forYear = (year: number) => data.filter((r) => parseDateParts(r.dateReceived)?.year === year);
    return { 2026: forYear(CURRENT_YEAR), 2025: forYear(CURRENT_YEAR - 1) };
  }, [data]);

  const ytdApplications = { y2025: recordsByYear[2025].length, y2026: recordsByYear[2026].length };
  const ytdIssued = {
    y2025: recordsByYear[2025].filter((r) => r.isPaid).length,
    y2026: recordsByYear[2026].filter((r) => r.isPaid).length,
  };

  const completeMonths2025 = monthlyPremium.slice(0, CURRENT_MONTH_INDEX).reduce((s, m) => s + m.y2025, 0);
  const completeMonths2026 = monthlyPremium.slice(0, CURRENT_MONTH_INDEX).reduce((s, m) => s + (m.y2026 ?? 0), 0);
  const premiumYtd2026 = monthlyPremium.reduce((s, m) => s + (m.y2026 ?? 0), 0);
  const premiumYoyPct = safePct(completeMonths2026 - completeMonths2025, completeMonths2025);
  const attainmentPct = Math.min(100, Math.round(safePct(premiumYtd2026, annualTarget)));

  const applicationsYoyPct = safePct(ytdApplications.y2026 - ytdApplications.y2025, ytdApplications.y2025);
  const issuedYoyPct = safePct(ytdIssued.y2026 - ytdIssued.y2025, ytdIssued.y2025);
  const conversion2026 = safePct(ytdIssued.y2026, ytdApplications.y2026);
  const conversion2025 = safePct(ytdIssued.y2025, ytdApplications.y2025);
  const conversionDeltaPts = conversion2026 - conversion2025;

  const applicationsForYear = selectedYear === '2026' ? ytdApplications.y2026 : ytdApplications.y2025;

  const employmentNature = useMemo(() => {
    const records = selectedYear === '2026' ? recordsByYear[2026] : recordsByYear[2025];
    const counts: Record<OfwApplication['natureOfEmployment'], number> = { 'Direct-hired': 0, 'Balik-Manggagawa': 0 };
    for (const r of records) counts[r.natureOfEmployment]++;
    return (Object.keys(EMPLOYMENT_LABELS) as OfwApplication['natureOfEmployment'][]).map((key) => ({
      label: EMPLOYMENT_LABELS[key],
      count: counts[key],
    }));
  }, [recordsByYear, selectedYear]);
  const employmentTotal = employmentNature.reduce((s, e) => s + e.count, 0);

  const topCountries = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of recordsByYear[2026]) counts[r.employerCountry] = (counts[r.employerCountry] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([country, applications]) => ({ country, applications }));
  }, [recordsByYear]);
  const maxCountryApplications = Math.max(1, ...topCountries.map((c) => c.applications));

  const conflictZoneAcknowledgmentsYtd = recordsByYear[2026].filter((r) => r.isConflictZone).length;

  const maxMonthly = Math.max(1, ...monthlyPremium.flatMap((m) => [m.y2025, m.y2026 ?? 0]));
  const peakMonth = monthlyPremium.slice(0, CURRENT_MONTH_INDEX).reduce((best, m) =>
    (m.y2026 ?? 0) > (best.y2026 ?? 0) ? m : best,
    monthlyPremium[0]
  );
  const peakMonthGrowthPct = Math.round(safePct((peakMonth.y2026 ?? 0) - peakMonth.y2025, peakMonth.y2025));

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto font-sans text-slate-900 dark:text-slate-100 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 font-['Montserrat'] dark:text-white">
          OFW INSURANCE PERFORMANCE
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1 dark:text-slate-500">
          Year-to-date results for OFW Compulsory Insurance (ofwinsurance.ph) — compared against last year, since this is the first year OFW has its own dashboard on the new system.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 dark:text-slate-500">Total Premium Collected (YTD)</h3>
          <p className="text-xl font-black text-[#002f6c] dark:text-[#49b1ea]">{usd(premiumYtd2026)}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">+{premiumYoyPct.toFixed(1)}%</span>
            <span className="text-slate-400 dark:text-slate-500">YoY (Jan&ndash;Aug vs 2025)</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 dark:text-slate-500">Annual Premium Target</h3>
          <div className="flex items-baseline space-x-1.5">
            <p className="text-xl font-black text-slate-900 dark:text-white">{usd(premiumYtd2026)}</p>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">/ {usd(annualTarget)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-3 dark:bg-slate-800">
            <div className="h-full rounded-full bg-[#002f6c] dark:bg-[#49b1ea]" style={{ width: `${attainmentPct}%` }} />
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-2 dark:text-slate-500">{attainmentPct}% of target attained &middot; 8.5 of 12 months in</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 dark:text-slate-500">New Applications (YTD)</h3>
          <p className="text-xl font-black text-slate-900 dark:text-white">{ytdApplications.y2026.toLocaleString()}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">+{applicationsYoyPct.toFixed(1)}%</span>
            <span className="text-slate-400 dark:text-slate-500">YoY vs {ytdApplications.y2025.toLocaleString()} last year</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 dark:text-slate-500">Policies Issued (YTD)</h3>
          <p className="text-xl font-black text-slate-900 dark:text-white">{ytdIssued.y2026.toLocaleString()}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">+{issuedYoyPct.toFixed(1)}%</span>
            <span className="text-slate-400 dark:text-slate-500">YoY</span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-1.5 dark:text-slate-500">
            {conversion2026.toFixed(1)}% of applications convert
            <span className="text-emerald-500 font-bold"> (+{conversionDeltaPts.toFixed(1)} pts YoY)</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Coverage Type */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <div className="flex justify-between items-start mb-6 flex-wrap gap-y-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase dark:text-white">Coverage Type</h2>
              <p className="text-xs text-slate-500 font-medium dark:text-slate-500">Paramount Direct only offers the land-based package</p>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="px-4 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-2 hover:bg-slate-50 transition-colors cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span>{selectedYear}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isYearDropdownOpen && (
                <div className="absolute right-0 mt-2 w-28 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 py-2 animate-fadeIn dark:bg-slate-800 dark:border-slate-700">
                  {(['2026', '2025'] as const).map((year) => (
                    <button
                      key={year}
                      onClick={() => { setSelectedYear(year); setIsYearDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#002f6c] dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-[#49b1ea]"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 rounded-full bg-[#002f6c] dark:bg-[#49b1ea] flex items-center justify-center">
              <div className="absolute inset-[16px] rounded-full bg-white flex items-center justify-center dark:bg-slate-900">
                <div className="text-center">
                  <span className="block text-2xl font-black text-slate-900 dark:text-white">{applicationsForYear.toLocaleString()}</span>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider dark:text-slate-500">Applications</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-8">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#002f6c] dark:bg-[#49b1ea]" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Land-based</span>
              <span className="text-xs font-black text-slate-400 ml-auto dark:text-slate-500">100%</span>
            </div>
          </div>
        </div>

        {/* Right: Year-over-Year Premium Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <div className="flex justify-between items-center mb-2 flex-wrap gap-y-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase dark:text-white">Premium Collected — This Year vs Last Year</h2>
              <p className="text-xs text-slate-500 font-medium dark:text-slate-500">Monthly totals in USD, 2026 vs 2025</p>
            </div>
            <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-500 flex-wrap gap-y-1 dark:text-slate-500">
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /><span>2025</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#002f6c] dark:bg-[#49b1ea]" /><span>2026</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#002f6c] dark:bg-[#49b1ea] opacity-40" /><span>2026 (MTD)</span></span>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between px-2 pb-2 mt-6 space-x-2 min-h-[180px]">
            {monthlyPremium.map((m, i) => (
              <div key={m.month} className="flex flex-col items-center flex-1 h-full justify-end space-y-2">
                <div className="flex items-end space-x-1 w-full justify-center h-full">
                  <div
                    className="w-full max-w-[10px] rounded-t bg-slate-300"
                    style={{ height: `${(m.y2025 / maxMonthly) * 100}%` }}
                    title={`2025: ${usd(m.y2025)}`}
                  />
                  {m.y2026 !== null && (
                    <div
                      className={`w-full max-w-[10px] rounded-t bg-[#002f6c] dark:bg-[#49b1ea] ${i === CURRENT_MONTH_INDEX ? 'opacity-40' : ''}`}
                      style={{ height: `${(m.y2026 / maxMonthly) * 100}%` }}
                      title={`2026: ${usd(m.y2026)}${i === CURRENT_MONTH_INDEX ? ' (month-to-date)' : ''}`}
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-start space-x-2 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="font-semibold">
              {FULL_MONTH_NAME[peakMonth.month]} was our strongest month this year — {usd(peakMonth.y2026 ?? 0)}, up {peakMonthGrowthPct}% from {FULL_MONTH_NAME[peakMonth.month]} last year.
              {' '}{FULL_MONTH_NAME[monthlyPremium[CURRENT_MONTH_INDEX].month]} is tracking at {usd(monthlyPremium[CURRENT_MONTH_INDEX].y2026 ?? 0)} so far, month-to-date.
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Nature of Employment */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1 dark:text-white">Nature of Employment</h2>
          <p className="text-xs text-slate-500 font-medium mb-5 dark:text-slate-500">Direct-hired vs. Balik-Manggagawa ({selectedYear})</p>

          <div className="space-y-4">
            {employmentNature.map((e) => (
              <div key={e.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{e.label}</span>
                  <span className="font-black text-slate-900 dark:text-white">{e.count.toLocaleString()} <span className="text-slate-400 font-semibold dark:text-slate-500">({safePct(e.count, employmentTotal).toFixed(0)}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                  <div className="h-full rounded-full bg-[#49b1ea]" style={{ width: `${safePct(e.count, employmentTotal)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-start space-x-2 dark:border-slate-800">
            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {conflictZoneAcknowledgmentsYtd} applications this year required the conflict-zone advisory acknowledgment before proceeding.
            </p>
          </div>
        </div>

        {/* Top Countries of Employment */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1 dark:text-white">Top Countries of Employment</h2>
          <p className="text-xs text-slate-500 font-medium mb-5 dark:text-slate-500">Applications by foreign employer's country, 2026 YTD</p>

          {topCountries.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">No applications yet</p>
          ) : (
            <div className="space-y-4">
              {topCountries.map((c) => (
                <div key={c.country}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{c.country}</span>
                    <span className="font-black text-slate-900 dark:text-white">{c.applications.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                    <div className="h-full rounded-full bg-[#002f6c] dark:bg-[#49b1ea]" style={{ width: `${(c.applications / maxCountryApplications) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
