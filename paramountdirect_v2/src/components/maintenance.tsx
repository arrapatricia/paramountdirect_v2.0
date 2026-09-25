import { Building2, BarChart3, Globe } from 'lucide-react';
import BranchDirectory from './branch_directory';
import MarketingDashboard from './marketing_dashboard';
import type { AnnualTargets } from '../App';
import type { ProductLine } from './sidebar';
import { brandTheme } from '../lib/brand';

interface Props {
  activeSubTab?: string;
  setActiveSubTab?: (tab: string) => void;
  annualTargets: AnnualTargets;
  onUpdateAnnualTargets: (targets: AnnualTargets) => void;
  activeProduct: ProductLine;
}

const SUB_TABS = [
  { id: 'branch', label: 'Branch Directory', icon: Building2 },
  { id: 'marketing', label: 'Marketing Dashboard', icon: BarChart3 },
  { id: 'cms', label: 'CMS (Website Content)', icon: Globe },
];

export default function Maintenance({ activeSubTab = 'branch', setActiveSubTab, annualTargets, onUpdateAnnualTargets, activeProduct }: Props) {
  const brand = brandTheme(activeProduct);

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-gray-50 dark:bg-slate-950 dark:text-slate-100">
      {/* Sub-Module Nav Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold shadow-xs dark:bg-slate-900 dark:border-slate-800">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab && setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 pb-2 transition-all cursor-pointer border-b-2 ${
                activeSubTab === tab.id
                  ? brand.tabActive
                  : 'text-slate-500 border-transparent hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* View Switcher */}
      <div>
        {activeSubTab === 'branch' && <BranchDirectory activeProduct={activeProduct} />}

        {activeSubTab === 'marketing' && (
          <MarketingDashboard
            activeProduct={activeProduct}
            annualTargets={annualTargets}
            onUpdateAnnualTargets={onUpdateAnnualTargets}
          />
        )}

        {activeSubTab === 'cms' && (
          <div className="p-12 text-center text-slate-400 font-bold max-w-[1600px] mx-auto dark:text-slate-500">
            <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl border flex items-center justify-center ${brand.iconChip}`}>
              <Globe className="w-7 h-7" />
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              {activeProduct === 'OFW' ? 'ofwinsurance.ph' : 'paramountdirect.com'} content management is coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
