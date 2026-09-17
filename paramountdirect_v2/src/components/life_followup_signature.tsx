import { useMemo, useState } from 'react';
import {
  Search, Stamp, Printer, FileText, Mail, CheckCircle2, Clock, Send,
  ShieldCheck, ShieldAlert, Inbox, FileSignature,
} from 'lucide-react';
import type { ScreeningItem } from '../App';
import { PrintableDocumentModal, DocRow } from './policy_documents';
import { buildFollowUpRows, isUnsigned, type FollowUpRow } from './followup_signature_data';

interface Props {
  data: ScreeningItem[];
  // Shared with Signed Applications - marking a policy signed here also
  // marks it signed there, and vice versa.
  signedIds: string[];
  onMarkSigned: (id: string) => void;
}

type FilterMode = 'all' | 'unsigned' | 'followed-up' | 'signed';

function todayFormatted(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}

const getPolicyStatusStyle = (status: string) =>
  status === 'LAPSED'
    ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
    : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';

export default function LifeFollowupSignature({ data, signedIds, onMarkSigned }: Props) {
  const baseRows = useMemo(() => buildFollowUpRows(data, signedIds), [data, signedIds]);

  // Logging a follow-up is a real action here (not just a display), so it's
  // tracked as an override layered on top of the derived rows rather than
  // trying to persist it back onto ScreeningItem, which has no such fields.
  const [overrides, setOverrides] = useState<Record<string, { latestPrintFollowUp?: string; latestEmailFollowUp?: string }>>({});
  const rows: FollowUpRow[] = baseRows.map((row) => ({ ...row, ...overrides[row.id] }));

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('unsigned');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [printDoc, setPrintDoc] = useState<{ id: string; kind: 'letter' | 'appform' } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2500);
  };

  // Once a policy is signed it's resolved - it no longer counts toward the
  // unsigned/followed-up chasing buckets, only its own "Signed" bucket.
  const activeRows = rows.filter((row) => !row.signed);
  const unsignedCount = activeRows.filter(isUnsigned).length;
  const followedUpCount = activeRows.length - unsignedCount;
  const signedCount = rows.length - activeRows.length;

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      row.payor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.policyNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterMode === 'all' ? true :
      filterMode === 'signed' ? row.signed :
      filterMode === 'unsigned' ? (!row.signed && isUnsigned(row)) :
      (!row.signed && !isUnsigned(row));
    return matchesSearch && matchesFilter;
  });

  const selectedRow = selectedId ? rows.find((r) => r.id === selectedId) ?? null : null;
  const printRow = printDoc ? rows.find((r) => r.id === printDoc.id) ?? null : null;

  const logFollowUp = (id: string, channel: 'print' | 'email') => {
    setOverrides((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...(channel === 'print' ? { latestPrintFollowUp: todayFormatted() } : { latestEmailFollowUp: todayFormatted() }),
      },
    }));
    notify(`${channel === 'print' ? 'Print' : 'Email'} follow-up logged for today.`);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1500px] mx-auto font-sans text-slate-900 dark:text-slate-100">

      {/* Header */}
      <div className="flex items-center space-x-2.5 border-b pb-4 border-slate-200 dark:border-slate-800">
        <Stamp className="h-6 w-6 text-[#d0112b]" />
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
            FOLLOW-UP SIGNATURE
          </h1>
          <p className="text-xs text-slate-500 font-semibold dark:text-slate-500">Issued policies awaiting the client's signed application form</p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide dark:text-slate-500">Issued Policies</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{rows.length.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide dark:text-slate-500">Unsigned</p>
          <p className="text-2xl font-black text-[#d0112b]">{unsignedCount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide dark:text-slate-500">Followed Up</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{followedUpCount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide dark:text-slate-500">Signed</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{signedCount.toLocaleString()}</p>
        </div>
      </div>

      {/* Master-detail layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

        {/* List panel */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col max-h-[720px]">
          <div className="p-4 space-y-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search payor or policy number..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d0112b] dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {([
                { key: 'unsigned', label: `Unsigned (${unsignedCount})` },
                { key: 'followed-up', label: 'Followed Up' },
                { key: 'signed', label: `Signed (${signedCount})` },
                { key: 'all', label: 'All' },
              ] as { key: FilterMode; label: string }[]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterMode(tab.key)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                    filterMode === tab.key
                      ? 'bg-white text-[#d0112b] shadow-sm dark:bg-slate-900'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRows.length === 0 ? (
              <div className="p-8 flex flex-col items-center text-center space-y-2">
                <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">No policies match this view.</p>
              </div>
            ) : (
              filteredRows.map((row) => {
                const unsigned = isUnsigned(row);
                const isSelected = row.id === selectedId;
                return (
                  <button
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer border-l-4 ${
                      isSelected
                        ? 'border-l-[#d0112b] bg-red-50/60 dark:bg-red-950/20'
                        : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{row.payor}</span>
                      {row.signed ? (
                        <FileSignature className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      ) : unsigned ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-[#008cb4] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-[#008cb4] font-mono">{row.policyNumber}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{row.planCode} &middot; {row.planDesc}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-bold ${getPolicyStatusStyle(row.policyStatus)}`}>
                        {row.policyStatus}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 min-h-[400px]">
          {!selectedRow ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-10 space-y-3">
              <Stamp className="w-10 h-10 text-slate-200 dark:text-slate-800" />
              <p className="text-sm font-bold text-slate-400 dark:text-slate-600">Select a policy from the list to see its follow-up details.</p>
            </div>
          ) : (
            <div className="p-6 md:p-8 space-y-8">
              {/* Policy summary */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedRow.payor}</h2>
                  <p className="text-sm font-bold text-[#008cb4] font-mono">{selectedRow.policyNumber}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1 dark:text-slate-400">{selectedRow.planCode} - {selectedRow.planDesc} &middot; {selectedRow.premium}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRow.signed && (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      <FileSignature className="w-3.5 h-3.5" /><span>Signed</span>
                    </span>
                  )}
                  <span className={`inline-flex px-3 py-1.5 rounded-xl border text-xs font-bold ${getPolicyStatusStyle(selectedRow.policyStatus)}`}>
                    {selectedRow.policyStatus}
                  </span>
                </div>
              </div>

              {/* Key dates */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><p className="text-[10px] font-extrabold text-slate-400 uppercase dark:text-slate-500">Received</p><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedRow.dateReceived}</p></div>
                <div><p className="text-[10px] font-extrabold text-slate-400 uppercase dark:text-slate-500">Issued</p><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedRow.dateIssued}</p></div>
                <div><p className="text-[10px] font-extrabold text-slate-400 uppercase dark:text-slate-500">Shipped</p><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedRow.dateShipped || '—'}</p></div>
                <div><p className="text-[10px] font-extrabold text-slate-400 uppercase dark:text-slate-500">Effectivity</p><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedRow.effectivityDate}</p></div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mb-4 dark:text-slate-500">Signature Follow-Up Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-[#d0112b] flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-3.5 h-3.5 text-white" /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Policy Issued</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedRow.dateIssued}</p>
                    </div>
                  </div>
                  {selectedRow.dateShipped && (
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0 dark:bg-slate-700"><Send className="w-3.5 h-3.5 text-white" /></div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Application Form Shipped</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedRow.dateShipped}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${selectedRow.latestPrintFollowUp ? 'bg-[#008cb4]' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      <Printer className={`w-3.5 h-3.5 ${selectedRow.latestPrintFollowUp ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Print Follow-Up</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedRow.latestPrintFollowUp || 'Not sent yet'}</p>
                      </div>
                      {!selectedRow.latestPrintFollowUp && (
                        <button
                          onClick={() => logFollowUp(selectedRow.id, 'print')}
                          className="text-[11px] font-bold text-[#008cb4] hover:underline cursor-pointer flex items-center space-x-1"
                        >
                          <Clock className="w-3 h-3" /><span>Log as sent today</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${selectedRow.latestEmailFollowUp ? 'bg-purple-500' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      <Mail className={`w-3.5 h-3.5 ${selectedRow.latestEmailFollowUp ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Email Follow-Up</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedRow.latestEmailFollowUp || 'Not sent yet'}</p>
                      </div>
                      {!selectedRow.latestEmailFollowUp && (
                        <button
                          onClick={() => logFollowUp(selectedRow.id, 'email')}
                          className="text-[11px] font-bold text-purple-600 hover:underline cursor-pointer flex items-center space-x-1 dark:text-purple-400"
                        >
                          <Clock className="w-3 h-3" /><span>Log as sent today</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedRow.signed && (
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0"><FileSignature className="w-3.5 h-3.5 text-white" /></div>
                      <div>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Client Signature Received</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Signed application form is on file</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setPrintDoc({ id: selectedRow.id, kind: 'letter' })}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Printer className="w-4 h-4" /><span>Print Letter</span>
                </button>
                <button
                  onClick={() => setPrintDoc({ id: selectedRow.id, kind: 'appform' })}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <FileText className="w-4 h-4" /><span>Print Application Form</span>
                </button>
                {!selectedRow.signed && isUnsigned(selectedRow) && (
                  <button
                    onClick={() => { logFollowUp(selectedRow.id, 'email'); }}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#d0112b] text-white text-xs font-bold hover:bg-[#a80d22] cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" /><span>Send Follow-Up Email Now</span>
                  </button>
                )}
                {!selectedRow.signed ? (
                  <button
                    onClick={() => { onMarkSigned(selectedRow.id); notify('Marked as signed - also updated on Signed Applications.'); }}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-md ml-auto"
                  >
                    <FileSignature className="w-4 h-4" /><span>Mark as Signed</span>
                  </button>
                ) : (
                  <span className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold dark:bg-emerald-950/30 dark:text-emerald-400 ml-auto">
                    <CheckCircle2 className="w-4 h-4" /><span>Signed - resolved</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Letter / Application Form */}
      {printRow && printDoc && (
        <PrintableDocumentModal
          title={printDoc.kind === 'letter' ? 'Follow-Up Signature Letter' : 'Application Form Recap'}
          onClose={() => setPrintDoc(null)}
        >
          {printDoc.kind === 'letter' ? (
            <>
              <p className="text-[11px] leading-relaxed text-slate-700 border-b border-dashed border-slate-300 pb-3">
                Dear <strong>{printRow.payor}</strong>, our records show that Policy No. <strong>{printRow.policyNumber}</strong> has been issued effective <strong>{printRow.effectivityDate}</strong>, but we have not yet received your signed copy of the application form. Kindly sign and return the enclosed application form at your earliest convenience so we can complete your policy file.
              </p>
              <DocRow label="Policy Number" value={printRow.policyNumber} />
              <DocRow label="Insured" value={printRow.payor} />
              <DocRow label="Plan" value={`${printRow.planCode} - ${printRow.planDesc}`} />
              <DocRow label="Date Issued" value={printRow.dateIssued} />
              <DocRow label="Effectivity Date" value={printRow.effectivityDate} />
            </>
          ) : (
            <>
              <DocRow label="Policy Number" value={printRow.policyNumber} />
              <DocRow label="Insured" value={printRow.payor} />
              <DocRow label="Plan" value={`${printRow.planCode} - ${printRow.planDesc}`} />
              <DocRow label="Premium" value={printRow.premium} />
              <DocRow label="Date Received" value={printRow.dateReceived} />
              <DocRow label="Date Issued" value={printRow.dateIssued} />
            </>
          )}
        </PrintableDocumentModal>
      )}

      {/* Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
