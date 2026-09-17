import { useState } from 'react';
import { Search, Eye, X, ChevronLeft, ChevronRight, UserPlus, Plane, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { GTP_STATUSES, GTP_STATUS_DESCRIPTIONS, type GtpApplication } from './gtp_types';
import { PolicyDocumentsSection, PrintableDocumentModal, DocRow, type PolicyDocumentSpec } from './policy_documents';

interface Props {
  data: GtpApplication[];
  onCreateNew?: () => void;
  onUpdate?: (id: string, patch: Partial<GtpApplication>) => void;
}

const GTP_DOCUMENTS: PolicyDocumentSpec[] = [
  { key: 'policySchedule', label: 'Policy Schedule' },
  { key: 'policyJacket', label: 'Policy Jacket' },
  { key: 'or', label: 'Official Receipt (OR)' },
  { key: 'serviceInvoice', label: 'Service Invoice' },
];

const ITEMS_PER_PAGE = 20;
const STATUS_TABS = ['All', ...GTP_STATUSES] as const;

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'Received': return 'bg-[#002f6c]/10 text-[#002f6c] border-[#002f6c]/30';
    case 'Cancelled': return 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    case 'Duplicate': return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800';
    default: return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
};

const getRowTintStyle = (status: string) => {
  switch (status) {
    case 'Received': return 'bg-[#002f6c]/[0.03] hover:bg-[#002f6c]/[0.06]';
    case 'Cancelled': return 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800';
    case 'Duplicate': return 'bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30';
    default: return 'hover:bg-slate-50 dark:hover:bg-slate-800/60';
  }
};

