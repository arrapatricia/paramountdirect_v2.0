import { useState } from 'react';
import { Search, Eye, X, ChevronLeft, ChevronRight, UserPlus, Car, ShieldCheck, CheckCircle2, Pencil } from 'lucide-react';
import type { CtplApplication, CtplPolicyStatus } from './ctpl_types';
import { CTPL_POLICY_TYPES, CTPL_MV_TYPES_BY_POLICY, CTPL_STATUSES, COV_FEE, getCtplPolicyStatus } from './ctpl_types';
import { PolicyDocumentsSection, PrintableDocumentModal, DocRow, type PolicyDocumentSpec } from './policy_documents';
import { getPremiumRate, type PremiumRate } from './premium_rates';
import { PH_REGIONS, citiesForRegion, GENERIC_BARANGAYS } from './ph_geography';

interface Props {
  data: CtplApplication[];
  onCreateNew?: () => void;
  onUpdate?: (id: string, patch: Partial<CtplApplication>) => void;
  rates?: PremiumRate[];
}

const getPremium = (rates: PremiumRate[], policyType: string, mvType: string) =>
  !policyType || !mvType ? 0 : getPremiumRate(rates, 'CTPL', `${policyType}|${mvType}`, getPremiumRate(rates, 'CTPL', 'default', 606));

type CtplEditForm = Pick<
  CtplApplication,
  | 'clientType' | 'ownerFirstName' | 'ownerMiddleName' | 'ownerSurname' | 'ownerAddress' | 'ownerRegion' | 'ownerCity' | 'ownerBarangay'
  | 'sameAsOwner' | 'applicantFirstName' | 'applicantSurname' | 'email' | 'mobileNumber'
  | 'policyType' | 'mvType' | 'plateNumber' | 'mvFileNumber' | 'chassisNumber' | 'requiresCOV' | 'forPublicUse' | 'status'
>;

// Only statuses that make sense for an application still awaiting payment -
// Reversed requires a prior payment to reverse, so it's excluded here.
const EDITABLE_UNPAID_STATUSES = ['Completed', 'Spoiled', 'Duplicate', 'Cancelled'] as const;

const buildEditForm = (app: CtplApplication): CtplEditForm => ({
  clientType: app.clientType, ownerFirstName: app.ownerFirstName, ownerMiddleName: app.ownerMiddleName, ownerSurname: app.ownerSurname,
  ownerAddress: app.ownerAddress, ownerRegion: app.ownerRegion, ownerCity: app.ownerCity, ownerBarangay: app.ownerBarangay,
  sameAsOwner: app.sameAsOwner, applicantFirstName: app.applicantFirstName, applicantSurname: app.applicantSurname,
  email: app.email, mobileNumber: app.mobileNumber,
  policyType: app.policyType, mvType: app.mvType, plateNumber: app.plateNumber, mvFileNumber: app.mvFileNumber, chassisNumber: app.chassisNumber,
  requiresCOV: app.requiresCOV, forPublicUse: app.forPublicUse, status: app.status,
});

const editInputClass = 'w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const editLabelClass = 'text-slate-400 font-bold block mb-1 dark:text-slate-500';

// `premium` is stored formatted (e.g. "₱682.00") and already includes the
// COV fee when one applies - the Service Invoice needs the pre-fee base
// amount back out to show an accurate line-item breakdown.
const parsePeso = (formatted: string) => Number(formatted.replace(/[₱,]/g, '')) || 0;

