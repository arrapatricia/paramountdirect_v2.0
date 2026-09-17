import { useState } from 'react';
import {
  BarChart3,
  MousePointerClick,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Mail,
  ExternalLink,
  Edit2,
  Trash2,
} from 'lucide-react';

interface PageClickStat {
  page: string;
  product: string;
  clicks: number;
  visitors: number;
  ctr: string;
  avgDuration: string;
}

interface SourcePerformance {
  id: number;
  name: string;
  type: string;
  status: 'Active' | 'Inactive';
  clicks: number;
  applications: number;
  conversionRate: string;
}

interface DropOffStep {
  step: string;
  count: number;
}

interface UnfinishedApplication {
  id: string;
  product: string;
  planCode: string;
  stepReached: string;
  dateStarted: string;
  lastActivity: string;
  source: string;
}

const gaPageClicks: PageClickStat[] = [
  { page: '/health-insurance', product: 'Health Care', clicks: 8420, visitors: 6210, ctr: '5.8%', avgDuration: '2m 14s' },
  { page: '/life-accident-insurance', product: 'Life & Accident', clicks: 5310, visitors: 4025, ctr: '4.1%', avgDuration: '1m 48s' },
  { page: '/comprehensive-insurance', product: 'Comprehensive', clicks: 3980, visitors: 2890, ctr: '3.2%', avgDuration: '2m 02s' },
  { page: '/apply/healthcare-cash-plan', product: 'Health Care', clicks: 1240, visitors: 980, ctr: '9.4%', avgDuration: '4m 32s' },
  { page: '/apply/golden-life-advantage-plan', product: 'Life & Accident', clicks: 860, visitors: 690, ctr: '8.1%', avgDuration: '3m 58s' },
  { page: '/apply/sure-savings-plan', product: 'Comprehensive', clicks: 705, visitors: 540, ctr: '7.6%', avgDuration: '5m 10s' },
];

const sourcePerformance: SourcePerformance[] = [
  { id: 1, name: 'ML', type: 'Affiliate', status: 'Active', clicks: 2140, applications: 312, conversionRate: '14.6%' },
  { id: 2, name: 'Email', type: 'Direct', status: 'Active', clicks: 3680, applications: 588, conversionRate: '16.0%' },
  { id: 3, name: 'Non-Life', type: 'Cross-Sell', status: 'Active', clicks: 1120, applications: 96, conversionRate: '8.6%' },
  { id: 4, name: 'Google', type: 'Paid Search', status: 'Active', clicks: 12480, applications: 1840, conversionRate: '14.7%' },
  { id: 5, name: 'Facebook', type: 'Social Media', status: 'Active', clicks: 6720, applications: 715, conversionRate: '10.6%' },
  { id: 6, name: 'Direct', type: 'Organic', status: 'Inactive', clicks: 380, applications: 22, conversionRate: '5.8%' },
];

const dropOffSteps: DropOffStep[] = [
  { step: 'Policy Owner Information', count: 180 },
  { step: 'Contact Information', count: 410 },
  { step: 'Other / Employment Information', count: 325 },
  { step: 'Payor Information', count: 210 },
];

const unfinishedApplications: UnfinishedApplication[] = [
  { id: 'DRF10231', product: 'Sure Savings Plan', planCode: 'SSP', stepReached: 'Employment Information', dateStarted: '09/12/2026 at 3:14 PM', lastActivity: '2 hours ago', source: 'Google' },
  { id: 'DRF10230', product: 'Golden Life Advantage Plan', planCode: 'GLA', stepReached: 'Contact Information', dateStarted: '09/12/2026 at 1:02 PM', lastActivity: '4 hours ago', source: 'Facebook' },
  { id: 'DRF10229', product: 'HealthCare Cash Plan', planCode: 'HCP', stepReached: 'Payor Information', dateStarted: '09/11/2026 at 5:47 PM', lastActivity: '1 day ago', source: 'Pd Site' },
  { id: 'DRF10228', product: 'MoneyPlus Protection Plan', planCode: 'MPR', stepReached: 'Other Information', dateStarted: '09/11/2026 at 2:20 PM', lastActivity: '1 day ago', source: 'Email Newsletter' },
  { id: 'DRF10227', product: 'Go Protect Plan', planCode: 'GPR', stepReached: 'Contact Information', dateStarted: '09/10/2026 at 11:35 AM', lastActivity: '2 days ago', source: 'Google' },
  { id: 'DRF10226', product: 'Hospital Income Benefit Plan', planCode: 'HIP', stepReached: 'Policy Owner Information', dateStarted: '09/10/2026 at 9:12 AM', lastActivity: '2 days ago', source: 'Facebook' },
];

const KPI_TOTAL_CLICKS = gaPageClicks.reduce((sum, p) => sum + p.clicks, 0);
const KPI_TOTAL_VISITORS = gaPageClicks.reduce((sum, p) => sum + p.visitors, 0);
const KPI_STARTED = 3140;
const KPI_COMPLETED = 2015;
const KPI_UNFINISHED = KPI_STARTED - KPI_COMPLETED;
const KPI_COMPLETION_RATE = ((KPI_COMPLETED / KPI_STARTED) * 100).toFixed(1);

