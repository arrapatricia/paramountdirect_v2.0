import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ScreeningItem } from '../App';
import { CURRENT_YEAR, MONTH_LABELS, bucketByDay, bucketByMonth, parseDateParts } from '../lib/dashboardStats';

interface PeriodPoint {
  label: string;
  total: number;
  received: number;
  forVerification: number;
  forEvaluation: number;
  paid: number;
  issued: number;
}

const SERIES = [
  { key: 'received', label: 'Received', color: '#64748b', status: 'Received' },
  { key: 'forVerification', label: 'For Verification', color: '#f59e0b', status: 'For Verification' },
  { key: 'forEvaluation', label: 'For Evaluation', color: '#a855f7', status: 'For Evaluation' },
  { key: 'paid', label: 'Paid', color: '#6366f1', status: 'Paid' },
  { key: 'issued', label: 'Issued', color: '#10b981', status: 'Issued' },
] as const;

function summarize(label: string, records: ScreeningItem[]): PeriodPoint {
  const point: PeriodPoint = { label, total: records.length, received: 0, forVerification: 0, forEvaluation: 0, paid: 0, issued: 0 };
  for (const item of records) {
    const series = SERIES.find((s) => s.status === item.status);
    if (series) point[series.key]++;
  }
  return point;
}

// No real target/prior-year source exists yet on this fresh system - these
// stay as configured goals rather than derived figures, same rationale as
// the product dashboards' Annual Target before it became editable.
const MONTHLY_TARGET = 450;
const DAILY_TARGET = 20;

interface Props {
  period: 'Monthly' | 'Daily';
  data: ScreeningItem[];
}

export default function LifeApplicationsOverview({ period, data }: Props) {
  const [sourceFilter, setSourceFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');

  const isMonthly = period === 'Monthly';
  const target = isMonthly ? MONTHLY_TARGET : DAILY_TARGET;

  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (sourceFilter === 'All' || item.source === sourceFilter) &&
          (productFilter === 'All' || item.planCode === productFilter)
      ),
    [data, sourceFilter, productFilter]
  );

  const periodData: PeriodPoint[] = useMemo(() => {
    if (isMonthly) {
      return bucketByMonth(filtered, (item) => item.dateReceived).map((records, i) => summarize(MONTH_LABELS[i], records));
    }
    return bucketByDay(filtered, (item) => item.dateReceived).map(({ date, records }) => summarize(date, records));
  }, [filtered, isMonthly]);

  const current = periodData[periodData.length - 1] ?? { label: '-', total: 0, received: 0, forVerification: 0, forEvaluation: 0, paid: 0, issued: 0 };
  const previous = periodData[periodData.length - 2] ?? { label: '-', total: 0, received: 0, forVerification: 0, forEvaluation: 0, paid: 0, issued: 0 };
  const priorPoints = periodData.slice(0, -1);
  const average = priorPoints.length > 0 ? Math.round(priorPoints.reduce((s, d) => s + d.total, 0) / priorPoints.length) : 0;

  // "Same period last year" - real count, not a placeholder; reads 0 until
  // this system actually has a prior year's applications in it.
  const lastYearSamePeriod = useMemo(() => {
    if (isMonthly) {
      const currentMonthIndex = periodData.length - 1;
      return filtered.filter((item) => {
        const parts = parseDateParts(item.dateReceived);
        return parts && parts.year === CURRENT_YEAR - 1 && parts.monthIndex === currentMonthIndex;
      }).length;
    }
    return filtered.filter((item) => {
      const parts = parseDateParts(item.dateReceived);
      return parts && parts.year === CURRENT_YEAR - 1 && item.dateReceived.split(' at ')[0] === current.label.replace(String(CURRENT_YEAR), String(CURRENT_YEAR - 1));
    }).length;
  }, [filtered, isMonthly, periodData.length, current.label]);

  const totalPaid = periodData.reduce((s, d) => s + d.paid, 0);
  const attainmentPct = Math.min(100, Math.round((current.total / target) * 100));
  const delta = current.total - previous.total;

  const maxValue = Math.max(1, ...periodData.map((d) => d.total));

  const sourceToday = useMemo(() => {
    if (isMonthly || periodData.length === 0) return [];
    const todayLabel = current.label;
    const todaysRecords = filtered.filter((item) => item.dateReceived.split(' at ')[0] === todayLabel);
    const counts = new Map<string, number>();
    for (const item of todaysRecords) counts.set(item.source, (counts.get(item.source) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered, isMonthly, periodData.length, current.label]);

  const availableSources = useMemo(() => Array.from(new Set(data.map((item) => item.source))).sort(), [data]);
  const availableProducts = useMemo(() => Array.from(new Set(data.map((item) => item.planCode))).sort(), [data]);

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
              {sourceToday.length === 0 ? (
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">No applications today</p>
              ) : (
                <div className="space-y-2">
                  {sourceToday.map((s) => (
                    <div key={s.source} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">{s.source}</span>
                      <span className="font-black text-slate-900 dark:text-white">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
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
                {availableSources.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
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
                {availableProducts.map((planCode) => (
                  <option key={planCode} value={planCode}>{planCode}</option>
                ))}
              </select>
            </div>
          </div>

          {periodData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center min-h-[220px]">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">No applications yet</p>
            </div>
          ) : (
            <div className="flex-1 flex items-end justify-between px-2 pb-2 space-x-1 min-h-[220px]">
              {periodData.map((d) => (
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
                        style={{ height: `${(d[s.key] / maxValue) * 100}%`, backgroundColor: s.color }}
                        title={`${s.label}: ${d[s.key]}`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap dark:text-slate-500">{d.label}</span>
                </div>
              ))}
            </div>
          )}

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
