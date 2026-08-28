import React from 'react';
import { Database, RefreshCw, Server, AlertTriangle } from 'lucide-react';

interface Props {
  darkMode: boolean;
}

export default function Maintenance({ darkMode }: Props) {
  return (
    <div className={`p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto font-sans ${
      darkMode ? 'text-white' : 'text-gray-900'
    }`}>
      <div className="border-b pb-4 border-gray-200 dark:border-white/10">
        <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b]">
          System Maintenance
        </h1>
        <p className="text-xs text-gray-400 mt-1">Manage system parameters, cache, and iPeak sync services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cache Refresh */}
        <div className={`p-6 rounded-3xl border backdrop-blur-xl ${
          darkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <div className="flex items-center space-x-3 text-[#d0112b] mb-3">
            <RefreshCw className="h-5 w-5" />
            <h2 className="text-sm font-bold">Flush Application Cache</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Clear localized temporary records and force re-fetching of global policy definitions.
          </p>
          <button className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-white bg-[#d0112b] hover:bg-[#b00e24] cursor-pointer">
            Clear Cache Now
          </button>
        </div>

        {/* Database & Sync Diagnostics */}
        <div className={`p-6 rounded-3xl border backdrop-blur-xl ${
          darkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <div className="flex items-center space-x-3 text-[#d0112b] mb-3">
            <Server className="h-5 w-5" />
            <h2 className="text-sm font-bold">iPeak Integration Service</h2>
          </div>
          <div className="flex items-center space-x-2 text-xs text-amber-500 mb-4">
            <AlertTriangle className="h-4 w-4" />
            <span>Scheduled sync window: 02:00 AM - 03:00 AM PHT</span>
          </div>
          <button className="px-4 py-2.5 rounded-2xl text-xs font-semibold border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer">
            Run Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}