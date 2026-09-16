import React, { useMemo, useState } from 'react';
import {
  Search, X, ChevronLeft, ChevronRight, ChevronDown, Stamp, Eye, Printer,
  FileText, History, Download, CheckSquare, Square, CheckCircle2,
} from 'lucide-react';
import type { ScreeningItem } from '../App';
import { PrintableDocumentModal, DocRow } from './policy_documents';

interface Props {
  data: ScreeningItem[];
}

interface FollowUpRow {
  id: string;
  payor: string;
  policyNumber: string;
  planCode: string;
  planDesc: string;
  premium: string;
  dateReceived: string;
  dateIssued: string;
  dateShipped: string; // '' = not yet shipped
  effectivityDate: string;
  policyStatus: 'INFORCE' | 'LAPSED';
  latestPrintFollowUp: string; // '' = none sent yet
  latestEmailFollowUp: string; // '' = none sent yet
}

function addDays(dateStr: string, days: number): string {
  const [mm, dd, yyyy] = dateStr.split('/').map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}

// Only issued policies have a policy number / effectivity date to chase a
// wet-ink signature for, so the queue is built from the same `screeningData`
// as Application Screening, filtered to Issued rows and deterministically
// enriched with the follow-up-specific fields the real system tracks.
function buildFollowUpRows(data: ScreeningItem[]): FollowUpRow[] {
  return data
    .filter((item) => item.status === 'Issued')
    .map((item) => {
      const seed = parseInt(item.id, 10) || 0;
      const receivedDateOnly = item.dateReceived.split(' at ')[0];
      const dateIssued = item.dateScreened !== '-' ? item.dateScreened : receivedDateOnly;
      const dateShipped = seed % 3 !== 0 ? dateIssued : '';
      const effectivityDate = addDays(dateIssued, (seed % 3) + 1);
      const policyStatus: 'INFORCE' | 'LAPSED' = seed % 11 === 0 ? 'LAPSED' : 'INFORCE';
      const latestEmailFollowUp = seed % 3 !== 0 ? addDays(effectivityDate, (seed % 5) + 1) : '';
      const latestPrintFollowUp = seed % 7 === 0 ? addDays(effectivityDate, (seed % 5) + 2) : '';
      const policyNumber = `${item.planCode}-${((seed * 37) % 900000 + 100000).toString().padStart(6, '0')}-${seed % 2}`;

      return {
        id: item.id,
        payor: item.payor,
        policyNumber,
        planCode: item.planCode,
        planDesc: item.planDesc,
        premium: item.premium,
        dateReceived: receivedDateOnly,
        dateIssued,
        dateShipped,
        effectivityDate,
        policyStatus,
        latestPrintFollowUp,
        latestEmailFollowUp,
      };
    });
}

const ITEMS_PER_PAGE = 20;

