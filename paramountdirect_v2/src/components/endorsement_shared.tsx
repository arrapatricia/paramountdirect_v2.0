import { useState } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { documentsApi, ApiError, type EndorsementApi, type EndorsementStatusApi, type EndorsementTypeApi, type EndorsementAmountsApi } from '../lib/api';

// Shared by the policy-level endorsement list/form (ctpl_endorsement_modal.tsx)
// and the approval queue (endorsements_queue.tsx).

export const ENDORSEMENT_TYPE_LABEL: Record<EndorsementTypeApi, string> = {
  Non_Financial: 'Non-Financial',
  Term_Extension: 'Term Extension',
  Cancellation_Flat: 'Flat Cancellation',
  Cancellation_Pro_Rata: 'Pro Rata Cancellation',
};

export const isFinancialType = (type: EndorsementTypeApi) => type !== 'Non_Financial';

// Mirrors APPROVER_ROLES in server/src/routes/endorsements.ts - the server
// is the one that enforces it; this only decides which buttons to show.
export const ENDORSEMENT_APPROVER_ROLES: Record<string, string[]> = {
  CTPL: ['System Admin', 'Non-Life Admin', 'CTPL Admin'],
  OFW: ['System Admin', 'Non-Life Admin', 'OFW Admin'],
  GTP: ['System Admin', 'Non-Life Admin', 'GTP Admin'],
};

export const canApproveEndorsements = (product: string, role: string | null) =>
  !!role && (ENDORSEMENT_APPROVER_ROLES[product] ?? []).includes(role);

// Labels for GeneratedDocument.docKey values an endorsement can issue - see
// server/src/services/ctplEndorsementDocuments.ts.
const DOC_LABEL: Record<string, string> = {
  'ctpl-endorsement': 'Endorsement',
  'ctpl-endorsement-service-invoice': 'Service Invoice',
  'ctpl-credit-memo': 'Credit Memo',
};

export const peso = (n: number | null | undefined) =>
  `₱${Math.abs(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const displayDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' }) : '—';

// yyyy-mm-dd in Manila time, for <input type="date"> values.
export const toDateInput = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Date(date.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
};

export const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] focus:border-transparent disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
export const labelClass = 'text-xs font-bold text-slate-700 block mb-1 dark:text-slate-300';

const STATUS_STYLE: Record<EndorsementStatusApi, string> = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  Reviewed: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  Denied: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
};

export function EndorsementStatusBadge({ status }: { status: EndorsementStatusApi }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold ${STATUS_STYLE[status]}`}>{status}</span>;
}