export default function GtpApplicationList({ data, onCreateNew, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [travelTypeFilter, setTravelTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Look up from `data` (rather than holding a snapshot) so the modal stays
  // in sync as the payment field changes.
  const viewingApp = viewingId ? data.find((d) => d.id === viewingId) ?? null : null;

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleViewDoc = (key: string) => setViewingDoc(key);
  const handleSendDoc = (key: string) => {
    const doc = GTP_DOCUMENTS.find((d) => d.key === key);
    notify(`${doc?.label ?? 'Document'} emailed to ${viewingApp?.email}.`);
  };

  const tabCounts: Record<string, number> = {
    'All': data.length,
    ...Object.fromEntries(GTP_STATUSES.map((s) => [s, data.filter(d => d.status === s).length])),
  };

  const filteredData = data.filter((item) => {
    const fullName = `${item.travelerFirstName} ${item.travelerSurname}`.toLowerCase();
    const matchesTab = activeTab === 'All' || item.status === activeTab;
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || item.id.includes(searchTerm);
    const matchesTravelType = travelTypeFilter === 'All' || item.travelType === travelTypeFilter;
    return matchesTab && matchesSearch && matchesTravelType;
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
          <Plane className="h-6 w-6 text-[#002f6c]" />
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#002f6c] font-['Montserrat']">
              GTP APPLICATIONS
            </h1>
            <p className="text-xs text-slate-500 font-semibold dark:text-slate-500">Global Travel Protect Premium — application registry</p>
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search by traveler name or reference no..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase dark:text-white">Travel Type</span>
          <select
            value={travelTypeFilter}
            onChange={(e) => { setTravelTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="All">All</option>
            <option value="International">International</option>
            <option value="Domestic">Domestic</option>
          </select>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="rounded-2xl border border-slate-300 bg-slate-200/70 p-1 flex items-center justify-start space-x-1 overflow-x-auto dark:border-slate-700 dark:bg-slate-800/70">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
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
              <tr className="border-b border-slate-300 text-slate-800 font-extrabold uppercase tracking-wider dark:border-slate-700 dark:text-white">
                <th className="py-3 px-2">Reference No.</th>
                <th className="py-3 px-2">Traveler</th>
                <th className="py-3 px-2">Destination(s)</th>
                <th className="py-3 px-2">Travel Dates</th>
                <th className="py-3 px-2">Plan</th>
                <th className="py-3 px-2">Premium</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-bold dark:text-slate-500">
                    No applications match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id} className={`transition-colors ${getRowTintStyle(row.status)}`}>
                    <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{row.id}</td>
                    <td className="py-3.5 px-2">
                      <div className="font-bold text-slate-900 dark:text-white">{row.travelerFirstName} {row.travelerSurname}</div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-500">{row.applicationType}</span>
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{row.destinations.join(', ')}</div>
                      {row.isSchengenDestination && (
                        <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold text-amber-700 mt-0.5 dark:text-amber-400">
                          <ShieldAlert className="w-3 h-3" /><span>Schengen Compliance</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{row.departureDate} to {row.returnDate}</td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{row.planVariant}</td>
                    <td className="py-3.5 px-2 font-black text-[#002f6c]">{row.premium}</td>
                    <td className="py-3.5 px-2 text-center">
                      <span
                        title={GTP_STATUS_DESCRIPTIONS[row.status]}
                        className={`inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold ${getStatusBadgeStyle(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <button
                        onClick={() => setViewingId(row.id)}
                        className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#002f6c] hover:text-white transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                        title="View Application Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-y-2 pt-4 mt-4 border-t border-slate-200 px-2 dark:border-slate-800">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 my-8 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">Application {viewingApp.id}</h2>
              <button onClick={() => setViewingId(null)} className="cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Traveler</span><span className="font-extrabold text-slate-900 dark:text-white">{viewingApp.travelerFirstName} {viewingApp.travelerSurname}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Application Type</span><span className="font-bold text-slate-800 dark:text-white">{viewingApp.applicationType}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Birthdate</span><span className="font-bold text-slate-800 dark:text-white">{viewingApp.birthdate}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Plan</span><span className="font-bold text-slate-800 dark:text-white">{viewingApp.planVariant}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Email</span><span className="font-bold text-slate-800 dark:text-white">{viewingApp.email}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Mobile</span><span className="font-bold text-slate-800 dark:text-white">{viewingApp.mobileNumber}</span></div>

              <div className="sm:col-span-2 border-t border-slate-100 pt-3 font-extrabold text-slate-500 uppercase text-[10px] tracking-wide dark:border-slate-800 dark:text-slate-500">Travel Details</div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Travel Type</span><span className="font-bold text-slate-800 dark:text-white">{viewingApp.travelType}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Days of Travel</span><span className="font-bold text-slate-800 dark:text-white">{viewingApp.daysOfTravel}</span></div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-bold block dark:text-slate-500">Destination(s)</span>
                <span className="font-bold text-slate-800 flex items-center space-x-1 dark:text-white">
                  <span>{viewingApp.destinations.join(', ')}</span>
                  {viewingApp.isSchengenDestination && <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
                </span>
              </div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Departure</span><span className="font-bold text-slate-800 dark:text-white">{viewingApp.departureDate}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Return</span><span className="font-bold text-slate-800 dark:text-white">{viewingApp.returnDate}</span></div>

              <div className="sm:col-span-2 border-t border-slate-100 pt-3 font-extrabold text-slate-500 uppercase text-[10px] tracking-wide dark:border-slate-800 dark:text-slate-500">Add-ons</div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Cruise Coverage</span><span className="font-bold text-slate-800 dark:text-white">{viewingApp.cruiseCoverage ? 'Yes' : 'No'}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Hazardous Sports Coverage</span><span className="font-bold text-slate-800 dark:text-white">{viewingApp.hazardousSportsCoverage ? 'Yes' : 'No'}</span></div>

              {viewingApp.isSchengenDestination && (
                <div className="sm:col-span-2 p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center space-x-2 dark:bg-amber-950/30 dark:border-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="font-semibold text-amber-800 dark:text-amber-300">Schengen destination — requires €30,000 / ₱2.5M medical coverage compliance.</span>
                </div>
              )}

              <div className="sm:col-span-2 border-t border-slate-100 pt-3 font-extrabold text-slate-500 uppercase text-[10px] tracking-wide dark:border-slate-800 dark:text-slate-500">
                Payment
              </div>
              {!viewingApp.isPaid && (
                <div className="sm:col-span-2 flex items-center justify-between px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Awaiting client payment</span>
                  <button
                    type="button"
                    onClick={() => { onUpdate?.(viewingApp.id, { isPaid: true }); notify('Payment confirmed — documents are now available.'); }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 cursor-pointer"
                  >
                    Simulate Payment Received
                  </button>
                </div>
              )}

              <PolicyDocumentsSection
                isPaid={viewingApp.isPaid}
                documents={GTP_DOCUMENTS}
                onView={handleViewDoc}
                onSend={handleSendDoc}
                lockedMessage="Documents will be available once the client completes payment on the website."
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setViewingId(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Document Modal */}
      {viewingApp && viewingDoc && (
        <PrintableDocumentModal
          title={GTP_DOCUMENTS.find((d) => d.key === viewingDoc)?.label ?? 'Document'}
          onClose={() => setViewingDoc(null)}
        >
          <DocRow label="Reference No." value={viewingApp.id} />
          <DocRow label="Traveler" value={`${viewingApp.travelerFirstName} ${viewingApp.travelerSurname}`} />
          <DocRow label="Destination(s)" value={viewingApp.destinations.join(', ')} />
          <DocRow label="Travel Dates" value={`${viewingApp.departureDate} to ${viewingApp.returnDate}`} />
          <DocRow label="Plan" value={viewingApp.planVariant} />
          <DocRow label="Premium" value={viewingApp.premium} />
          {viewingDoc === 'or' && <DocRow label="OR Status" value="PAID" />}
          {viewingDoc === 'serviceInvoice' && <DocRow label="Invoice Status" value="PAID" />}
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
