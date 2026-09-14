import React, { useState } from 'react';
import {
  Search, Eye, X, ChevronLeft, ChevronRight, UserPlus,
  FileCheck2, FileX2, ShieldAlert, Plane
} from 'lucide-react';
import { OFW_STATUSES, OFW_STATUS_DESCRIPTIONS, type OfwApplication } from './ofw_types';

interface Props {
  data: OfwApplication[];
  onCreateNew?: () => void;
}

const ITEMS_PER_PAGE = 20;
const STATUS_TABS = ['All', ...OFW_STATUSES] as const;

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'Received': return 'bg-[#002f6c]/10 text-[#002f6c] border-[#002f6c]/30 dark:bg-[#49b1ea]/10 dark:text-[#49b1ea] dark:border-[#49b1ea]/30';
    case 'Cancelled': return 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    case 'Duplicate': return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    case 'Reversed': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    default: return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
};

const getRowTintStyle = (status: string) => {
  switch (status) {
    case 'Received': return 'bg-[#002f6c]/[0.03] hover:bg-[#002f6c]/[0.06] dark:bg-[#49b1ea]/[0.04] dark:hover:bg-[#49b1ea]/[0.08]';
    case 'Cancelled': return 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800';
    case 'Duplicate': return 'bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30';
    case 'Reversed': return 'bg-purple-50/60 hover:bg-purple-50 dark:bg-purple-950/20 dark:hover:bg-purple-950/30';
    default: return 'hover:bg-slate-50 dark:hover:bg-slate-800/60';
  }
};

export default function OfwApplicationList({ data, onCreateNew }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [coverageFilter, setCoverageFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingApp, setViewingApp] = useState<OfwApplication | null>(null);

  const tabCounts: Record<string, number> = {
    'All': data.length,
    ...Object.fromEntries(OFW_STATUSES.map((s) => [s, data.filter(d => d.status === s).length])),
  };

  const filteredData = data.filter((item) => {
    const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
    const matchesTab = activeTab === 'All' || item.status === activeTab;
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || item.id.includes(searchTerm);
    const matchesCoverage = coverageFilter === 'All' || item.coverageType === coverageFilter;
    return matchesTab && matchesSearch && matchesCoverage;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleTabChange = (tab: (typeof STATUS_TABS)[number]) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const docBadge = (label: string, status: 'Uploaded' | 'Missing') => (
    <span
      key={label}
      title={`${label}: ${status}`}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg ${
        status === 'Uploaded' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
      }`}
    >
      {status === 'Uploaded' ? <FileCheck2 className="w-3.5 h-3.5" /> : <FileX2 className="w-3.5 h-3.5" />}
    </span>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900 dark:text-slate-100">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Plane className="h-6 w-6 text-[#002f6c]" />
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#002f6c] font-['Montserrat']">
              OFW APPLICATIONS
            </h1>
            <p className="text-xs text-slate-500 font-semibold dark:text-slate-500">OFW Compulsory Insurance — application registry and document verification</p>
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
            placeholder="Search by applicant name or reference no..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase dark:text-slate-300">Coverage</span>
          <select
            value={coverageFilter}
            onChange={(e) => { setCoverageFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          >
            <option value="All">All</option>
            <option value="Land-based">Land-based</option>
            <option value="Sea-based">Sea-based</option>
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
                <th className="py-3 px-2">Applicant</th>
                <th className="py-3 px-2">Occupation</th>
                <th className="py-3 px-2">Coverage</th>
                <th className="py-3 px-2">Country</th>
                <th className="py-3 px-2">Premium</th>
                <th className="py-3 px-2 text-center">Documents</th>
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
                paginatedData.map((row) => (
                  <tr key={row.id} className={`transition-colors ${getRowTintStyle(row.status)}`}>
                    <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{row.id}</td>
                    <td className="py-3.5 px-2">
                      <div className="font-bold text-slate-900 dark:text-white">{row.firstName} {row.lastName}</div>
                      {row.isConflictZone && (
                        <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold text-amber-700 mt-0.5 dark:text-amber-400">
                          <ShieldAlert className="w-3 h-3" /><span>Conflict-Zone Advisory</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{row.occupation}</td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{row.coverageType}</td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{row.employerCountry}</td>
                    <td className="py-3.5 px-2 font-black text-[#002f6c] dark:text-[#49b1ea]">{row.premium}</td>
                    <td className="py-3.5 px-2">
                      <div className="flex items-center justify-center space-x-1">
                        {docBadge('Passport', row.documents.passport)}
                        {docBadge('Visa', row.documents.visa)}
                        {docBadge('Employment Contract', row.documents.employmentContract)}
                        {docBadge('Medical Certificate', row.documents.medicalCertificate)}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <span
                        title={OFW_STATUS_DESCRIPTIONS[row.status]}
                        className={`inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold ${getStatusBadgeStyle(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <button
                        onClick={() => setViewingApp(row)}
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
              <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">Application {viewingApp.id}</h2>
              <button onClick={() => setViewingApp(null)} className="cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Applicant</span><span className="font-extrabold text-slate-900 dark:text-white">{viewingApp.firstName} {viewingApp.middleName} {viewingApp.lastName}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Gender / Civil Status</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.gender} &middot; {viewingApp.civilStatus}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Birthdate</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.birthdate}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Place of Birth</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.placeOfBirth}</span></div>
              <div className="sm:col-span-2"><span className="text-slate-400 font-bold block dark:text-slate-500">PH Address</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.phAddress}, {viewingApp.phCity}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Mobile</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.phone}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Email</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.email}</span></div>

              <div className="sm:col-span-2 border-t border-slate-100 pt-3 font-extrabold text-slate-500 uppercase text-[10px] tracking-wide dark:border-slate-800 dark:text-slate-500">Employment</div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Nature of Employment</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.natureOfEmployment}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Coverage Type</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.coverageType}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Occupation</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.occupation}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Passport No.</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.passportNumber}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Estimated Salary</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.salaryAmount.toLocaleString()} {viewingApp.salaryCurrency}</span></div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Foreign Employer</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.employerName}</span></div>
              <div>
                <span className="text-slate-400 font-bold block dark:text-slate-500">Country of Employment</span>
                <span className="font-bold text-slate-800 flex items-center space-x-1 dark:text-slate-200">
                  <span>{viewingApp.employerCountry}</span>
                  {viewingApp.isConflictZone && <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                </span>
              </div>
              <div><span className="text-slate-400 font-bold block dark:text-slate-500">Contract Period</span><span className="font-bold text-slate-800 dark:text-slate-200">{viewingApp.contractStart} to {viewingApp.contractEnd}</span></div>

              <div className="sm:col-span-2 border-t border-slate-100 pt-3 font-extrabold text-slate-500 uppercase text-[10px] tracking-wide dark:border-slate-800 dark:text-slate-500">Documents</div>
              <div className="sm:col-span-2 flex items-center flex-wrap gap-4">
                {docBadge('Passport', viewingApp.documents.passport)}
                {docBadge('Visa', viewingApp.documents.visa)}
                {docBadge('Employment Contract', viewingApp.documents.employmentContract)}
                {docBadge('Medical Certificate', viewingApp.documents.medicalCertificate)}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setViewingApp(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
