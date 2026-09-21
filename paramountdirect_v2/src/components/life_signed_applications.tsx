import { useMemo } from 'react';
import { TrendingUp, TrendingDown, FileSignature } from 'lucide-react';
import type { ScreeningItem } from '../App';
import { buildFollowUpRows } from './followup_signature_data';

interface Props {
  data: ScreeningItem[];
  // Shared with Follow-up Signature - marking a policy signed here also
  // marks it signed there, and vice versa.
  signedIds: string[];
  onMarkSigned: (id: string) => void;
}

// Paid figures match the "paid" column on the Monthly Applications page so
// the two views agree with each other.
const MONTHLY_TREND = [
  { month: 'Jan', paid: 34, signed: 27 },
  { month: 'Feb', paid: 32, signed: 25 },
  { month: 'Mar', paid: 38, signed: 30 },
  { month: 'Apr', paid: 39, signed: 30 },
  { month: 'May', paid: 41, signed: 32 },
  { month: 'Jun', paid: 43, signed: 34 },
  { month: 'Jul', paid: 41, signed: 32 },
  { month: 'Aug', paid: 45, signed: 35 },
  { month: 'Sep', paid: 20, signed: 16 }, // month-to-date
];

const totalPaid = MONTHLY_TREND.reduce((s, m) => s + m.paid, 0);
const totalSigned = MONTHLY_TREND.reduce((s, m) => s + m.signed, 0);
const totalUnsigned = totalPaid - totalSigned;

const current = MONTHLY_TREND[MONTHLY_TREND.length - 1];
const previous = MONTHLY_TREND[MONTHLY_TREND.length - 2];
const average = Math.round(MONTHLY_TREND.slice(0, -1).reduce((s, m) => s + m.paid, 0) / (MONTHLY_TREND.length - 1));
const delta = current.paid - previous.paid;
const maxTrendValue = Math.max(...MONTHLY_TREND.map((m) => m.paid));

export default function LifeSignedApplications({ data, signedIds, onMarkSigned }: Props) {
  // Same derivation Follow-up Signature uses - this is the identical queue
  // of issued-but-unsigned policies, not a separate fabricated list, so
  // marking one signed here is instantly reflected there too.
  const rows = useMemo(() => buildFollowUpRows(data, signedIds), [data, signedIds]);
  const unsigned = rows.filter((row) => !row.signed);

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto font-sans text-slate-900 dark:text-slate-100 space-y-6">
      <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white font-['Montserrat']">SIGNED APPLICATIONS</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-3 dark:text-slate-500">Total</h2>
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">Paid</span><span className="font-black text-slate-900 dark:text-white">{totalPaid.toLocaleString()}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">Signed</span><span className="font-black text-emerald-600 dark:text-emerald-400">{totalSigned.toLocaleString()}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">Unsigned</span><span className="font-black text-amber-600 dark:text-amber-400">{totalUnsigned.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-3 dark:text-slate-500">Per Month</h2>
            <div className="flex items-baseline space-x-3 mb-3">
              <span className="text-2xl font-black text-[#d0112b] flex items-center">
                {current.paid} <TrendingUp className="w-4 h-4 ml-1" />
              </span>
              <span className="text-lg font-bold text-slate-400 flex items-center dark:text-slate-500">
                {Math.abs(delta)} {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5 ml-1" /> : <TrendingDown className="w-3.5 h-3.5 ml-1" />}
              </span>
            </div>
            <div className="space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <p>{average.toLocaleString()} average per month</p>
              <p>{previous.paid.toLocaleString()} last month</p>
              <p>{current.paid.toLocaleString()} this month</p>
              <p>{totalPaid.toLocaleString()} total Paid</p>
              <p>{totalSigned.toLocaleString()} total Signed</p>
            </div>
          </div>
        </div>

        {/* Right: chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-6 dark:text-slate-100">Paid vs Signed</h2>
          <div className="flex-1 flex items-end justify-between px-2 pb-2 space-x-1 min-h-[200px]">
            {MONTHLY_TREND.map((m) => (
              <div key={m.month} className="flex flex-col items-center flex-1 h-full justify-end space-y-2">
                <div className="flex items-end space-x-1 w-full justify-center h-full">
                  <div className="w-full max-w-[10px] rounded-t bg-[#d0112b]" style={{ height: `${(m.paid / maxTrendValue) * 100}%` }} title={`Paid: ${m.paid}`} />
                  <div className="w-full max-w-[10px] rounded-t bg-emerald-500" style={{ height: `${(m.signed / maxTrendValue) * 100}%` }} title={`Signed: ${m.signed}`} />
                </div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-500 dark:border-slate-800 dark:text-slate-500">
            <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#d0112b]" /><span>Paid</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span>Signed</span></span>
          </div>
        </div>
      </div>

      {/* Unsigned queue - same live data/action as Follow-up Signature's "Unsigned" + "Followed Up" tabs combined */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1 dark:text-slate-100">Issued, Awaiting Signature</h2>
        <p className="text-xs text-slate-500 font-medium mb-5 dark:text-slate-500">
          {unsigned.length} of {rows.length} issued policies still need the client's signed form back - the same queue tracked on Follow-up Signature.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider dark:border-slate-800 dark:text-slate-100">
                <th className="py-3 px-2">Reference No.</th>
                <th className="py-3 px-2">Payor</th>
                <th className="py-3 px-2">Plan</th>
                <th className="py-3 px-2">Premium</th>
                <th className="py-3 px-2">Date Issued</th>
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {unsigned.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500 font-semibold">
                    No issued policies are currently awaiting a signature.
                  </td>
                </tr>
              )}
              {unsigned.map((row) => (
                <tr key={row.id}>
                  <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{row.policyNumber}</td>
                  <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{row.payor}</td>
                  <td className="py-3.5 px-2 font-extrabold text-slate-800 dark:text-slate-100">{row.planCode}</td>
                  <td className="py-3.5 px-2 font-black text-[#d0112b]">{row.premium}</td>
                  <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{row.dateIssued}</td>
                  <td className="py-3.5 px-2 text-center">
                    <button
                      onClick={() => onMarkSigned(row.id)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors bg-slate-100 text-slate-700 hover:bg-[#d0112b] hover:text-white cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      <span>Mark as Signed</span>
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
