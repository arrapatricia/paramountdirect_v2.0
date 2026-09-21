import { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, Download, Clock } from 'lucide-react';
import { auditLogApi, getAuthToken, type AuditLogApi } from '../lib/api';

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

// Turns a raw cuid ("ckz1x9...") into a short, stable display ref by hashing
// it to a number - there's no sequence column on AuditLog to show instead.
function toLogRef(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return `LOG-${(hash % 100000).toString().padStart(5, '0')}`;
}

function toCsvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: AuditLogApi[]) {
  const header = ['Log Ref', 'Timestamp', 'User', 'Role', 'Action', 'Module', 'Details', 'IP Address'];
  const lines = [
    header.join(','),
    ...rows.map((log) =>
      [toLogRef(log.id), formatTimestamp(log.timestamp), log.userLabel, log.role, log.action, log.module, log.details, log.ipAddress]
        .map(toCsvValue)
        .join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('All');
  const [logs, setLogs] = useState<AuditLogApi[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!getAuthToken()) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    auditLogApi
      .list()
      .then((data) => {
        if (cancelled) return;
        setLogs(data);
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load audit logs.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const modules = useMemo(() => Array.from(new Set(logs.map((log) => log.module))).sort(), [logs]);

  const filteredLogs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return logs.filter((log) => {
      if (selectedModule !== 'All' && log.module !== selectedModule) return false;
      if (!term) return true;
      return (
        log.userLabel.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term)
      );
    });
  }, [logs, searchTerm, selectedModule]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-500 text-gray-900 dark:text-white">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-gray-200 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-[#d0112b]" />
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
            SYSTEM AUDIT LOGS
          </h1>
        </div>

        <button
          onClick={() => downloadCsv(filteredLogs)}
          disabled={filteredLogs.length === 0}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#008cb4] hover:bg-[#007395] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="p-4 rounded-3xl border backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 bg-white border-gray-100 shadow-sm dark:bg-gray-900/40 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, action, or log details..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-[#008cb4] bg-gray-50 border-gray-200 text-gray-900 dark:bg-white/5 dark:border-white/10 dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Module</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-medium border outline-none bg-gray-50 border-gray-200 text-gray-900 dark:bg-slate-900 dark:border-white/10 dark:text-white"
            >
              <option value="All">All Modules</option>
              {modules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Showing {filteredLogs.length} of {logs.length} entries
        </span>
      </div>

      {/* Logs Table */}
      <div className="p-6 rounded-3xl border backdrop-blur-xl bg-white border-gray-100 shadow-sm dark:bg-gray-900/40 dark:border-white/10">
        {loadError ? (
          <div className="py-10 text-center text-xs font-semibold text-[#d0112b]">{loadError}</div>
        ) : isLoading ? (
          <div className="py-10 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-10 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">No audit log entries match your filters.</div>
        ) : (
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
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-100/70 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-2 font-mono font-bold text-[#d0112b]">{toLogRef(log.id)}</td>
                    <td className="py-3.5 px-2 font-medium text-gray-700 dark:text-gray-300">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="font-bold text-black dark:text-white">{log.userLabel}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">{log.role}</div>
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
        )}
      </div>
    </div>
  );
}
