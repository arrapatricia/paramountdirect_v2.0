import { useState } from 'react';
import { Search, Eye, X, ChevronLeft, ChevronRight, UserPlus, Car, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { CtplApplication, CtplPolicyStatus } from './ctpl_types';
import { CTPL_POLICY_TYPES, CTPL_STATUSES, COV_FEE, getCtplPolicyStatus } from './ctpl_types';
import { PolicyDocumentsSection, type PolicyDocumentSpec } from './policy_documents';
import { documentsApi, ApiError } from '../lib/api';

interface Props {
  data: CtplApplication[];
  onCreateNew?: () => void;
  // Controlled from App.tsx so the browser URL reflects which application is
  // open (see ctpl_application_detail.tsx for the unpaid/full-page half of
  // this same "view details" flow) - Paid applications don't need editing,
  // so this modal is a read-only quick preview only. Keyed by referenceNo,
  // not the internal id, so the URL is human-readable.
  viewingId?: string | null;
  onView?: (id: string) => void;
  onCloseView?: () => void;
}

// CTPL issues a Certificate of Cover (COC) rather than a separate OR, unlike
// OFW/GTP which get an Official Receipt. Keys match GeneratedDocument.docKey
// (see ctplDocumentFill.ts) - only these two templates exist so far.
const CTPL_DOCUMENTS: PolicyDocumentSpec[] = [
  { key: 'ctpl-coc', label: 'Certificate of Cover (COC)' },
  { key: 'ctpl-service-invoice', label: 'Service Invoice' },
];

const ITEMS_PER_PAGE = 20;
const STATUS_TABS = ['All', ...CTPL_STATUSES] as const;

const getPolicyStatusBadgeStyle = (status: CtplPolicyStatus) => {
  switch (status) {
    case 'Issued': return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    case 'Spoiled': return 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    case 'Cancelled': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
  }
};

const getRowTintStyle = (status: string) => {
  switch (status) {
    case 'Completed': return 'bg-emerald-50/60 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30';
    case 'Spoiled': return 'bg-rose-50/60 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/30';
    case 'Duplicate': return 'bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30';
    case 'Reversed': return 'bg-purple-50/60 hover:bg-purple-50 dark:bg-purple-950/20 dark:hover:bg-purple-950/30';
    case 'Cancelled': return 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800';
    default: return 'hover:bg-slate-50 dark:hover:bg-slate-800/60';
  }
};

export default function CtplApplicationList({ data, onCreateNew, viewingId = null, onView, onCloseView }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [policyTypeFilter, setPolicyTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState<string | null>(null);

  // Look up from `data` (rather than holding a snapshot) so the modal stays
  // in sync as the payment field changes. Only ever shown for a Paid
  // application - unpaid ones render as the full ctpl_application_detail.tsx
  // page instead (App.tsx makes that call), so this guards against a stale
  // viewingId briefly pointing at one mid-transition.
  const viewingApp = viewingId ? data.find((d) => (d.referenceNo === viewingId || d.id === viewingId) && d.isPaid) ?? null : null;

  const closeModal = () => onCloseView?.();

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2500);
  };

  // Looks up the real generated PDF (see ctplDocumentFill.ts / documents.ts)
  // rather than rendering an in-app mock - opens it in a new tab via a
  // short-lived presigned S3 URL, since the bucket itself is private.
  const findGeneratedDoc = async (key: string) => {
    if (!viewingApp) return null;
    const docs = await documentsApi.list('CTPL', viewingApp.id);
    return docs.find((d) => d.docKey === key) ?? null;
  };

  const handleViewDoc = async (key: string) => {
    const label = CTPL_DOCUMENTS.find((d) => d.key === key)?.label ?? 'Document';
    try {
      const doc = await findGeneratedDoc(key);
      if (!doc) { notify(`${label} hasn't been generated for this application yet.`); return; }
      const { url } = await documentsApi.getUrl(doc.id);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : `Failed to open ${label}.`);
    }
  };

  const handleSendDoc = async (key: string) => {
    const label = CTPL_DOCUMENTS.find((d) => d.key === key)?.label ?? 'Document';
    try {
      const doc = await findGeneratedDoc(key);
      if (!doc) { notify(`${label} hasn't been generated for this application yet.`); return; }
      notify(`${label} emailed to ${viewingApp?.email}.`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : `Failed to send ${label}.`);
    }
  };

  const tabCounts: Record<string, number> = {
    'All': data.length,
    ...Object.fromEntries(CTPL_STATUSES.map((s) => [s, data.filter(d => d.status === s).length])),
  };

  const filteredData = data.filter((item) => {
    const ownerName = `${item.ownerFirstName} ${item.ownerSurname}`.toLowerCase();
    const matchesTab = activeTab === 'All' || item.status === activeTab;
    const matchesSearch = ownerName.includes(searchTerm.toLowerCase()) || item.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) || (item.referenceNo ?? '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.policyNumber ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPolicyType = policyTypeFilter === 'All' || item.policyType === policyTypeFilter;
    return matchesTab && matchesSearch && matchesPolicyType;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleTabChange = (tab: (typeof STATUS_TABS)[number]) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900 dark:text-slate-100">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Car className="h-6 w-6 text-[#002f6c] dark:text-[#49b1ea]" />
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#002f6c] dark:text-[#49b1ea] font-['Montserrat']">
              CTPL APPLICATIONS
            </h1>
            <p className="text-xs text-slate-500 font-semibold dark:text-slate-500">Compulsory Third Party Liability — application registry and COC authentication</p>
          </div>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center space-x-2 bg-[#002f6c] hover:bg-[#00224f] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search by owner name, plate no., or reference no..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase dark:text-slate-300">Policy Type</span>
          <select
            value={policyTypeFilter}
            onChange={(e) => { setPolicyTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          >
            <option value="All">All</option>
            {CTPL_POLICY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="rounded-2xl border border-slate-300 bg-slate-200/70 p-1 flex items-center justify-start space-x-1 overflow-x-auto dark:border-slate-700 dark:bg-slate-800/70">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {tab} <span className="font-extrabold ml-1">{tabCounts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-slate-800 font-extrabold uppercase tracking-wider dark:border-slate-700 dark:text-slate-300">
                <th className="py-3 px-2">Reference No.</th>
                <th className="py-3 px-2">Policy Number</th>
                <th className="py-3 px-2">Insured Name</th>
                <th className="py-3 px-2">Plate No.</th>
                <th className="py-3 px-2">Premium</th>
                <th className="py-3 px-2">Issuer</th>
                <th className="py-3 px-2 text-center">COV</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-bold dark:text-slate-500">
                    No applications match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const policyStatus = getCtplPolicyStatus(row);
                  return (
                  <tr key={row.id} className={`transition-colors ${getRowTintStyle(row.status)}`}>
                    <td className="py-3.5 px-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {row.referenceNo ?? <span className="text-slate-300 text-[10px] font-bold dark:text-slate-600">&mdash;</span>}
                    </td>
                    <td className="py-3.5 px-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {row.policyNumber ?? <span className="text-slate-300 text-[10px] font-bold dark:text-slate-600">&mdash;</span>}
                    </td>
                    <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{row.ownerFirstName} {row.ownerSurname}</td>
                    <td className="py-3.5 px-2 font-mono font-bold text-slate-800 dark:text-slate-200">{row.plateNumber}</td>
                    <td className="py-3.5 px-2 font-black text-[#002f6c] dark:text-[#49b1ea]">{row.premium}</td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{row.screenedBy || '-'}</td>
                    <td className="py-3.5 px-2 text-center">
                      {row.requiresCOV ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                          <ShieldCheck className="w-3 h-3" /><span>COV</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px] font-bold dark:text-slate-600">&mdash;</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold ${row.isPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
                          {row.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold ${getPolicyStatusBadgeStyle(policyStatus)}`}>
                          {policyStatus}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <button
                        onClick={() => onView?.(row.referenceNo ?? row.id)}
                        className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#002f6c] hover:text-white transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                        title="View Application Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-y-3 pt-4 mt-4 border-t border-slate-200 px-2 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-semibold dark:text-slate-500">
              Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> records
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <div className="text-xs font-bold text-slate-700 px-2 dark:text-slate-300">Page {currentPage} of {totalPages}</div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

      {/* Detail View Modal */}
      {viewingApp && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 my-8 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">Application {viewingApp.referenceNo ?? '(Reference No. pending payment)'}</h2>
              <button onClick={closeModal} className="cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Registered Owner</span><span className="font-extrabold text-slate-900 dark:text-white">{viewingApp.ownerFirstName} {viewingApp.ownerMiddleName} {viewingApp.ownerSurname}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Client Type</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.clientType}</span></div>
              <div className="sm:col-span-2"><span className="text-slate-400 font-bold block dark:text-slate-500">Owner Address</span><span className="font-bold text-slate-800 dark:text-slate-200">{[viewingApp.ownerAddress, viewingApp.ownerBarangay !== 'N/A' ? viewingApp.ownerBarangay : null, viewingApp.ownerCity, viewingApp.ownerRegion].filter(Boolean).join(', ')}</span></div>

              {!viewingApp.sameAsOwner && (
                <div className="sm:col-span-2"><span className="text-slate-400 font-bold block dark:text-slate-500">Applicant (if different from owner)</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.applicantFirstName} {viewingApp.applicantSurname}</span></div>
              )}

              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Email</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.email}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Mobile</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.mobileNumber}</span></div>

              <div className="sm:col-span-2 border-t border-slate-100 pt-3 font-extrabold text-slate-500 uppercase text-[10px] tracking-wide dark:border-slate-800 dark:text-slate-500">Vehicle Details</div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Policy Type</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.policyType} ({viewingApp.renewalType}){viewingApp.forPublicUse ? ' — For Public Use' : ''}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">MV Type</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.mvType}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Plate Number</span><span className="font-mono font-bold text-slate-800 dark:text-slate-200">{viewingApp.plateNumber}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">MV File Number</span><span className="font-mono font-bold text-slate-800 dark:text-slate-200">{viewingApp.mvFileNumber}</span></div>
              <div className="sm:col-span-2"><span className="text-slate-400 font-bold block dark:text-slate-500">Serial/Chassis Number</span><span className="font-mono font-bold text-slate-800 dark:text-slate-200">{viewingApp.chassisNumber}</span></div>

              {viewingApp.requiresCOV && (
                <div className="sm:col-span-2 p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center space-x-2 dark:bg-amber-950/30 dark:border-amber-800">
                  <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 dark:text-amber-400" />
                  <span className="font-semibold text-amber-800 dark:text-amber-300">Certificate of Validation (COV) required — additional ₱{COV_FEE.toFixed(2)} verification fee via DBP-DCI.</span>
                </div>
              )}

              <PolicyDocumentsSection
                isPaid={viewingApp.isPaid}
                documents={CTPL_DOCUMENTS}
                onView={handleViewDoc}
                onSend={handleSendDoc}
                lockedMessage="Documents will be available once the client completes payment on the website."
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
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
