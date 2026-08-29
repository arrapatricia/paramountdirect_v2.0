import React, { useState } from 'react';
import { ChevronDown, Calendar, Filter, MoreVertical, TrendingUp, TrendingDown } from 'lucide-react';

export default function Dashboard() {
  const [activeYearDropdown, setActiveYearDropdown] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2026');
  
  const [activeDateDropdown, setActiveDateDropdown] = useState(false);
  const [activeCategoryDropdown, setActiveCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto font-sans text-slate-900 space-y-6">
      
      {/* Header */}
      <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 font-['Montserrat']">
        MONTHLY APPLICATIONS
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Customer Acquisition (Donut Chart Mock) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase">CUSTOMER ACQUISITION</h2>
              <p className="text-xs text-slate-500 font-medium">Breakdown of sources</p>
            </div>
            
            {/* INTERACTIVE: Year Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setActiveYearDropdown(!activeYearDropdown)}
                className="px-4 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-2 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>Year - {selectedYear}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${activeYearDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {activeYearDropdown && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 py-2 animate-fadeIn">
                  {['2026', '2025', '2024'].map(year => (
                    <button 
                      key={year}
                      onClick={() => { setSelectedYear(year); setActiveYearDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#d0112b]"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Mock Donut Chart Ring */}
            <div className="relative w-48 h-48 rounded-full border-[16px] border-emerald-400 border-t-[#d0112b] border-l-pink-300 flex items-center justify-center">
              <div className="text-center">
                <span className="block text-2xl font-black text-slate-900">194,231</span>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Total Applications</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-3 mt-8">
            {[
              { label: 'ML', color: 'bg-pink-300' },
              { label: 'Email', color: 'bg-[#d0112b]' },
              { label: 'Non-Life', color: 'bg-slate-800' },
              { label: 'Google', color: 'bg-yellow-300' },
              { label: 'Facebook', color: 'bg-blue-400' },
              { label: 'Direct', color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center space-x-2">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-xs font-bold text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: KPIs and Trend Chart */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Total Premium</h3>
              <p className="text-xl font-black text-[#d0112b]">₱194,231.00</p>
              <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500">+2.45%</span>
                <span className="text-slate-400">vs Last Month</span>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm relative">
              <MoreVertical className="absolute top-4 right-4 w-4 h-4 text-slate-300" />
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Applications</h3>
              <div className="flex items-center space-x-1 mt-8 text-[10px] font-bold">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500">+1.14%</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm relative">
              <MoreVertical className="absolute top-4 right-4 w-4 h-4 text-slate-300" />
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Issued</h3>
              <div className="flex items-center space-x-1 mt-8 text-[10px] font-bold">
                <TrendingDown className="w-3 h-3 text-rose-500" />
                <span className="text-rose-500">-0.62%</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm relative">
              <MoreVertical className="absolute top-4 right-4 w-4 h-4 text-slate-300" />
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Paid</h3>
              <div className="flex items-center space-x-1 mt-8 text-[10px] font-bold">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500">+0.32%</span>
              </div>
            </div>
          </div>

          {/* Bottom Chart Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xs font-bold text-slate-500">Initial Premium Trend</h2>
              
              <div className="flex items-center space-x-3">
                {/* INTERACTIVE: Start Date Picker Button */}
                <div className="relative">
                  <button 
                    onClick={() => { setActiveDateDropdown(!activeDateDropdown); setActiveCategoryDropdown(false); }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-2 hover:bg-slate-50 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Start Date</span>
                  </button>
                  {activeDateDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 p-4 animate-fadeIn">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Select Range</p>
                      <input type="date" className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none focus:border-[#d0112b] mb-2" />
                      <button className="w-full bg-[#d0112b] text-white text-xs font-bold py-2 rounded-lg hover:bg-red-700">Apply Date</button>
                    </div>
                  )}
                </div>

                {/* INTERACTIVE: Premium Category Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => { setActiveCategoryDropdown(!activeCategoryDropdown); setActiveDateDropdown(false); }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-2 hover:bg-slate-50 cursor-pointer"
                  >
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedCategory}</span>
                  </button>
                  {activeCategoryDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 py-2 animate-fadeIn">
                      {['All Categories', 'Plan 200', 'Plan 500', 'Plan 1000', 'Plan 2000'].map(cat => (
                        <button 
                          key={cat}
                          onClick={() => { setSelectedCategory(cat); setActiveCategoryDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#d0112b]"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bar Chart Mock UI */}
            <div className="flex-1 flex items-end justify-between px-4 pb-2 mt-4 space-x-2">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                <div key={month} className="flex flex-col items-center flex-1 space-y-3">
                  <div className={`w-full max-w-[8px] rounded-full transition-all duration-500 ${month === 'Nov' ? 'bg-[#d0112b]' : 'bg-red-200/60'}`} style={{ height: `${Math.max(20, Math.random() * 100)}%` }} />
                  <span className="text-[10px] font-bold text-slate-400">{month}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}