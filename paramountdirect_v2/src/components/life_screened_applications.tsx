import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const DAILY_TREND = [
  { day: 'Sep 6', total: 18, screened: 15, emailSent: 12 },
  { day: 'Sep 7', total: 15, screened: 13, emailSent: 10 },
  { day: 'Sep 8', total: 20, screened: 17, emailSent: 14 },
  { day: 'Sep 9', total: 17, screened: 14, emailSent: 11 },
  { day: 'Sep 10', total: 22, screened: 19, emailSent: 16 },
  { day: 'Sep 11', total: 19, screened: 16, emailSent: 13 },
  { day: 'Sep 12', total: 24, screened: 21, emailSent: 17 },
  { day: 'Sep 13', total: 16, screened: 13, emailSent: 10 },
  { day: 'Sep 14', total: 9, screened: 7, emailSent: 5 }, // today, partial
];

const SCREENER_BREAKDOWN = [
  { screener: 'Juan Dela Cruz', screenedThisMonth: 156, screenedToday: 4 },
  { screener: 'Pedro Rodrigo', screenedThisMonth: 148, screenedToday: 3 },
  { screener: 'Oliver Rodrigo', screenedThisMonth: 151, screenedToday: 2 },
];

const totalPast3Months = 1240;
const current = DAILY_TREND[DAILY_TREND.length - 1];
const previous = DAILY_TREND[DAILY_TREND.length - 2];
const average = Math.round(DAILY_TREND.slice(0, -1).reduce((s, d) => s + d.total, 0) / (DAILY_TREND.length - 1));
const delta = current.total - previous.total;
const maxTrendValue = Math.max(...DAILY_TREND.map((d) => d.total));

export default function LifeScreenedApplications() {
  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto font-sans text-slate-900 dark:text-slate-100 space-y-6">
      <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white font-['Montserrat']">SCREENED APPLICATIONS</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-2 dark:text-slate-500">Applications</h2>
            <p className="text-2xl font-black text-[#d0112b]">{totalPast3Months.toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-500">for the past 3 months</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-3 dark:text-slate-500">Per Day</h2>
            <div className="flex items-baseline space-x-3 mb-3">
              <span className="text-2xl font-black text-[#d0112b] flex items-center">
                {current.total} <TrendingUp className="w-4 h-4 ml-1" />
              </span>
              <span className="text-lg font-bold text-slate-400 flex items-center dark:text-slate-500">
                {Math.abs(delta)} {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5 ml-1" /> : <TrendingDown className="w-3.5 h-3.5 ml-1" />}
              </span>
            </div>
            <div className="space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <p>{average.toLocaleString()} average per day</p>
              <p>{previous.total.toLocaleString()} yesterday</p>
              <p>{current.total.toLocaleString()} today</p>
            </div>
          </div>
        </div>

        {/* Right: chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-6 dark:text-slate-100">Daily Trend</h2>
          <div className="flex-1 flex items-end justify-between px-2 pb-2 space-x-1 min-h-[200px]">
            {DAILY_TREND.map((d) => (
              <div key={d.day} className="flex flex-col items-center flex-1 h-full justify-end space-y-2">
                <div className="flex items-end space-x-1 w-full justify-center h-full">
                  <div className="w-full max-w-[10px] rounded-t bg-[#d0112b]" style={{ height: `${(d.total / maxTrendValue) * 100}%` }} title={`Total: ${d.total}`} />
                  <div className="w-full max-w-[10px] rounded-t bg-amber-500" style={{ height: `${(d.screened / maxTrendValue) * 100}%` }} title={`Screened: ${d.screened}`} />
                  <div className="w-full max-w-[10px] rounded-t bg-purple-500" style={{ height: `${(d.emailSent / maxTrendValue) * 100}%` }} title={`Email Sent: ${d.emailSent}`} />
                </div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-500 dark:border-slate-800 dark:text-slate-500">
            <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#d0112b]" /><span>Total</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /><span>Screened</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /><span>Email Sent</span></span>
          </div>
        </div>
      </div>

      {/* Screener breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1 dark:text-slate-100">Screener Breakdown</h2>
        <p className="text-xs text-slate-500 font-medium mb-5 dark:text-slate-500">Applications screened by each issuer this month</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider dark:border-slate-800 dark:text-slate-100">
                <th className="py-3 px-2">Screened By</th>
                <th className="py-3 px-2 text-right">Screened This Month</th>
                <th className="py-3 px-2 text-right">Screened Today</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {SCREENER_BREAKDOWN.map((s) => (
                <tr key={s.screener}>
                  <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{s.screener}</td>
                  <td className="py-3.5 px-2 text-right font-black text-slate-800 dark:text-slate-100">{s.screenedThisMonth.toLocaleString()}</td>
                  <td className="py-3.5 px-2 text-right font-black text-[#d0112b]">{s.screenedToday}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
