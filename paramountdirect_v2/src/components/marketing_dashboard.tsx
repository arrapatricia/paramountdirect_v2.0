import { useState } from 'react';
import {
  BarChart3,
  MousePointerClick,
  Users,
  Target,
  Clock,
  AlertTriangle,
  Mail,
  ExternalLink,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react';
import type { AnnualTargets } from '../App';
import type { ProductLine } from './sidebar';
import { brandTheme } from '../lib/brand';

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

// No history yet on the new system — page/source/step structure is real,
// but every metric starts at zero and fills in as real traffic and
// applications come through.
interface SiteContent {
  domain: string;
  pageClicks: PageClickStat[];
  dropOffSteps: DropOffStep[];
}

const zeroStats = { clicks: 0, visitors: 0, ctr: '0.0%', avgDuration: '0m 00s' };

// paramountdirect.com - PD Life products and their multi-step apply form.
const PD_SITE: SiteContent = {
  domain: 'paramountdirect.com',
  pageClicks: [
    { page: '/health-insurance', product: 'Health Care', ...zeroStats },
    { page: '/life-accident-insurance', product: 'Life & Accident', ...zeroStats },
    { page: '/comprehensive-insurance', product: 'Comprehensive', ...zeroStats },
    { page: '/apply/healthcare-cash-plan', product: 'Health Care', ...zeroStats },
    { page: '/apply/golden-life-advantage-plan', product: 'Life & Accident', ...zeroStats },
    { page: '/apply/sure-savings-plan', product: 'Comprehensive', ...zeroStats },
  ],
  dropOffSteps: [
    { step: 'Policy Owner Information', count: 0 },
    { step: 'Contact Information', count: 0 },
    { step: 'Other / Employment Information', count: 0 },
    { step: 'Payor Information', count: 0 },
  ],
};

// ofwinsurance.ph - the public OFW site's pages (same nav as the live
// site) and the sections of its online application form.
const OFW_SITE: SiteContent = {
  domain: 'ofwinsurance.ph',
  pageClicks: [
    { page: '/', product: 'Home', ...zeroStats },
    { page: '/online-applications', product: 'Apply Now', ...zeroStats },
    { page: '/how-to-pay', product: 'How To Pay', ...zeroStats },
    { page: '/claims-process', product: 'How To Claim', ...zeroStats },
    { page: '/ofw-branches', product: 'Branch Locator', ...zeroStats },
    { page: '/contact-us', product: 'Contact Us', ...zeroStats },
  ],
  dropOffSteps: [
    { step: 'Personal Information', count: 0 },
    { step: 'Employment Information', count: 0 },
    { step: 'Beneficiaries', count: 0 },
    { step: 'Required Documents', count: 0 },
    { step: 'Payment', count: 0 },
  ],
};

const sourcePerformance: SourcePerformance[] = [
  { id: 1, name: 'ML', type: 'Affiliate', status: 'Active', clicks: 0, applications: 0, conversionRate: '0.0%' },
  { id: 2, name: 'Email', type: 'Direct', status: 'Active', clicks: 0, applications: 0, conversionRate: '0.0%' },
  { id: 3, name: 'Non-Life', type: 'Cross-Sell', status: 'Active', clicks: 0, applications: 0, conversionRate: '0.0%' },
  { id: 4, name: 'Google', type: 'Paid Search', status: 'Active', clicks: 0, applications: 0, conversionRate: '0.0%' },
  { id: 5, name: 'Facebook', type: 'Social Media', status: 'Active', clicks: 0, applications: 0, conversionRate: '0.0%' },
  { id: 6, name: 'Direct', type: 'Organic', status: 'Inactive', clicks: 0, applications: 0, conversionRate: '0.0%' },
];

// Real unfinished-application records only — nothing has been abandoned yet.
const unfinishedApplications: UnfinishedApplication[] = [];

const KPI_STARTED = 0;
const KPI_COMPLETED = 0;
const KPI_UNFINISHED = KPI_STARTED - KPI_COMPLETED;
const KPI_COMPLETION_RATE = KPI_STARTED === 0 ? '0.0' : ((KPI_COMPLETED / KPI_STARTED) * 100).toFixed(1);

interface MarketingDashboardProps {
  activeProduct: ProductLine;
  annualTargets: AnnualTargets;
  onUpdateAnnualTargets: (targets: AnnualTargets) => void;
}

const ANNUAL_TARGET_FIELDS: { key: keyof AnnualTargets; label: string; currency: '₱' | '$' }[] = [
  { key: 'pdLife', label: 'PD Life (Sales)', currency: '₱' },
  { key: 'ofw', label: 'OFW', currency: '$' },
  { key: 'ctpl', label: 'CTPL', currency: '₱' },
  { key: 'gtp', label: 'GTP', currency: '₱' },
];

export default function MarketingDashboard({ activeProduct, annualTargets, onUpdateAnnualTargets }: MarketingDashboardProps) {
  const brand = brandTheme(activeProduct);
  const isOfw = activeProduct === 'OFW';
  const site = isOfw ? OFW_SITE : PD_SITE;
  const { pageClicks: gaPageClicks, dropOffSteps } = site;
  const KPI_TOTAL_CLICKS = gaPageClicks.reduce((sum, p) => sum + p.clicks, 0);
  const KPI_TOTAL_VISITORS = gaPageClicks.reduce((sum, p) => sum + p.visitors, 0);
  const [remindedIds, setRemindedIds] = useState<string[]>([]);
  const [targetDrafts, setTargetDrafts] = useState<Record<keyof AnnualTargets, string>>(() => ({
    pdLife: String(annualTargets.pdLife),
    ofw: String(annualTargets.ofw),
    ctpl: String(annualTargets.ctpl),
    gtp: String(annualTargets.gtp),
  }));
  const [targetsSaved, setTargetsSaved] = useState(false);

  const handleSaveTargets = () => {
    const parsed: AnnualTargets = {
      pdLife: Math.max(0, Number(targetDrafts.pdLife) || 0),
      ofw: Math.max(0, Number(targetDrafts.ofw) || 0),
      ctpl: Math.max(0, Number(targetDrafts.ctpl) || 0),
      gtp: Math.max(0, Number(targetDrafts.gtp) || 0),
    };
    onUpdateAnnualTargets(parsed);
    setTargetDrafts({
      pdLife: String(parsed.pdLife),
      ofw: String(parsed.ofw),
      ctpl: String(parsed.ctpl),
      gtp: String(parsed.gtp),
    });
    setTargetsSaved(true);
    setTimeout(() => setTargetsSaved(false), 2000);
  };

  const maxPageClicks = Math.max(1, ...gaPageClicks.map(p => p.clicks));
  const maxDropOff = Math.max(1, ...dropOffSteps.map(d => d.count));
  const totalDropOff = dropOffSteps.reduce((sum, d) => sum + d.count, 0);
  const safePct = (numerator: number, denominator: number) => (denominator === 0 ? 0 : (numerator / denominator) * 100);
  const topDropOffStep = dropOffSteps.reduce((best, d) => (d.count > best.count ? d : best), dropOffSteps[0]);

  const handleSendReminder = (id: string) => {
    setRemindedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-y-2 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <BarChart3 className={`w-5 h-5 ${brand.text}`} />
          <div>
            <h1 className={`text-lg md:text-xl font-bold uppercase tracking-wider font-['Montserrat'] ${brand.text}`}>
              MARKETING DASHBOARD
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Google Analytics traffic, source performance &amp; application drop-off for {site.domain}</p>
          </div>
        </div>
      </div>

      {/* Annual Sales/Premium Targets */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <Target className={`w-4 h-4 ${brand.text}`} />
            <h2 className="text-sm font-extrabold text-slate-800 uppercase dark:text-slate-100">Annual Targets</h2>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-5">The goal each product's dashboard measures YTD attainment against</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ANNUAL_TARGET_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 dark:text-slate-500" htmlFor={`annual-target-${field.key}`}>
                {field.label}
              </label>
              <div className={`flex items-center rounded-xl border border-slate-200 overflow-hidden dark:border-slate-700 ${brand.focusWithinBorder}`}>
                <span className="px-3 text-sm font-bold text-slate-400 dark:text-slate-500">{field.currency}</span>
                <input
                  id={`annual-target-${field.key}`}
                  type="number"
                  min={0}
                  step={1}
                  value={targetDrafts[field.key]}
                  onChange={(e) => setTargetDrafts((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full py-2 pr-3 text-sm font-bold text-slate-900 bg-transparent outline-none dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-3 mt-5">
          <button
            onClick={handleSaveTargets}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${brand.button}`}
          >
            Save Targets
          </button>
          {targetsSaved && (
            <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}
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
            <span className="text-slate-400 dark:text-slate-500">No data yet</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest dark:text-slate-500">Unique Visitors</h3>
            <Users className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">{KPI_TOTAL_VISITORS.toLocaleString()}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <span className="text-slate-400 dark:text-slate-500">No data yet</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest dark:text-slate-500">Applications Started</h3>
            <Target className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">{KPI_STARTED.toLocaleString()}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <span className="text-slate-400 dark:text-slate-500">No data yet</span>
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
          <p className={`text-xl font-black ${brand.text}`}>{KPI_UNFINISHED.toLocaleString()}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <span className="text-slate-400 dark:text-slate-500">No data yet</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest dark:text-slate-500">Top Drop-off Step</h3>
            <Clock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-black text-slate-900 leading-snug dark:text-white">{totalDropOff === 0 ? '—' : topDropOffStep.step}</p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] font-bold">
            <span className="text-slate-400 dark:text-slate-500">{totalDropOff === 0 ? 'No data yet' : `${topDropOffStep.count} abandoned here`}</span>
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
              className={`flex items-center space-x-1 text-[10px] font-bold hover:underline ${brand.accentText}`}
            >
              <span>Open GA4</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-5">{site.domain} — most-clicked {isOfw ? 'site' : 'product & apply'} pages this month</p>

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
                    className={`h-full rounded-full ${brand.accentBar}`}
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
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-5">Where applicants abandon the {isOfw ? 'OFW online application form' : 'multi-step form, across all products'}</p>

          <div className="space-y-4">
            {dropOffSteps.map((d) => (
              <div key={d.step}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{d.step}</span>
                  <span className="font-black text-slate-900 dark:text-white">{d.count} <span className="text-slate-400 dark:text-slate-500 font-semibold">({safePct(d.count, totalDropOff).toFixed(0)}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${brand.bar}`}
                    style={{ width: `${(d.count / maxDropOff) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs dark:border-slate-800">
            <span className="font-bold text-slate-500 dark:text-slate-400">Total unfinished applications tracked</span>
            <span className={`font-black ${brand.text}`}>{totalDropOff.toLocaleString()}</span>
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
                  <td className={`py-4 px-4 text-right font-black ${brand.accentText}`}>{source.conversionRate}</td>
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
              {unfinishedApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center font-semibold text-slate-400 dark:text-slate-500">
                    No unfinished applications yet
                  </td>
                </tr>
              ) : (
                unfinishedApplications.map((app) => (
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
                            : `bg-slate-100 text-slate-700 hover:text-white cursor-pointer dark:bg-slate-800 dark:text-slate-300 ${activeProduct === 'PD Life' ? 'hover:bg-[#d0112b]' : 'hover:bg-[#002f6c]'}`
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{remindedIds.includes(app.id) ? 'Reminder Sent' : 'Send Reminder'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
