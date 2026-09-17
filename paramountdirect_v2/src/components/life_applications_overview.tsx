import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PeriodPoint {
  label: string;
  total: number;
  received: number;
  forVerification: number;
  forEvaluation: number;
  paid: number;
  issued: number;
}

// Monthly, Jan-Sep 2026 (Sep in progress).
const MONTHLY_DATA: PeriodPoint[] = [
  { label: 'Jan', total: 310, received: 47, forVerification: 62, forEvaluation: 53, paid: 34, issued: 114 },
  { label: 'Feb', total: 295, received: 44, forVerification: 59, forEvaluation: 50, paid: 32, issued: 110 },
  { label: 'Mar', total: 345, received: 52, forVerification: 69, forEvaluation: 59, paid: 38, issued: 127 },
  { label: 'Apr', total: 355, received: 53, forVerification: 71, forEvaluation: 60, paid: 39, issued: 132 },
  { label: 'May', total: 370, received: 56, forVerification: 74, forEvaluation: 63, paid: 41, issued: 136 },
  { label: 'Jun', total: 390, received: 59, forVerification: 78, forEvaluation: 66, paid: 43, issued: 144 },
  { label: 'Jul', total: 375, received: 56, forVerification: 75, forEvaluation: 64, paid: 41, issued: 139 },
  { label: 'Aug', total: 405, received: 61, forVerification: 81, forEvaluation: 69, paid: 45, issued: 149 },
  { label: 'Sep', total: 210, received: 44, forVerification: 42, forEvaluation: 30, paid: 20, issued: 74 }, // month-to-date
];

// Daily, last 9 days (today = Sep 14, 2026; today's count is still partial).
const DAILY_DATA: PeriodPoint[] = [
  { label: 'Sep 6', total: 15, received: 3, forVerification: 3, forEvaluation: 3, paid: 2, issued: 4 },
  { label: 'Sep 7', total: 12, received: 2, forVerification: 3, forEvaluation: 2, paid: 1, issued: 4 },
  { label: 'Sep 8', total: 17, received: 3, forVerification: 4, forEvaluation: 3, paid: 2, issued: 5 },
  { label: 'Sep 9', total: 14, received: 3, forVerification: 3, forEvaluation: 2, paid: 2, issued: 4 },
  { label: 'Sep 10', total: 18, received: 4, forVerification: 4, forEvaluation: 3, paid: 2, issued: 5 },
  { label: 'Sep 11', total: 16, received: 3, forVerification: 3, forEvaluation: 3, paid: 2, issued: 5 },
  { label: 'Sep 12', total: 19, received: 4, forVerification: 4, forEvaluation: 3, paid: 2, issued: 6 },
  { label: 'Sep 13', total: 13, received: 2, forVerification: 3, forEvaluation: 2, paid: 2, issued: 4 },
  { label: 'Sep 14', total: 8, received: 3, forVerification: 2, forEvaluation: 1, paid: 1, issued: 1 }, // today, partial
];

const SOURCE_TODAY = [
  { source: 'Google', count: 4 },
  { source: 'Facebook', count: 2 },
  { source: 'Email Newsletter', count: 1 },
  { source: 'Pd Site', count: 1 },
];

const SERIES = [
  { key: 'received', label: 'Received', color: '#64748b' },
  { key: 'forVerification', label: 'For Verification', color: '#f59e0b' },
  { key: 'forEvaluation', label: 'For Evaluation', color: '#a855f7' },
  { key: 'paid', label: 'Paid', color: '#6366f1' },
  { key: 'issued', label: 'Issued', color: '#10b981' },
] as const;

interface Props {
  period: 'Monthly' | 'Daily';
}

