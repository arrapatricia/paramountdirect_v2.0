import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ScreeningItem } from '../App';

interface Props {
  data: ScreeningItem[];
}

// "Screened" means the Application Screening queue actually recorded a Date
// Screened for the item - so every number on this page is derived straight
// from the same `data` the Application Screening page works off of, rather
// than a separate hardcoded dataset.
const wasScreened = (item: ScreeningItem) => item.dateScreened !== '-';
const receivedDateOnly = (item: ScreeningItem) => item.dateReceived.split(' at ')[0];

export default function LifeScreenedApplications({ data }: Props) {
  const totalReceived = data.length;
  const totalScreened = data.filter(wasScreened).length;

  const dayBuckets = new Map<string, { total: number; screened: number }>();
  data.forEach((item) => {
    const day = receivedDateOnly(item);
    const bucket = dayBuckets.get(day) ?? { total: 0, screened: 0 };
    bucket.total += 1;
    if (wasScreened(item)) bucket.screened += 1;
    dayBuckets.set(day, bucket);
  });
  const dailyTrend = Array.from(dayBuckets.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const current = dailyTrend[dailyTrend.length - 1] ?? { date: '-', total: 0, screened: 0 };
  const previous = dailyTrend[dailyTrend.length - 2] ?? { date: '-', total: 0, screened: 0 };
  const priorDays = dailyTrend.slice(0, -1);
  const average = priorDays.length > 0 ? Math.round(priorDays.reduce((s, d) => s + d.total, 0) / priorDays.length) : 0;
  const delta = current.total - previous.total;
  const maxTrendValue = Math.max(1, ...dailyTrend.map((d) => d.total));

  const screenerMap = new Map<string, { total: number; screened: number }>();
  data.forEach((item) => {
    const bucket = screenerMap.get(item.screenedBy) ?? { total: 0, screened: 0 };
    bucket.total += 1;
    if (wasScreened(item)) bucket.screened += 1;
    screenerMap.set(item.screenedBy, bucket);
  });
  const screenerBreakdown = Array.from(screenerMap.entries())
    .map(([screener, v]) => ({ screener, ...v }))
    .sort((a, b) => b.screened - a.screened);

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto font-sans text-slate-900 dark:text-slate-100 space-y-6">
      <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white font-['Montserrat']">SCREENED APPLICATIONS</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-3 dark:text-slate-500">Application Screening Queue</h2>
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">Received</span><span className="font-black text-slate-900 dark:text-white">{totalReceived.toLocaleString()}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">Screened</span><span className="font-black text-amber-600 dark:text-amber-400">{totalScreened.toLocaleString()}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">Awaiting Screening</span><span className="font-black text-[#d0112b]">{(totalReceived - totalScreened).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-3 dark:text-slate-500">Per Day</h2>
            <div className="flex items-baseline space-x-3 mb-3">
              <span className="text-2xl font-black text-[#d0112b] flex items-center">
                {current.screened} <TrendingUp className="w-4 h-4 ml-1" />
              </span>
              <span className="text-lg font-bold text-slate-400 flex items-center dark:text-slate-500">
                {Math.abs(delta)} {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5 ml-1" /> : <TrendingDown className="w-3.5 h-3.5 ml-1" />}
              </span>
            </div>
            <div className="space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <p>{average.toLocaleString()} average received per day</p>
              <p>{previous.screened.toLocaleString()} screened on {previous.date}</p>
              <p>{current.screened.toLocaleString()} screened on {current.date}</p>
            </div>
          </div>
        </div>

        {/* Right: chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1 dark:text-slate-100">Daily Trend</h2>
          <p className="text-xs text-slate-500 font-medium mb-5 dark:text-slate-500">Received vs. actually screened, from the Application Screening queue</p>
          <div className="flex-1 flex items-end justify-between px-2 pb-2 space-x-1 min-h-[200px]">
            {dailyTrend.map((d) => (
              <div key={d.date} className="flex flex-col items-center flex-1 h-full justify-end space-y-2">
                <div className="flex items-end space-x-1 w-full justify-center h-full">
                  <div className="w-full max-w-[14px] rounded-t bg-[#d0112b]" style={{ height: `${(d.total / maxTrendValue) * 100}%` }} title={`Received: ${d.total}`} />
                  <div className="w-full max-w-[14px] rounded-t bg-amber-500" style={{ height: `${(d.screened / maxTrendValue) * 100}%` }} title={`Screened: ${d.screened}`} />
                </div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{d.date}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-500 dark:border-slate-800 dark:text-slate-500">
            <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#d0112b]" /><span>Received</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /><span>Screened</span></span>
          </div>
        </div>
      </div>

      {/* Screener breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1 dark:text-slate-100">Screener Breakdown</h2>
        <p className="text-xs text-slate-500 font-medium mb-5 dark:text-slate-500">Assigned vs. screened, per issuer in the Application Screening queue</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider dark:border-slate-800 dark:text-slate-100">
                <th className="py-3 px-2">Screened By</th>
                <th className="py-3 px-2 text-right">Assigned</th>
                <th className="py-3 px-2 text-right">Screened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {screenerBreakdown.map((s) => (
                <tr key={s.screener}>
                  <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{s.screener}</td>
                  <td className="py-3.5 px-2 text-right font-black text-slate-800 dark:text-slate-100">{s.total.toLocaleString()}</td>
                  <td className="py-3.5 px-2 text-right font-black text-[#d0112b]">{s.screened.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
