import React, { useState } from 'react';
import {
  Search, Eye, X, ChevronLeft, ChevronRight, UserPlus,
  FileCheck2, FileX2, ShieldAlert, Plane
} from 'lucide-react';
import type { OfwApplication } from './ofw_types';

interface Props {
  data: OfwApplication[];
  onCreateNew?: () => void;
}

const ITEMS_PER_PAGE = 20;
const STATUS_TABS = ['All', 'Received', 'For Verification', 'For Evaluation', 'Paid', 'Issued'] as const;

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'Received': return 'bg-[#002f6c]/10 text-[#002f6c] border-[#002f6c]/30';
    case 'For Verification': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'For Evaluation': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Paid': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'Issued': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    default: return 'bg-slate-100 text-slate-700 border-slate-300';
  }
};

const getRowTintStyle = (status: string) => {
  switch (status) {
    case 'Received': return 'bg-[#002f6c]/[0.03] hover:bg-[#002f6c]/[0.06]';
    case 'For Verification': return 'bg-amber-50/60 hover:bg-amber-50';
    case 'For Evaluation': return 'bg-purple-50/60 hover:bg-purple-50';
    case 'Paid': return 'bg-indigo-50/60 hover:bg-indigo-50';
    case 'Issued': return 'bg-emerald-50/60 hover:bg-emerald-50';
    default: return 'hover:bg-slate-50';
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
    'Received': data.filter(d => d.status === 'Received').length,
    'For Verification': data.filter(d => d.status === 'For Verification').length,
    'For Evaluation': data.filter(d => d.status === 'For Evaluation').length,
    'Paid': data.filter(d => d.status === 'Paid').length,
    'Issued': data.filter(d => d.status === 'Issued').length,
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
        status === 'Uploaded' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
      }`}
    >
      {status === 'Uploaded' ? <FileCheck2 className="w-3.5 h-3.5" /> : <FileX2 className="w-3.5 h-3.5" />}
    </span>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200">
        <div className="flex items-center space-x-2.5">
          <Plane className="h-6 w-6 text-[#002f6c]" />
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#002f6c] font-['Montserrat']">
              OFW APPLICATIONS
            </h1>
            <p className="text-xs text-slate-500 font-semibold">OFW Compulsory Insurance — application registry and document verification</p>
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
      <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search by applicant name or reference no..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase">Coverage</span>
          <select
            value={coverageFilter}
            onChange={(e) => { setCoverageFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] cursor-pointer"
          >
            <option value="All">All</option>
            <option value="Land-based">Land-based</option>
            <option value="Sea-based">Sea-based</option>
          </select>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="rounded-2xl border border-slate-300 bg-slate-200/70 p-1 flex items-center justify-start space-x-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {tab} <span className="font-extrabold ml-1">{tabCounts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-slate-800 font-extrabold uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-bold">
                    No applications match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id} className={`transition-colors ${getRowTintStyle(row.status)}`}>
                    <td className="py-3.5 px-2 font-bold text-slate-900">{row.id}</td>
                    <td className="py-3.5 px-2">
                      <div className="font-bold text-slate-900">{row.firstName} {row.lastName}</div>
                      {row.isConflictZone && (
                        <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold text-amber-700 mt-0.5">
                          <ShieldAlert className="w-3 h-3" /><span>Conflict-Zone Advisory</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700">{row.occupation}</td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700">{row.coverageType}</td>
                    <td className="py-3.5 px-2 font-semibold text-slate-700">{row.employerCountry}</td>
                    <td className="py-3.5 px-2 font-black text-[#002f6c]">{row.premium}</td>
                    <td className="py-3.5 px-2">
                      <div className="flex items-center justify-center space-x-1">
                        {docBadge('Passport', row.documents.passport)}
                        {docBadge('Visa', row.documents.visa)}
                        {docBadge('Employment Contract', row.documents.employmentContract)}
                        {docBadge('Medical Certificate', row.documents.medicalCertificate)}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold ${getStatusBadgeStyle(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <button
                        onClick={() => setViewingApp(row)}
                        className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#002f6c] hover:text-white transition-all cursor-pointer"
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
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200 px-2">
            <span className="text-xs text-slate-500 font-semibold">
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-bold text-slate-900">{totalItems}</span> records
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <div className="text-xs font-bold text-slate-700 px-2">Page {currentPage} of {totalPages}</div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-1"
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
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-4 border-slate-100">
              <h2 className="text-base font-bold uppercase text-slate-900">Application {viewingApp.id}</h2>
              <button onClick={() => setViewingApp(null)} className="cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div><span className="text-slate-400 font-bold block">Applicant</span><span className="font-extrabold text-slate-900">{viewingApp.firstName} {viewingApp.middleName} {viewingApp.lastName}</span></div>
              <div><span className="text-slate-400 font-bold block">Gender / Civil Status</span><span className="font-bold text-slate-800">{viewingApp.gender} &middot; {viewingApp.civilStatus}</span></div>
              <div><span className="text-slate-400 font-bold block">Birthdate</span><span className="font-bold text-slate-800">{viewingApp.birthdate}</span></div>
              <div><span className="text-slate-400 font-bold block">Place of Birth</span><span className="font-bold text-slate-800">{viewingApp.placeOfBirth}</span></div>
              <div className="col-span-2"><span className="text-slate-400 font-bold block">PH Address</span><span className="font-bold text-slate-800">{viewingApp.phAddress}, {viewingApp.phCity}</span></div>
              <div><span className="text-slate-400 font-bold block">Mobile</span><span className="font-bold text-slate-800">{viewingApp.phone}</span></div>
              <div><span className="text-slate-400 font-bold block">Email</span><span className="font-bold text-slate-800">{viewingApp.email}</span></div>

              <div className="col-span-2 border-t border-slate-100 pt-3 font-extrabold text-slate-500 uppercase text-[10px] tracking-wide">Employment</div>
              <div><span className="text-slate-400 font-bold block">Nature of Employment</span><span className="font-bold text-slate-800">{viewingApp.natureOfEmployment}</span></div>
              <div><span className="text-slate-400 font-bold block">Coverage Type</span><span className="font-bold text-slate-800">{viewingApp.coverageType}</span></div>
              <div><span className="text-slate-400 font-bold block">Occupation</span><span className="font-bold text-slate-800">{viewingApp.occupation}</span></div>
              <div><span className="text-slate-400 font-bold block">Passport No.</span><span className="font-bold text-slate-800">{viewingApp.passportNumber}</span></div>
              <div><span className="text-slate-400 font-bold block">Estimated Salary</span><span className="font-bold text-slate-800">{viewingApp.salaryAmount.toLocaleString()} {viewingApp.salaryCurrency}</span></div>
              <div><span className="text-slate-400 font-bold block">Foreign Employer</span><span className="font-bold text-slate-800">{viewingApp.employerName}</span></div>
              <div>
                <span className="text-slate-400 font-bold block">Country of Employment</span>
                <span className="font-bold text-slate-800 flex items-center space-x-1">
                  <span>{viewingApp.employerCountry}</span>
                  {viewingApp.isConflictZone && <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
                </span>
              </div>
              <div><span className="text-slate-400 font-bold block">Contract Period</span><span className="font-bold text-slate-800">{viewingApp.contractStart} to {viewingApp.contractEnd}</span></div>

              <div className="col-span-2 border-t border-slate-100 pt-3 font-extrabold text-slate-500 uppercase text-[10px] tracking-wide">Documents</div>
              <div className="col-span-2 flex items-center space-x-4">
                {docBadge('Passport', viewingApp.documents.passport)}
                {docBadge('Visa', viewingApp.documents.visa)}
                {docBadge('Employment Contract', viewingApp.documents.employmentContract)}
                {docBadge('Medical Certificate', viewingApp.documents.medicalCertificate)}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button onClick={() => setViewingApp(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