export default function LifeFollowupSignature({ data }: Props) {
  const rows = useMemo(() => buildFollowUpRows(data), [data]);

  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [unsignedOnly, setUnsignedOnly] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [printDoc, setPrintDoc] = useState<{ id: string; kind: 'letter' | 'appform' | 'both' } | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2500);
  };

  const isUnsigned = (row: FollowUpRow) => !row.latestPrintFollowUp && !row.latestEmailFollowUp;
  const unsignedCount = rows.filter(isUnsigned).length;
  const productOptions = Array.from(new Set(rows.map((r) => r.planCode))).sort();

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      row.payor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.id.includes(searchTerm);
    const matchesProduct = productFilter === 'All' || row.planCode === productFilter;
    const matchesUnsigned = !unsignedOnly || isUnsigned(row);

    let matchesDate = true;
    if (fromDate || toDate) {
      const [mm, dd, yyyy] = row.dateIssued.split('/');
      const rowDateStr = `${yyyy}-${mm}-${dd}`;
      if (fromDate && rowDateStr < fromDate) matchesDate = false;
      if (toDate && rowDateStr > toDate) matchesDate = false;
    }

    return matchesSearch && matchesProduct && matchesUnsigned && matchesDate;
  });

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedRows = filteredRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const viewingRow = viewingId ? rows.find((r) => r.id === viewingId) ?? null : null;
  const printRow = printDoc ? rows.find((r) => r.id === printDoc.id) ?? null : null;
  const historyRow = historyId ? rows.find((r) => r.id === historyId) ?? null : null;

  const handleClearFilters = () => {
    setSearchTerm('');
    setProductFilter('All');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedRows.length && paginatedRows.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRows.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBatch = (action: string) => {
    if (selectedIds.length === 0) {
      notify('Select at least one policy first.');
      return;
    }
    notify(`${action} queued for ${selectedIds.length} ${selectedIds.length === 1 ? 'policy' : 'policies'}.`);
    setSelectedIds([]);
  };

  const handleAction = (row: FollowUpRow, action: 'view' | 'print-letter' | 'print-appform' | 'view-both' | 'history') => {
    setOpenActionId(null);
    if (action === 'view') setViewingId(row.id);
    else if (action === 'print-letter') setPrintDoc({ id: row.id, kind: 'letter' });
    else if (action === 'print-appform') setPrintDoc({ id: row.id, kind: 'appform' });
    else if (action === 'view-both') setPrintDoc({ id: row.id, kind: 'both' });
    else setHistoryId(row.id);
  };

  const getPolicyStatusStyle = (status: string) =>
    status === 'LAPSED'
      ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
      : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900 dark:text-slate-100">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Stamp className="h-6 w-6 text-[#d0112b]" />
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
              FOLLOW-UP SIGNATURE
            </h1>
            <p className="text-xs text-slate-500 font-semibold dark:text-slate-500">Issued policies awaiting the client's signed application form</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
        <button
          onClick={() => { setUnsignedOnly(!unsignedOnly); setCurrentPage(1); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            unsignedOnly
              ? 'bg-[#d0112b] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Unsigned <span className="font-extrabold ml-1">{unsignedCount}</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase dark:text-slate-100">Search By</span>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Name / Policy Number"
              className="w-52 pl-3 pr-8 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4] dark:border-slate-700 dark:bg-slate-800"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#008cb4]" />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase dark:text-slate-100">Product</span>
          <select
            value={productFilter}
            onChange={(e) => { setProductFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="All">All</option>
            {productOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase dark:text-slate-100">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4] dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase dark:text-slate-100">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4] dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {(searchTerm || productFilter !== 'All' || fromDate || toDate) && (
          <button
            onClick={handleClearFilters}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-[#d0112b] hover:bg-red-50 transition-colors cursor-pointer dark:border-slate-700 dark:hover:bg-red-950/30"
            title="Clear All Filters"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="ml-auto flex items-center flex-wrap gap-x-3 gap-y-1 text-xs font-bold">
          <button onClick={() => handleBatch('Batch Email')} className="text-[#008cb4] hover:underline cursor-pointer">Batch Email</button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button onClick={() => handleBatch('Batch Print Letter')} className="text-[#008cb4] hover:underline cursor-pointer">Batch Print Letter</button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button onClick={() => handleBatch('Batch Print AppForm')} className="text-[#008cb4] hover:underline cursor-pointer">Batch Print AppForm</button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button onClick={() => handleBatch('Download')} className="text-[#008cb4] hover:underline cursor-pointer flex items-center space-x-1">
            <Download className="w-3.5 h-3.5" /><span>Download</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-slate-800 font-extrabold uppercase tracking-wider dark:border-slate-700 dark:text-slate-100">
                <th className="py-3 px-2 w-8">
                  <button onClick={toggleSelectAll} className="cursor-pointer">
                    {selectedIds.length === paginatedRows.length && paginatedRows.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-[#d0112b]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-2">ID</th>
                <th className="py-3 px-2">Payor</th>
                <th className="py-3 px-2">Policy Number</th>
                <th className="py-3 px-2">Plan</th>
                <th className="py-3 px-2">Date Received</th>
                <th className="py-3 px-2">Date Issued</th>
                <th className="py-3 px-2">Date Shipped</th>
                <th className="py-3 px-2">Effectivity Date</th>
                <th className="py-3 px-2 text-center">Policy Status</th>
                <th className="py-3 px-2">Latest Print Follow-Up</th>
                <th className="py-3 px-2">Latest Email Follow-Up</th>
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-400 font-bold dark:text-slate-500">
                    No policies match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3.5 px-2">
                      <button onClick={() => toggleSelect(row.id)} className="cursor-pointer">
                        {selectedIds.includes(row.id) ? (
                          <CheckSquare className="h-4 w-4 text-[#d0112b]" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{row.id}</td>
                    <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{row.payor}</td>
                    <td className="py-3.5 px-2">
                      <button
                        onClick={() => setViewingId(row.id)}
                        className="font-bold text-[#008cb4] hover:underline cursor-pointer"
                      >
                        {row.policyNumber}
                      </button>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">{row.planCode}</span>
                      <span className="text-[10px] font-semibold text-slate-600 ml-1.5 dark:text-slate-400">{row.planDesc}</span>
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-slate-800 dark:text-slate-200">{row.dateReceived}</td>
                    <td className="py-3.5 px-2 font-semibold text-slate-800 dark:text-slate-200">{row.dateIssued}</td>
                    <td className="py-3.5 px-2 font-semibold text-slate-800 dark:text-slate-200">
                      {row.dateShipped || <span className="text-slate-300 dark:text-slate-600">&mdash;</span>}
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-slate-800 dark:text-slate-200">{row.effectivityDate}</td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-xl border text-[11px] font-bold ${getPolicyStatusStyle(row.policyStatus)}`}>
                        {row.policyStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-2">
                      {row.latestPrintFollowUp ? (
                        <button onClick={() => handleAction(row, 'history')} className="font-bold text-[#008cb4] hover:underline cursor-pointer">
                          {row.latestPrintFollowUp}
                        </button>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">&mdash;</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2">
                      {row.latestEmailFollowUp ? (
                        <button onClick={() => handleAction(row, 'history')} className="font-bold text-[#008cb4] hover:underline cursor-pointer">
                          {row.latestEmailFollowUp}
                        </button>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">&mdash;</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-center relative">
                      <button
                        onClick={() => setOpenActionId(openActionId === row.id ? null : row.id)}
                        className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#d0112b] hover:text-white transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                        title="Actions"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {openActionId === row.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenActionId(null)} />
                          <div className="absolute right-0 top-full mt-1 z-20 w-64 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 text-left dark:bg-slate-900 dark:border-slate-700">
                            <button onClick={() => handleAction(row, 'view')} className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer dark:text-slate-200 dark:hover:bg-slate-800">
                              <Eye className="w-3.5 h-3.5 text-slate-400" /><span>View Details</span>
                            </button>
                            <button onClick={() => handleAction(row, 'print-letter')} className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer dark:text-slate-200 dark:hover:bg-slate-800">
                              <Printer className="w-3.5 h-3.5 text-slate-400" /><span>Print Letter</span>
                            </button>
                            <button onClick={() => handleAction(row, 'print-appform')} className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer dark:text-slate-200 dark:hover:bg-slate-800">
                              <FileText className="w-3.5 h-3.5 text-slate-400" /><span>Print Application Form</span>
                            </button>
                            <button onClick={() => handleAction(row, 'view-both')} className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer dark:text-slate-200 dark:hover:bg-slate-800">
                              <Eye className="w-3.5 h-3.5 text-slate-400" /><span>View Letter &amp; Application Form</span>
                            </button>
                            <button onClick={() => handleAction(row, 'history')} className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer dark:text-slate-200 dark:hover:bg-slate-800">
                              <History className="w-3.5 h-3.5 text-slate-400" /><span>Show Follow-Up Signature History</span>
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-y-2 pt-4 mt-4 border-t border-slate-200 px-2 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-semibold dark:text-slate-400">
              Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> records
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <div className="text-xs font-bold text-slate-700 px-2 dark:text-slate-300">Page {currentPage} of {totalPages}</div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

      {/* View Details Modal */}
      {viewingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">Policy {viewingRow.policyNumber}</h2>
              <button onClick={() => setViewingId(null)} className="cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Payor</span><span className="font-extrabold text-slate-900 dark:text-white">{viewingRow.payor}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Plan</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingRow.planCode} - {viewingRow.planDesc}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Premium</span><span className="font-bold text-[#d0112b]">{viewingRow.premium}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Policy Status</span><span className={`inline-flex px-2 py-0.5 rounded-lg border text-[11px] font-bold ${getPolicyStatusStyle(viewingRow.policyStatus)}`}>{viewingRow.policyStatus}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Date Received</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingRow.dateReceived}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Date Issued</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingRow.dateIssued}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Date Shipped</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingRow.dateShipped || '—'}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Effectivity Date</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingRow.effectivityDate}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Latest Print Follow-Up</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingRow.latestPrintFollowUp || '—'}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Latest Email Follow-Up</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingRow.latestEmailFollowUp || '—'}</span></div>
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setViewingId(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Letter / Application Form / Both */}
      {printRow && printDoc && (
        <PrintableDocumentModal
          title={printDoc.kind === 'letter' ? 'Follow-Up Signature Letter' : printDoc.kind === 'appform' ? 'Application Form Recap' : 'Letter & Application Form'}
          onClose={() => setPrintDoc(null)}
        >
          {(printDoc.kind === 'letter' || printDoc.kind === 'both') && (
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
          )}
          {(printDoc.kind === 'appform' || printDoc.kind === 'both') && (
            <>
              {printDoc.kind === 'both' && (
                <p className="text-[10px] font-extrabold uppercase text-slate-500 pt-2">Application Form Recap</p>
              )}
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

      {/* Follow-Up Signature History */}
      {historyRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">Signature History</h2>
              <button onClick={() => setHistoryId(null)} className="cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Policy {historyRow.policyNumber} &mdash; {historyRow.payor}</p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-[#d0112b] mt-1.5 flex-shrink-0" />
                <p className="text-xs text-slate-700 dark:text-slate-300"><span className="font-bold">Policy Issued</span> &mdash; {historyRow.dateIssued}</p>
              </div>
              {historyRow.dateShipped && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-slate-700 dark:text-slate-300"><span className="font-bold">Application Form Shipped</span> &mdash; {historyRow.dateShipped}</p>
                </div>
              )}
              {historyRow.latestPrintFollowUp && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-[#008cb4] mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-slate-700 dark:text-slate-300"><span className="font-bold">Print Follow-Up Sent</span> &mdash; {historyRow.latestPrintFollowUp}</p>
                </div>
              )}
              {historyRow.latestEmailFollowUp && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-slate-700 dark:text-slate-300"><span className="font-bold">Email Follow-Up Sent</span> &mdash; {historyRow.latestEmailFollowUp}</p>
                </div>
              )}
              {!historyRow.latestPrintFollowUp && !historyRow.latestEmailFollowUp && (
                <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">
                  No follow-up has been sent yet for this policy.
                </p>
              )}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setHistoryId(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Close
              </button>
            </div>
          </div>
        </div>
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
