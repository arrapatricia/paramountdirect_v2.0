import React from 'react';
import { Lock, Printer, Send, X } from 'lucide-react';

export interface PolicyDocumentSpec {
  key: string;
  label: string;
}

interface PolicyDocumentsSectionProps {
  isPaid: boolean;
  documents: PolicyDocumentSpec[];
  onView: (key: string) => void;
  onSend: (key: string) => void;
  lockedMessage?: string;
}

// Shared "documents unlock once premium payment is confirmed" pattern, used
// across OFW/CTPL/GTP application detail views. Policy Schedule, COC, Policy
// Jacket, OR, and Service Invoice are all generated documents that only
// exist once payment is fulfilled - this renders either a locked notice or
// a View/Send row per document, depending on `isPaid`.
export function PolicyDocumentsSection({ isPaid, documents, onView, onSend, lockedMessage }: PolicyDocumentsSectionProps) {
  return (
    <div className="sm:col-span-2 space-y-3">
      <div className="border-t border-slate-100 pt-3 font-extrabold text-slate-500 uppercase text-[10px] tracking-wide dark:border-slate-800 dark:text-slate-500">
        Documents
      </div>

      {!isPaid ? (
        <div className="flex items-start space-x-2 p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700">
          <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {lockedMessage ?? 'These documents will be generated automatically once the premium payment has been confirmed.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.key} className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{doc.label}</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onView(doc.key)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>View / Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSend(doc.key)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#002f6c] text-white text-[11px] font-bold hover:bg-[#00224f] cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Client</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Shared printable-document modal chrome (letterhead + Print/Close buttons),
// matching the paper-document pattern already established in
// payment_transactions.tsx. `children` is the document body.
export function PrintableDocumentModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 font-sans my-6 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 uppercase dark:text-white">{title}</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-[#008cb4] hover:bg-[#007396] text-white text-xs font-bold cursor-pointer flex items-center space-x-2 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer dark:hover:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Emulates a printed paper document - intentionally plain light
            styling in both themes, same convention as payment_transactions.tsx. */}
        <div id="printable-policy-document" className="p-8 border-2 border-slate-300 bg-white space-y-4 font-sans text-xs text-slate-800">
          <div className="border-b border-slate-300 pb-3 text-center">
            <h1 className="text-base font-extrabold text-[#d0112b] font-['Montserrat'] uppercase">
              Paramount Life &amp; General Insurance Corporation
            </h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// Row helper for printable document bodies.
export function DocRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-dashed border-slate-200 py-1.5">
      <span className="text-slate-500 font-bold">{label}</span>
      <span className="font-extrabold text-slate-900 text-right">{value}</span>
    </div>
  );
}
