import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import type { CtplApplication } from './ctpl_types';
import { endorsementsApi, ApiError, type EndorsementApi } from '../lib/api';
import { EndorsementDetail, EndorsementStatusBadge, ENDORSEMENT_TYPE_LABEL, displayDate, peso, isFinancialType } from './endorsement_shared';
import CtplEndorsementModal from './ctpl_endorsement_modal';

// Endorsement history + "New Endorsement" for one issued CTPL policy - shown
// inside the policy quick-preview modal in ctpl_application_list.tsx.

interface Props {
  app: CtplApplication;
  // The API is live (App.tsx's ctplConnected) - endorsements only exist
  // server-side, so there's nothing to show against mock data.
  connected: boolean;
  // Called after an endorsement that changes the policy itself (every
  // non-financial one) so App.tsx can reload the application list.
  onPolicyChanged: () => void;
  notify: (message: string) => void;
}

export default function CtplPolicyEndorsements({ app, connected, onPolicyChanged, notify }: Props) {
  const [endorsements, setEndorsements] = useState<EndorsementApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  // Callers pass a fresh notify each render - keep it out of load's deps.
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const load = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      setEndorsements(await endorsementsApi.list({ product: 'CTPL', applicationId: app.id }));
    } catch (err) {
      notifyRef.current(err instanceof ApiError ? err.message : 'Failed to load endorsements.');
    } finally {
      setLoading(false);
    }
  }, [app.id, connected]);

  useEffect(() => { void load(); }, [load]);

  const isCancelled = app.status === 'Reversed';
  const hasOpenFinancial = endorsements.some((e) => e.status === 'Pending' || e.status === 'Reviewed');

  const handleSubmitted = (created: EndorsementApi) => {
    setIsCreating(false);
    setExpandedId(created.id);
    if (created.type === 'Non_Financial') {
      notify(`Endorsement ${created.endorsementNumber} issued.`);
      onPolicyChanged();
    } else {
      notify(`${ENDORSEMENT_TYPE_LABEL[created.type]} submitted for review.`);
    }
    void load();
  };

  return (
    <div className="sm:col-span-2 border-t border-slate-100 pt-3 space-y-2 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-slate-500 uppercase text-[10px] tracking-wide dark:text-slate-500">Endorsements</span>
        {connected && !isCancelled && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#002f6c] hover:bg-[#00224f] text-white text-[11px] font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Endorsement
          </button>
        )}
      </div>

      {!connected && <p className="text-[11px] font-semibold text-slate-400">Endorsements need the live backend — this list is showing sample data.</p>}
      {isCancelled && <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">This policy has been cancelled — no further endorsements can be made.</p>}
      {hasOpenFinancial && !isCancelled && (
        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">A financial endorsement is awaiting approval — another one can't be requested until it's decided.</p>
      )}
      {connected && !loading && endorsements.length === 0 && <p className="text-[11px] font-semibold text-slate-400">No endorsements yet.</p>}

      <div className="space-y-1.5">
        {endorsements.map((e) => (
          <div key={e.id} className="rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left cursor-pointer hover:bg-slate-50 rounded-xl dark:hover:bg-slate-800/60"
            >
              <span className="flex flex-wrap items-center gap-2">
                <EndorsementStatusBadge status={e.status} />
                <span className="font-bold text-slate-800 dark:text-slate-200">{ENDORSEMENT_TYPE_LABEL[e.type]}</span>
                <span className="font-mono text-[11px] text-slate-500">{e.endorsementNumber ?? ''}</span>
              </span>
              <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                {isFinancialType(e.type) && <span className="font-mono">{(e.total ?? 0) < 0 ? '−' : '+'}{peso(e.total)}</span>}
                {displayDate(e.effectiveDate)}
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === e.id ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {expandedId === e.id && (
              <div className="px-3 pb-3 pt-1">
                <EndorsementDetail endorsement={e} onError={notify} />
              </div>
            )}
          </div>
        ))}
      </div>

      {isCreating && (
        <CtplEndorsementModal
          app={app}
          onClose={() => setIsCreating(false)}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  );
}
