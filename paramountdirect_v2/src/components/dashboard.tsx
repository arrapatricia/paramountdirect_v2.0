import { useMemo, useState } from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import type { ScreeningItem } from '../App';
import { CURRENT_MONTH_INDEX, CURRENT_YEAR, buildMonthlyPremiumSeries, countByField, parseDateParts } from '../lib/dashboardStats';

interface DashboardProps {
  data: ScreeningItem[];
}

const ANNUAL_TARGET = 2_200_000;

// Fixed color per acquisition source, so the donut's palette stays stable
// as real sources show up (falls back to slate for anything unlisted).
const SOURCE_COLORS: Record<string, string> = {
  Google: '#d0112b',
  Facebook: '#008cb4',
  Email: '#f59e0b',
  ML: '#8b5cf6',
  Direct: '#64748b',
  'Non-Life': '#10b981',
  'Paramount Website': '#d0112b',
};
const FALLBACK_SOURCE_COLORS = ['#0ea5e9', '#f97316', '#a855f7', '#14b8a6', '#eab308'];

function buildConicGradient(sources: { applications: number; color: string }[]) {
  const total = sources.reduce((sum, s) => sum + s.applications, 0);
  if (total === 0) {
    return { gradient: '#e2e8f0', total };
  }
  let cumulative = 0;
  const stops = sources.map((s) => {
    const start = (cumulative / total) * 360;
    cumulative += s.applications;
    const end = (cumulative / total) * 360;
    return `${s.color} ${start}deg ${end}deg`;
  });
  return { gradient: `conic-gradient(${stops.join(', ')})`, total };
}

const safePct = (numerator: number, denominator: number) => (denominator === 0 ? 0 : (numerator / denominator) * 100);

const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;

const FULL_MONTH_NAME: Record<string, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
  Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
};