export default function MarketingDashboard() {
  const [remindedIds, setRemindedIds] = useState<string[]>([]);

  const maxPageClicks = Math.max(...gaPageClicks.map(p => p.clicks));
  const maxDropOff = Math.max(...dropOffSteps.map(d => d.count));
  const totalDropOff = dropOffSteps.reduce((sum, d) => sum + d.count, 0);

  const handleSendReminder = (id: string) => {
    setRemindedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-y-2 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-[#d0112b]" />
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
              MARKETING DASHBOARD
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Google Analytics traffic, source performance &amp; application drop-off for paramountdirect.com</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest dark:text-slate-500">Total Clicks</h3>
            <MousePointerClick className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">{KPI_TOTAL_CLICKS.toLocaleString()}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">+8.2%</span>
            <span className="text-slate-400 dark:text-slate-500">vs Last Month</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest dark:text-slate-500">Unique Visitors</h3>
            <Users className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">{KPI_TOTAL_VISITORS.toLocaleString()}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">+5.6%</span>
            <span className="text-slate-400 dark:text-slate-500">vs Last Month</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest dark:text-slate-500">Applications Started</h3>
            <Target className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">{KPI_STARTED.toLocaleString()}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">+3.1%</span>
            <span className="text-slate-400 dark:text-slate-500">vs Last Month</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest dark:text-slate-500">Applications Completed</h3>
            <Target className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{KPI_COMPLETED.toLocaleString()}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <span className="text-slate-400 dark:text-slate-500">{KPI_COMPLETION_RATE}% completion rate</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest dark:text-slate-500">Unfinished Applications</h3>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-xl font-black text-[#d0112b]">{KPI_UNFINISHED.toLocaleString()}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <TrendingDown className="w-3 h-3 text-rose-500" />
            <span className="text-rose-500">+2.4%</span>
            <span className="text-slate-400 dark:text-slate-500">vs Last Month</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest dark:text-slate-500">Top Drop-off Step</h3>
            <Clock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-black text-slate-900 leading-snug dark:text-white">Contact Information</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <span className="text-slate-400 dark:text-slate-500">{dropOffSteps[1].count} abandoned here</span>
          </div>
        </div>
      </div>

      {/* Google Analytics + Drop-off breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GA Per-Page Clicks */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase dark:text-slate-100">Google Analytics — Clicks by Page</h2>
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-[10px] font-bold text-[#008cb4] hover:underline"
            >
              <span>Open GA4</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-5">paramountdirect.com — most-clicked product &amp; apply pages this month</p>

          <div className="space-y-4">
            {gaPageClicks.map((p) => (
              <div key={p.page}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="min-w-0 pr-2">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{p.page}</span>
                    <span className="ml-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">{p.product}</span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white flex-shrink-0">{p.clicks.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-[#008cb4]"
                    style={{ width: `${(p.clicks / maxPageClicks) * 100}%` }}
                  />
                </div>
                <div className="flex items-center space-x-3 mt-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  <span>{p.visitors.toLocaleString()} visitors</span>
                  <span>CTR {p.ctr}</span>
                  <span>Avg. {p.avgDuration} on page</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drop-off by Step */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase mb-1 dark:text-slate-100">Application Drop-off by Step</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-5">Where applicants abandon the multi-step form, across all products</p>

          <div className="space-y-4">
            {dropOffSteps.map((d) => (
              <div key={d.step}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{d.step}</span>
                  <span className="font-black text-slate-900 dark:text-white">{d.count} <span className="text-slate-400 dark:text-slate-500 font-semibold">({((d.count / totalDropOff) * 100).toFixed(0)}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-[#d0112b]"
                    style={{ width: `${(d.count / maxDropOff) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs dark:border-slate-800">
            <span className="font-bold text-slate-500 dark:text-slate-400">Total unfinished applications tracked</span>
            <span className="font-black text-[#d0112b]">{totalDropOff.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Marketing Source Performance */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6 pb-0 flex flex-wrap items-center justify-between gap-y-2">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 uppercase dark:text-slate-100">Marketing Source Performance</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clicks, applications and conversion rate per channel</p>
          </div>
        </div>
        <div className="overflow-x-auto p-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                <th className="py-3 px-4 rounded-l-xl">Source Name</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Clicks</th>
                <th className="py-3 px-4 text-right">Applications</th>
                <th className="py-3 px-4 text-right">Conversion Rate</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sourcePerformance.map((source) => (
                <tr key={source.id} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/60">
                  <td className="py-4 px-4 font-extrabold text-slate-900 dark:text-white">{source.name}</td>
                  <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">{source.type}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      source.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {source.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-slate-800 dark:text-slate-100">{source.clicks.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right font-bold text-slate-800 dark:text-slate-100">{source.applications.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right font-black text-[#008cb4]">{source.conversionRate}</td>
                  <td className="py-4 px-4 flex items-center justify-end space-x-2">
                    <button className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unfinished Applications */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6 pb-0 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase dark:text-slate-100">Unfinished Applications</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Applicants who started but did not submit — follow up before they go cold</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto p-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                <th className="py-3 px-4 rounded-l-xl">Reference No.</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Step Reached</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Date Started</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {unfinishedApplications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/60">
                  <td className="py-4 px-4 font-bold text-slate-500 dark:text-slate-400">{app.id}</td>
                  <td className="py-4 px-4">
                    <span className="font-extrabold text-slate-900 dark:text-white">{app.planCode}</span>
                    <span className="text-[10px] font-semibold text-slate-500 ml-1.5 dark:text-slate-400">{app.product}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      {app.stepReached}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">{app.source}</td>
                  <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">{app.dateStarted}</td>
                  <td className="py-4 px-4 font-semibold text-slate-500 dark:text-slate-400">{app.lastActivity}</td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleSendReminder(app.id)}
                      disabled={remindedIds.includes(app.id)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                        remindedIds.includes(app.id)
                          ? 'bg-emerald-50 text-emerald-600 cursor-default dark:bg-emerald-950/30 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-[#d0112b] hover:text-white cursor-pointer dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{remindedIds.includes(app.id) ? 'Reminder Sent' : 'Send Reminder'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
