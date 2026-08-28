import React from 'react';
import { MoreVertical, TrendingUp, TrendingDown, Calendar, Filter, DollarSign } from 'lucide-react';

interface DashboardProps {
  darkMode: boolean;
}

export default function Dashboard({ darkMode }: DashboardProps) {
  const barData = [650, 500, 380, 780, 1150, 530, 810, 330, 780, 1100, 540, 630];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto font-sans">
      <h1 className="text-xl font-bold uppercase tracking-wider text-gray-500 border-b pb-4 border-gray-200 dark:border-white/10">
        Monthly Applications
      </h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Customer Acquisition (Donut Chart representation) */}
        <div className={`col-span-3 p-6 rounded-3xl border ${
          darkMode ? 'bg-slate-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200">Customer Acquisition</h3>
              <p className="text-[10px] text-gray-400">Breakdown of sources</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-lg border text-gray-400">Year - 2026</span>
          </div>

          <div className="relative flex justify-center items-center my-6">
            <div className="w-36 h-36 rounded-full border-[14px] border-[#d0112b] border-t-pink-300 border-r-stone-700 flex flex-col justify-center items-center">
              <span className="text-base font-bold">194,231</span>
              <span className="text-[9px] text-gray-400">Total applications</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-pink-300" /><span>ML</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-[#d0112b]" /><span>Email</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-stone-700" /><span>Non-Life</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-orange-200" /><span>Google</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-blue-300" /><span>Facebook</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-red-600" /><span>Direct</span></div>
          </div>
        </div>

        {/* Top 4 KPI Cards & Main Bar Chart Area */}
        <div className="col-span-9 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {/* Total Premium KPI Card */}
            <div className={`p-5 rounded-3xl border relative ${
              darkMode ? 'bg-slate-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#d0112b]">Total Premium</p>
                <DollarSign className="h-4 w-4 text-[#d0112b]" />
              </div>
              <h2 className="text-xl font-extrabold my-2 text-[#d0112b]">₱194,231.00</h2>
              <div className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <TrendingUp className="h-3 w-3" />
                <span>+2.45%</span>
                <span className="text-gray-400 ml-1 font-normal">vs Last Month</span>
              </div>
            </div>

            {/* KPI Card 1: Applications */}
            <div className={`p-5 rounded-3xl border relative ${
              darkMode ? 'bg-slate-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Applications</p>
                <MoreVertical className="h-4 w-4 text-gray-400 cursor-pointer" />
              </div>
              <h2 className="text-xl font-bold my-2">1363</h2>
              <div className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <TrendingUp className="h-3 w-3" />
                <span>+1.14%</span>
              </div>
            </div>

            {/* KPI Card 2: Issued */}
            <div className={`p-5 rounded-3xl border relative ${
              darkMode ? 'bg-slate-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Issued</p>
                <MoreVertical className="h-4 w-4 text-gray-400 cursor-pointer" />
              </div>
              <h2 className="text-xl font-bold my-2">1260</h2>
              <div className="inline-flex items-center space-x-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                <TrendingDown className="h-3 w-3" />
                <span>-0.62%</span>
              </div>
            </div>

            {/* KPI Card 3: Paid */}
            <div className={`p-5 rounded-3xl border relative ${
              darkMode ? 'bg-slate-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Paid</p>
                <MoreVertical className="h-4 w-4 text-gray-400 cursor-pointer" />
              </div>
              <h2 className="text-xl font-bold my-2">169</h2>
              <div className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <TrendingUp className="h-3 w-3" />
                <span>+0.32%</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className={`p-6 rounded-3xl border ${
            darkMode ? 'bg-slate-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold">ParamountDirect</h3>
                <p className="text-xs text-gray-400">Initial Premium Trend</p>
              </div>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-gray-200">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span>Start Date</span>
                </div>
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-gray-200">
                  <Filter className="h-3.5 w-3.5 text-gray-400" />
                  <span>Premium Category</span>
                </div>
              </div>
            </div>

            {/* Simulated Chart Bars */}
            <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-dashed border-gray-200">
              {barData.map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                  <div
                    style={{ height: `${(val / 1200) * 100}%` }}
                    className={`w-2.5 rounded-t-full transition-all ${
                      idx === 10 ? 'bg-[#d0112b]' : 'bg-red-300'
                    }`}
                  />
                  <span className="text-[10px] text-gray-400 mt-3">{months[idx]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}