export default function Dashboard({ data }: DashboardProps) {
  const [selectedYear, setSelectedYear] = useState<'2026' | '2025'>('2026');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  const monthlySales = useMemo(
    () => buildMonthlyPremiumSeries(data, (r) => r.dateReceived, (r) => r.premium),
    [data]
  );

  const acquisitionByYear = useMemo(() => {
    const build = (year: number) => {
      const records = data.filter((r) => parseDateParts(r.dateReceived)?.year === year);
      const counts = countByField(records, (r) => r.source || 'Unknown');
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([label, applications], i) => ({
          label,
          applications,
          color: SOURCE_COLORS[label] ?? FALLBACK_SOURCE_COLORS[i % FALLBACK_SOURCE_COLORS.length],
        }));
    };
    return { '2026': build(CURRENT_YEAR), '2025': build(CURRENT_YEAR - 1) };
  }, [data]);

  const { applications: ytdApplications, issued: ytdIssued } = useMemo(() => {
    const countYear = (year: number) => data.filter((r) => parseDateParts(r.dateReceived)?.year === year);
    const curr = countYear(CURRENT_YEAR);
    const prev = countYear(CURRENT_YEAR - 1);
    return {
      applications: { y2025: prev.length, y2026: curr.length },
      issued: {
        y2025: prev.filter((r) => r.status === 'Issued').length,
        y2026: curr.filter((r) => r.status === 'Issued').length,
      },
    };
  }, [data]);

  const completeMonths2025 = monthlySales.slice(0, CURRENT_MONTH_INDEX).reduce((s, m) => s + m.y2025, 0);
  const completeMonths2026 = monthlySales.slice(0, CURRENT_MONTH_INDEX).reduce((s, m) => s + (m.y2026 ?? 0), 0);
  const premiumYtd2026 = monthlySales.reduce((s, m) => s + (m.y2026 ?? 0), 0);
  const premiumYoyPct = safePct(completeMonths2026 - completeMonths2025, completeMonths2025);

  const attainmentPct = Math.min(100, Math.round(safePct(premiumYtd2026, ANNUAL_TARGET)));

  const applicationsYoyPct = safePct(ytdApplications.y2026 - ytdApplications.y2025, ytdApplications.y2025);
  const issuedYoyPct = safePct(ytdIssued.y2026 - ytdIssued.y2025, ytdIssued.y2025);
  const conversion2026 = safePct(ytdIssued.y2026, ytdApplications.y2026);
  const conversion2025 = safePct(ytdIssued.y2025, ytdApplications.y2025);
  const conversionDeltaPts = conversion2026 - conversion2025;

  const acquisition = acquisitionByYear[selectedYear];
  const { gradient, total: acquisitionTotal } = buildConicGradient(acquisition);

  const maxMonthly = Math.max(1, ...monthlySales.flatMap((m) => [m.y2025, m.y2026 ?? 0]));

  // "Strongest month" = highest absolute sales, not highest growth rate —
  // those can be different months, so we compute the growth % for whichever
  // month actually had the peak sales, rather than pulling it from a
  // separately-chosen "best growth" month.
  const peakMonth = monthlySales.slice(0, CURRENT_MONTH_INDEX).reduce((best, m) =>
    (m.y2026 ?? 0) > (best.y2026 ?? 0) ? m : best,
    monthlySales[0]
  );
  const peakMonthGrowthPct = Math.round(safePct((peakMonth.y2026 ?? 0) - peakMonth.y2025, peakMonth.y2025));

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto font-sans text-slate-900 dark:text-slate-100 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 font-['Montserrat'] dark:text-white">
          SALES PERFORMANCE
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1 dark:text-slate-500">
          Year-to-date results across Health, Life &amp; Accident, and Comprehensive — compared against last year, since this is our first full year on the new system.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 dark:text-slate-500">Total Premium Sales (YTD)</h3>
          <p className="text-xl font-black text-[#d0112b]">{peso(premiumYtd2026)}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">+{premiumYoyPct.toFixed(1)}%</span>
            <span className="text-slate-400 dark:text-slate-500">YoY (Jan&ndash;Aug vs 2025)</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 dark:text-slate-500">Annual Sales Target</h3>
          <div className="flex items-baseline space-x-1.5">
            <p className="text-xl font-black text-slate-900 dark:text-white">{peso(premiumYtd2026)}</p>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">/ {peso(ANNUAL_TARGET)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-3 dark:bg-slate-800">
            <div className="h-full rounded-full bg-[#d0112b]" style={{ width: `${attainmentPct}%` }} />
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

        {/* Left: Customer Acquisition Donut */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <div className="flex flex-wrap justify-between items-start gap-y-2 mb-6">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase dark:text-slate-100">Where Our Customers Come From</h2>
              <p className="text-xs text-slate-500 font-medium dark:text-slate-400">Applications by acquisition source</p>
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
                <div className="absolute right-0 mt-2 w-28 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 py-2 animate-fadeIn dark:bg-slate-900 dark:border-slate-800">
                  {(['2026', '2025'] as const).map((year) => (
                    <button
                      key={year}
                      onClick={() => { setSelectedYear(year); setIsYearDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#d0112b] dark:text-slate-300 dark:hover:bg-slate-800"
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
              <div className="absolute inset-[16px] rounded-full bg-white flex items-center justify-center dark:bg-slate-900">
                <div className="text-center">
                  <span className="block text-2xl font-black text-slate-900 dark:text-white">{acquisitionTotal.toLocaleString()}</span>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider dark:text-slate-500">Applications</span>
                </div>
              </div>
            </div>
          </div>

          {acquisition.length === 0 ? (
            <p className="text-center text-xs font-semibold text-slate-400 mt-8 dark:text-slate-500">No applications yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-8">
              {acquisition.map((item) => (
                <div key={item.label} className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                  <span className="text-xs font-black text-slate-400 ml-auto dark:text-slate-500">
                    {safePct(item.applications, acquisitionTotal).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Year-over-Year Premium Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <div className="flex flex-wrap justify-between items-center gap-y-2 mb-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase dark:text-slate-100">Premium Sales — This Year vs Last Year</h2>
              <p className="text-xs text-slate-500 font-medium dark:text-slate-400">Monthly totals, 2026 vs 2025</p>
            </div>
            <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" /><span>2025</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#d0112b]" /><span>2026</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#d0112b] opacity-40" /><span>2026 (MTD)</span></span>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between px-2 pb-2 mt-6 space-x-2 min-h-[180px]">
            {monthlySales.map((m, i) => (
              <div key={m.month} className="flex flex-col items-center flex-1 h-full justify-end space-y-2">
                <div className="flex items-end space-x-1 w-full justify-center h-full">
                  <div
                    className="w-full max-w-[10px] rounded-t bg-slate-300 dark:bg-slate-600"
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
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{m.month}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-start space-x-2 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="font-semibold">
              {FULL_MONTH_NAME[peakMonth.month]} was our strongest month this year — {peso(peakMonth.y2026 ?? 0)}, up {peakMonthGrowthPct}% from {FULL_MONTH_NAME[peakMonth.month]} last year.
              {' '}{FULL_MONTH_NAME[monthlySales[CURRENT_MONTH_INDEX].month]} is tracking at {peso(monthlySales[CURRENT_MONTH_INDEX].y2026 ?? 0)} so far, month-to-date.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
