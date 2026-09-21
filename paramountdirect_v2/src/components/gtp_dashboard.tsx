import { useMemo, useState } from 'react';
import { ChevronDown, TrendingUp, ShieldAlert } from 'lucide-react';
import type { GtpApplication } from './gtp_types';
import { CURRENT_MONTH_INDEX, CURRENT_YEAR, buildMonthlyPremiumSeries, parseDateParts } from '../lib/dashboardStats';

interface GtpDashboardProps {
  data: GtpApplication[];
  annualTarget: number;
}

const TRAVEL_TYPE_COLORS: Record<GtpApplication['travelType'], string> = {
  International: '#002f6c',
  Domestic: '#49b1ea',
};

const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;
const safePct = (numerator: number, denominator: number) => (denominator === 0 ? 0 : (numerator / denominator) * 100);

const FULL_MONTH_NAME: Record<string, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
  Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
};

export default function GtpDashboard({ data, annualTarget }: GtpDashboardProps) {
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

  const recordsForSelectedYear = selectedYear === '2026' ? recordsByYear[2026] : recordsByYear[2025];

  const travelTypes = useMemo(() => {
    const counts: Record<GtpApplication['travelType'], number> = { International: 0, Domestic: 0 };
    for (const r of recordsForSelectedYear) counts[r.travelType]++;
    return (Object.keys(TRAVEL_TYPE_COLORS) as GtpApplication['travelType'][]).map((label) => ({
      label,
      count: counts[label],
      color: TRAVEL_TYPE_COLORS[label],
    }));
  }, [recordsForSelectedYear]);
  const travelTotal = travelTypes.reduce((s, c) => s + c.count, 0);
  let cumulative = 0;
  const gradientStops = travelTypes.map((c) => {
    const start = safePct(cumulative, travelTotal) * 3.6;
    cumulative += c.count;
    const end = safePct(cumulative, travelTotal) * 3.6;
    return `${c.color} ${start}deg ${end}deg`;
  });
  const travelGradient = travelTotal === 0 ? '#e2e8f0' : `conic-gradient(${gradientStops.join(', ')})`;

  const applicationType = useMemo(() => {
    const counts: Record<GtpApplication['applicationType'], number> = { Individual: 0, Family: 0 };
    for (const r of recordsForSelectedYear) counts[r.applicationType]++;
    return (['Individual', 'Family'] as const).map((label) => ({ label, count: counts[label] }));
  }, [recordsForSelectedYear]);
  const applicationTypeTotal = applicationType.reduce((s, e) => s + e.count, 0);

  const topDestinations = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of recordsByYear[2026]) {
      for (const destination of r.destinations) counts[destination] = (counts[destination] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([country, applications]) => ({ country, applications }));
  }, [recordsByYear]);
  const maxDestinationApplications = Math.max(1, ...topDestinations.map((c) => c.applications));

  const cruiseAttachYtd = recordsByYear[2026].filter((r) => r.cruiseCoverage).length;
  const hazardousSportsAttachYtd = recordsByYear[2026].filter((r) => r.hazardousSportsCoverage).length;

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
          GTP PERFORMANCE
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1 dark:text-slate-500">
          Year-to-date results for Global Travel Protect Premium (yourtravelinsurance.ph) — compared against last year, since this is the first year GTP has its own dashboard on the new system.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 dark:text-slate-500">Total Premium Collected (YTD)</h3>
          <p className="text-xl font-black text-[#002f6c]">{peso(premiumYtd2026)}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">+{premiumYoyPct.toFixed(1)}%</span>
            <span className="text-slate-400 dark:text-slate-500">YoY (Jan&ndash;Aug vs 2025)</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 dark:text-slate-500">Annual Premium Target</h3>
          <div className="flex items-baseline space-x-1.5">
            <p className="text-xl font-black text-slate-900 dark:text-white">{peso(premiumYtd2026)}</p>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">/ {peso(annualTarget)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-3 dark:bg-slate-800">
            <div className="h-full rounded-full bg-[#002f6c]" style={{ width: `${attainmentPct}%` }} />
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

        {/* Left: Travel Type Donut */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <div className="flex flex-wrap justify-between items-start gap-y-2 mb-6">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase dark:text-white">Travel Type</h2>
              <p className="text-xs text-slate-500 font-medium dark:text-slate-500">International vs. Domestic applications</p>
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
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#002f6c] dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 rounded-full" style={{ background: travelGradient }}>
              <div className="absolute inset-[16px] rounded-full bg-white flex items-center justify-center dark:bg-slate-900">
                <div className="text-center">
                  <span className="block text-2xl font-black text-slate-900 dark:text-white">{travelTotal.toLocaleString()}</span>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider dark:text-slate-500">Applications</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-8">
            {travelTypes.map((item) => (
              <div key={item.label} className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                <span className="text-xs font-black text-slate-400 ml-auto dark:text-slate-500">
                  {item.count.toLocaleString()} &middot; {safePct(item.count, travelTotal).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Year-over-Year Premium Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase dark:text-white">Premium Collected — This Year vs Last Year</h2>
              <p className="text-xs text-slate-500 font-medium dark:text-slate-500">Monthly totals, 2026 vs 2025</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-500 dark:text-slate-500">
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /><span>2025</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#002f6c]" /><span>2026</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#002f6c] opacity-40" /><span>2026 (MTD)</span></span>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between px-2 pb-2 mt-6 space-x-2 min-h-[180px]">
            {monthlyPremium.map((m, i) => (
              <div key={m.month} className="flex flex-col items-center flex-1 h-full justify-end space-y-2">
                <div className="flex items-end space-x-1 w-full justify-center h-full">
                  <div
                    className="w-full max-w-[10px] rounded-t bg-slate-300"
                    style={{ height: `${(m.y2025 / maxMonthly) * 100}%` }}
                    title={`2025: ${peso(m.y2025)}`}
                  />
                  {m.y2026 !== null && (
                    <div
                      className={`w-full max-w-[10px] rounded-t bg-[#002f6c] ${i === CURRENT_MONTH_INDEX ? 'opacity-40' : ''}`}
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
              {FULL_MONTH_NAME[peakMonth.month]} was our strongest month this year — {peso(peakMonth.y2026 ?? 0)}, up {peakMonthGrowthPct}% from {FULL_MONTH_NAME[peakMonth.month]} last year, in line with the peak summer travel season.
              {' '}{FULL_MONTH_NAME[monthlyPremium[CURRENT_MONTH_INDEX].month]} is tracking at {peso(monthlyPremium[CURRENT_MONTH_INDEX].y2026 ?? 0)} so far, month-to-date.
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Application Type + Add-ons */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1 dark:text-white">Application Type</h2>
          <p className="text-xs text-slate-500 font-medium mb-5 dark:text-slate-500">Individual vs. Family ({selectedYear})</p>

          <div className="space-y-4">
            {applicationType.map((e) => (
              <div key={e.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{e.label}</span>
                  <span className="font-black text-slate-900 dark:text-white">{e.count.toLocaleString()} <span className="text-slate-400 font-semibold dark:text-slate-500">({safePct(e.count, applicationTypeTotal).toFixed(0)}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                  <div className="h-full rounded-full bg-[#49b1ea]" style={{ width: `${safePct(e.count, applicationTypeTotal)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Cruise Coverage attached (YTD)</span>
              <span className="font-black text-slate-900 dark:text-white">{cruiseAttachYtd}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Hazardous Sports Coverage attached (YTD)</span>
              <span className="font-black text-slate-900 dark:text-white">{hazardousSportsAttachYtd}</span>
            </div>
          </div>

          <div className="mt-4 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-500">
              Schengen destinations require €30,000 / ₱2.5M medical coverage compliance — flagged automatically during screening.
            </p>
          </div>
        </div>

        {/* Top Destinations */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1 dark:text-white">Top Destinations</h2>
          <p className="text-xs text-slate-500 font-medium mb-5 dark:text-slate-500">Applications by destination country, 2026 YTD</p>

          {topDestinations.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">No applications yet</p>
          ) : (
            <div className="space-y-4">
              {topDestinations.map((c) => (
                <div key={c.country}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{c.country}</span>
                    <span className="font-black text-slate-900 dark:text-white">{c.applications.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                    <div className="h-full rounded-full bg-[#002f6c]" style={{ width: `${(c.applications / maxDestinationApplications) * 100}%` }} />
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
