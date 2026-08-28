import React, { useState } from 'react';
import { Search, Filter, CheckSquare, Square, X, CheckCircle2, XCircle, Lock, ChevronDown, Eye } from 'lucide-react';

interface Props {
  darkMode: boolean;
  onSelectApplication?: (id: string) => void;
}

interface ScreeningItem {
  id: string;
  payor: string;
  planCode: string;
  planDesc: string;
  source: string;
  dateReceived: string;
  dateScreened: string;
  status: 'Received' | 'For Verification' | 'Issued' | 'Paid' | 'For Evaluation';
}

export default function ApplicationScreening({ darkMode, onSelectApplication }: Props) {
  const [activeTab, setActiveTab] = useState<'Received' | 'For Verification' | 'Issued' | 'Paid' | 'For Evaluation'>('Issued');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [screeningData, setScreeningData] = useState<ScreeningItem[]>([
    { id: '367377', payor: 'Paramount Corp', planCode: 'HIP', planDesc: 'Plan 500 - Family', source: 'Pd Site', dateReceived: '08/27/2026 at 07:50 PM', dateScreened: '08/28/2026', status: 'Issued' },
    { id: '392015', payor: 'Christian Bukid', planCode: 'HIP', planDesc: 'Plan 1000 - Individual', source: 'Google', dateReceived: '08/27/2026 at 12:44 PM', dateScreened: '-', status: 'Received' },
    { id: '392013', payor: 'Lorena Tanguan', planCode: 'PCP', planDesc: 'Plan 2000', source: 'Pd Site', dateReceived: '08/27/2026 at 09:11 AM', dateScreened: '08/28/2026', status: 'Issued' },
    { id: '392012', payor: 'Eleonora Sunga', planCode: 'PHP', planDesc: 'Plan 200', source: 'Email Newsletter', dateReceived: '08/27/2026 at 08:30 AM', dateScreened: '-', status: 'Received' },
    { id: '392011', payor: 'Mylene Andrada', planCode: 'PCP', planDesc: 'Plan 500', source: 'Google', dateReceived: '08/27/2026 at 08:02 AM', dateScreened: '08/28/2026', status: 'Issued' },
    { id: '392010', payor: 'Christian Miciano', planCode: 'PCP', planDesc: 'Plan 4000', source: 'Pd Site', dateReceived: '08/27/2026 at 07:51 AM', dateScreened: '08/28/2026', status: 'Issued' },
    { id: '392009', payor: 'Karlo Miguel Bautista', planCode: 'HIP', planDesc: 'Plan 4000 - Individual', source: 'Pd Site', dateReceived: '08/27/2026 at 07:38 AM', dateScreened: '-', status: 'Received' },
    { id: '392008', payor: 'Melinda Bautista', planCode: 'PHC', planDesc: 'Plan 3000', source: 'Pd Site', dateReceived: '08/27/2026 at 07:17 AM', dateScreened: '08/28/2026', status: 'Issued' },
    { id: '392007', payor: 'Nicanor Bautista', planCode: 'PHC', planDesc: 'Plan 3000', source: 'Pd Site', dateReceived: '08/27/2026 at 07:10 AM', dateScreened: '08/28/2026', status: 'Issued' },
  ]);

  const handleSelectAll = () => {
    if (selectedItems.length === screeningData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(screeningData.map(item => item.id));
    }
  };

  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
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
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'For Evaluation':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'Paid':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30';
      case 'Issued':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  return (
    <div className={`p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-500 ${
      darkMode ? 'text-white' : 'text-gray-900'
    }`}>
      {/* Title Header */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#d0112b]" />
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
            APPLICATION SCREENING
          </h1>
        </div>
      </div>

      {/* Top Search & Filter Bar */}
      <div className={`p-4 rounded-3xl border backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 ${
        darkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase">SEARCH BY</span>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name / Reference No."
                className={`w-56 pl-3 pr-8 py-1.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-[#008cb4] ${
                  darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              />
              <button className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-[#008cb4]">
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Source</span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border outline-none ${
                darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            >
              <option value="All">All</option>
              <option value="Pd Site">Pd Site</option>
              <option value="Google">Google</option>
              <option value="Email Newsletter">Email Newsletter</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Product</span>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border outline-none ${
                darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            >
              <option value="All">All</option>
              <option value="PCP">PCP</option>
              <option value="HIP">HIP</option>
              <option value="PHP">PHP</option>
              <option value="PHC">PHC</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">From</span>
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              className={`w-28 px-2 py-1.5 rounded-xl text-xs font-medium border text-center outline-none ${
                darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">To</span>
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              className={`w-28 px-2 py-1.5 rounded-xl text-xs font-medium border text-center outline-none ${
                darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            />
          </div>

          <button className="p-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 cursor-pointer">
            <Filter className="h-3.5 w-3.5" />
          </button>
          <button className="p-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Bulk Actions :</span>
          <button className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-white/20 text-xs font-bold bg-gray-100 dark:bg-white/10 cursor-pointer text-gray-800 dark:text-gray-200">
            <span>Action</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs Counter Banner */}
      <div className={`rounded-2xl border p-1 flex items-center justify-start space-x-1 overflow-x-auto ${
        darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-200/70 border-gray-300'
      }`}>
        <button
          onClick={() => setActiveTab('Received')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'Received' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900'
          }`}
        >
          Received <span className="font-extrabold ml-1">3</span>
        </button>

        <button
          onClick={() => setActiveTab('For Verification')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'For Verification' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900'
          }`}
        >
          For Verification <span className="font-extrabold ml-1">0</span>
        </button>

        <button
          onClick={() => setActiveTab('Issued')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'Issued' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900'
          }`}
        >
          Issued <span className="font-extrabold ml-1 text-[#d0112b]">176240</span>
        </button>

        <button
          onClick={() => setActiveTab('Paid')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'Paid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900'
          }`}
        >
          Paid <span className="font-extrabold ml-1">0</span>
        </button>

        <button
          onClick={() => setActiveTab('For Evaluation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'For Evaluation' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900'
          }`}
        >
          For Evaluation <span className="font-extrabold ml-1">0</span>
        </button>
      </div>

      {/* Main Table */}
      <div className={`p-6 rounded-3xl border backdrop-blur-xl ${
        darkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-200 font-bold uppercase tracking-wider">
                <th className="py-3 px-2 w-8">
                  <button onClick={handleSelectAll} className="cursor-pointer">
                    {selectedItems.length === screeningData.length ? (
                      <CheckSquare className="h-4 w-4 text-[#d0112b]" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-2">ID</th>
                <th className="py-3 px-2">Payor</th>
                <th className="py-3 px-2">Plan</th>
                <th className="py-3 px-2">Source</th>
                <th className="py-3 px-2">Date Received</th>
                <th className="py-3 px-2">Date Screened</th>
                <th className="py-3 px-2 text-center">Transmitted to iPeak</th>
                <th className="py-3 px-2 text-center">Application Status</th>
                <th className="py-3 px-2 text-center">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {screeningData.map((row) => {
                const isIssued = row.status === 'Issued';
                return (
                  <tr key={row.id} className="hover:bg-gray-100/70 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-2">
                      <button onClick={() => handleSelectItem(row.id)} className="cursor-pointer">
                        {selectedItems.includes(row.id) ? (
                          <CheckSquare className="h-4 w-4 text-[#d0112b]" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-2 font-bold text-black dark:text-white">{row.id}</td>
                    <td className="py-3.5 px-2 font-bold text-black dark:text-white text-xs">{row.payor}</td>
                    <td className="py-3.5 px-2">
                      <span className="font-extrabold text-black dark:text-white">{row.planCode}</span>
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 ml-1.5">{row.planDesc}</span>
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-black dark:text-gray-200">{row.source}</td>
                    <td className="py-3.5 px-2 font-semibold text-black dark:text-gray-200">{row.dateReceived}</td>
                    <td className="py-3.5 px-2 font-semibold text-black dark:text-gray-200">{row.dateScreened}</td>
                    
                    {/* Transmitted to iPeak Badge */}
                    <td className="py-3.5 px-2 text-center">
                      {isIssued ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>No</span>
                        </span>
                      )}
                    </td>

                    {/* Status Menu */}
                    <td className="py-3.5 px-2 relative text-center">
                      {isIssued ? (
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-sm">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Issued</span>
                        </div>
                      ) : (
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
                            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${getStatusBadgeStyle(row.status)}`}
                          >
                            <span>{row.status}</span>
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${activeMenuId === row.id ? 'rotate-180' : ''}`} />
                          </button>

                          {activeMenuId === row.id && (
                            <div className="absolute right-0 top-10 z-40 w-44 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-2xl text-left font-sans animate-fadeIn">
                              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 mb-1">
                                Update Status
                              </div>
                              {workflowStatusOptions.map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() => handleStatusUpdate(row.id, opt)}
                                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                    row.status === opt
                                      ? 'bg-[#d0112b] text-white'
                                      : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {opt === 'Issued' && <Lock className="h-3 w-3 text-amber-300" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* View Details Icon Action */}
                    <td className="py-3.5 px-2 text-center">
                      <button
                        onClick={() => onSelectApplication && onSelectApplication(row.id)}
                        className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-[#d0112b] hover:text-white cursor-pointer transition-all"
                        title="View Application Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}