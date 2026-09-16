import React, { useState } from 'react';
import {
  Layers,
  Save,
  CheckCircle2,
  X,
  SlidersHorizontal,
  FolderTree,
  Search,
  RotateCcw,
  CheckCheck,
  Ban
} from 'lucide-react';

export type ProductSystem = 'PD Life' | 'OFW' | 'CTPL' | 'GTP';

export interface ModulePermission {
  moduleName: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

const PRODUCT_MODULE_MAP: Record<ProductSystem, string[]> = {
  'PD Life': [
    'Application Screening',
    'Application Inquiry',
    'Sending of Policy Docs',
    'Sending of Billing',
    'Payment Transactions & Ledger',
    'Call Out',
    'Maintenance & Rate Tables',
    'CMS Content',
    'Audit Logs',
  ],
  'OFW': ['OFW Contracts & Screening', 'OEC Payment Ledger', 'POEA Rate Configuration', 'Agency Audit Logs'],
  'CTPL': ['LTO Motor Registration', 'CTPL Certificate Ledger', 'Tariff & Premium Calculator', 'Agent Logs'],
  'GTP': ['Group Corporate Accounts', 'Billing Schedule & Master Roll', 'Endorsements & Rates', 'Audit Logs']
};

// These modules describe workflows Direct Marketing has committed to, but the
// underlying pages haven't been built yet (Billing send-outs, the Contact
// Center's Call Out queue). Roles can still be pre-configured for them so
// access is ready to go the day the page ships.
const MODULES_NOT_YET_BUILT = new Set(['Sending of Billing', 'Call Out']);

const MODULE_DESCRIPTIONS: Partial<Record<string, string>> = {
  'Application Screening': 'Review, verify and update the status of incoming online applications.',
  'Application Inquiry': 'Read-only lookup of application details and status history.',
  'Sending of Policy Docs': 'Dispatch issued policy documents to policyholders.',
  'Sending of Billing': 'Send billing notices and statements to policyholders.',
  'Call Out': 'Contact Center outbound call queue for application follow-up.',
};

// Direct Marketing's own operating roles, as opposed to the large legacy
// PD Life role list below (carried over from the wider Paramount system).
const DIRECT_MARKETING_ROLES = ['Operations', 'Marketing', 'Contact Center'];

type PermissionTemplate = Partial<Record<string, { canRead?: boolean; canWrite?: boolean; canDelete?: boolean }>>;

const ROLE_PERMISSION_TEMPLATES: Partial<Record<ProductSystem, Record<string, PermissionTemplate>>> = {
  'PD Life': {
    'Operations': {
      'Application Screening': { canRead: true, canWrite: true },
      'Application Inquiry': { canRead: true },
      'Sending of Policy Docs': { canRead: true, canWrite: true },
      'Sending of Billing': { canRead: true, canWrite: true },
      'Payment Transactions & Ledger': { canRead: true, canWrite: true },
      'Audit Logs': { canRead: true },
    },
    'Marketing': {
      'Application Inquiry': { canRead: true },
    },
    'Contact Center': {
      'Application Inquiry': { canRead: true },
      'Call Out': { canRead: true, canWrite: true },
    },
  },
};

const PRODUCT_ROLES_MAP: Record<ProductSystem, string[]> = {
  'PD Life': [
    ...DIRECT_MARKETING_ROLES,
    'Accounts Executive 1',
    'Agency Admin',
    'Agency Branch Admin',
    'Agency Branch Admin/Issuer',
    'Agency Issuer',
    'Agent Audit',
    'Campaigns, Inquiries and Tele',
    'Campaigns, Inquiries and Tele Head',
    'Claims',
    'Claims Processor',
    'Collection Assistant',
    'Coop Area - Admin',
    'Coop Area - Issuer',
    'Coop Branch - Admin',
    'Coop Branch - Assistant',
    'Coop Branch - Issuer',
    'Coop Main',
    'Coop Region - Admin',
    'Coop Region - Issuer',
    'Coop Super Admin',
    'DM Actuarial',
    'Exchange Rate Admin',
    'Exchange Rate User',
    'Follow-Up',
    'Follow-up and App Status',
    'Kaagapay Admin',
    'Kaagapay Issuer',
    'Kaagapay Super Admin',
    'Kaagapay User',
    'Online Payment Portal User',
    'Payment Transactions',
    'Payment Transactions 1',
    'Policy Issuer and Shipper',
    'Policy Issuer and Shipper 1',
    'Policy Issuer and Shipper Head',
    'Policy Services',
    'Policy Services Head',
    'Policy Shipper'
  ],
  'OFW': [
    'OFW Agency User',
    'OFW Discount User',
    'OFW TEAM',
    'OFW Team Admin',
    'OFW Team Admin 1',
    'Seabase Admin'
  ],
  'CTPL': [
    'Agent Motor Insurance Admin',
    'Agent Motor Insurance Branch Issuer',
    'Agent Motor Insurance Branch Manager',
    'Agent Motor Insurance Regional Manager',
    'CTPL',
    'CTPL Agent District',
    'CTPL Agent Issuer',
    'CTPL Agent Region',
    'CTPL Agent Runner',
    'CTPL Finance',
    'CTPL National',
    'CTPL Plus Demo',
    'CTPL Validator',
    'CTPL VMV',
    'Motor Insurance Agent',
    'Motor Insurance Branch Admin',
    'Motor Insurance Branch Issuer',
    'Motor Insurance Branch Manager',
    'Motor Insurance Issuer',
    'Motor Insurance Issuer 1',
    'Motor Insurance Regional Manager',
    'Motor Insurance Underwriter',
    'Motor Insurance Uploader',
    'Roadside Assistance'
  ],
  'GTP': [
    'GTPP Agent Admin',
    'GTPP Agent Issuer',
    'GTPP Agent Manager',
    'GTPP Branch Admin',
    'GTPP Branch Issuer',
    'GTPP Branch Manager',
    'GTPP Head Office Admin',
    'GTPP Head Office Admin 1',
    'GTPP Head Office Issuer',
    'GTPP Head Office Super Admin',
    'GTPP Head Office Super Admin 1',
    'GTPP Travel Agency Admin',
    'GTPP Travel Agency Issuer',
    'GTPP Travel Agency Manager'
  ]
};

const SHARED_CORE_ROLES = [
  'Admin',
  'API',
  'Basic',
  'Basic 2',
  'Basic View',
  'Branding',
  'Content Manager',
  'Content Manager and Inquiry',
  'Content Manager and Inquiry 1',
  'Customer Service',
  'Customer Service 1',
  'Customer Service 2',
  'D&G',
  'Digital Marketing 1',
  'Direct Hire Users',
  'Marketing Coordinator Admin',
  'Marketing Services Admin',
  'OJT'
];

// Roles with a known template get a tailored starting matrix; everything
// else (the large legacy role lists) keeps the old blanket "read-only
// everything" default rather than guessing at access it shouldn't grant.
const getDefaultPermissions = (product: ProductSystem, role: string): ModulePermission[] => {
  const modules = PRODUCT_MODULE_MAP[product];
  const template = ROLE_PERMISSION_TEMPLATES[product]?.[role];

  if (!template) {
    return modules.map(m => ({ moduleName: m, canRead: true, canWrite: false, canDelete: false }));
  }

  return modules.map(m => ({
    moduleName: m,
    canRead: !!template[m]?.canRead,
    canWrite: !!template[m]?.canWrite,
    canDelete: !!template[m]?.canDelete,
  }));
};

function StatCard({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'brand' | 'emerald' | 'slate' }) {
  const valueColor = tone === 'brand'
    ? 'text-[#d0112b]'
    : tone === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'slate'
        ? 'text-slate-500 dark:text-slate-400'
        : 'text-slate-900 dark:text-white';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
      <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 dark:text-slate-500">{label}</h3>
      <p className={`text-2xl font-black ${valueColor}`}>{value}</p>
    </div>
  );
}

