import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Settings, Target, Users } from 'lucide-react';

export default function Maintenance() {
  const [activeTab, setActiveTab] = useState<'Sources' | 'Categories' | 'Targets'>('Sources');

  // Dummy data for marketing configurations
  const marketingSources = [
    { id: 1, name: 'ML', type: 'Affiliate', status: 'Active' },
    { id: 2, name: 'Email', type: 'Direct', status: 'Active' },
    { id: 3, name: 'Non-Life', type: 'Cross-Sell', status: 'Active' },
    { id: 4, name: 'Google', type: 'Paid Search', status: 'Active' },
    { id: 5, name: 'Facebook', type: 'Social Media', status: 'Active' },
    { id: 6, name: 'Direct', type: 'Organic', status: 'Inactive' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans text-slate-900">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 border-slate-200">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-[#d0112b]" />
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
            MARKETING DASHBOARD CONFIGURATION
          </h1>
        </div>
        <button className="flex items-center space-x-2 bg-[#d0112b] hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Add New {activeTab.slice(0, -1)}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('Sources')}
          className={`pb-3 px-4 text-xs font-bold flex items-center space-x-2 transition-all border-b-2 ${
            activeTab === 'Sources' ? 'border-[#d0112b] text-[#d0112b]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Acquisition Sources</span>
        </button>
        <button
          onClick={() => setActiveTab('Categories')}
          className={`pb-3 px-4 text-xs font-bold flex items-center space-x-2 transition-all border-b-2 ${
            activeTab === 'Categories' ? 'border-[#d0112b] text-[#d0112b]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Premium Categories</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'Sources' && (
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
        )}

        {activeTab === 'Categories' && (
          <div className="p-12 text-center text-slate-400 font-bold">
            <Target className="w-12 h-12 mx-auto mb-4 text-slate-200" />
            <p>Premium Category management module goes here.</p>
          </div>
        )}
      </div>

    </div>
  );
}