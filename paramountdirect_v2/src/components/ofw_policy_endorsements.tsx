import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import type { OfwApplication } from './ofw_types';
import { endorsementsApi, ApiError, type EndorsementApi } from '../lib/api';
import { EndorsementDetail, EndorsementStatusBadge, ENDORSEMENT_TYPE_LABEL, displayDate, peso, isFinancialType } from './endorsement_shared';

// Endorsement history for one issued OFW policy - shown inside the policy
// quick-preview modal in ofw_application_list.tsx, same UI shape as CTPL's
// (see ctpl_policy_endorsements.tsx). Endorsement records themselves are
// product-agnostic server-side (GET /api/endorsements already supports OFW),
// but requesting a new one isn't wired up on the server yet - "New
// Endorsement" is a placeholder until that lands.

interface Props {
  app: OfwApplication;
  // The API is live (App.tsx's ofwConnected) - endorsements only exist
  // server-side, so there's nothing to show against mock data.
  connected: boolean;
  notify: (message: string) => void;
}

export default function OfwPolicyEndorsements({ app, connected, notify }: Props) {
  const [endorsements, setEndorsements] = useState<EndorsementApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Callers pass a fresh notify each render - keep it out of load's deps.
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const load = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      setEndorsements(await endorsementsApi.list({ product: 'OFW', applicationId: app.id }));
    } catch (err) {
      notifyRef.current(err instanceof ApiError ? err.message : 'Failed to load endorsements.');
    } finally {
      setLoading(false);
    }
  }, [app.id, connected]);

  useEffect(() => { void load(); }, [load]);

  const isCancelled = app.status === 'Reversed';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-slate-500 uppercase text-[10px] tracking-wide dark:text-slate-500">Endorsements</span>
        {connected && !isCancelled && (
          <button
            type="button"
            onClick={() => notify('OFW endorsement requests are coming soon.')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#002f6c] hover:bg-[#00224f] text-white text-[11px] font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Endorsement
          </button>
        )}
      </div>

      {!connected && <p className="text-[11px] font-semibold text-slate-400">Endorsements need the live backend — this list is showing sample data.</p>}
      {isCancelled && <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">This policy has been reversed — no further endorsements can be made.</p>}
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
    </div>
  );
}
