import { useState } from 'react';
import { Search, Wallet, Printer, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PrintableDocumentModal, DocRow } from './policy_documents';

// Shared presentational shell for a per-product Payment Transactions page.
// OFW/CTPL/GTP are straight-through, one-time website payments (no
// installment ledger like PD Life), so this is a flat list of already-paid
// transactions rather than a per-policy payment history. Each product gets
// its own thin wrapper file (ofw_payment_transactions.tsx etc.) that maps
// its own application data into `PaymentRow`s - this file has no per-product
// knowledge of its own.
export interface PaymentRow {
  id: string;
  // Identifying fields used to correlate a non-life payment record back to
  // its source application: Policy Number once issued, and the Reference
  // No. generated at the moment payment was confirmed.
  policyNumber: string;
  referenceNo: string;
  payorName: string;
  planLabel: string;
  premium: string;
  dateReceived: string;
}

interface Props {
  productLabel: string;
  accentColor: string;
  rows: PaymentRow[];
  // Manually recording a transaction is a cashier-only action - the caller
  // (ofw_/ctpl_/gtp_payment_transactions.tsx) resolves this from the
  // logged-in user's role, same as the consolidated Non-Life Pay Tran tab.
  canCreate?: boolean;
}

const ITEMS_PER_PAGE = 20;

const EMPTY_DRAFT = {
  policyNumber: '',
  referenceNo: '',
  payorName: '',
  planLabel: '',
  premium: '',
  dateReceived: '',
};

