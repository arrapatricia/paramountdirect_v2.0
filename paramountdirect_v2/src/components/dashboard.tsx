import React, { useState } from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';

// Monthly premium sales, PHP. 2025 is the prior year's actual full-year figures
// (this system has no history of its own yet, so last year's numbers are the
// only comparison baseline we have). 2026 is year-to-date — September is
// still in progress, and Oct/Nov/Dec haven't happened, so they're left null
// rather than faked.
const MONTHLY_SALES: { month: string; y2025: number; y2026: number | null }[] = [
  { month: 'Jan', y2025: 152340, y2026: 168900 },
  { month: 'Feb', y2025: 148900, y2026: 159400 },
  { month: 'Mar', y2025: 161200, y2026: 177800 },
  { month: 'Apr', y2025: 158700, y2026: 181300 },
  { month: 'May', y2025: 167300, y2026: 189600 },
  { month: 'Jun', y2025: 172400, y2026: 198200 },
  { month: 'Jul', y2025: 165900, y2026: 191500 },
  { month: 'Aug', y2025: 178600, y2026: 205300 },
  { month: 'Sep', y2025: 181200, y2026: 96400 }, // month-to-date
  { month: 'Oct', y2025: 186500, y2026: null },
  { month: 'Nov', y2025: 193800, y2026: null },
  { month: 'Dec', y2025: 208900, y2026: null },
];
const CURRENT_MONTH_INDEX = 8; // September — the last index with a (partial) 2026 value

// Where issued applications came from, by year. Same underlying numbers as
// the Marketing Dashboard's source performance table (2026: Google 1,840,
// Facebook 715, Email 588, ML 312, Non-Life 96, Direct 22 = 3,573 total),
// so the two pages agree with each other.
const ACQUISITION_BY_YEAR: Record<string, { label: string; applications: number; color: string }[]> = {
  '2026': [
    { label: 'Google', applications: 1840, color: '#d0112b' },
    { label: 'Facebook', applications: 715, color: '#008cb4' },
    { label: 'Email', applications: 588, color: '#f59e0b' },
    { label: 'ML', applications: 312, color: '#8b5cf6' },
    { label: 'Direct', applications: 22, color: '#64748b' },
    { label: 'Non-Life', applications: 96, color: '#10b981' },
  ],
  '2025': [
    { label: 'Google', applications: 1390, color: '#d0112b' },
    { label: 'Facebook', applications: 570, color: '#008cb4' },
    { label: 'Email', applications: 510, color: '#f59e0b' },
    { label: 'ML', applications: 270, color: '#8b5cf6' },
    { label: 'Direct', applications: 190, color: '#64748b' },
    { label: 'Non-Life', applications: 90, color: '#10b981' },
  ],
};

const YTD_APPLICATIONS = { y2025: 3020, y2026: 3573 };
const YTD_ISSUED = { y2025: 1890, y2026: 2340 };
const ANNUAL_TARGET = 2_200_000;

function buildConicGradient(sources: { applications: number; color: string }[]) {
  const total = sources.reduce((sum, s) => sum + s.applications, 0);
  let cumulative = 0;
  const stops = sources.map((s) => {
    const start = (cumulative / total) * 360;
    cumulative += s.applications;
    const end = (cumulative / total) * 360;
    return `${s.color} ${start}deg ${end}deg`;
  });
  return { gradient: `conic-gradient(${stops.join(', ')})`, total };
}

const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;

