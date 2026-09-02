import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Save, 
  CheckCircle2, 
  Lock, 
  X,
  SlidersHorizontal,
  FolderTree
} from 'lucide-react';

export type ProductSystem = 'PD Life' | 'OFW' | 'CTPL' | 'GTP';

export interface ModulePermission {
  moduleName: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

const PRODUCT_MODULE_MAP: Record<ProductSystem, string[]> = {
  'PD Life': ['Applications & Screening', 'Payment Transactions & Ledger', 'Maintenance & Rate Tables', 'CMS Content', 'Audit Logs'],
  'OFW': ['OFW Contracts & Screening', 'OEC Payment Ledger', 'POEA Rate Configuration', 'Agency Audit Logs'],
  'CTPL': ['LTO Motor Registration', 'CTPL Certificate Ledger', 'Tariff & Premium Calculator', 'Agent Logs'],
  'GTP': ['Group Corporate Accounts', 'Billing Schedule & Master Roll', 'Endorsements & Rates', 'Audit Logs']
};

const PRODUCT_ROLES_MAP: Record<ProductSystem, string[]> = {
  'PD Life': [
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

export default function RoleAccessMaintenance() {
  const [selectedProduct, setSelectedProduct] = useState<ProductSystem>('PD Life');
  const [selectedRole, setSelectedRole] = useState<string>(PRODUCT_ROLES_MAP['PD Life'][0]);
  const [notification, setNotification] = useState<string | null>(null);

  const [permissionMatrix, setPermissionMatrix] = useState<ModulePermission[]>(
    PRODUCT_MODULE_MAP['PD Life'].map(m => ({ moduleName: m, canRead: true, canWrite: false, canDelete: false }))
  );

  const handleProductChange = (prod: ProductSystem) => {
    setSelectedProduct(prod);
    setSelectedRole(PRODUCT_ROLES_MAP[prod][0]);
    setPermissionMatrix(
      PRODUCT_MODULE_MAP[prod].map(m => ({ moduleName: m, canRead: true, canWrite: false, canDelete: false }))
    );
  };

  const handleToggle = (moduleName: string, key: 'canRead' | 'canWrite' | 'canDelete') => {
    setPermissionMatrix(prev => prev.map(p => p.moduleName === moduleName ? { ...p, [key]: !p[key] } : p));
  };

  const handleSaveMatrix = () => {
    setNotification(`Permissions saved for ${selectedRole} under ${selectedProduct} system.`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900 relative">
      
      {notification && (
        <div className="fixed top-6 right-6 z-[100] p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center justify-between space-x-3">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="cursor-pointer p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <FolderTree className="w-6 h-6 text-[#d0112b]" />
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
              ROLE & MODULE ACCESS MAINTENANCE
            </h1>
            <p className="text-xs text-slate-500 font-medium">Configure module access matrices across Paramount multi-product systems</p>
          </div>
        </div>

        <button onClick={handleSaveMatrix} className="flex items-center space-x-2 bg-[#008cb4] hover:bg-[#007396] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md">
          <Save className="w-4 h-4" />
          <span>Save Access Matrix</span>
        </button>
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
                : 'bg-white/80 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <span>{prod} System</span>
            <Layers className="w-4 h-4 opacity-70" />
          </button>
        ))}
      </div>

      {/* Role Selection Dropdown */}
      <div className="p-4 rounded-3xl border border-white/60 bg-white/70 backdrop-blur-md shadow-lg flex items-center space-x-3">
        <SlidersHorizontal className="w-4 h-4 text-slate-500" />
        <span className="text-xs font-bold text-slate-600 uppercase">Target Role ({selectedProduct}):</span>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer max-w-md"
        >
          <optgroup label={`${selectedProduct} Product Roles`}>
            {PRODUCT_ROLES_MAP[selectedProduct].map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </optgroup>
          <optgroup label="System Core & Global Roles">
            {SHARED_CORE_ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Access Control Matrix Table */}
      <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 font-extrabold uppercase">
              <th className="py-3 px-3">Module Name ({selectedProduct})</th>
              <th className="py-3 px-3 text-center">Read / View</th>
              <th className="py-3 px-3 text-center">Write / Edit</th>
              <th className="py-3 px-3 text-center">Delete Privilege</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {permissionMatrix.map((item) => (
              <tr key={item.moduleName} className="hover:bg-slate-50/80">
                <td className="py-4 px-3 font-bold text-slate-800">{item.moduleName}</td>
                <td className="py-4 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={item.canRead}
                    onChange={() => handleToggle(item.moduleName, 'canRead')}
                    className="h-4 w-4 rounded border-slate-300 text-[#008cb4] focus:ring-[#008cb4] cursor-pointer"
                  />
                </td>
                <td className="py-4 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={item.canWrite}
                    onChange={() => handleToggle(item.moduleName, 'canWrite')}
                    className="h-4 w-4 rounded border-slate-300 text-[#008cb4] focus:ring-[#008cb4] cursor-pointer"
                  />
                </td>
                <td className="py-4 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={item.canDelete}
                    onChange={() => handleToggle(item.moduleName, 'canDelete')}
                    className="h-4 w-4 rounded border-slate-300 text-[#d0112b] focus:ring-[#d0112b] cursor-pointer"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}