export default function LifeApplicationsOverview({ period }: Props) {
  const [sourceFilter, setSourceFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');

  const isMonthly = period === 'Monthly';
  const data = isMonthly ? MONTHLY_DATA : DAILY_DATA;
  const target = isMonthly ? 450 : 20;

  const current = data[data.length - 1];
  const previous = data[data.length - 2];
  const average = Math.round(data.slice(0, -1).reduce((s, d) => s + d.total, 0) / (data.length - 1));
  const lastYearSamePeriod = isMonthly ? 268 : 11;
  const totalPaid = data.reduce((s, d) => s + d.paid, 0);
  const attainmentPct = Math.min(100, Math.round((current.total / target) * 100));
  const delta = current.total - previous.total;

  const maxValue = Math.max(...data.map((d) => d.total));

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto font-sans text-slate-900 dark:text-slate-100 space-y-6">
      <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white font-['Montserrat']">
        {period.toUpperCase()} APPLICATIONS
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Progress + Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-3 dark:text-slate-500">
              Current {isMonthly ? 'Month' : 'Day'} Progress
            </h2>
            <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
              <div className="h-full rounded-full bg-[#d0112b]" style={{ width: `${attainmentPct}%` }} />
            </div>
            <div className="flex justify-end mt-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold">
                TARGET {target.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-3 dark:text-slate-500">Per {isMonthly ? 'Month' : 'Day'}</h2>
            <div className="flex items-baseline space-x-3 mb-3">
              <span className="text-2xl font-black text-[#d0112b] flex items-center">
                {current.total} <TrendingUp className="w-4 h-4 ml-1" />
              </span>
              <span className="text-lg font-bold text-slate-400 flex items-center dark:text-slate-500">
                {Math.abs(delta)} {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5 ml-1" /> : <TrendingDown className="w-3.5 h-3.5 ml-1" />}
              </span>
            </div>
            <div className="space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <p>{average.toLocaleString()} average per {isMonthly ? 'month' : 'day'}</p>
              <p>{previous.total.toLocaleString()} {isMonthly ? 'last month' : 'yesterday'}</p>
              <p>{current.total.toLocaleString()} {isMonthly ? 'this month' : 'today'}</p>
              <p>{lastYearSamePeriod.toLocaleString()} last year</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-2 dark:text-slate-500">For Payment</h2>
            <p className="text-xl font-black text-slate-900 dark:text-white">{totalPaid.toLocaleString()} <span className="text-xs font-bold text-slate-400 dark:text-slate-500">total policies</span></p>
          </div>

          {!isMonthly && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-3 dark:text-slate-500">Per Source Today</h2>
              <div className="space-y-2">
                {SOURCE_TODAY.map((s) => (
                  <div key={s.source} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">{s.source}</span>
                    <span className="font-black text-slate-900 dark:text-white">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-6 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase dark:text-slate-500">Source:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="All">Sales Source</option>
                <option value="Google">Google</option>
                <option value="Email Newsletter">Email</option>
                <option value="Pd Site">PD Site</option>
                <option value="Facebook">Facebook</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase dark:text-slate-500">Product:</span>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="All">Product</option>
                <option value="HIP">HIP</option>
                <option value="GLA">GLA</option>
                <option value="SSP">SSP</option>
                <option value="PHC">PHC</option>
                <option value="GPR">GPR</option>
                <option value="MPR">MPR</option>
              </select>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between px-2 pb-2 space-x-1 min-h-[220px]">
            {data.map((d) => (
              <div key={d.label} className="flex flex-col items-center flex-1 h-full justify-end space-y-2">
                <div className="flex items-end space-x-0.5 w-full justify-center h-full">
                  <div
                    className="w-full max-w-[8px] rounded-t bg-[#d0112b]"
                    style={{ height: `${(d.total / maxValue) * 100}%` }}
                    title={`Total: ${d.total}`}
                  />
                  {SERIES.map((s) => (
                    <div
                      key={s.key}
                      className="w-full max-w-[6px] rounded-t"
                      style={{ height: `${(d[s.key as keyof PeriodPoint] as number / maxValue) * 100}%`, backgroundColor: s.color }}
                      title={`${s.label}: ${d[s.key as keyof PeriodPoint]}`}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap dark:text-slate-500">{d.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#d0112b]" /><span>Total</span>
            </span>
            {SERIES.map((s) => (
              <span key={s.key} className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} /><span>{s.label}</span>
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
