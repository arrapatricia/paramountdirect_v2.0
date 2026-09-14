import React from 'react';

// Same monthly breakdown as the Monthly Applications page, so both views
// agree with each other.
const MONTHLY_DATA = [
  { label: 'Jan', received: 47, forVerification: 62, forEvaluation: 53, paid: 34, issued: 114 },
  { label: 'Feb', received: 44, forVerification: 59, forEvaluation: 50, paid: 32, issued: 110 },
  { label: 'Mar', received: 52, forVerification: 69, forEvaluation: 59, paid: 38, issued: 127 },
  { label: 'Apr', received: 53, forVerification: 71, forEvaluation: 60, paid: 39, issued: 132 },
  { label: 'May', received: 56, forVerification: 74, forEvaluation: 63, paid: 41, issued: 136 },
  { label: 'Jun', received: 59, forVerification: 78, forEvaluation: 66, paid: 43, issued: 144 },
  { label: 'Jul', received: 56, forVerification: 75, forEvaluation: 64, paid: 41, issued: 139 },
  { label: 'Aug', received: 61, forVerification: 81, forEvaluation: 69, paid: 45, issued: 149 },
  { label: 'Sep', received: 44, forVerification: 42, forEvaluation: 30, paid: 20, issued: 74 }, // month-to-date
];

const SERIES = [
  { key: 'received', label: 'Received', color: '#64748b' },
  { key: 'forVerification', label: 'For Verification', color: '#f59e0b' },
  { key: 'forEvaluation', label: 'For Evaluation', color: '#a855f7' },
  { key: 'paid', label: 'Paid', color: '#6366f1' },
  { key: 'issued', label: 'Issued', color: '#10b981' },
] as const;

const ytdTotals = SERIES.map((s) => ({
  ...s,
  total: MONTHLY_DATA.reduce((sum, m) => sum + (m[s.key as keyof typeof m] as number), 0),
}));
const grandTotal = ytdTotals.reduce((s, x) => s + x.total, 0);
const maxMonthlyValue = Math.max(...MONTHLY_DATA.flatMap((m) => SERIES.map((s) => m[s.key as keyof typeof m] as number)));

export default function LifeApplicationStatuses() {
  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto font-sans text-slate-900 dark:text-slate-100 space-y-6">
      <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white font-['Montserrat']">APPLICATION STATUSES</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1 dark:text-slate-100">Monthly Breakdown by Status</h2>
          <p className="text-xs text-slate-500 font-medium mb-6 dark:text-slate-500">Grouped bars per status, 2026</p>

          <div className="flex-1 flex items-end justify-between px-2 pb-2 space-x-1 min-h-[240px]">
            {MONTHLY_DATA.map((d) => (
              <div key={d.label} className="flex flex-col items-center flex-1 h-full justify-end space-y-2">
                <div className="flex items-end space-x-0.5 w-full justify-center h-full">
                  {SERIES.map((s) => (
                    <div
                      key={s.key}
                      className="w-full max-w-[9px] rounded-t"
                      style={{ height: `${((d[s.key as keyof typeof d] as number) / maxMonthlyValue) * 100}%`, backgroundColor: s.color }}
                      title={`${s.label}: ${d[s.key as keyof typeof d]}`}
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
          <p className="text-xs text-slate-500 font-medium mb-5 dark:text-slate-500">{grandTotal.toLocaleString()} applications, Jan&ndash;Sep 2026</p>

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
