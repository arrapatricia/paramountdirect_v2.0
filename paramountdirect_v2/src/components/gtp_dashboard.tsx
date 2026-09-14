import React, { useState } from 'react';
import { ChevronDown, TrendingUp, ShieldAlert } from 'lucide-react';

const MONTHLY_PREMIUM: { month: string; y2025: number; y2026: number | null }[] = [
  { month: 'Jan', y2025: 185000, y2026: 205000 },
  { month: 'Feb', y2025: 175000, y2026: 195000 },
  { month: 'Mar', y2025: 210000, y2026: 235000 },
  { month: 'Apr', y2025: 240000, y2026: 270000 },
  { month: 'May', y2025: 230000, y2026: 260000 },
  { month: 'Jun', y2025: 260000, y2026: 295000 },
  { month: 'Jul', y2025: 290000, y2026: 330000 },
  { month: 'Aug', y2025: 275000, y2026: 315000 },
  { month: 'Sep', y2025: 220000, y2026: 110000 }, // month-to-date
  { month: 'Oct', y2025: 230000, y2026: null },
  { month: 'Nov', y2025: 210000, y2026: null },
  { month: 'Dec', y2025: 260000, y2026: null },
];
const CURRENT_MONTH_INDEX = 8;

const ANNUAL_TARGET = 2_950_000;

const YTD_APPLICATIONS = { y2025: 5100, y2026: 5820 };
const YTD_ISSUED = { y2025: 4650, y2026: 5390 };

const TRAVEL_TYPE_BY_YEAR: Record<string, { label: string; count: number; color: string }[]> = {
  '2026': [
    { label: 'International', count: 4780, color: '#002f6c' },
    { label: 'Domestic', count: 1040, color: '#49b1ea' },
  ],
  '2025': [
    { label: 'International', count: 4050, color: '#002f6c' },
    { label: 'Domestic', count: 1050, color: '#49b1ea' },
  ],
};

const APPLICATION_TYPE = {
  '2026': [
    { label: 'Individual', count: 4230 },
    { label: 'Family', count: 1590 },
  ],
  '2025': [
    { label: 'Individual', count: 3720 },
    { label: 'Family', count: 1380 },
  ],
};

const TOP_DESTINATIONS = [
  { country: 'Japan', applications: 1120 },
  { country: 'United States', applications: 890 },
  { country: 'Hong Kong', applications: 640 },
  { country: 'South Korea', applications: 610 },
  { country: 'Thailand', applications: 420 },
  { country: 'France', applications: 280 },
];

const CRUISE_ATTACH_YTD = 145;
const HAZARDOUS_SPORTS_ATTACH_YTD = 210;

const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;

const FULL_MONTH_NAME: Record<string, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
  Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
};

