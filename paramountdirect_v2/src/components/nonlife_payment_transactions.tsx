import React, { useState } from 'react';
import { Search, Wallet, Printer, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PrintableDocumentModal, DocRow } from './policy_documents';
import type { CtplApplication } from './ctpl_types';
import type { OfwApplication } from './ofw_types';
import type { GtpApplication } from './gtp_types';

// Consolidated Non-Life Payment Transactions view, living inside the main
// Pay Tran page alongside PD Life. CTPL/OFW/GTP are straight-through,
// one-time website payments with no installment ledger, so each paid
// application becomes a single row here rather than a per-policy payment
// history. Since none of the three products share a table, rows are
// correlated by Policy Number (assigned once issued) and Reference No.
// (the OR/reference number generated at the moment payment is confirmed)
// instead of a real database FK.
type NonLifeProduct = 'CTPL' | 'OFW' | 'GTP';

interface NonLifePaymentRow {
  key: string;
  product: NonLifeProduct;
  policyNumber: string;
  referenceNo: string;
  payorName: string;
  planLabel: string;
  premium: string;
  dateReceived: string;
}

interface Props {
  ctplData: CtplApplication[];
  ofwData: OfwApplication[];
  gtpData: GtpApplication[];
  // Manually recording a transaction is a cashier-only action - the caller
  // (payment_transactions.tsx) resolves this from the logged-in user's role.
  canCreate?: boolean;
}

const PRODUCT_ACCENT: Record<NonLifeProduct, string> = {
  CTPL: '#002f6c',
  OFW: '#008cb4',
  GTP: '#7c3aed',
};

const ITEMS_PER_PAGE = 20;

const EMPTY_DRAFT = {
  product: 'CTPL' as NonLifeProduct,
  policyNumber: '',
  referenceNo: '',
  payorName: '',
  planLabel: '',
  premium: '',
  dateReceived: '',
};

export default function NonLifePaymentTransactions({ ctplData, ofwData, gtpData, canCreate = false }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<'All' | NonLifeProduct>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingKey, setViewingKey] = useState<string | null>(null);
  // Manually recorded transactions don't correspond to a mock application
  // row (isPaid, etc.) - a cashier logs the payment they just took directly.
  const [manualEntries, setManualEntries] = useState<NonLifePaymentRow[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: NonLifePaymentRow = {
      key: `MANUAL-${draft.product}-${Date.now()}`,
      product: draft.product,
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

  const rows: NonLifePaymentRow[] = [
    ...manualEntries,
    ...ctplData
      .filter((d) => d.isPaid)
      .map((d) => ({
        key: `CTPL-${d.id}`,
        product: 'CTPL' as const,
        policyNumber: d.policyNumber ?? '—',
        referenceNo: d.referenceNo ?? '—',
        payorName: `${d.ownerFirstName} ${d.ownerMiddleName} ${d.ownerSurname}`,
        planLabel: `${d.policyType} — ${d.mvType}`,
        premium: d.premium,
        dateReceived: d.dateReceived,
      })),
    ...ofwData
      .filter((d) => d.isPaid)
      .map((d) => ({
        key: `OFW-${d.id}`,
        product: 'OFW' as const,
        policyNumber: d.policyNumber ?? '—',
        referenceNo: d.referenceNo ?? '—',
        payorName: `${d.firstName} ${d.middleName} ${d.lastName}`,
        planLabel: `${d.coverageType} OFW Insurance`,
        premium: d.premium,
        dateReceived: d.dateReceived,
      })),
    ...gtpData
      .filter((d) => d.isPaid)
      .map((d) => ({
        key: `GTP-${d.id}`,
        product: 'GTP' as const,
        policyNumber: d.policyNumber ?? '—',
        referenceNo: d.referenceNo ?? '—',
        payorName: `${d.travelerFirstName} ${d.travelerSurname}`,
        planLabel: `${d.planVariant} — ${d.destinations.join(', ')}`,
        premium: d.premium,
        dateReceived: d.dateReceived,
      })),
  ];

  const filteredRows = rows.filter((r) => {
    const matchesProduct = selectedProduct === 'All' || r.product === selectedProduct;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      r.payorName.toLowerCase().includes(term) ||
      r.policyNumber.toLowerCase().includes(term) ||
      r.referenceNo.toLowerCase().includes(term);
    return matchesProduct && matchesSearch;
  });

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedRows = filteredRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const viewingRow = viewingKey ? rows.find((r) => r.key === viewingKey) ?? null : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5">
          <Wallet className="h-6 w-6 text-slate-500" />
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider font-['Montserrat'] text-slate-700 dark:text-slate-200">
              Non-Life Payment Transactions
            </h2>
            <p className="text-xs text-slate-500 font-semibold dark:text-slate-500">
              CTPL, OFW &amp; GTP — one-time payment records, correlated by Policy Number and Reference No.
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={() => { setDraft(EMPTY_DRAFT); setIsCreating(true); }}
            className="flex items-center space-x-2 bg-[#008cb4] hover:bg-[#007396] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Transaction</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
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

        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">Product:</span>
          <select
            value={selectedProduct}
            onChange={(e) => { setSelectedProduct(e.target.value as 'All' | NonLifeProduct); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          >
            <option value="All">All Products</option>
            <option value="CTPL">CTPL</option>
            <option value="OFW">OFW</option>
            <option value="GTP">GTP</option>
          </select>
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
                <th className="py-3 px-2">Product</th>
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
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-bold dark:text-slate-500">
                    No paid transactions match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3.5 px-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white uppercase tracking-wider"
                        style={{ backgroundColor: PRODUCT_ACCENT[row.product] }}
                      >
                        {row.product}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{row.policyNumber}</td>
                    <td className="py-3.5 px-2 font-bold text-slate-700 dark:text-slate-300">{row.referenceNo}</td>
                    <td className="py-3.5 px-2 font-extrabold text-slate-800 dark:text-slate-100">{row.payorName}</td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{row.planLabel}</td>
                    <td className="py-3.5 px-2 font-black text-[#008cb4]">{row.premium}</td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{row.dateReceived}</td>
                    <td className="py-3.5 px-2 text-center">
                      <button
                        onClick={() => setViewingKey(row.key)}
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
        <PrintableDocumentModal title="Payment Receipt" onClose={() => setViewingKey(null)}>
          <DocRow label="Product" value={viewingRow.product} />
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

      {/* Create Transaction Modal (Cashier / Admin only) */}
      {isCreating && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 space-y-5 font-sans my-6 dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 uppercase dark:text-white">Create Payment Transaction</h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#d0112b] hover:bg-red-50 cursor-pointer dark:hover:bg-red-950/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <label className="col-span-2 space-y-1">
                <span className="font-bold text-slate-600 uppercase tracking-wide dark:text-slate-400">Product</span>
                <select
                  value={draft.product}
                  onChange={(e) => setDraft((d) => ({ ...d, product: e.target.value as NonLifeProduct }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="CTPL">CTPL</option>
                  <option value="OFW">OFW</option>
                  <option value="GTP">GTP</option>
                </select>
              </label>

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
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#008cb4] hover:bg-[#007396] cursor-pointer shadow-md"
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
