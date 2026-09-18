import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ShieldAlert, Phone } from 'lucide-react';

const MONTHLY_TREND = [
  { month: 'Jan', total: 205, successful: 148, forPayment: 39, forCancellation: 18 },
  { month: 'Feb', total: 198, successful: 141, forPayment: 37, forCancellation: 20 },
  { month: 'Mar', total: 224, successful: 162, forPayment: 42, forCancellation: 20 },
  { month: 'Apr', total: 231, successful: 168, forPayment: 43, forCancellation: 20 },
  { month: 'May', total: 240, successful: 174, forPayment: 45, forCancellation: 21 },
  { month: 'Jun', total: 252, successful: 183, forPayment: 47, forCancellation: 22 },
  { month: 'Jul', total: 242, successful: 176, forPayment: 45, forCancellation: 21 },
  { month: 'Aug', total: 258, successful: 188, forPayment: 48, forCancellation: 22 },
  { month: 'Sep', total: 240, successful: 186, forPayment: 40, forCancellation: 14 }, // month-to-date
];

const TIERS = [
  { tier: 'First Follow-up Call', critical: 8, pending: 34 },
  { tier: 'Second Follow-up Call', critical: 3, pending: 17 },
  { tier: 'Third Follow-up Call', critical: 1, pending: 6 },
];

interface PendingCall {
  id: string;
  payor: string;
  tier: 'First' | 'Second' | 'Third';
  mobile: string;
  dueDate: string;
  isCritical: boolean;
}

// Fresh-environment reset: no seed calls in the queue.
const INITIAL_PENDING: PendingCall[] = [];

const current = MONTHLY_TREND[MONTHLY_TREND.length - 1];
const previous = MONTHLY_TREND[MONTHLY_TREND.length - 2];
const successRatePct = Math.round((current.successful / current.total) * 100);
const unsuccessful = current.total - current.successful;
const unsuccessfulPrev = previous.total - previous.successful;
const avgSuccessfulPerDay = Math.round(current.successful / 14);
const avgUnsuccessfulPerDay = Math.round(unsuccessful / 14);
const maxTrendValue = Math.max(...MONTHLY_TREND.map((m) => m.total));

export default function LifeFollowupCalls() {
  const pending: PendingCall[] = INITIAL_PENDING;
  const [calledIds, setCalledIds] = useState<string[]>([]);

  const markCalled = (id: string) => {
    setCalledIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto font-sans text-slate-900 dark:text-slate-100 space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white font-['Montserrat']">FOLLOW-UP CALLS</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1 dark:text-slate-500">{successRatePct}% successful follow-up calls, for the past month</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-xs font-extrabold text-emerald-600 uppercase tracking-wide mb-3 dark:text-emerald-400">Successful</h2>
            <div className="flex items-baseline space-x-3 mb-2">
              <span className="text-2xl font-black text-emerald-600 flex items-center dark:text-emerald-400">
                {current.successful} <TrendingUp className="w-4 h-4 ml-1" />
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{current.successful - previous.successful >= 0 ? '+' : ''}{current.successful - previous.successful}</span>
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{current.successful} / {current.total} of total</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{avgSuccessfulPerDay} average per day</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-xs font-extrabold text-rose-600 uppercase tracking-wide mb-3 dark:text-rose-400">Unsuccessful</h2>
            <div className="flex items-baseline space-x-3 mb-2">
              <span className="text-2xl font-black text-rose-600 flex items-center dark:text-rose-400">
                {unsuccessful} <TrendingDown className="w-4 h-4 ml-1" />
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{unsuccessful - unsuccessfulPrev >= 0 ? '+' : ''}{unsuccessful - unsuccessfulPrev}</span>
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{unsuccessful} / {current.total} of total</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{avgUnsuccessfulPerDay} average per day</p>
          </div>
        </div>

        {/* Right: chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-6 dark:text-slate-100">Monthly Trend</h2>
          <div className="flex-1 flex items-end justify-between px-2 pb-2 space-x-1 min-h-[200px]">
            {MONTHLY_TREND.map((m) => (
              <div key={m.month} className="flex flex-col items-center flex-1 h-full justify-end space-y-2">
                <div className="flex items-end space-x-0.5 w-full justify-center h-full">
                  <div className="w-full max-w-[8px] rounded-t bg-[#d0112b]" style={{ height: `${(m.total / maxTrendValue) * 100}%` }} title={`Total: ${m.total}`} />
                  <div className="w-full max-w-[8px] rounded-t bg-emerald-500" style={{ height: `${(m.successful / maxTrendValue) * 100}%` }} title={`Successful: ${m.successful}`} />
                  <div className="w-full max-w-[8px] rounded-t bg-indigo-500" style={{ height: `${(m.forPayment / maxTrendValue) * 100}%` }} title={`For Payment: ${m.forPayment}`} />
                  <div className="w-full max-w-[8px] rounded-t bg-slate-400" style={{ height: `${(m.forCancellation / maxTrendValue) * 100}%` }} title={`For Cancellation: ${m.forCancellation}`} />
                </div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-500 dark:border-slate-800 dark:text-slate-500">
            <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#d0112b]" /><span>Total</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span>Successful</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /><span>For Payment</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400" /><span>For Cancellation</span></span>
          </div>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map((t) => (
          <div key={t.tier} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-center dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-4 dark:text-slate-500">{t.tier}</h3>
            <div className="flex items-center justify-center space-x-8">
              <div>
                <p className="text-2xl font-black text-[#d0112b]">{t.critical}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">Critical</p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-500 dark:text-amber-400">{t.pending}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">Pending</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending follow-ups queue */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1 dark:text-slate-100">Pending Follow-ups</h2>
        <p className="text-xs text-slate-500 font-medium mb-5 dark:text-slate-500">Applications due for a follow-up call today</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider dark:border-slate-800 dark:text-slate-100">
                <th className="py-3 px-2">Reference No.</th>
                <th className="py-3 px-2">Payor</th>
                <th className="py-3 px-2">Tier</th>
                <th className="py-3 px-2">Mobile</th>
                <th className="py-3 px-2">Due Date</th>
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pending.map((call) => (
                <tr key={call.id} className={call.isCritical ? 'bg-rose-50/40 dark:bg-rose-950/30' : ''}>
                  <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{call.id}</td>
                  <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{call.payor}</td>
                  <td className="py-3.5 px-2">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                      {call.isCritical && <ShieldAlert className="w-3 h-3 text-rose-500 dark:text-rose-400" />}
                      <span>{call.tier}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{call.mobile}</td>
                  <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{call.dueDate}</td>
                  <td className="py-3.5 px-2 text-center">
                    <button
                      onClick={() => markCalled(call.id)}
                      disabled={calledIds.includes(call.id)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                        calledIds.includes(call.id)
                          ? 'bg-emerald-50 text-emerald-600 cursor-default dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-700 hover:bg-[#d0112b] hover:text-white cursor-pointer dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{calledIds.includes(call.id) ? 'Called' : 'Mark as Called'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
