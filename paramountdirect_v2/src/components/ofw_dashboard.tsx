import React, { useState } from 'react';
import { ChevronDown, TrendingUp, ShieldAlert } from 'lucide-react';

// OFW premium is collected in USD, unlike PD Life's PHP - the live application
// form itself quotes "Premium: $..." per applicant.
const MONTHLY_PREMIUM: { month: string; y2025: number; y2026: number | null }[] = [
  { month: 'Jan', y2025: 8200, y2026: 9100 },
  { month: 'Feb', y2025: 7900, y2026: 8700 },
  { month: 'Mar', y2025: 8600, y2026: 9600 },
  { month: 'Apr', y2025: 8400, y2026: 9800 },
  { month: 'May', y2025: 8900, y2026: 10200 },
  { month: 'Jun', y2025: 9300, y2026: 10900 },
  { month: 'Jul', y2025: 8950, y2026: 10400 },
  { month: 'Aug', y2025: 9600, y2026: 11200 },
  { month: 'Sep', y2025: 9750, y2026: 5300 }, // month-to-date
  { month: 'Oct', y2025: 10050, y2026: null },
  { month: 'Nov', y2025: 10400, y2026: null },
  { month: 'Dec', y2025: 11100, y2026: null },
];
const CURRENT_MONTH_INDEX = 8; // September, partial

const ANNUAL_TARGET = 125_000;

const YTD_APPLICATIONS = { y2025: 1840, y2026: 2150 };
const YTD_ISSUED = { y2025: 1520, y2026: 1790 };

// Type of Package, as asked on the actual application form.
const COVERAGE_TYPE_BY_YEAR: Record<string, { label: string; count: number; color: string }[]> = {
  '2026': [
    { label: 'Land-based', count: 1720, color: '#d0112b' },
    { label: 'Sea-based', count: 430, color: '#008cb4' },
  ],
  '2025': [
    { label: 'Land-based', count: 1590, color: '#d0112b' },
    { label: 'Sea-based', count: 250, color: '#008cb4' },
  ],
};

// Nature of Employment, the other classification asked on the form.
const EMPLOYMENT_NATURE = {
  '2026': [
    { label: 'Direct-hired', count: 1310 },
    { label: 'Balik-Manggagawa (returning worker)', count: 840 },
  ],
  '2025': [
    { label: 'Direct-hired', count: 1180 },
    { label: 'Balik-Manggagawa (returning worker)', count: 660 },
  ],
};

const TOP_COUNTRIES = [
  { country: 'Saudi Arabia', applications: 480 },
  { country: 'United Arab Emirates', applications: 410 },
  { country: 'Qatar', applications: 310 },
  { country: 'Hong Kong', applications: 285 },
  { country: 'Singapore', applications: 240 },
  { country: 'Kuwait', applications: 195 },
];

const CONFLICT_ZONE_ACKNOWLEDGMENTS_YTD = 34;

const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

const FULL_MONTH_NAME: Record<string, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
  Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
};