// Premium breakdown table. Negative totals are refunds (cancellation).
export function AmountsTable({ amounts, title }: { amounts: EndorsementAmountsApi | EndorsementApi; title?: string }) {
  const isRefund = (amounts.total ?? 0) < 0;
  const rows: [string, number | null][] = [
    [isRefund ? 'Return Premium' : 'Additional Premium', amounts.premium],
    ['Documentary Stamps', amounts.dst],
    ['Value Added Tax', amounts.vat],
    ['Local Government Tax', amounts.lgt],
    ['Other Fees / Charges', amounts.otherFees],
  ];
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-700">
      {title && <div className="px-3 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">{title}</div>}
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300">{label}</td>
              <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-800 dark:text-slate-100">{peso(value)}</td>
            </tr>
          ))}
          <tr className="border-t border-slate-200 bg-[#ebf3fc] dark:border-slate-700 dark:bg-[#49b1ea]/10">
            <td className="px-3 py-2 font-black uppercase text-[#002f6c] dark:text-[#49b1ea]">{isRefund ? 'Total Refund' : 'Total Additional Premium'}</td>
            <td className="px-3 py-2 text-right font-mono font-black text-[#002f6c] dark:text-[#49b1ea]">{peso(amounts.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function EndorsementDocuments({ endorsement, onError }: { endorsement: EndorsementApi; onError: (message: string) => void }) {
  const [opening, setOpening] = useState<string | null>(null);
  if (endorsement.status !== 'Approved') return null;

  // Latest copy per docKey (documents come back newest first).
  const latest = endorsement.documents.filter((d, i, all) => all.findIndex((x) => x.docKey === d.docKey) === i);

  const open = async (id: string) => {
    setOpening(id);
    try {
      const { url } = await documentsApi.getUrl(id);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to open document.');
    } finally {
      setOpening(null);
    }
  };

  if (latest.length === 0) {
    return <p className="text-[11px] font-semibold text-slate-400">Documents are still being generated — refresh in a moment.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {latest.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => open(d.id)}
          disabled={opening === d.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-[#002f6c] hover:bg-slate-50 cursor-pointer disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-[#49b1ea] dark:hover:bg-slate-700"
        >
          <FileText className="w-3.5 h-3.5" />
          {DOC_LABEL[d.docKey] ?? d.docKey}
          <ExternalLink className="w-3 h-3 opacity-60" />
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-slate-400 font-bold block text-[11px] dark:text-slate-500">{label}</span>
      <span className="font-bold text-slate-800 text-xs dark:text-slate-200">{children}</span>
    </div>
  );
}

// Everything recorded on one endorsement - what changed / what it costs,
// and who requested, reviewed and decided it.
export function EndorsementDetail({ endorsement: e, onError }: { endorsement: EndorsementApi; onError: (message: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="Type">{ENDORSEMENT_TYPE_LABEL[e.type]}</Field>
        <Field label="Status"><EndorsementStatusBadge status={e.status} /></Field>
        <Field label="Endorsement No.">{e.endorsementNumber ?? 'Assigned on approval'}</Field>
        <Field label="Policy No."><span className="font-mono">{e.policyNumber}</span></Field>
        <Field label={e.type.startsWith('Cancellation') ? 'Cancellation Date' : 'Effective Date'}>{displayDate(e.effectiveDate)}</Field>
        <Field label="Reason">{e.reason || '—'}</Field>
        {e.type === 'Term_Extension' && (
          <>
            <Field label="Current Expiry">{displayDate(e.previousExpiryDate)}</Field>
            <Field label="New Expiry">{displayDate(e.newExpiryDate)}</Field>
            <Field label="Service Invoice No.">{e.invoiceNumber ?? 'Assigned on approval'}</Field>
          </>
        )}
        {e.type.startsWith('Cancellation') && <Field label="Credit Memo No.">{e.creditMemoNumber ?? 'Assigned on approval'}</Field>}
      </div>

      {e.type === 'Non_Financial' && (
        e.withDeedOfSale && (e.changes ?? []).length === 0 ? null : (
          <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-700">
            <div className="px-3 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Changes {e.withDeedOfSale && '— Transfer of ownership (with Deed of Sale)'}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase text-slate-400">
                  <th className="px-3 py-1.5">Field</th><th className="px-3 py-1.5">From</th><th className="px-3 py-1.5">To</th>
                </tr>
              </thead>
              <tbody>
                {(e.changes ?? []).map((c) => (
                  <tr key={c.field} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-300">{c.label}</td>
                    <td className="px-3 py-1.5 text-slate-500 line-through dark:text-slate-500">{c.from || '—'}</td>
                    <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white">{c.to || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {isFinancialType(e.type) && <AmountsTable amounts={e} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] border-t border-slate-100 pt-3 dark:border-slate-800">
        <div>
          <span className="text-slate-400 font-bold block">Requested</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{e.requestedBy} · {displayDate(e.createdAt)}</span>
        </div>
        {isFinancialType(e.type) && (
          <div>
            <span className="text-slate-400 font-bold block">Reviewed</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{e.reviewedBy ? `${e.reviewedBy} · ${displayDate(e.reviewedAt)}` : '—'}</span>
            {e.reviewRemarks && <span className="block text-slate-500 italic">“{e.reviewRemarks}”</span>}
          </div>
        )}
        <div>
          <span className="text-slate-400 font-bold block">{e.status === 'Denied' ? 'Denied' : 'Approved'}</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{e.decidedBy ? `${e.decidedBy} · ${displayDate(e.decidedAt)}` : '—'}</span>
          {e.decisionRemarks && <span className="block text-slate-500 italic">“{e.decisionRemarks}”</span>}
        </div>
      </div>

      <EndorsementDocuments endorsement={e} onError={onError} />
    </div>
  );
}