export default function GtpDashboard() {
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

  const travelTypes = TRAVEL_TYPE_BY_YEAR[selectedYear];
  const travelTotal = travelTypes.reduce((s, c) => s + c.count, 0);
  let cumulative = 0;
  const gradientStops = travelTypes.map((c) => {
    const start = (cumulative / travelTotal) * 360;
    cumulative += c.count;
    const end = (cumulative / travelTotal) * 360;
    return `${c.color} ${start}deg ${end}deg`;
  });
  const travelGradient = `conic-gradient(${gradientStops.join(', ')})`;

  const applicationType = APPLICATION_TYPE[selectedYear];
  const applicationTypeTotal = applicationType.reduce((s, e) => s + e.count, 0);
  const maxDestinationApplications = Math.max(...TOP_DESTINATIONS.map((c) => c.applications));

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
          GTP PERFORMANCE
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Year-to-date results for Global Travel Protect Premium (yourtravelinsurance.ph) — compared against last year, since this is the first year GTP has its own dashboard on the new system.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Total Premium Collected (YTD)</h3>
          <p className="text-xl font-black text-[#002f6c]">{peso(premiumYtd2026)}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">+{premiumYoyPct.toFixed(1)}%</span>
            <span className="text-slate-400">YoY (Jan&ndash;Aug vs 2025)</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Annual Premium Target</h3>
          <div className="flex items-baseline space-x-1.5">
            <p className="text-xl font-black text-slate-900">{peso(premiumYtd2026)}</p>
            <span className="text-xs font-bold text-slate-400">/ {peso(ANNUAL_TARGET)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-3">
            <div className="h-full rounded-full bg-[#002f6c]" style={{ width: `${attainmentPct}%` }} />
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

        {/* Left: Travel Type Donut */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase">Travel Type</h2>
              <p className="text-xs text-slate-500 font-medium">International vs. Domestic applications</p>
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
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#002f6c]"
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
              <div className="absolute inset-[16px] rounded-full bg-white flex items-center justify-center">
                <div className="text-center">
                  <span className="block text-2xl font-black text-slate-900">{travelTotal.toLocaleString()}</span>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Applications</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-8">
            {travelTypes.map((item) => (
              <div key={item.label} className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-slate-600">{item.label}</span>
                <span className="text-xs font-black text-slate-400 ml-auto">
                  {item.count.toLocaleString()} &middot; {((item.count / travelTotal) * 100).toFixed(0)}%
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
              <p className="text-xs text-slate-500 font-medium">Monthly totals, 2026 vs 2025</p>
            </div>
            <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-500">
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /><span>2025</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#002f6c]" /><span>2026</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#002f6c] opacity-40" /><span>2026 (MTD)</span></span>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between px-2 pb-2 mt-6 space-x-2 min-h-[180px]">
            {MONTHLY_PREMIUM.map((m, i) => (
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
                <span className="text-[10px] font-bold text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-start space-x-2 text-xs text-slate-600">
            <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="font-semibold">
              {FULL_MONTH_NAME[peakMonth.month]} was our strongest month this year — {peso(peakMonth.y2026 ?? 0)}, up {peakMonthGrowthPct}% from {FULL_MONTH_NAME[peakMonth.month]} last year, in line with the peak summer travel season.
              {' '}{FULL_MONTH_NAME[MONTHLY_PREMIUM[CURRENT_MONTH_INDEX].month]} is tracking at {peso(MONTHLY_PREMIUM[CURRENT_MONTH_INDEX].y2026 ?? 0)} so far, month-to-date.
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Application Type + Add-ons */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1">Application Type</h2>
          <p className="text-xs text-slate-500 font-medium mb-5">Individual vs. Family ({selectedYear})</p>

          <div className="space-y-4">
            {applicationType.map((e) => (
              <div key={e.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">{e.label}</span>
                  <span className="font-black text-slate-900">{e.count.toLocaleString()} <span className="text-slate-400 font-semibold">({((e.count / applicationTypeTotal) * 100).toFixed(0)}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#49b1ea]" style={{ width: `${(e.count / applicationTypeTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600">Cruise Coverage attached (YTD)</span>
              <span className="font-black text-slate-900">{CRUISE_ATTACH_YTD}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600">Hazardous Sports Coverage attached (YTD)</span>
              <span className="font-black text-slate-900">{HAZARDOUS_SPORTS_ATTACH_YTD}</span>
            </div>
          </div>

          <div className="mt-4 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] font-semibold text-slate-500">
              Schengen destinations require €30,000 / ₱2.5M medical coverage compliance — flagged automatically during screening.
            </p>
          </div>
        </div>

        {/* Top Destinations */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1">Top Destinations</h2>
          <p className="text-xs text-slate-500 font-medium mb-5">Applications by destination country, 2026 YTD</p>

          <div className="space-y-4">
            {TOP_DESTINATIONS.map((c) => (
              <div key={c.country}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">{c.country}</span>
                  <span className="font-black text-slate-900">{c.applications.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#002f6c]" style={{ width: `${(c.applications / maxDestinationApplications) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