export default function OfwDashboard() {
  const [selectedYear, setSelectedYear] = useState<'2026' | '2025'>('2026');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  const completeMonths2025 = MONTHLY_PREMIUM.slice(0, CURRENT_MONTH_INDEX).reduce((s, m) => s + m.y2025, 0);
  const completeMonths2026 = MONTHLY_PREMIUM.slice(0, CURRENT_MONTH_INDEX).reduce((s, m) => s + (m.y2026 ?? 0), 0);
  const premiumYtd2026 = MONTHLY_PREMIUM.reduce((s, m) => s + (m.y2026 ?? 0), 0);
  const premiumYoyPct = ((completeMonths2026 - completeMonths2025) / completeMonths2025) * 100;
  const attainmentPct = Math.min(100, Math.round((premiumYtd2026 / ANNUAL_TARGET) * 100));

  const applicationsYoyPct = ((YTD_APPLICATIONS.y2026 - YTD_APPLICATIONS.y2025) / YTD_APPLICATIONS.y2025) * 100;
  const issuedYoyPct = ((YTD_ISSUED.y2026 - YTD_ISSUED.y2025) / YTD_ISSUED.y2025) * 100;
  const conversion2026 = (YTD_ISSUED.y2026 / YTD_APPLICATIONS.y2026) * 100;
  const conversion2025 = (YTD_ISSUED.y2025 / YTD_APPLICATIONS.y2025) * 100;
  const conversionDeltaPts = conversion2026 - conversion2025;

  const coverageTypes = COVERAGE_TYPE_BY_YEAR[selectedYear];
  const coverageTotal = coverageTypes.reduce((s, c) => s + c.count, 0);
  let cumulative = 0;
  const coverageGradientStops = coverageTypes.map((c) => {
    const start = (cumulative / coverageTotal) * 360;
    cumulative += c.count;
    const end = (cumulative / coverageTotal) * 360;
    return `${c.color} ${start}deg ${end}deg`;
  });
  const coverageGradient = `conic-gradient(${coverageGradientStops.join(', ')})`;

  const employmentNature = EMPLOYMENT_NATURE[selectedYear];
  const employmentTotal = employmentNature.reduce((s, e) => s + e.count, 0);
  const maxCountryApplications = Math.max(...TOP_COUNTRIES.map((c) => c.applications));

  const maxMonthly = Math.max(...MONTHLY_PREMIUM.flatMap((m) => [m.y2025, m.y2026 ?? 0]));
  const peakMonth = MONTHLY_PREMIUM.slice(0, CURRENT_MONTH_INDEX).reduce((best, m) =>
    (m.y2026 ?? 0) > (best.y2026 ?? 0) ? m : best
  );
  const peakMonthGrowthPct = Math.round((((peakMonth.y2026 ?? 0) - peakMonth.y2025) / peakMonth.y2025) * 100);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto font-sans text-slate-900 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 font-['Montserrat']">
          OFW INSURANCE PERFORMANCE
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Year-to-date results for OFW Compulsory Insurance (ofwinsurance.ph) — compared against last year, since this is the first year OFW has its own dashboard on the new system.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Total Premium Collected (YTD)</h3>
          <p className="text-xl font-black text-[#d0112b]">{usd(premiumYtd2026)}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">+{premiumYoyPct.toFixed(1)}%</span>
            <span className="text-slate-400">YoY (Jan&ndash;Aug vs 2025)</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Annual Premium Target</h3>
          <div className="flex items-baseline space-x-1.5">
            <p className="text-xl font-black text-slate-900">{usd(premiumYtd2026)}</p>
            <span className="text-xs font-bold text-slate-400">/ {usd(ANNUAL_TARGET)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-3">
            <div className="h-full rounded-full bg-[#d0112b]" style={{ width: `${attainmentPct}%` }} />
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-2">{attainmentPct}% of target attained &middot; 8.5 of 12 months in</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">New Applications (YTD)</h3>
          <p className="text-xl font-black text-slate-900">{YTD_APPLICATIONS.y2026.toLocaleString()}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">+{applicationsYoyPct.toFixed(1)}%</span>
            <span className="text-slate-400">YoY vs {YTD_APPLICATIONS.y2025.toLocaleString()} last year</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Policies Issued (YTD)</h3>
          <p className="text-xl font-black text-slate-900">{YTD_ISSUED.y2026.toLocaleString()}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">+{issuedYoyPct.toFixed(1)}%</span>
            <span className="text-slate-400">YoY</span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-1.5">
            {conversion2026.toFixed(1)}% of applications convert
            <span className="text-emerald-500 font-bold"> (+{conversionDeltaPts.toFixed(1)} pts YoY)</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Coverage Type Donut */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase">Coverage Type</h2>
              <p className="text-xs text-slate-500 font-medium">Land-based vs. Sea-based applications</p>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="px-4 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-2 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>{selectedYear}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isYearDropdownOpen && (
                <div className="absolute right-0 mt-2 w-28 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 py-2 animate-fadeIn">
                  {(['2026', '2025'] as const).map((year) => (
                    <button
                      key={year}
                      onClick={() => { setSelectedYear(year); setIsYearDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#d0112b]"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 rounded-full" style={{ background: coverageGradient }}>
              <div className="absolute inset-[16px] rounded-full bg-white flex items-center justify-center">
                <div className="text-center">
                  <span className="block text-2xl font-black text-slate-900">{coverageTotal.toLocaleString()}</span>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Applications</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-8">
            {coverageTypes.map((item) => (
              <div key={item.label} className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-slate-600">{item.label}</span>
                <span className="text-xs font-black text-slate-400 ml-auto">
                  {item.count.toLocaleString()} &middot; {((item.count / coverageTotal) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Year-over-Year Premium Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase">Premium Collected — This Year vs Last Year</h2>
              <p className="text-xs text-slate-500 font-medium">Monthly totals in USD, 2026 vs 2025</p>
            </div>
            <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-500">
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /><span>2025</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#d0112b]" /><span>2026</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#d0112b] opacity-40" /><span>2026 (MTD)</span></span>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between px-2 pb-2 mt-6 space-x-2 min-h-[180px]">
            {MONTHLY_PREMIUM.map((m, i) => (
              <div key={m.month} className="flex flex-col items-center flex-1 h-full justify-end space-y-2">
                <div className="flex items-end space-x-1 w-full justify-center h-full">
                  <div
                    className="w-full max-w-[10px] rounded-t bg-slate-300"
                    style={{ height: `${(m.y2025 / maxMonthly) * 100}%` }}
                    title={`2025: ${usd(m.y2025)}`}
                  />
                  {m.y2026 !== null && (
                    <div
                      className={`w-full max-w-[10px] rounded-t bg-[#d0112b] ${i === CURRENT_MONTH_INDEX ? 'opacity-40' : ''}`}
                      style={{ height: `${(m.y2026 / maxMonthly) * 100}%` }}
                      title={`2026: ${usd(m.y2026)}${i === CURRENT_MONTH_INDEX ? ' (month-to-date)' : ''}`}
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-start space-x-2 text-xs text-slate-600">
            <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="font-semibold">
              {FULL_MONTH_NAME[peakMonth.month]} was our strongest month this year — {usd(peakMonth.y2026 ?? 0)}, up {peakMonthGrowthPct}% from {FULL_MONTH_NAME[peakMonth.month]} last year.
              {' '}{FULL_MONTH_NAME[MONTHLY_PREMIUM[CURRENT_MONTH_INDEX].month]} is tracking at {usd(MONTHLY_PREMIUM[CURRENT_MONTH_INDEX].y2026 ?? 0)} so far, month-to-date.
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Nature of Employment */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1">Nature of Employment</h2>
          <p className="text-xs text-slate-500 font-medium mb-5">Direct-hired vs. Balik-Manggagawa ({selectedYear})</p>

          <div className="space-y-4">
            {employmentNature.map((e) => (
              <div key={e.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">{e.label}</span>
                  <span className="font-black text-slate-900">{e.count.toLocaleString()} <span className="text-slate-400 font-semibold">({((e.count / employmentTotal) * 100).toFixed(0)}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#008cb4]" style={{ width: `${(e.count / employmentTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-slate-600">
              {CONFLICT_ZONE_ACKNOWLEDGMENTS_YTD} applications this year required the conflict-zone advisory acknowledgment before proceeding.
            </p>
          </div>
        </div>

        {/* Top Countries of Employment */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1">Top Countries of Employment</h2>
          <p className="text-xs text-slate-500 font-medium mb-5">Applications by foreign employer's country, 2026 YTD</p>

          <div className="space-y-4">
            {TOP_COUNTRIES.map((c) => (
              <div key={c.country}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">{c.country}</span>
                  <span className="font-black text-slate-900">{c.applications.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#d0112b]" style={{ width: `${(c.applications / maxCountryApplications) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
