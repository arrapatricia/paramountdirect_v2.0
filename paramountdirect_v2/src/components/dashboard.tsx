import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  MoreVertical, 
  Calendar, 
  Filter 
} from 'lucide-react';

interface DashboardProps {
  darkMode: boolean;
}

export default function Dashboard({ darkMode }: DashboardProps) {
  const [selectedYear, setSelectedYear] = useState('2026');

  return (
    <div className={`p-6 space-y-6 font-['Montserrat'] ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-wider uppercase text-gray-800 dark:text-black font-['Montserrat']">
            MONTHLY APPLICATIONS
          </h1>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Customer Acquisition Donut Section */}
        <div className={`lg:col-span-4 p-6 rounded-3xl border ${
          darkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-black-700 dark:text-gray-200 font-['Montserrat']">
                Customer Acquisition
              </h3>
              <p className="text-xs text-gray-400 font-medium">Breakdown of sources</p>
            </div>
            <div className={`px-3 py-1 rounded-xl text-xs font-bold border ${
              darkMode ? 'bg-slate-800 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              Year - {selectedYear}
            </div>
          </div>

          {/* Donut Chart Visual */}
          <div className="relative flex justify-center items-center my-8">
            <div className="w-48 h-48 rounded-full border-[16px] border-emerald-400 border-t-[#d0112b] border-r-pink-300 flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl font-black font-['Montserrat']">194,231</span>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total applications</p>
              </div>
            </div>
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 gap-3 text-xs font-bold tracking-wide mt-6 font-['Montserrat']">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-300" />
              <span className="text-gray-600 dark:text-gray-300">ML</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d0112b]" />
              <span className="text-gray-600 dark:text-gray-300">Email</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <span className="text-gray-600 dark:text-gray-300">Non-Life</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-200" />
              <span className="text-gray-600 dark:text-gray-300">Google</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span className="text-gray-600 dark:text-gray-300">Facebook</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span className="text-gray-600 dark:text-gray-300">Direct</span>
            </div>
          </div>
        </div>

        {/* Metric Cards & Bar Chart Area */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: TOTAL PREMIUM (Removed Red Dollar Icon) */}
            <div className={`p-5 rounded-3xl border ${
              darkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 font-['Montserrat']">
                  TOTAL PREMIUM
                </span>
              </div>
              <div className="mt-3">
                <h2 className="text-xl font-black text-[#d0112b] font-['Montserrat']">
                  ₱194,231.00
                </h2>
                <div className="flex items-center space-x-1 text-[11px] font-bold text-emerald-500 mt-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+2.45%</span>
                  <span className="text-gray-400 font-medium text-[10px] ml-1">vs Last Month</span>
                </div>
              </div>
            </div>

            {/* Card 2: APPLICATIONS */}
            <div className={`p-5 rounded-3xl border ${
              darkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 font-['Montserrat']">
                  APPLICATIONS
                </span>
                <MoreVertical className="h-4 w-4 text-gray-400 cursor-pointer" />
              </div>
              <div className="mt-3">
                <h2 className="text-xl font-black text-gray-800 dark:text-white font-['Montserrat']">
                  1,363
                </h2>
                <div className="flex items-center space-x-1 text-[11px] font-bold text-emerald-500 mt-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+1.14%</span>
                </div>
              </div>
            </div>

            {/* Card 3: ISSUED */}
            <div className={`p-5 rounded-3xl border ${
              darkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 font-['Montserrat']">
                  ISSUED
                </span>
                <MoreVertical className="h-4 w-4 text-gray-400 cursor-pointer" />
              </div>
              <div className="mt-3">
                <h2 className="text-xl font-black text-gray-800 dark:text-white font-['Montserrat']">
                  1,260
                </h2>
                <div className="flex items-center space-x-1 text-[11px] font-bold text-red-500 mt-2">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span>-0.62%</span>
                </div>
              </div>
            </div>

            {/* Card 4: PAID */}
            <div className={`p-5 rounded-3xl border ${
              darkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 font-['Montserrat']">
                  PAID
                </span>
                <MoreVertical className="h-4 w-4 text-gray-400 cursor-pointer" />
              </div>
              <div className="mt-3">
                <h2 className="text-xl font-black text-gray-800 dark:text-white font-['Montserrat']">
                  169
                </h2>
                <div className="flex items-center space-x-1 text-[11px] font-bold text-emerald-500 mt-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+0.32%</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bar Chart Section */}
          <div className={`p-6 rounded-3xl border ${
            darkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white border-gray-100 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-800 dark:text-white font-['Montserrat']">
                  ParamountDirect
                </h3>
                <p className="text-xs text-gray-400 font-medium">Initial Premium Trend</p>
              </div>

              <div className="flex items-center space-x-2">
                <button className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  darkMode ? 'bg-slate-800 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Start Date</span>
                </button>
                <button className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  darkMode ? 'bg-slate-800 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  <Filter className="h-3.5 w-3.5" />
                  <span>Premium Category</span>
                </button>
              </div>
            </div>

            {/* Monthly Premium Bar Visualization */}
            <div className="h-56 flex items-end justify-between gap-2 pt-6 border-b border-dashed border-gray-200 dark:border-white/10 px-2">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => {
                const heights = ['h-32', 'h-28', 'h-20', 'h-36', 'h-44', 'h-30', 'h-38', 'h-24', 'h-40', 'h-48', 'h-32', 'h-36'];
                const isHighlight = month === 'Nov';
                return (
                  <div key={month} className="flex flex-col items-center flex-1 space-y-2">
                    <div 
                      className={`w-2 rounded-full transition-all duration-300 ${heights[idx]} ${
                        isHighlight ? 'bg-[#d0112b]' : 'bg-red-300/80 dark:bg-red-400/50'
                      }`} 
                    />
                    <span className="text-[10px] font-bold text-gray-400 font-['Montserrat']">
                      {month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}