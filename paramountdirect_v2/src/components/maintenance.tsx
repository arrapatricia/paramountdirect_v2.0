import React from 'react';
import { Plus, Edit2, Trash2, Settings, Target, Users, Building2, BarChart3, Globe } from 'lucide-react';
import BranchDirectory from './branch_directory';

interface Props {
  activeSubTab?: string;
  setActiveSubTab?: (tab: string) => void;
}

export default function Maintenance({ activeSubTab = 'branch', setActiveSubTab }: Props) {
  const marketingSources = [
    { id: 1, name: 'ML', type: 'Affiliate', status: 'Active' },
    { id: 2, name: 'Email', type: 'Direct', status: 'Active' },
    { id: 3, name: 'Non-Life', type: 'Cross-Sell', status: 'Active' },
    { id: 4, name: 'Google', type: 'Paid Search', status: 'Active' },
    { id: 5, name: 'Facebook', type: 'Social Media', status: 'Active' },
    { id: 6, name: 'Direct', type: 'Organic', status: 'Inactive' },
  ];

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-gray-50">
      {/* Sub-Module Nav Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex space-x-6 text-xs font-bold shadow-xs">
        <button
          onClick={() => setActiveSubTab && setActiveSubTab('branch')}
          className={`flex items-center space-x-2 pb-2 transition-all cursor-pointer border-b-2 ${
            activeSubTab === 'branch'
              ? 'text-[#d0112b] border-[#d0112b]'
              : 'text-slate-500 border-transparent hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Branch Directory</span>
        </button>

        <button
          onClick={() => setActiveSubTab && setActiveSubTab('marketing')}
          className={`flex items-center space-x-2 pb-2 transition-all cursor-pointer border-b-2 ${
            activeSubTab === 'marketing'
              ? 'text-[#d0112b] border-[#d0112b]'
              : 'text-slate-500 border-transparent hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Marketing Dashboard</span>
        </button>

        <button
          onClick={() => setActiveSubTab && setActiveSubTab('cms')}
          className={`flex items-center space-x-2 pb-2 transition-all cursor-pointer border-b-2 ${
            activeSubTab === 'cms'
              ? 'text-[#d0112b] border-[#d0112b]'
              : 'text-slate-500 border-transparent hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>CMS (Website Content)</span>
        </button>
      </div>

      {/* View Switcher */}
      <div>
        {activeSubTab === 'branch' && <BranchDirectory />}

        {activeSubTab === 'marketing' && (
          <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center border-b pb-4 border-slate-200">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-[#d0112b]" />
                <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
                  MARKETING DASHBOARD CONFIGURATION
                </h1>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">Source Name</th>
                    <th className="py-4 px-6">Marketing Channel</th>
                    <th className="py-4 px-6">Dashboard Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marketingSources.map((source) => (
                    <tr key={source.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-500">#{source.id}</td>
                      <td className="py-4 px-6 font-extrabold text-slate-900">{source.name}</td>
                      <td className="py-4 px-6 font-semibold text-slate-700">{source.type}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          source.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {source.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 flex items-center justify-end space-x-2">
                        <button className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'cms' && (
          <div className="p-12 text-center text-slate-400 font-bold max-w-[1600px] mx-auto">
            <Globe className="w-12 h-12 mx-auto mb-4 text-slate-200" />
            <p>Website CMS Content Management module goes here.</p>
          </div>
        )}
      </div>
    </div>
  );
}