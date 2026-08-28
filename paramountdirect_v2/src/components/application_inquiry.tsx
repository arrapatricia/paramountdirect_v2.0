import React, { useState } from 'react';
import { Search, Calendar, ChevronDown, Eye, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

interface ApplicationInquiryProps {
  darkMode: boolean;
}

export default function ApplicationInquiry({ darkMode }: ApplicationInquiryProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const records = [
    { id: 'DRE-000053-7', name: 'Fernandez, Maria Theresa', status: 'Received', payment: 'Issued', payCode: 'CM10', product: 'CCP' },
    { id: 'DRE-000059-1', name: 'Bancoro, Jaysone Christopher', status: 'Unpaid', payment: 'Created', payCode: 'CM10', product: 'CCP' },
    { id: 'DRE-000060-8', name: 'Dargantes, Delma', status: 'Underpaid', payment: 'Issued', payCode: 'CM10', product: 'CCP' },
    { id: 'DRE-000062-6', name: 'Moreland, Jordyn', status: 'Received', payment: 'Issued', payCode: 'CM10', product: 'CCP' },
    { id: 'DRE-000064-4', name: 'Rodrigo, Olivia', status: 'Received', payment: 'Issued', payCode: 'CM10', product: 'CCP' },
    { id: 'DRE-000066-2', name: 'Vallar, Arnold', status: 'For Verification', payment: 'Created', payCode: 'CM10', product: 'CCP' },
    { id: 'DRE-000069-9', name: 'Lopez, Ma. Luisa', status: 'For Evaluation', payment: 'Created', payCode: 'CM10', product: 'CCP' },
    { id: 'DRE-000073-3', name: 'Mariano, Clarisse', status: 'Duplicate', payment: 'Issued', payCode: 'CM10', product: 'CCP' },
    { id: 'DRE-000079-7', name: 'Recopuerto, Cesyl', status: 'Denied', payment: 'Reversed', payCode: 'CM10', product: 'CCP' },
    { id: 'DRE-000081-3', name: 'Biswas, Tessieree', status: 'Withdrawn', payment: 'Reversed', payCode: 'CM10', product: 'CCP' },
  ];

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto font-sans">
      <div className="text-xs text-gray-400">Home &gt; <span className="text-[#d0112b] font-semibold">Application Inquiry</span></div>

      <div className={`p-8 rounded-3xl border ${
        darkMode ? 'bg-slate-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
      }`}>
        <div className="mb-6">
          <h1 className="text-xl font-bold">Application Inquiry</h1>
          <p className="text-xs text-gray-400 mt-1">View and manage all Applications</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by policy number, policy holder"
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#d0112b] ${
                darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'
              }`}
            />
          </div>

          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <div className="flex items-center space-x-2 px-3 py-2 rounded-2xl border border-gray-200 bg-white dark:bg-slate-800">
              <span className="text-gray-400">From</span>
              <input type="text" placeholder="MM/DD/YYYY" className="w-24 bg-transparent outline-none" />
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 rounded-2xl border border-gray-200 bg-white dark:bg-slate-800">
              <span className="text-gray-400">To</span>
              <input type="text" placeholder="MM/DD/YYYY" className="w-24 bg-transparent outline-none" />
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 rounded-2xl border border-gray-200 bg-white dark:bg-slate-800 cursor-pointer">
              <span>Reports</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400">
                <th className="py-3 px-2 font-semibold">Policy Number</th>
                <th className="py-3 px-2 font-semibold">Policy Holder</th>
                <th className="py-3 px-2 font-semibold">Application Status</th>
                <th className="py-3 px-2 font-semibold">Payment Status</th>
                <th className="py-3 px-2 font-semibold">Pay Code</th>
                <th className="py-3 px-2 font-semibold">Product</th>
                <th className="py-3 px-2 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {records.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-2 font-semibold text-gray-700 dark:text-gray-300">{item.id}</td>
                  <td className="py-3.5 px-2">{item.name}</td>
                  <td className="py-3.5 px-2 text-gray-500">{item.status}</td>
                  <td className="py-3.5 px-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                      item.payment === 'Issued' ? 'bg-emerald-100 text-emerald-700' :
                      item.payment === 'Created' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {item.payment}
                    </span>
                  </td>
                  <td className="py-3.5 px-2"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-mono text-[10px]">{item.payCode}</span></td>
                  <td className="py-3.5 px-2 text-gray-400">{item.product}</td>
                  <td className="py-3.5 px-2">
                    <div className="flex items-center justify-center space-x-3 text-[#d0112b]">
                      <Eye className="h-4 w-4 cursor-pointer hover:opacity-80" />
                      <Printer className="h-4 w-4 cursor-pointer hover:opacity-80" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between pt-6 text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-xl border border-gray-200 flex items-center space-x-1 cursor-pointer"><ChevronLeft className="h-3.5 w-3.5" /><span>Previous</span></button>
            <div className="flex items-center space-x-1 px-2">
              <span className="w-7 h-7 flex items-center justify-center rounded-full bg-[#d0112b] text-white font-bold">1</span>
              <span className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">2</span>
              <span className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">3</span>
            </div>
            <button className="p-2 rounded-xl border border-gray-200 flex items-center space-x-1 cursor-pointer"><span>Next</span><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
          <span>Showing 10 of 100 records</span>
        </div>
      </div>
    </div>
  );
}