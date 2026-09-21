import type { ScreeningItem } from '../App';
import { MONTH_LABELS, bucketByMonth } from '../lib/dashboardStats';

interface Props {
  data: ScreeningItem[];
}

const SERIES = [
  { key: 'received', label: 'Received', color: '#64748b', status: 'Received' },
  { key: 'forVerification', label: 'For Verification', color: '#f59e0b', status: 'For Verification' },
  { key: 'forEvaluation', label: 'For Evaluation', color: '#a855f7', status: 'For Evaluation' },
  { key: 'paid', label: 'Paid', color: '#6366f1', status: 'Paid' },
  { key: 'issued', label: 'Issued', color: '#10b981', status: 'Issued' },
] as const;

export default function LifeApplicationStatuses({ data }: Props) {
  const monthlyBuckets = bucketByMonth(data, (item) => item.dateReceived);
  const monthlyData = monthlyBuckets.map((records, i) => {
    const counts: Record<(typeof SERIES)[number]['key'], number> = {
      received: 0, forVerification: 0, forEvaluation: 0, paid: 0, issued: 0,
    };
    for (const item of records) {
      const series = SERIES.find((s) => s.status === item.status);
      if (series) counts[series.key]++;
    }
    return { label: MONTH_LABELS[i], ...counts };
  });

  const ytdTotals = SERIES.map((s) => ({
    ...s,
    total: monthlyData.reduce((sum, m) => sum + m[s.key], 0),
  }));
  const grandTotal = Math.max(1, ytdTotals.reduce((s, x) => s + x.total, 0));
  const maxMonthlyValue = Math.max(1, ...monthlyData.flatMap((m) => SERIES.map((s) => m[s.key])));

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto font-sans text-slate-900 dark:text-slate-100 space-y-6">
      <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white font-['Montserrat']">APPLICATION STATUSES</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1 dark:text-slate-100">Monthly Breakdown by Status</h2>
          <p className="text-xs text-slate-500 font-medium mb-6 dark:text-slate-500">Grouped bars per status, {new Date().getFullYear()}</p>

          <div className="flex-1 flex items-end justify-between px-2 pb-2 space-x-1 min-h-[240px]">
            {monthlyData.map((d) => (
              <div key={d.label} className="flex flex-col items-center flex-1 h-full justify-end space-y-2">
                <div className="flex items-end space-x-0.5 w-full justify-center h-full">
                  {SERIES.map((s) => (
                    <div
                      key={s.key}
                      className="w-full max-w-[9px] rounded-t"
                      style={{ height: `${(d[s.key] / maxMonthlyValue) * 100}%`, backgroundColor: s.color }}
                      title={`${s.label}: ${d[s.key]}`}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{d.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-500 dark:border-slate-800 dark:text-slate-500">
            {SERIES.map((s) => (
              <span key={s.key} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} /><span>{s.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* YTD breakdown */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1 dark:text-slate-100">YTD Breakdown</h2>
          <p className="text-xs text-slate-500 font-medium mb-5 dark:text-slate-500">{grandTotal.toLocaleString()} applications, Jan&ndash;{MONTH_LABELS[monthlyData.length - 1]} {new Date().getFullYear()}</p>

          <div className="space-y-4">
            {ytdTotals.map((s) => (
              <div key={s.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{s.label}</span>
                  <span className="font-black text-slate-900 dark:text-white">{s.total.toLocaleString()} <span className="text-slate-400 font-semibold dark:text-slate-500">({((s.total / grandTotal) * 100).toFixed(0)}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                  <div className="h-full rounded-full" style={{ width: `${(s.total / grandTotal) * 100}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
