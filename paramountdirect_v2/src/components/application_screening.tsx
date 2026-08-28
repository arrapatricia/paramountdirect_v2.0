import React, { useState } from 'react';
import { Search, Filter, CheckSquare, Square, X, CheckCircle2, XCircle, Lock, ChevronDown, Eye, UserCheck, ShieldAlert } from 'lucide-react';

interface Props {
  onSelectApplication?: (id: string) => void;
}

interface ScreeningItem {
  id: string;
  payor: string;
  planCode: string;
  planDesc: string;
  premium: string;
  source: string;
  dateReceived: string;
  dateScreened: string;
  screenedBy: string;
  status: 'Received' | 'For Verification' | 'Issued' | 'Paid' | 'For Evaluation';
}

// Active logged-in user context for issuer access lock checking
const CURRENT_LOGGED_USER = 'Juan Dela Cruz';

export default function ApplicationScreening({ onSelectApplication }: Props) {
  const [activeTab, setActiveTab] = useState<'Received' | 'For Verification' | 'For Evaluation' | 'Paid' | 'Issued'>('Received');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [accessWarning, setAccessWarning] = useState<string | null>(null);

  const [screeningData, setScreeningData] = useState<ScreeningItem[]>([
    { id: '392015', payor: 'Christian Bukid', planCode: 'HIP', planDesc: 'Plan 1000 - Individual', premium: '₱1,000.00', source: 'Google', dateReceived: '08/27/2026 at 12:44 PM', dateScreened: '-', screenedBy: 'Juan Dela Cruz', status: 'Received' },
    { id: '392012', payor: 'Eleonora Sunga', planCode: 'PHP', planDesc: 'Plan 200', premium: '₱200.00', source: 'Email Newsletter', dateReceived: '08/27/2026 at 08:30 AM', dateScreened: '-', screenedBy: 'Pedro Rodrigo', status: 'Received' },
    { id: '392009', payor: 'Karlo Miguel Bautista', planCode: 'HIP', planDesc: 'Plan 4000 - Individual', premium: '₱4,000.00', source: 'Pd Site', dateReceived: '08/27/2026 at 07:38 AM', dateScreened: '-', screenedBy: 'Oliver Rodrigo', status: 'Received' },
    { id: '367377', payor: 'Paramount Corp', planCode: 'HIP', planDesc: 'Plan 500 - Family', premium: '₱500.00', source: 'Pd Site', dateReceived: '08/27/2026 at 07:50 PM', dateScreened: '08/28/2026', screenedBy: 'Olivia Rodrigo', status: 'Issued' },
    { id: '392013', payor: 'Lorena Tanguan', planCode: 'PCP', planDesc: 'Plan 2000', premium: '₱2,000.00', source: 'Pd Site', dateReceived: '08/27/2026 at 09:11 AM', dateScreened: '08/28/2026', screenedBy: 'Olivia Rodrigo', status: 'Issued' },
    { id: '392011', payor: 'Mylene Andrada', planCode: 'PCP', planDesc: 'Plan 500', premium: '₱500.00', source: 'Google', dateReceived: '08/27/2026 at 08:02 AM', dateScreened: '08/28/2026', screenedBy: 'Olivia Rodrigo', status: 'Issued' },
    { id: '392010', payor: 'Christian Miciano', planCode: 'PCP', planDesc: 'Plan 4000', premium: '₱4,000.00', source: 'Pd Site', dateReceived: '08/27/2026 at 07:51 AM', dateScreened: '08/28/2026', screenedBy: 'Olivia Rodrigo', status: 'Issued' },
    { id: '392008', payor: 'Melinda Bautista', planCode: 'PHC', planDesc: 'Plan 3000', premium: '₱3,000.00', source: 'Pd Site', dateReceived: '08/27/2026 at 07:17 AM', dateScreened: '08/28/2026', screenedBy: 'Olivia Rodrigo', status: 'Issued' },
    { id: '392007', payor: 'Nicanor Bautista', planCode: 'PHC', planDesc: 'Plan 3000', premium: '₱3,000.00', source: 'Pd Site', dateReceived: '08/27/2026 at 07:10 AM', dateScreened: '08/28/2026', screenedBy: 'Olivia Rodrigo', status: 'Issued' },
  ]);

  // Tab counts dynamically computed
  const tabCounts = {
    Received: screeningData.filter(d => d.status === 'Received').length,
    'For Verification': screeningData.filter(d => d.status === 'For Verification').length,
    'For Evaluation': screeningData.filter(d => d.status === 'For Evaluation').length,
    Paid: screeningData.filter(d => d.status === 'Paid').length,
    Issued: 176240,
  };

  // Filtered rows matching active tab & search
  const filteredData = screeningData.filter((item) => {
    const matchesTab = item.status === activeTab;
    const matchesSearch = item.payor.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData.map(item => item.id));
    }
  };

  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const toggleStatusMenu = (row: ScreeningItem) => {
    if (row.screenedBy !== CURRENT_LOGGED_USER && row.status !== 'Issued') {
      setAccessWarning(`Access Locked: Record #${row.id} is actively locked by Issuer "${row.screenedBy}".`);
      setTimeout(() => setAccessWarning(null), 4000);
      return;
    }
    setAccessWarning(null);
    setActiveMenuId(activeMenuId === row.id ? null : row.id);
  };

  const handleStatusUpdate = (id: string, newStatus: ScreeningItem['status']) => {
    setScreeningData(prev =>
      prev.map(item => {
        if (item.id === id) {
          const isIssued = newStatus === 'Issued';
          return {
            ...item,
            status: newStatus,
            dateScreened: isIssued ? '08/28/2026' : '-',
          };
        }
        return item;
      })
    );
    setActiveMenuId(null);
  };

  const handleViewDetails = (row: ScreeningItem) => {
    if (row.screenedBy !== CURRENT_LOGGED_USER && row.status !== 'Issued') {
      setAccessWarning(`Access Restricted: Application #${row.id} is assigned to Issuer "${row.screenedBy}".`);
      setTimeout(() => setAccessWarning(null), 4000);
      return;
    }
    if (onSelectApplication) {
      onSelectApplication(row.id);
    }
  };

  const workflowStatusOptions: Exclude<ScreeningItem['status'], 'Received'>[] = [
    'For Verification',
    'For Evaluation',
    'Paid',
    'Issued',
  ];

  const getStatusBadgeStyle = (status: ScreeningItem['status']) => {
    switch (status) {
      case 'Received':
        return 'bg-[#d0112b]/10 text-[#d0112b] border-[#d0112b]/30';
      case 'For Verification':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'For Evaluation':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Paid':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Issued':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900">
      {/* Title Header */}
      <div className="flex justify-between items-center border-b pb-4 border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#d0112b]" />
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
            APPLICATION SCREENING
          </h1>
        </div>
      </div>

      {/* Issuer Lock Warning Alert Banner */}
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
      <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800 uppercase">SEARCH BY</span>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name / Reference No."
                className="w-56 pl-3 pr-8 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4]"
              />
              <button className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-[#008cb4]">
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-700">Source</span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 outline-none"
            >
              <option value="All">All</option>
              <option value="Pd Site">Pd Site</option>
              <option value="Google">Google</option>
              <option value="Email Newsletter">Email Newsletter</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-700">Product</span>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 outline-none"
            >
              <option value="All">All</option>
              <option value="PCP">PCP</option>
              <option value="HIP">HIP</option>
              <option value="PHP">PHP</option>
              <option value="PHC">PHC</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-700">From</span>
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              className="w-28 px-2 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 text-center outline-none"
            />
            <span className="text-xs font-semibold text-slate-700">To</span>
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              className="w-28 px-2 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 text-center outline-none"
            />
          </div>

          <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer">
            <Filter className="h-3.5 w-3.5" />
          </button>
          <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Rearranged Status Counter Tabs */}
      <div className="rounded-2xl border border-slate-300 bg-slate-200/70 p-1 flex items-center justify-start space-x-1 overflow-x-auto">
        {(['Received', 'For Verification', 'For Evaluation', 'Paid', 'Issued'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {tab} <span className={`font-extrabold ml-1 ${tab === 'Received' ? 'text-[#d0112b]' : ''}`}>{tabCounts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Main Screening Table */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-slate-800 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-2 w-8">
                  <button onClick={handleSelectAll} className="cursor-pointer">
                    {selectedItems.length === filteredData.length && filteredData.length > 0 ? (
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
                <th className="py-3 px-2">Issuer / Screened By</th>
                <th className="py-3 px-2 text-center">Transmitted to iPeak</th>
                <th className="py-3 px-2 text-center">Application Status</th>
                <th className="py-3 px-2 text-center">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 font-bold">
                    No applications currently found under "{activeTab}".
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
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

                      <td className="py-3.5 px-2 font-black text-[#d0112b]">
                        {row.premium}
                      </td>

                      <td className="py-3.5 px-2 font-semibold text-slate-800">{row.source}</td>
                      <td className="py-3.5 px-2 font-semibold text-slate-800">{row.dateReceived}</td>
                      <td className="py-3.5 px-2 font-semibold text-slate-800">{row.dateScreened}</td>

                      {/* Issuer / Screened By Lock Tag */}
                      <td className="py-3.5 px-2 font-semibold text-slate-800">
                        <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${
                          isLockedByOther 
                            ? 'bg-amber-50 border-amber-300 text-amber-800' 
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          {isLockedByOther ? (
                            <Lock className="h-3 w-3 text-amber-600" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5 text-[#d0112b]" />
                          )}
                          <span>{row.screenedBy}</span>
                        </div>
                      </td>
                      
                      {/* Transmitted to iPeak Badge */}
                      <td className="py-3.5 px-2 text-center">
                        {isIssued ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Yes</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-300">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>No</span>
                          </span>
                        )}
                      </td>

                      {/* Status Dropdown Menu with Access Check */}
                      <td className="py-3.5 px-2 relative text-center">
                        {isIssued ? (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-100 text-emerald-800 text-xs font-bold shadow-sm">
                            <Lock className="h-3.5 w-3.5" />
                            <span>Issued</span>
                          </div>
                        ) : (
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => toggleStatusMenu(row)}
                              className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${getStatusBadgeStyle(row.status)} ${
                                isLockedByOther ? 'opacity-80 cursor-not-allowed' : ''
                              }`}
                            >
                              <span>{row.status}</span>
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${activeMenuId === row.id ? 'rotate-180' : ''}`} />
                            </button>

                            {activeMenuId === row.id && !isLockedByOther && (
                              <div className="absolute right-0 top-10 z-50 w-44 py-2 rounded-2xl bg-white border border-slate-200 shadow-xl text-left font-sans">
                                <div className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                                  Update Status
                                </div>
                                {workflowStatusOptions.map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => handleStatusUpdate(row.id, opt)}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                                      row.status === opt
                                        ? 'bg-[#d0112b] text-white'
                                        : 'text-slate-800 hover:bg-slate-100'
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {opt === 'Issued' && <Lock className="h-3 w-3 text-amber-500" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* View Action */}
                      <td className="py-3.5 px-2 text-center">
                        <button
                          onClick={() => handleViewDetails(row)}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            isLockedByOther
                              ? 'bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-[#d0112b] hover:text-white'
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
      </div>
    </div>
  );
}