// CTPL issues a Certificate of Cover (COC) rather than a separate OR, unlike
// OFW/GTP which get an Official Receipt.
const CTPL_DOCUMENTS: PolicyDocumentSpec[] = [
  { key: 'policySchedule', label: 'Policy Schedule' },
  { key: 'policyJacket', label: 'Policy Jacket' },
  { key: 'coc', label: 'Certificate of Cover (COC)' },
  { key: 'serviceInvoice', label: 'Service Invoice' },
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

export default function CtplApplicationList({ data, onCreateNew, onUpdate, rates = [] }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [policyTypeFilter, setPolicyTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CtplEditForm | null>(null);

  // Look up from `data` (rather than holding a snapshot) so the modal stays
  // in sync as the payment field changes.
  const viewingApp = viewingId ? data.find((d) => d.id === viewingId) ?? null : null;

  const closeModal = () => { setViewingId(null); setEditForm(null); };
  const startEdit = () => { if (viewingApp) setEditForm(buildEditForm(viewingApp)); };
  const cancelEdit = () => setEditForm(null);
  const saveEdit = () => {
    if (!viewingApp || !editForm) return;
    const premiumValue = getPremium(rates, editForm.policyType, editForm.mvType);
    const totalDue = premiumValue + (editForm.requiresCOV ? COV_FEE : 0);
    onUpdate?.(viewingApp.id, { ...editForm, premium: `₱${totalDue.toFixed(2)}` });
    notify('Application details updated.');
    setEditForm(null);
  };

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleViewDoc = (key: string) => setViewingDoc(key);
  const handleSendDoc = (key: string) => {
    const doc = CTPL_DOCUMENTS.find((d) => d.key === key);
    notify(`${doc?.label ?? 'Document'} emailed to ${viewingApp?.email}.`);
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
                <th className="py-3 px-2 text-center">COV Required</th>
                <th className="py-3 px-2 text-center">Payment Status</th>
                <th className="py-3 px-2 text-center">Policy Status</th>
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-bold dark:text-slate-500">
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
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold ${row.isPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
                        {row.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold ${getPolicyStatusBadgeStyle(policyStatus)}`}>
                        {policyStatus}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 my-8 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">Application {viewingApp.referenceNo ?? '(Reference No. pending payment)'}</h2>
              <div className="flex items-center space-x-1">
                {!viewingApp.isPaid && !editForm && (
                  <button onClick={startEdit} className="cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    <Pencil className="w-3.5 h-3.5" /><span>Edit</span>
                  </button>
                )}
                <button onClick={closeModal} className="cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {editForm ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div>
                  <label className={editLabelClass}>Client Type</label>
                  <select className={editInputClass} value={editForm.clientType} onChange={(e) => setEditForm({ ...editForm, clientType: e.target.value as CtplApplication['clientType'] })}>
                    <option>Individual</option>
                    <option>Corporate without assignee</option>
                    <option>Corporate with assignee</option>
                  </select>
                </div>
                <div className="flex items-end space-x-3 pt-1">
                  {[true, false].map((val) => (
                    <label key={String(val)} className="flex items-center space-x-1.5 font-semibold text-slate-700 dark:text-slate-300">
                      <input type="radio" checked={editForm.sameAsOwner === val} onChange={() => setEditForm({ ...editForm, sameAsOwner: val })} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
                      <span>Applicant {val ? 'same as' : 'different from'} owner</span>
                    </label>
                  ))}
                </div>

                <div><label className={editLabelClass}>Owner First Name</label><input className={editInputClass} value={editForm.ownerFirstName} onChange={(e) => setEditForm({ ...editForm, ownerFirstName: e.target.value })} /></div>
                <div><label className={editLabelClass}>Owner Middle Name</label><input className={editInputClass} value={editForm.ownerMiddleName} onChange={(e) => setEditForm({ ...editForm, ownerMiddleName: e.target.value })} /></div>
                <div><label className={editLabelClass}>Owner Surname</label><input className={editInputClass} value={editForm.ownerSurname} onChange={(e) => setEditForm({ ...editForm, ownerSurname: e.target.value })} /></div>

                {!editForm.sameAsOwner && (
                  <>
                    <div><label className={editLabelClass}>Applicant First Name</label><input className={editInputClass} value={editForm.applicantFirstName} onChange={(e) => setEditForm({ ...editForm, applicantFirstName: e.target.value })} /></div>
                    <div><label className={editLabelClass}>Applicant Surname</label><input className={editInputClass} value={editForm.applicantSurname} onChange={(e) => setEditForm({ ...editForm, applicantSurname: e.target.value })} /></div>
                  </>
                )}

                <div className="sm:col-span-2"><label className={editLabelClass}>Owner Address</label><input className={editInputClass} value={editForm.ownerAddress} onChange={(e) => setEditForm({ ...editForm, ownerAddress: e.target.value })} /></div>
                <div>
                  <label className={editLabelClass}>Region</label>
                  <select className={editInputClass} value={editForm.ownerRegion} onChange={(e) => { const r = e.target.value; setEditForm({ ...editForm, ownerRegion: r, ownerCity: citiesForRegion(r)[0] }); }}>
                    {PH_REGIONS.map((r) => <option key={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={editLabelClass}>City/Municipality</label>
                  <select className={editInputClass} value={editForm.ownerCity} onChange={(e) => setEditForm({ ...editForm, ownerCity: e.target.value })}>
                    {citiesForRegion(editForm.ownerRegion).map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={editLabelClass}>Barangay</label>
                  <select className={editInputClass} value={editForm.ownerBarangay} onChange={(e) => setEditForm({ ...editForm, ownerBarangay: e.target.value })}>
                    {GENERIC_BARANGAYS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>

                <div><label className={editLabelClass}>Email</label><input type="email" className={editInputClass} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
                <div><label className={editLabelClass}>Mobile</label><input className={editInputClass} value={editForm.mobileNumber} onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })} /></div>

                <div className="sm:col-span-2 border-t border-slate-100 pt-3 font-extrabold text-slate-500 uppercase text-[10px] tracking-wide dark:border-slate-800 dark:text-slate-500">Vehicle Details</div>
                <div>
                  <label className={editLabelClass}>Application Status</label>
                  <select className={editInputClass} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as CtplApplication['status'] })}>
                    {EDITABLE_UNPAID_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div />
                <div>
                  <label className={editLabelClass}>Policy Type</label>
                  <select className={editInputClass} value={editForm.policyType} onChange={(e) => { const v = e.target.value as CtplApplication['policyType']; setEditForm({ ...editForm, policyType: v, mvType: '', forPublicUse: v === 'Motorcycle' ? editForm.forPublicUse : false }); }}>
                    {CTPL_POLICY_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={editLabelClass}>LTO MV Type</label>
                  <select className={editInputClass} value={editForm.mvType} onChange={(e) => setEditForm({ ...editForm, mvType: e.target.value })}>
                    <option value="">-- Select --</option>
                    {CTPL_MV_TYPES_BY_POLICY[editForm.policyType].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className={editLabelClass}>Plate Number</label><input className={editInputClass} value={editForm.plateNumber} onChange={(e) => setEditForm({ ...editForm, plateNumber: e.target.value.toUpperCase() })} /></div>
                <div><label className={editLabelClass}>MV File Number</label><input className={editInputClass} value={editForm.mvFileNumber} onChange={(e) => setEditForm({ ...editForm, mvFileNumber: e.target.value })} /></div>
                <div className="sm:col-span-2"><label className={editLabelClass}>Serial/Chassis Number</label><input className={editInputClass} value={editForm.chassisNumber} onChange={(e) => setEditForm({ ...editForm, chassisNumber: e.target.value.toUpperCase() })} /></div>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={editForm.requiresCOV} onChange={(e) => setEditForm({ ...editForm, requiresCOV: e.target.checked })} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Requires COV (+₱{COV_FEE.toFixed(2)})</span>
                </label>
                {editForm.policyType === 'Motorcycle' && (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={editForm.forPublicUse} onChange={(e) => setEditForm({ ...editForm, forPublicUse: e.target.checked })} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">For Public Use (LCOC series)</span>
                  </label>
                )}

                <div className="sm:col-span-2 p-3 rounded-xl bg-[#ebf3fc] flex items-center justify-between dark:bg-[#49b1ea]/10">
                  <span className="font-bold text-slate-600 uppercase dark:text-slate-300">Recalculated Premium</span>
                  <span className="text-base font-black text-[#002f6c] dark:text-[#49b1ea]">
                    ₱{(getPremium(rates, editForm.policyType, editForm.mvType) + (editForm.requiresCOV ? COV_FEE : 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
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
                documents={CTPL_DOCUMENTS}
                onView={handleViewDoc}
                onSend={handleSendDoc}
                lockedMessage="Documents will be available once the client completes payment on the website."
              />
            </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {editForm ? (
                <>
                  <button onClick={cancelEdit} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    Cancel
                  </button>
                  <button onClick={saveEdit} className="px-4 py-2 rounded-xl bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold cursor-pointer shadow-md">
                    Save Changes
                  </button>
                </>
              ) : (
                <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Document Modal */}
      {viewingApp && viewingDoc && (
        <PrintableDocumentModal
          title={CTPL_DOCUMENTS.find((d) => d.key === viewingDoc)?.label ?? 'Document'}
          onClose={() => setViewingDoc(null)}
        >
          {viewingDoc === 'policySchedule' ? (
            // Matches the real EMCC Policy Schedule template.
            <>
              <p className="text-center text-sm font-extrabold uppercase tracking-wide text-slate-900">Policy Schedule</p>
              <DocRow label="Policy No." value={viewingApp.policyNumber ?? '—'} />
              <DocRow label="Confirmation of Cover No." value={viewingApp.policyNumber ? `COC-${viewingApp.policyNumber}` : '—'} />
              <DocRow label="Official Receipt No." value={viewingApp.referenceNo ?? '—'} />
              <DocRow label="Registered Owner" value={`${viewingApp.ownerFirstName} ${viewingApp.ownerMiddleName} ${viewingApp.ownerSurname}`} />
              <div className="border border-slate-300">
                <p className="bg-slate-100 text-[10px] font-extrabold uppercase px-2 py-1 border-b border-slate-300">Schedule of Vehicle</p>
                <div className="grid grid-cols-2 text-[10px]">
                  <div className="px-2 py-1.5 border-b border-r border-dashed border-slate-200"><span className="text-slate-500 font-bold">Type / MV Type</span><br /><span className="font-extrabold">{viewingApp.policyType} &mdash; {viewingApp.mvType}</span></div>
                  <div className="px-2 py-1.5 border-b border-dashed border-slate-200"><span className="text-slate-500 font-bold">MV File No.</span><br /><span className="font-extrabold">{viewingApp.mvFileNumber}</span></div>
                  <div className="px-2 py-1.5 border-r border-dashed border-slate-200"><span className="text-slate-500 font-bold">Plate No.</span><br /><span className="font-extrabold font-mono">{viewingApp.plateNumber}</span></div>
                  <div className="px-2 py-1.5"><span className="text-slate-500 font-bold">Serial / Chassis No.</span><br /><span className="font-extrabold font-mono">{viewingApp.chassisNumber}</span></div>
                </div>
              </div>
              <div className="border border-slate-300">
                <p className="bg-slate-100 text-[10px] font-extrabold uppercase px-2 py-1 border-b border-slate-300">Section I / II &mdash; Third Party Liability (subject to schedule of indemnity)</p>
                <div className="flex justify-between px-2 py-1.5 text-[10px]"><span className="font-bold text-slate-600">Limit of Liability: ₱200,000.00</span><span className="font-extrabold">{viewingApp.premium}</span></div>
              </div>
              <div className="border border-slate-300 text-[10px]">
                <p className="bg-slate-100 font-extrabold uppercase px-2 py-1 border-b border-slate-300">Section III &amp; IV &mdash; Own Damage / Bodily Injury &amp; Property Damage</p>
                <p className="px-2 py-1.5 text-slate-500 font-semibold">Not Covered &mdash; CTPL-only policy</p>
              </div>
              <DocRow label="Total Premium" value={viewingApp.premium} />
            </>
          ) : viewingDoc === 'coc' ? (
            // Matches the real Confirmation of Cover template — Land Transportation
            // Operators Vehicle (commercial, with passenger liability) vs.
            // Non-Land Transportation Operators Vehicle (private, TPL only).
            <>
              <p className="text-center text-sm font-extrabold uppercase tracking-wide text-slate-900">"Original" Confirmation of Cover</p>
              <p className="text-center text-[10px] font-bold uppercase text-slate-500 pb-2 border-b border-dashed border-slate-300">
                {viewingApp.policyType === 'Commercial Vehicle' ? 'Land Transportation Operators Vehicle' : 'Non-Land Transportation Operators Vehicle'}
              </p>
              <DocRow label="Policy No." value={viewingApp.policyNumber ?? '—'} />
              <DocRow label="Confirmation of Cover No." value={viewingApp.policyNumber ? `COC-${viewingApp.policyNumber}` : '—'} />
              <DocRow label="Name and Address of Insured" value={`${viewingApp.ownerFirstName} ${viewingApp.ownerMiddleName} ${viewingApp.ownerSurname}, ${[viewingApp.ownerAddress, viewingApp.ownerBarangay !== 'N/A' ? viewingApp.ownerBarangay : null, viewingApp.ownerCity, viewingApp.ownerRegion].filter(Boolean).join(', ')}`} />
              <DocRow label="Vehicle" value={`${viewingApp.mvType} — Plate ${viewingApp.plateNumber}`} />
              <div className="border border-slate-300">
                <p className="bg-slate-100 text-[10px] font-extrabold uppercase px-2 py-1 border-b border-slate-300">Limits of Liability (Subject to Schedule of Indemnities)</p>
                <div className="flex justify-between px-2 py-1.5 text-[10px] border-b border-dashed border-slate-200"><span className="font-bold text-slate-600">A. Third Party Liability</span><span className="font-extrabold">₱200,000.00</span></div>
                {viewingApp.policyType === 'Commercial Vehicle' && (
                  <div className="flex justify-between px-2 py-1.5 text-[10px]"><span className="font-bold text-slate-600">B. Passenger Liability</span><span className="font-extrabold">₱200,000.00</span></div>
                )}
              </div>
              <DocRow label="Premiums Paid (Inclusive of Taxes)" value={viewingApp.premium} />
              <p className="text-[9px] text-slate-500 leading-relaxed pt-1">This Confirmation of Cover is evidence of the policy of insurance required under Chapter VI, Compulsory Motor Vehicle Liability Insurance of the Insurance Code, as amended by Presidential Decree No. 1814.</p>
              <p className="text-[10px] text-slate-500 pt-2 text-right">Reynaldo M. Saris, SAVP &mdash; Underwriting<br />Authorized Signature</p>
            </>
          ) : viewingDoc === 'serviceInvoice' ? (
            // Matches the real Service Invoice template.
            <>
              <p className="text-center text-sm font-extrabold uppercase tracking-wide text-slate-900">Service Invoice</p>
              <DocRow label="Invoice No." value={viewingApp.referenceNo ? `INV-${viewingApp.referenceNo}` : '—'} />
              <DocRow label="Invoice Date" value={viewingApp.dateReceived} />
              <DocRow label="Policy No." value={viewingApp.policyNumber ?? '—'} />
              <DocRow label="Name" value={`${viewingApp.ownerFirstName} ${viewingApp.ownerMiddleName} ${viewingApp.ownerSurname}`} />
              <table className="w-full text-[10px] border border-slate-300 mt-1">
                <thead><tr className="bg-[#002f6c] text-white"><th className="text-left px-2 py-1.5">Item Description / Nature of Service</th><th className="text-right px-2 py-1.5">Amount</th></tr></thead>
                <tbody>
                  <tr><td className="px-2 py-1.5 border-b border-dashed border-slate-200">CTPL Insurance Premium &mdash; {viewingApp.mvType}</td><td className="px-2 py-1.5 border-b border-dashed border-slate-200 text-right font-bold">₱{(parsePeso(viewingApp.premium) - (viewingApp.requiresCOV ? COV_FEE : 0)).toFixed(2)}</td></tr>
                  {viewingApp.requiresCOV && (
                    <tr><td className="px-2 py-1.5">Certificate of Validation (COV) Fee</td><td className="px-2 py-1.5 text-right font-bold">₱{COV_FEE.toFixed(2)}</td></tr>
                  )}
                </tbody>
              </table>
              <DocRow label="Total Amount" value={viewingApp.premium} />
              <p className="text-[10px] text-slate-500 pt-2">Please make check payments payable to Paramount Life &amp; General Insurance Corporation.</p>
            </>
          ) : (
            <>
              <DocRow label="Reference No." value={viewingApp.referenceNo ?? '—'} />
              <DocRow label="Registered Owner" value={`${viewingApp.ownerFirstName} ${viewingApp.ownerMiddleName} ${viewingApp.ownerSurname}`} />
              <DocRow label="Policy Type" value={viewingApp.policyType} />
              <DocRow label="MV Type" value={viewingApp.mvType} />
              <DocRow label="Plate Number" value={viewingApp.plateNumber} />
              <DocRow label="Premium" value={viewingApp.premium} />
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
