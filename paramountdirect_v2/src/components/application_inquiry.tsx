import { useState } from 'react';
import { Search, Eye, Printer, ChevronLeft, ChevronRight, X, CheckSquare, Square, ShieldCheck, Clock, FileCheck, AlertCircle, UserPlus } from 'lucide-react';
import type { ScreeningItem } from '../App';
import ApplicationStatusBar from './application_status_bar';

interface Props {
  data: ScreeningItem[];
  onSelectApplication?: (id: string, planCode: string) => void;
  onCreateNew?: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function ApplicationInquiry({ data, onSelectApplication, onCreateNew }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  
  // Selection and Modal State
  const [selectedIds, setSelectedItems] = useState<string[]>([]);
  const [printModalApps, setPrintModalApps] = useState<ScreeningItem[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Application Status to Payment Status Matrix
  const getPaymentStatus = (status: string): 'Paid' | 'Unpaid' => {
    switch (status) {
      case 'Paid':
      case 'Issued':
        return 'Paid';
      case 'Received':
      case 'For Verification':
      case 'For Evaluation':
      default:
        return 'Unpaid';
    }
  };

  // The real iPeak policy number (PLANCODE-NNNNNN-D), assigned once the
  // application first transmits to iPeak; before that, the sequential
  // Application ID (e.g. "0000001"); the internal id is a last-resort
  // fallback only for entirely local/mock rows.
  const formatPolicyNumber = (item: ScreeningItem) => item.policyNumber || item.applicationId || item.id;

  // 1. Filter Records
  const matchesFilterBar = (item: ScreeningItem) => {
    const formattedNumber = formatPolicyNumber(item);
    const matchesSearch =
      item.payor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.includes(searchTerm) ||
      formattedNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const paymentStatus = getPaymentStatus(item.status);
    const matchesPayment = paymentFilter === 'All' || paymentStatus === paymentFilter;

    let matchesDate = true;
    if (fromDate || toDate) {
      const datePart = item.dateReceived.split(' at ')[0];
      const [mm, dd, yyyy] = datePart.split('/');
      const itemDateStr = `${yyyy}-${mm}-${dd}`;

      if (fromDate && itemDateStr < fromDate) matchesDate = false;
      if (toDate && itemDateStr > toDate) matchesDate = false;
    }

    return matchesSearch && matchesPayment && matchesDate;
  };

  const filteredRecords = data.filter((item) => {
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesStatus && matchesFilterBar(item);
  });

  // Drives the status counts strip - reflects search/payment/date but not
  // the App Status dropdown itself, so every status's count stays visible
  // within the current search/date context.
  const dataForStatusBar = data.filter(matchesFilterBar);

  // 2. Paginate Data (20 records per page)
  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedData = filteredRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Checkbox Selection
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedData.map(item => item.id));
    }
  };

  const handleSelectItem = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedItems(selectedIds.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedIds, id]);
    }
  };

  // Trigger batch printing for selected items
  const handleBatchPrint = () => {
    const selectedApps = data.filter(d => selectedIds.includes(d.id));
    if (selectedApps.length === 0) return;
    setPrintModalApps(selectedApps);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Issued':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
            <ShieldCheck className="w-3 h-3" />
            <span>Issued</span>
          </span>
        );
      case 'For Verification':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            <span>For Verification</span>
          </span>
        );
      case 'For Evaluation':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/40 dark:text-purple-300">
            <FileCheck className="w-3 h-3" />
            <span>For Evaluation</span>
          </span>
        );
      case 'Paid':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300">
            <span>Paid</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-[#d0112b] border border-rose-300 dark:bg-rose-950/40">
            <span>{status}</span>
          </span>
        );
    }
  };

  const getPaymentBadge = (payment: 'Paid' | 'Unpaid') => {
    if (payment === 'Paid') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
          Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300">
        <AlertCircle className="w-3 h-3" />
        <span>Unpaid</span>
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900 dark:text-slate-100">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Search className="h-6 w-6 text-[#d0112b]" />
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
              APPLICATION INQUIRY
            </h1>
            <p className="text-xs text-slate-500 font-semibold dark:text-slate-500">General inquiry registry for all insurance applications and policy documents</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Batch Print Button */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchPrint}
              className="flex items-center space-x-2 bg-[#008cb4] hover:bg-[#007396] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md animate-fadeIn"
            >
              <Printer className="w-4 h-4" />
              <span>Batch Print ({selectedIds.length})</span>
            </button>
          )}

          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="flex items-center space-x-2 bg-[#d0112b] hover:bg-[#a80d22] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Application</span>
            </button>
          )}
        </div>
      </div>

      <ApplicationStatusBar data={dataForStatusBar} />

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center gap-4 dark:bg-slate-900 dark:border-slate-800">

        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search App ID, Policy No., or Payor..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4] dark:bg-slate-800 dark:border-slate-700"
          />
        </div>

        {/* Application Status Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-bold text-slate-800 uppercase dark:text-slate-100">App Status</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer dark:bg-slate-800 dark:border-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Received">Received</option>
            <option value="For Verification">For Verification</option>
            <option value="For Evaluation">For Evaluation</option>
            <option value="Paid">Paid</option>
            <option value="Issued">Issued</option>
          </select>
        </div>

        {/* Payment Status Filter Matrix */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-bold text-slate-800 uppercase dark:text-slate-100">Payment Status</span>
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer dark:bg-slate-800 dark:border-slate-700"
          >
            <option value="All">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>

        {/* Date Filters */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase dark:text-slate-100">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-[#008cb4] dark:bg-slate-800 dark:border-slate-700"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase dark:text-slate-100">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-[#008cb4] dark:bg-slate-800 dark:border-slate-700"
          />
        </div>

        {(fromDate || toDate || searchTerm || statusFilter !== 'All' || paymentFilter !== 'All') && (
          <button
            onClick={() => { setFromDate(''); setToDate(''); setSearchTerm(''); setStatusFilter('All'); setPaymentFilter('All'); setCurrentPage(1); }}
            className="ml-auto p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-[#d0112b] hover:bg-red-50 transition-colors cursor-pointer dark:border-slate-700 dark:hover:bg-red-950/30"
            title="Clear Filters"
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
                <th className="py-3 px-2 w-8">
                  <button onClick={handleSelectAll} className="cursor-pointer">
                    {selectedIds.length === paginatedData.length && paginatedData.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-[#d0112b]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-2">App ID / Policy Number</th>
                <th className="py-3 px-2">Policy Holder</th>
                <th className="py-3 px-2">Premium</th>
                <th className="py-3 px-2">Application Status</th>
                <th className="py-3 px-2">Payment Status</th>
                <th className="py-3 px-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-bold dark:text-slate-500">
                    No applications match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const paymentStatus = getPaymentStatus(item.status);
                  const displayPolicyNumber = formatPolicyNumber(item);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/60">
                      <td className="py-3.5 px-2">
                        <button onClick={() => handleSelectItem(item.id)} className="cursor-pointer">
                          {selectedIds.includes(item.id) ? (
                            <CheckSquare className="h-4 w-4 text-[#d0112b]" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{displayPolicyNumber}</td>
                      <td className="py-3.5 px-2 font-extrabold text-slate-800 dark:text-slate-100">{item.payor}</td>
                      <td className="py-3.5 px-2 font-bold text-[#d0112b]">{item.premium}</td>
                      <td className="py-3.5 px-2">{getStatusBadge(item.status)}</td>
                      <td className="py-3.5 px-2">{getPaymentBadge(paymentStatus)}</td>
                      <td className="py-3.5 px-2 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => onSelectApplication && onSelectApplication(item.id, item.planCode)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-[#d0112b] hover:text-white text-slate-700 transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setPrintModalApps([item])}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-[#008cb4] hover:text-white text-slate-700 transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                            title="Print Policy Certificate"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-y-2 pt-4 mt-4 border-t border-slate-200 px-2 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-semibold dark:text-slate-400">
              Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> records
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <div className="text-xs font-bold text-slate-700 px-2 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Batch Policy Certificate Print Preview Modal */}
      {printModalApps && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 font-sans my-8 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-[#d0112b]" />
                <h2 className="text-base font-bold text-slate-900 uppercase dark:text-white">
                  Policy Print Preview ({printModalApps.length})
                </h2>
              </div>
              <button
                onClick={() => setPrintModalApps(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Frame */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {printModalApps.map((app) => (
                <div key={app.id} className="p-8 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-4 dark:bg-slate-800/50 dark:border-slate-700">
                  <div className="text-center border-b border-slate-200 pb-4 dark:border-slate-700">
                    <h3 className="text-lg font-black text-[#d0112b] tracking-wider font-['Montserrat'] uppercase">
                      PARAMOUNT LIFE & GENERAL INSURANCE CORP.
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 dark:text-slate-400">
                      OFFICIAL POLICY CERTIFICATE
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block dark:text-slate-500">APP ID / POLICY NO:</span>
                      <span className="font-extrabold text-slate-900 text-sm dark:text-white">{formatPolicyNumber(app)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block dark:text-slate-500">POLICY HOLDER:</span>
                      <span className="font-extrabold text-slate-900 text-sm dark:text-white">{app.payor}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block dark:text-slate-500">PLAN CODE:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{app.planCode} ({app.planDesc})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block dark:text-slate-500">PREMIUM:</span>
                      <span className="font-black text-[#d0112b]">{app.premium}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block dark:text-slate-500">APPLICATION STATUS:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{app.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block dark:text-slate-500">ISSUED BY:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{app.screenedBy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPrintModalApps(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-[#008cb4] hover:bg-[#007396] text-white text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}