export default function RoleAccessMaintenance() {
  const [selectedProduct, setSelectedProduct] = useState<ProductSystem>('PD Life');
  const [selectedRole, setSelectedRole] = useState<string>(PRODUCT_ROLES_MAP['PD Life'][0]);
  const [moduleSearch, setModuleSearch] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const [permissionMatrix, setPermissionMatrix] = useState<ModulePermission[]>(
    getDefaultPermissions('PD Life', PRODUCT_ROLES_MAP['PD Life'][0])
  );

  const handleProductChange = (prod: ProductSystem) => {
    const firstRole = PRODUCT_ROLES_MAP[prod][0];
    setSelectedProduct(prod);
    setSelectedRole(firstRole);
    setModuleSearch('');
    setPermissionMatrix(getDefaultPermissions(prod, firstRole));
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setPermissionMatrix(getDefaultPermissions(selectedProduct, role));
  };

  const handleResetToDefault = () => {
    setPermissionMatrix(getDefaultPermissions(selectedProduct, selectedRole));
    triggerBanner(`Matrix reset to the default template for ${selectedRole}.`);
  };

  const handleToggle = (moduleName: string, key: 'canRead' | 'canWrite' | 'canDelete') => {
    setPermissionMatrix(prev => prev.map(p => p.moduleName === moduleName ? { ...p, [key]: !p[key] } : p));
  };

  const handleToggleColumn = (key: 'canRead' | 'canWrite' | 'canDelete') => {
    const visibleNames = new Set(filteredMatrix.map((m) => m.moduleName));
    const allOn = filteredMatrix.every((m) => m[key]);
    setPermissionMatrix(prev => prev.map(p => visibleNames.has(p.moduleName) ? { ...p, [key]: !allOn } : p));
  };

  const handleRowFullAccess = (moduleName: string) => {
    setPermissionMatrix(prev => prev.map(p => p.moduleName === moduleName ? { ...p, canRead: true, canWrite: true, canDelete: true } : p));
  };

  const handleRowNoAccess = (moduleName: string) => {
    setPermissionMatrix(prev => prev.map(p => p.moduleName === moduleName ? { ...p, canRead: false, canWrite: false, canDelete: false } : p));
  };

  const triggerBanner = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveMatrix = () => {
    triggerBanner(`Permissions saved for ${selectedRole} under ${selectedProduct} system.`);
  };

  const filteredMatrix = permissionMatrix.filter((m) => m.moduleName.toLowerCase().includes(moduleSearch.toLowerCase()));

  const fullAccessCount = permissionMatrix.filter((m) => m.canRead && m.canWrite && m.canDelete).length;
  const readOnlyCount = permissionMatrix.filter((m) => m.canRead && !m.canWrite && !m.canDelete).length;
  const noAccessCount = permissionMatrix.filter((m) => !m.canRead && !m.canWrite && !m.canDelete).length;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900 dark:text-slate-100 relative">

      {notification && (
        <div className="fixed top-6 right-6 z-[100] p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center justify-between space-x-3">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="cursor-pointer p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <FolderTree className="h-6 w-6 text-[#d0112b]" />
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
              ROLE & MODULE ACCESS MAINTENANCE
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure module access matrices across Paramount multi-product systems</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleResetToDefault} className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200">
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default</span>
          </button>
          <button onClick={handleSaveMatrix} className="flex items-center space-x-2 bg-[#008cb4] hover:bg-[#007396] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md">
            <Save className="w-4 h-4" />
            <span>Save Access Matrix</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={`Modules in ${selectedProduct}`} value={permissionMatrix.length} />
        <StatCard label="Full Access Modules" value={fullAccessCount} tone="brand" />
        <StatCard label="Read-Only Modules" value={readOnlyCount} />
        <StatCard label="No Access" value={noAccessCount} tone="slate" />
      </div>

      {/* Product Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['PD Life', 'OFW', 'CTPL', 'GTP'] as ProductSystem[]).map((prod) => (
          <button
            key={prod}
            onClick={() => handleProductChange(prod)}
            className={`p-4 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-between shadow-sm ${
              selectedProduct === prod
                ? 'bg-[#d0112b] text-white border-[#d0112b] shadow-md'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800'
            }`}
          >
            <span>{prod} System</span>
            <Layers className="w-4 h-4 opacity-70" />
          </button>
        ))}
      </div>

      {/* Role Selection + Module Search */}
      <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-bold text-slate-600 uppercase dark:text-slate-300">Target Role ({selectedProduct}):</span>
          <select
            value={selectedRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer max-w-md dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          >
            {selectedProduct === 'PD Life' ? (
              <>
                <optgroup label="Direct Marketing Roles">
                  {DIRECT_MARKETING_ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </optgroup>
                <optgroup label="Other PD Life Product Roles">
                  {PRODUCT_ROLES_MAP['PD Life']
                    .filter((role) => !DIRECT_MARKETING_ROLES.includes(role))
                    .map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                </optgroup>
              </>
            ) : (
              <optgroup label={`${selectedProduct} Product Roles`}>
                {PRODUCT_ROLES_MAP[selectedProduct].map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </optgroup>
            )}
            <optgroup label="System Core & Global Roles">
              {SHARED_CORE_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={moduleSearch}
            onChange={(e) => setModuleSearch(e.target.value)}
            placeholder="Search modules..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#008cb4] dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
        </div>
      </div>

      {selectedProduct === 'PD Life' && DIRECT_MARKETING_ROLES.includes(selectedRole) && (
        <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/60 text-xs text-slate-700 font-semibold dark:bg-blue-950/30 dark:border-blue-900 dark:text-slate-300">
          {selectedRole === 'Operations' && 'Handles Application Screening, sending policy documents, and sending billing statements once that page ships.'}
          {selectedRole === 'Marketing' && 'Mostly views submitted applications — read-only access to Application Inquiry.'}
          {selectedRole === 'Contact Center' && 'Uses the Call Out queue for outbound follow-up, once that page ships, plus read access to Application Inquiry for lookups.'}
        </div>
      )}

      {/* Access Control Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto dark:bg-slate-900 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 font-extrabold uppercase dark:border-slate-800 dark:text-slate-400">
              <th className="py-3 px-3">Module Name ({selectedProduct})</th>
              <th className="py-3 px-3 text-center">
                <button onClick={() => handleToggleColumn('canRead')} className="flex items-center justify-center gap-1 mx-auto cursor-pointer hover:text-[#008cb4]" title="Toggle all visible rows">
                  <span>Read / View</span>
                </button>
              </th>
              <th className="py-3 px-3 text-center">
                <button onClick={() => handleToggleColumn('canWrite')} className="flex items-center justify-center gap-1 mx-auto cursor-pointer hover:text-[#008cb4]" title="Toggle all visible rows">
                  <span>Write / Edit</span>
                </button>
              </th>
              <th className="py-3 px-3 text-center">
                <button onClick={() => handleToggleColumn('canDelete')} className="flex items-center justify-center gap-1 mx-auto cursor-pointer hover:text-[#d0112b]" title="Toggle all visible rows">
                  <span>Delete Privilege</span>
                </button>
              </th>
              <th className="py-3 px-3 text-center">Quick Set</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredMatrix.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400 dark:text-slate-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-bold">No modules match "{moduleSearch}".</p>
                </td>
              </tr>
            )}
            {filteredMatrix.map((item) => (
              <tr key={item.moduleName} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <td className="py-4 px-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{item.moduleName}</span>
                    {MODULES_NOT_YET_BUILT.has(item.moduleName) && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-700 border border-amber-300 uppercase tracking-wide dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  {MODULE_DESCRIPTIONS[item.moduleName] && (
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5 dark:text-slate-500">{MODULE_DESCRIPTIONS[item.moduleName]}</p>
                  )}
                </td>
                <td className="py-4 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={item.canRead}
                    onChange={() => handleToggle(item.moduleName, 'canRead')}
                    className="h-4 w-4 rounded border-slate-300 text-[#008cb4] focus:ring-[#008cb4] cursor-pointer dark:border-slate-600 dark:bg-slate-800"
                  />
                </td>
                <td className="py-4 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={item.canWrite}
                    onChange={() => handleToggle(item.moduleName, 'canWrite')}
                    className="h-4 w-4 rounded border-slate-300 text-[#008cb4] focus:ring-[#008cb4] cursor-pointer dark:border-slate-600 dark:bg-slate-800"
                  />
                </td>
                <td className="py-4 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={item.canDelete}
                    onChange={() => handleToggle(item.moduleName, 'canDelete')}
                    className="h-4 w-4 rounded border-slate-300 text-[#d0112b] focus:ring-[#d0112b] cursor-pointer dark:border-slate-600 dark:bg-slate-800"
                  />
                </td>
                <td className="py-4 px-3">
                  <div className="flex items-center justify-center space-x-1.5">
                    <button
                      onClick={() => handleRowFullAccess(item.moduleName)}
                      title="Grant full access"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-500 transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-400"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRowNoAccess(item.moduleName)}
                      title="Revoke all access"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#d0112b] hover:text-white text-slate-500 transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-400"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
