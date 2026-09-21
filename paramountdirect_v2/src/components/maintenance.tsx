
import { Building2, BarChart3, Globe } from 'lucide-react';
import BranchDirectory from './branch_directory';
import MarketingDashboard from './marketing_dashboard';
import type { AnnualTargets } from '../App';

interface Props {
  activeSubTab?: string;
  setActiveSubTab?: (tab: string) => void;
  annualTargets: AnnualTargets;
  onUpdateAnnualTargets: (targets: AnnualTargets) => void;
}

export default function Maintenance({ activeSubTab = 'branch', setActiveSubTab, annualTargets, onUpdateAnnualTargets }: Props) {
  return (
    <div className="min-h-screen font-sans text-slate-900 bg-gray-50 dark:bg-slate-950 dark:text-slate-100">
      {/* Sub-Module Nav Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab && setActiveSubTab('branch')}
          className={`flex items-center space-x-2 pb-2 transition-all cursor-pointer border-b-2 ${
            activeSubTab === 'branch'
              ? 'text-[#d0112b] border-[#d0112b]'
              : 'text-slate-500 border-transparent hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Branch Directory</span>
        </button>

        <button
          onClick={() => setActiveSubTab && setActiveSubTab('marketing')}
          className={`flex items-center space-x-2 pb-2 transition-all cursor-pointer border-b-2 ${
            activeSubTab === 'marketing'
              ? 'text-[#d0112b] border-[#d0112b]'
              : 'text-slate-500 border-transparent hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Marketing Dashboard</span>
        </button>

        <button
          onClick={() => setActiveSubTab && setActiveSubTab('cms')}
          className={`flex items-center space-x-2 pb-2 transition-all cursor-pointer border-b-2 ${
            activeSubTab === 'cms'
              ? 'text-[#d0112b] border-[#d0112b]'
              : 'text-slate-500 border-transparent hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>CMS (Website Content)</span>
        </button>
      </div>

      {/* View Switcher */}
      <div>
        {activeSubTab === 'branch' && <BranchDirectory />}

        {activeSubTab === 'marketing' && (
          <MarketingDashboard annualTargets={annualTargets} onUpdateAnnualTargets={onUpdateAnnualTargets} />
        )}

        {activeSubTab === 'cms' && (
          <div className="p-12 text-center text-slate-400 font-bold max-w-[1600px] mx-auto dark:text-slate-500">
            <Globe className="w-12 h-12 mx-auto mb-4 text-slate-200 dark:text-slate-700" />
            <p>Website CMS Content Management module goes here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
