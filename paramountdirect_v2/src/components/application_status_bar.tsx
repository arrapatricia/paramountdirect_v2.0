
import type { ScreeningItem } from '../App';

interface Props {
  data: ScreeningItem[];
}

// Mirrors the legacy admin's "Application Status" counts strip. Only
// Received / For Verification / For Evaluation / Paid / Issued exist on
// ScreeningItem, so every other legacy status (Quoted, Cancelled, Withdrawn,
// Duplicate, Denied, For QA, No Status) reads 0 here rather than being
// fabricated - the same way the real system shows 0 for statuses that
// don't apply to a given product/branch.
export default function ApplicationStatusBar({ data }: Props) {
  const count = (status: string) => data.filter((d) => d.status === status).length;

  const stats: { label: string; value: number }[] = [
    { label: 'Active', value: data.length },
    { label: 'Received', value: count('Received') },
    { label: 'Issued', value: count('Issued') },
    { label: 'Quoted', value: 0 },
    { label: 'For Verification', value: count('For Verification') },
    { label: 'Cancelled', value: 0 },
    { label: 'Withdrawn', value: 0 },
    { label: 'Duplicate', value: 0 },
    { label: 'For Evaluation', value: count('For Evaluation') },
    { label: 'Denied', value: 0 },
    { label: 'For QA', value: 0 },
    { label: 'No Status', value: 0 },
    { label: 'Paid', value: count('Paid') },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 dark:bg-slate-800/70 dark:border-slate-700">
      {stats.map((s) => (
        <span key={s.label} className="text-[11px] font-semibold text-slate-600 whitespace-nowrap dark:text-slate-300">
          {s.label} <span className="font-extrabold text-slate-900 dark:text-white">{s.value.toLocaleString()}</span>
        </span>
      ))}
    </div>
  );
}
