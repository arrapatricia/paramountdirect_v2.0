import { useState } from 'react';
import { X, Ban } from 'lucide-react';
import type { OfwApplication } from './ofw_types';
import { endorsementsApi, ApiError, type EndorsementApi, type EndorsementPreviewApi } from '../lib/api';
import { AmountsTable, peso, displayDate, toDateInput, inputClass, labelClass } from './endorsement_shared';

// "New Endorsement" for an issued OFW policy, opened from the policy's
// quick-preview modal (ofw_application_list.tsx). Cancellation only, so far
// (unlike CTPL, OFW has no Non-Financial/Term Extension endorsement yet) -
// refund is the whole-remaining-months formula in ofwEndorsementCalc.ts,
// capped at the original premium. Goes to review/approval, issues a
// Cancellation Letter + Credit Memo once approved.

interface Props {
  app: OfwApplication;
  onClose: () => void;
  onSubmitted: (endorsement: EndorsementApi) => void;
}

export default function OfwEndorsementModal({ app, onClose, onSubmitted }: Props) {
  const [effectiveDate, setEffectiveDate] = useState(toDateInput(new Date()));
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<EndorsementPreviewApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const compute = async () => {
    setError(null);
    setPreview(null);
    try {
      setPreview(await endorsementsApi.previewOfw(app.id, { kind: 'Cancellation', effectiveDate }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to compute refund.');
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await endorsementsApi.submitOfw(app.id, { kind: 'Cancellation', effectiveDate, reason: reason.trim() });
      onSubmitted(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit endorsement.');
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = !busy && !!reason.trim() && !!effectiveDate && !!preview;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-[#002f6c] dark:text-[#49b1ea]" />
            <div>
              <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">New Endorsement — Cancellation</h2>
              <p className="text-[11px] font-bold text-slate-500 font-mono dark:text-slate-400">
                {app.policyNumber} · {displayDate(app.insuranceStart)} to {displayDate(app.contractEnd)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Cancellation Date</label>
              <input type="date" value={effectiveDate} onChange={(e) => { setEffectiveDate(e.target.value); setPreview(null); }} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Reason</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for cancellation" className={inputClass} />
            </div>
          </div>

          {!preview && (
            <button
              type="button"
              onClick={compute}
              disabled={!effectiveDate}
              className="px-4 py-2 rounded-xl border border-[#002f6c] text-[#002f6c] text-xs font-bold hover:bg-[#ebf3fc] cursor-pointer disabled:opacity-40 dark:border-[#49b1ea] dark:text-[#49b1ea] dark:hover:bg-[#49b1ea]/10"
            >
              Compute Refund
            </button>
          )}

          {preview && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Refund of <b>{peso(preview.refund)}</b> (premium earned to date: {peso(preview.premiumEarned)}).
              </p>
              <AmountsTable amounts={preview.amounts} />
              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                This goes to review and approval. The policy won't change until it's approved. A Credit Memo of {peso(preview.amounts.total)} will be issued.
              </p>
            </div>
          )}

          {error && <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="button" onClick={submit} disabled={!canSubmit} className="px-5 py-2 rounded-xl bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
              {busy ? 'Submitting…' : 'Submit for Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