export default function ProductPaymentTransactions({ productLabel, accentColor, rows, canCreate = false }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);
  // Manually entered rows don't correspond to a mock application row - a
  // cashier logs the payment they just took directly, same pattern as
  // nonlife_payment_transactions.tsx's manualEntries.
  const [manualEntries, setManualEntries] = useState<PaymentRow[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: PaymentRow = {
      id: `MANUAL-${Date.now()}`,
      policyNumber: draft.policyNumber.trim() || '—',
      referenceNo: draft.referenceNo.trim() || '—',
      payorName: draft.payorName.trim(),
      planLabel: draft.planLabel.trim(),
      premium: draft.premium.trim(),
      dateReceived: draft.dateReceived,
    };
    setManualEntries((prev) => [entry, ...prev]);
    setDraft(EMPTY_DRAFT);
    setIsCreating(false);
  };

  const allRows = [...manualEntries, ...rows];
  const filteredRows = allRows.filter(
    (r) =>
      r.payorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referenceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedRows = filteredRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const viewingRow = viewingId ? allRows.find((r) => r.id === viewingId) ?? null : null;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900 dark:text-slate-100">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Wallet className="h-6 w-6" style={{ color: accentColor }} />
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider font-['Montserrat']" style={{ color: accentColor }}>
              {productLabel} PAYMENT TRANSACTIONS
            </h1>
            <p className="text-xs text-slate-500 font-semibold dark:text-slate-500">
              One-time payment records &mdash; straight-through website payment, no installment ledger
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={() => { setDraft(EMPTY_DRAFT); setIsCreating(true); }}
            className="flex items-center space-x-2 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            <Plus className="w-4 h-4" />
            <span>Enter New Transaction</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search by payor name, policy no., or reference no..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-[#d0112b] hover:bg-red-50 transition-colors cursor-pointer dark:border-slate-700 dark:hover:bg-red-950/30"
            title="Clear Search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-slate-800 font-extrabold uppercase tracking-wider dark:border-slate-700 dark:text-slate-100">
                <th className="py-3 px-2">Policy Number</th>
                <th className="py-3 px-2">Reference No.</th>
                <th className="py-3 px-2">Payor</th>
                <th className="py-3 px-2">Plan</th>
                <th className="py-3 px-2">Premium</th>
                <th className="py-3 px-2">Date Paid</th>
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-bold dark:text-slate-500">
                    No paid transactions match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{row.policyNumber}</td>
                    <td className="py-3.5 px-2 font-bold text-slate-700 dark:text-slate-300">{row.referenceNo}</td>
                    <td className="py-3.5 px-2 font-extrabold text-slate-800 dark:text-slate-100">{row.payorName}</td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{row.planLabel}</td>
                    <td className="py-3.5 px-2 font-black" style={{ color: accentColor }}>{row.premium}</td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{row.dateReceived}</td>
                    <td className="py-3.5 px-2 text-center">
                      <button
                        onClick={() => setViewingId(row.id)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-[#008cb4] hover:text-white text-slate-700 transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                        title="View / Print Receipt"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-y-2 pt-4 mt-4 border-t border-slate-200 px-2 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-semibold dark:text-slate-400">
              Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> records
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <div className="text-xs font-bold text-slate-700 px-2 dark:text-slate-300">Page {currentPage} of {totalPages}</div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {viewingRow && (
        <PrintableDocumentModal title="Payment Receipt" onClose={() => setViewingId(null)}>
          <DocRow label="Policy Number" value={viewingRow.policyNumber} />
          <DocRow label="Reference No." value={viewingRow.referenceNo} />
          <DocRow label="Payor" value={viewingRow.payorName} />
          <DocRow label="Plan" value={viewingRow.planLabel} />
          <DocRow label="Amount Paid" value={viewingRow.premium} />
          <DocRow label="Date Paid" value={viewingRow.dateReceived} />
          <DocRow label="Payment Type" value="One-Time Payment (Straight-Through Website Payment)" />
          <p className="text-center text-emerald-700 font-black uppercase tracking-widest text-sm pt-4 mt-2 border-t border-dashed border-slate-300">
            Paid in Full
          </p>
        </PrintableDocumentModal>
      )}

      {/* Enter New Transaction Modal (Cashier / Admin only) */}
      {isCreating && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 space-y-5 font-sans my-6 dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 uppercase dark:text-white">Enter New {productLabel} Transaction</h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#d0112b] hover:bg-red-50 cursor-pointer dark:hover:bg-red-950/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <label className="space-y-1">
                <span className="font-bold text-slate-600 uppercase tracking-wide dark:text-slate-400">Policy Number</span>
                <input
                  required
                  value={draft.policyNumber}
                  onChange={(e) => setDraft((d) => ({ ...d, policyNumber: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-[#008cb4] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </label>

              <label className="space-y-1">
                <span className="font-bold text-slate-600 uppercase tracking-wide dark:text-slate-400">Reference No.</span>
                <input
                  required
                  value={draft.referenceNo}
                  onChange={(e) => setDraft((d) => ({ ...d, referenceNo: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-[#008cb4] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </label>

              <label className="col-span-2 space-y-1">
                <span className="font-bold text-slate-600 uppercase tracking-wide dark:text-slate-400">Payor Name</span>
                <input
                  required
                  value={draft.payorName}
                  onChange={(e) => setDraft((d) => ({ ...d, payorName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-[#008cb4] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </label>

              <label className="col-span-2 space-y-1">
                <span className="font-bold text-slate-600 uppercase tracking-wide dark:text-slate-400">Plan</span>
                <input
                  required
                  value={draft.planLabel}
                  onChange={(e) => setDraft((d) => ({ ...d, planLabel: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-[#008cb4] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </label>

              <label className="space-y-1">
                <span className="font-bold text-slate-600 uppercase tracking-wide dark:text-slate-400">Premium</span>
                <input
                  required
                  placeholder="₱0.00"
                  value={draft.premium}
                  onChange={(e) => setDraft((d) => ({ ...d, premium: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-[#008cb4] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </label>

              <label className="space-y-1">
                <span className="font-bold text-slate-600 uppercase tracking-wide dark:text-slate-400">Date Paid</span>
                <input
                  required
                  type="date"
                  value={draft.dateReceived}
                  onChange={(e) => setDraft((d) => ({ ...d, dateReceived: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-[#008cb4] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                Save Transaction
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
