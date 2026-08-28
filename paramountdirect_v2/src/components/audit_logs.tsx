import React, { useState } from 'react';
import { Search, ShieldCheck, Download, Filter, UserCheck, Clock, FileText } from 'lucide-react';

interface Props {
  darkMode: boolean;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
}

export default function AuditLogs({ darkMode }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('All');

  const logs: AuditLogEntry[] = [
    {
      id: 'LOG-1092',
      timestamp: '2026-08-28 05:22:10 PM',
      user: 'Olivia Rodrigo',
      role: 'System Admin',
      action: 'STATUS_UPDATE',
      module: 'Application Screening',
      details: 'Changed status of Policy #367377 to ISSUED',
      ipAddress: '192.168.1.45',
    },
    {
      id: 'LOG-1091',
      timestamp: '2026-08-28 04:15:02 PM',
      user: 'Olivia Rodrigo',
      role: 'System Admin',
      action: 'IPEAK_TRANSMIT',
      module: 'Application Screening',
      details: 'Transmitted Policy #392016 data to iPeak integration system',
      ipAddress: '192.168.1.45',
    },
    {
      id: 'LOG-1090',
      timestamp: '2026-08-28 02:40:55 PM',
      user: 'System Bot',
      role: 'Automated Job',
      action: 'PRODUCT_SYNC',
      module: 'Product Enrollment',
      details: 'Synced PD Product Catalog (HCP, GLP, MPR) with iPeak API',
      ipAddress: '10.0.0.12',
    },
    {
      id: 'LOG-1089',
      timestamp: '2026-08-28 11:10:19 AM',
      user: 'Arra Del Mundo',
      role: 'Underwriter',
      action: 'VIEW_RECORD',
      module: 'Application Inquiry',
      details: 'Viewed policy details for Application ID #392015',
      ipAddress: '192.168.1.88',
    },
  ];

  return (
    <div className={`p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-500 ${
      darkMode ? 'text-white' : 'text-gray-900'
    }`}>
      {/* Title Header */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-[#d0112b]" />
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
            SYSTEM AUDIT LOGS
          </h1>
        </div>

        <button className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#008cb4] hover:bg-[#007395] cursor-pointer shadow-sm">
          <Download className="h-3.5 w-3.5" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className={`p-4 rounded-3xl border backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 ${
        darkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, action, or log details..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-[#008cb4] ${
                darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Module</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            >
              <option value="All">All Modules</option>
              <option value="Application Screening">Application Screening</option>
              <option value="Product Enrollment">Product Enrollment</option>
              <option value="Application Inquiry">Application Inquiry</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className={`p-6 rounded-3xl border backdrop-blur-xl ${
        darkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-200 font-bold uppercase tracking-wider">
                <th className="py-3 px-2">Log Ref</th>
                <th className="py-3 px-2">Timestamp</th>
                <th className="py-3 px-2">User / Role</th>
                <th className="py-3 px-2">Action</th>
                <th className="py-3 px-2">Module</th>
                <th className="py-3 px-2">Log Details</th>
                <th className="py-3 px-2 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-100/70 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-2 font-mono font-bold text-[#d0112b]">{log.id}</td>
                  <td className="py-3.5 px-2 font-medium text-gray-700 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {log.timestamp}
                    </span>
                  </td>
                  <td className="py-3.5 px-2">
                    <div className="font-bold text-black dark:text-white">{log.user}</div>
                    <div className="text-[10px] text-gray-400">{log.role}</div>
                  </td>
                  <td className="py-3.5 px-2 font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 font-semibold text-gray-800 dark:text-gray-200">{log.module}</td>
                  <td className="py-3.5 px-2 font-medium text-gray-900 dark:text-gray-100">{log.details}</td>
                  <td className="py-3.5 px-2 font-mono text-gray-500 dark:text-gray-400 text-right">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}