const FULL_MONTH_NAME: Record<string, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
  Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
};

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState<'2026' | '2025'>('2026');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  const completeMonths2025 = MONTHLY_SALES.slice(0, CURRENT_MONTH_INDEX).reduce((s, m) => s + m.y2025, 0);
  const completeMonths2026 = MONTHLY_SALES.slice(0, CURRENT_MONTH_INDEX).reduce((s, m) => s + (m.y2026 ?? 0), 0);
  const premiumYtd2026 = MONTHLY_SALES.reduce((s, m) => s + (m.y2026 ?? 0), 0);
  const premiumYoyPct = ((completeMonths2026 - completeMonths2025) / completeMonths2025) * 100;

  const attainmentPct = Math.min(100, Math.round((premiumYtd2026 / ANNUAL_TARGET) * 100));

  const applicationsYoyPct = ((YTD_APPLICATIONS.y2026 - YTD_APPLICATIONS.y2025) / YTD_APPLICATIONS.y2025) * 100;
  const issuedYoyPct = ((YTD_ISSUED.y2026 - YTD_ISSUED.y2025) / YTD_ISSUED.y2025) * 100;
  const conversion2026 = (YTD_ISSUED.y2026 / YTD_APPLICATIONS.y2026) * 100;
  const conversion2025 = (YTD_ISSUED.y2025 / YTD_APPLICATIONS.y2025) * 100;
  const conversionDeltaPts = conversion2026 - conversion2025;

  const acquisition = ACQUISITION_BY_YEAR[selectedYear];
  const { gradient, total: acquisitionTotal } = buildConicGradient(acquisition);

  const maxMonthly = Math.max(...MONTHLY_SALES.flatMap((m) => [m.y2025, m.y2026 ?? 0]));

  // "Strongest month" = highest absolute sales, not highest growth rate —
  // those can be different months, so we compute the growth % for whichever
  // month actually had the peak sales, rather than pulling it from a
  // separately-chosen "best growth" month.
  const peakMonth = MONTHLY_SALES.slice(0, CURRENT_MONTH_INDEX).reduce((best, m) =>
    (m.y2026 ?? 0) > (best.y2026 ?? 0) ? m : best
  );
  const peakMonthGrowthPct = Math.round((((peakMonth.y2026 ?? 0) - peakMonth.y2025) / peakMonth.y2025) * 100);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto font-sans text-slate-900 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 font-['Montserrat']">
          SALES PERFORMANCE
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Year-to-date results across Health, Life &amp; Accident, and Comprehensive — compared against last year, since this is our first full year on the new system.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Total Premium Sales (YTD)</h3>
          <p className="text-xl font-black text-[#d0112b]">{peso(premiumYtd2026)}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">+{premiumYoyPct.toFixed(1)}%</span>
            <span className="text-slate-400">YoY (Jan&ndash;Aug vs 2025)</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Annual Sales Target</h3>
          <div className="flex items-baseline space-x-1.5">
            <p className="text-xl font-black text-slate-900">{peso(premiumYtd2026)}</p>
            <span className="text-xs font-bold text-slate-400">/ {peso(ANNUAL_TARGET)}</span>
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

        {/* Left: Customer Acquisition Donut */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase">Where Our Customers Come From</h2>
              <p className="text-xs text-slate-500 font-medium">Applications by acquisition source</p>
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
            <div className="relative w-48 h-48 rounded-full" style={{ background: gradient }}>
              <div className="absolute inset-[16px] rounded-full bg-white flex items-center justify-center">
                <div className="text-center">
                  <span className="block text-2xl font-black text-slate-900">{acquisitionTotal.toLocaleString()}</span>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Applications</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-8">
            {acquisition.map((item) => (
              <div key={item.label} className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-slate-600">{item.label}</span>
                <span className="text-xs font-black text-slate-400 ml-auto">
                  {((item.applications / acquisitionTotal) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Year-over-Year Premium Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase">Premium Sales — This Year vs Last Year</h2>
              <p className="text-xs text-slate-500 font-medium">Monthly totals, 2026 vs 2025</p>
            </div>
            <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-500">
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /><span>2025</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#d0112b]" /><span>2026</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#d0112b] opacity-40" /><span>2026 (MTD)</span></span>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between px-2 pb-2 mt-6 space-x-2 min-h-[180px]">
            {MONTHLY_SALES.map((m, i) => (
              <div key={m.month} className="flex flex-col items-center flex-1 h-full justify-end space-y-2">
                <div className="flex items-end space-x-1 w-full justify-center h-full">
                  <div
                    className="w-full max-w-[10px] rounded-t bg-slate-300"
                    style={{ height: `${(m.y2025 / maxMonthly) * 100}%` }}
                    title={`2025: ${peso(m.y2025)}`}
                  />
                  {m.y2026 !== null && (
                    <div
                      className={`w-full max-w-[10px] rounded-t bg-[#d0112b] ${i === CURRENT_MONTH_INDEX ? 'opacity-40' : ''}`}
                      style={{ height: `${(m.y2026 / maxMonthly) * 100}%` }}
                      title={`2026: ${peso(m.y2026)}${i === CURRENT_MONTH_INDEX ? ' (month-to-date)' : ''}`}
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
              {FULL_MONTH_NAME[peakMonth.month]} was our strongest month this year — {peso(peakMonth.y2026 ?? 0)}, up {peakMonthGrowthPct}% from {FULL_MONTH_NAME[peakMonth.month]} last year.
              {' '}{FULL_MONTH_NAME[MONTHLY_SALES[CURRENT_MONTH_INDEX].month]} is tracking at {peso(MONTHLY_SALES[CURRENT_MONTH_INDEX].y2026 ?? 0)} so far, month-to-date.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
