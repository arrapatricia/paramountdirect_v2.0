import { useCallback, useEffect, useState } from 'react';
import { X, RefreshCw, CheckCircle2, Search } from 'lucide-react';
import { endorsementsApi, ApiError, type EndorsementApi, type EndorsementStatusApi } from '../lib/api';
import {
  EndorsementDetail, EndorsementStatusBadge, ENDORSEMENT_TYPE_LABEL, canApproveEndorsements, displayDate, peso, isFinancialType, inputClass, labelClass,
} from './endorsement_shared';

// Endorsements work queue for one non-life product (CTPL so far). Financial
// endorsements are worked here: Pending -> Review -> Approve / Deny.
// Non-financial ones show up already Approved, for the record.

interface Props {
  product: 'CTPL' | 'OFW' | 'GTP';
  currentUserRole: string | null;
  // Called after an approval so App.tsx can reload the product's
  // applications (a cancellation or extension changes the policy).
  onPolicyChanged: () => void;
}

const TABS: ('Awaiting Action' | EndorsementStatusApi | 'All')[] = ['Awaiting Action', 'Pending', 'Reviewed', 'Approved', 'Denied', 'All'];

const insuredName = (e: EndorsementApi) =>
  e.ctplApplication ? `${e.ctplApplication.ownerFirstName} ${e.ctplApplication.ownerSurname}` : '—';

export default function EndorsementsQueue({ product, currentUserRole, onPolicyChanged }: Props) {
  const [endorsements, setEndorsements] = useState<EndorsementApi[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Awaiting Action');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canApprove = canApproveEndorsements(product, currentUserRole);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEndorsements(await endorsementsApi.list({ product }));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load endorsements.');
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => { void load(); }, [load]);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const counts = Object.fromEntries(TABS.map((t) => [t,
    t === 'All' ? endorsements.length
      : t === 'Awaiting Action' ? endorsements.filter((e) => e.status === 'Pending' || e.status === 'Reviewed').length
      : endorsements.filter((e) => e.status === t).length,
  ]));

  const q = search.trim().toLowerCase();
  const rows = endorsements.filter((e) => {
    const inTab = tab === 'All' || (tab === 'Awaiting Action' ? e.status === 'Pending' || e.status === 'Reviewed' : e.status === tab);
    const matches = !q || [e.policyNumber, e.endorsementNumber, insuredName(e), e.ctplApplication?.plateNumber, e.requestedBy]
      .some((v) => (v ?? '').toLowerCase().includes(q));
    return inTab && matches;
  });

  const selected = endorsements.find((e) => e.id === selectedId) ?? null;

  const openDetail = (id: string) => {
    setSelectedId(id);
    setRemarks('');
    setActionError(null);
  };

  const act = async (action: 'review' | 'approve' | 'deny') => {
    if (!selected) return;
    if (action === 'deny' && !remarks.trim()) { setActionError('Enter the reason for denying in Remarks.'); return; }
    setBusy(true);
    setActionError(null);
    try {
      const updated = action === 'review' ? await endorsementsApi.review(selected.id, remarks)
        : action === 'approve' ? await endorsementsApi.approve(selected.id, remarks)
        : await endorsementsApi.deny(selected.id, remarks);
      setEndorsements((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setRemarks('');
      notify(action === 'review' ? 'Marked as reviewed.' : action === 'approve' ? `Approved — ${updated.endorsementNumber} issued.` : 'Endorsement denied.');
      if (action === 'approve') onPolicyChanged();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider text-[#002f6c] dark:text-[#49b1ea] font-['Montserrat']">{product} Endorsements</h1>
          <p className="text-xs font-bold text-slate-500 mt-1 dark:text-slate-400">
            Financial endorsements (term extension, cancellation) need review, then approval. Non-financial ones are approved on submission.
            {!canApprove && ` You can view these; only ${product} Admin, Non-Life Admin or System Admin can review or approve.`}
          </p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border ${tab === t
                ? 'bg-[#002f6c] text-white border-[#002f6c] dark:bg-[#49b1ea] dark:text-slate-900 dark:border-[#49b1ea]'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800'}`}
            >
              {t} <span className="opacity-70">({counts[t]})</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Policy, endorsement no., insured, plate…" className={`${inputClass} pl-9`} />
        </div>
      </div>

      {loadError && <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{loadError}</p>}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto dark:bg-slate-900 dark:border-slate-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] font-black uppercase tracking-wide text-slate-500 bg-slate-50 dark:bg-slate-800/60 dark:text-slate-400">
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Policy No.</th>
              <th className="px-4 py-3">Insured</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Effective</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Endorsement No.</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} onClick={() => openDetail(e.id)} className="border-t border-slate-100 cursor-pointer hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{displayDate(e.createdAt)}</span>
                  <span className="block text-[10px] text-slate-400">{e.requestedBy}</span>
                </td>
                <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">{e.policyNumber}</td>
                <td className="px-4 py-3 font-semibold">{insuredName(e)}</td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap">{ENDORSEMENT_TYPE_LABEL[e.type]}</td>
                <td className="px-4 py-3 whitespace-nowrap">{displayDate(e.effectiveDate)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                  {isFinancialType(e.type) ? `${(e.total ?? 0) < 0 ? '−' : '+'}${peso(e.total)}` : '—'}
                </td>
                <td className="px-4 py-3 font-mono whitespace-nowrap">{e.endorsementNumber ?? '—'}</td>
                <td className="px-4 py-3"><EndorsementStatusBadge status={e.status} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center font-semibold text-slate-400">{loading ? 'Loading…' : 'No endorsements here.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">{ENDORSEMENT_TYPE_LABEL[selected.type]}</h2>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {insuredName(selected)} · {selected.ctplApplication?.plateNumber} · Ref. {selected.ctplApplication?.referenceNo ?? '—'}
                </p>
              </div>
              <button onClick={() => setSelectedId(null)} className="cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <EndorsementDetail endorsement={selected} onError={notify} />

            {canApprove && (selected.status === 'Pending' || selected.status === 'Reviewed') && (
              <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div>
                  <label className={labelClass}>Remarks {selected.status === 'Reviewed' ? '(required to deny)' : '(optional to review, required to deny)'}</label>
                  <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className={inputClass} />
                </div>
                {actionError && <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{actionError}</p>}
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" disabled={busy} onClick={() => act('deny')} className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-50 cursor-pointer disabled:opacity-40 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30">
                    Deny
                  </button>
                  {selected.status === 'Pending' ? (
                    <button type="button" disabled={busy} onClick={() => act('review')} className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer disabled:opacity-40">
                      Mark as Reviewed
                    </button>
                  ) : (
                    <button type="button" disabled={busy} onClick={() => act('approve')} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-40">
                      Approve & Issue
                    </button>
                  )}
                </div>
                {selected.status === 'Pending' && <p className="text-[11px] font-semibold text-slate-400 text-right">Once reviewed, it can be approved.</p>}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setSelectedId(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-[100] p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
