import React, { useState } from 'react';
import { Search, CheckSquare, Square, X, CheckCircle2, XCircle, Lock, Eye, UserCheck, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScreeningItem } from '../App';

interface Props {
  data: ScreeningItem[];
  onSelectApplication?: (id: string, planCode: string) => void;
}

const CURRENT_LOGGED_USER = 'Oliver Rodrigo';
const ITEMS_PER_PAGE = 20;

export default function ApplicationScreening({ data, onSelectApplication }: Props) {
  // Component State
  const [activeTab, setActiveTab] = useState<string>('Received');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [accessWarning, setAccessWarning] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Tab counts dynamically computed from 'data' prop
  const tabCounts: Record<string, number> = {
    'Received': data.filter(d => d.status === 'Received').length,
    'For Verification': data.filter(d => d.status === 'For Verification').length,
    'For Evaluation': data.filter(d => d.status === 'For Evaluation').length,
    'Paid': data.filter(d => d.status === 'Paid').length,
    'Issued': data.filter(d => d.status === 'Issued').length,
  };

  // 1. Filter Data
  const filteredData = data.filter((item) => {
    const matchesTab = item.status === activeTab;
    const matchesSearch = item.payor.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.includes(searchTerm);
    const matchesSource = selectedSource === 'All' || item.source === selectedSource;
    const matchesProduct = selectedProduct === 'All' || item.planCode === selectedProduct;
    
    let matchesDate = true;
    if (fromDate || toDate) {
      // Extract MM/DD/YYYY from "MM/DD/YYYY at HH:MM PM"
      const datePart = item.dateReceived.split(' at ')[0];
      const [mm, dd, yyyy] = datePart.split('/');
      const itemDateStr = `${yyyy}-${mm}-${dd}`; // Convert to YYYY-MM-DD for standard JS comparison

      if (fromDate && itemDateStr < fromDate) matchesDate = false;
      if (toDate && itemDateStr > toDate) matchesDate = false;
    }

    return matchesTab && matchesSearch && matchesSource && matchesProduct && matchesDate;
  });

  // 2. Paginate Data
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedItems([]);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSource('All');
    setSelectedProduct('All');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === paginatedData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedData.map(item => item.id));
    }
  };

  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleViewDetails = (row: ScreeningItem) => {
    if (row.screenedBy !== CURRENT_LOGGED_USER && row.status !== 'Issued') {
      setAccessWarning(`Access Restricted: Application #${row.id} is assigned to Issuer "${row.screenedBy}".`);
      setTimeout(() => setAccessWarning(null), 4000);
      return;
    }
    if (onSelectApplication) {
      onSelectApplication(row.id, row.planCode);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Received': return 'bg-[#d0112b]/10 text-[#d0112b] border-[#d0112b]/30';
      case 'For Verification': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'For Evaluation': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Paid': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Issued': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900">
      <div className="flex justify-between items-center border-b pb-4 border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#d0112b]" />
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
            APPLICATION SCREENING
          </h1>
        </div>
      </div>

      {accessWarning && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 flex items-center justify-between text-xs font-bold animate-fadeIn">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span>{accessWarning}</span>
          </div>
          <button onClick={() => setAccessWarning(null)} className="cursor-pointer">
            <X className="h-4 w-4 text-amber-600" />
          </button>
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center gap-4">
        
        {/* Search */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase">Search By</span>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Name / Reference No."
              className="w-48 pl-3 pr-8 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4]"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#008cb4]" />
          </div>
        </div>

        {/* Source Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase">Source</span>
          <select 
            value={selectedSource}
            onChange={(e) => { setSelectedSource(e.target.value); setCurrentPage(1); }}
            className="w-32 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer"
          >
            <option value="All">All</option>
            <option value="Google">Google</option>
            <option value="Email Newsletter">Email</option>
            <option value="Pd Site">PD Site</option>
            <option value="Facebook">Facebook</option>
          </select>
        </div>

        {/* Product Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase">Product</span>
          <select 
            value={selectedProduct}
            onChange={(e) => { setSelectedProduct(e.target.value); setCurrentPage(1); }}
            className="w-24 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer"
          >
            <option value="All">All</option>
            <optgroup label="Health - Online">
              <option value="HCP">HCP</option>
              <option value="HIP">HIP</option>
              <option value="PCP">PCP</option>
              <option value="PHC">PHC</option>
            </optgroup>
            <optgroup label="Life & Accident - Online">
              <option value="GLA">GLA</option>
              <option value="GLP">GLP</option>
              <option value="GPR">GPR</option>
            </optgroup>
            <optgroup label="Comprehensive - Online">
              <option value="SSP">SSP</option>
              <option value="MPR">MPR</option>
              <option value="PHP">PHP</option>
              <option value="DRE">DRE</option>
            </optgroup>
          </select>
        </div>

        {/* Date From */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4]"
          />
        </div>

        {/* Date To */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-800 uppercase">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4]"
          />
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || selectedSource !== 'All' || selectedProduct !== 'All' || fromDate || toDate) && (
          <button 
            onClick={handleClearFilters}
            className="ml-auto p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-[#d0112b] hover:bg-red-50 transition-colors cursor-pointer"
            title="Clear All Filters"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status Counter Tabs */}
      <div className="rounded-2xl border border-slate-300 bg-slate-200/70 p-1 flex items-center justify-start space-x-1 overflow-x-auto">
        {(['Received', 'For Verification', 'For Evaluation', 'Paid', 'Issued'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {tab} <span className={`font-extrabold ml-1 ${tab === 'Received' ? 'text-[#d0112b]' : ''}`}>{tabCounts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Main Screening Table */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-slate-800 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-2 w-8">
                  <button onClick={handleSelectAll} className="cursor-pointer">
                    {selectedItems.length === paginatedData.length && paginatedData.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-[#d0112b]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-2">ID</th>
                <th className="py-3 px-2">Payor</th>
                <th className="py-3 px-2">Plan</th>
                <th className="py-3 px-2">Premium</th>
                <th className="py-3 px-2">Source</th>
                <th className="py-3 px-2">Date Received</th>
                <th className="py-3 px-2">Date Screened</th>
                <th className="py-3 px-2">Screened By</th>
                <th className="py-3 px-2 text-center">Transmitted to iPeak</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 font-bold">
                    No applications match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const isIssued = row.status === 'Issued';
                  const isLockedByOther = row.screenedBy !== CURRENT_LOGGED_USER && !isIssued;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-2">
                        <button onClick={() => handleSelectItem(row.id)} className="cursor-pointer">
                          {selectedItems.includes(row.id) ? (
                            <CheckSquare className="h-4 w-4 text-[#d0112b]" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-2 font-bold text-slate-900">{row.id}</td>
                      <td className="py-3.5 px-2 font-bold text-slate-900 text-xs">{row.payor}</td>
                      <td className="py-3.5 px-2">
                        <span className="font-extrabold text-slate-900">{row.planCode}</span>
                        <span className="text-[10px] font-semibold text-slate-600 ml-1.5">{row.planDesc}</span>
                      </td>
                      <td className="py-3.5 px-2 font-black text-[#d0112b]">{row.premium}</td>
                      <td className="py-3.5 px-2 font-semibold text-slate-800">{row.source}</td>
                      <td className="py-3.5 px-2 font-semibold text-slate-800">{row.dateReceived}</td>
                      <td className="py-3.5 px-2 font-semibold text-slate-800">{row.dateScreened}</td>
                      <td className="py-3.5 px-2 font-semibold text-slate-800">
                        <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${
                          isLockedByOther ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          {isLockedByOther ? <Lock className="h-3 w-3 text-amber-600" /> : <UserCheck className="h-3.5 w-3.5 text-[#d0112b]" />}
                          <span>{row.screenedBy}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        {isIssued ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" /><span>Yes</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-300">
                            <XCircle className="h-3.5 w-3.5" /><span>No</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${getStatusBadgeStyle(row.status)}`}>
                          <span>{row.status}</span>
                          {isIssued && <Lock className="h-3.5 w-3.5" />}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <button
                          onClick={() => handleViewDetails(row)}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            isLockedByOther ? 'bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-700' : 'bg-slate-100 text-slate-700 hover:bg-[#d0112b] hover:text-white'
                          }`}
                          title={isLockedByOther ? `Assigned to ${row.screenedBy}` : 'View Application Details'}
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

        {/* Pagination Controls */}
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
              <div className="text-xs font-bold text-slate-700 px-2">
                Page {currentPage} of {totalPages}
              </div>
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
    </div>
  );
}