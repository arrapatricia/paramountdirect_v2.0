import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit3, 
  X, 
  CheckCircle2
} from 'lucide-react';

export type ProductScope = 'PD Life' | 'OFW' | 'CTPL' | 'GTP';

export interface UserAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  assignedProducts: ProductScope[];
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

const PRODUCT_ROLES_MAP: Record<ProductScope, string[]> = {
  'PD Life': [
    'Accounts Executive 1',
    'Agency Admin',
    'Agency Branch Admin',
    'Agency Issuer',
    'Claims Processor',
    'Collection Assistant',
    'Coop Area - Admin',
    'Coop Branch - Admin',
    'DM Actuarial',
    'Kaagapay Admin',
    'Payment Transactions',
    'Policy Services Head'
  ],
  'OFW': [
    'OFW Agency User',
    'OFW Discount User',
    'OFW TEAM',
    'OFW Team Admin',
    'Seabase Admin'
  ],
  'CTPL': [
    'Agent Motor Insurance Admin',
    'Agent Motor Insurance Branch Issuer',
    'Agent Motor Insurance Branch Manager',
    'CTPL Agent District',
    'CTPL Agent Issuer',
    'CTPL Agent Region',
    'CTPL Finance',
    'CTPL Validator',
    'Motor Insurance Agent',
    'Motor Insurance Branch Admin',
    'Motor Insurance Branch Issuer',
    'Motor Insurance Underwriter'
  ],
  'GTP': [
    'GTPP Agent Admin',
    'GTPP Agent Issuer',
    'GTPP Agent Manager',
    'GTPP Branch Admin',
    'GTPP Branch Issuer',
    'GTPP Head Office Admin',
    'GTPP Head Office Super Admin',
    'GTPP Travel Agency Admin'
  ]
};

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'USR-1001',
    firstName: 'Arra',
    lastName: 'Del Mundo',
    email: 'arra.delmundo@paramount.com.ph',
    role: 'Agency Admin',
    assignedProducts: ['PD Life', 'OFW', 'CTPL', 'GTP'],
    status: 'Active',
    lastLogin: '2026-09-02 08:45 AM'
  },
  {
    id: 'USR-1002',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    email: 'juan.delacruz@paramount.com.ph',
    role: 'Collection Assistant',
    assignedProducts: ['PD Life', 'OFW'],
    status: 'Active',
    lastLogin: '2026-09-01 04:12 PM'
  },
  {
    id: 'USR-1003',
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria.santos@paramount.com.ph',
    role: 'Motor Insurance Underwriter',
    assignedProducts: ['CTPL', 'GTP'],
    status: 'Active',
    lastLogin: '2026-08-30 11:20 AM'
  }
];

export default function UserManagement() {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('All');
  const [activeModalUser, setActiveModalUser] = useState<UserAccount | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<UserAccount>>({});

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = selectedProductFilter === 'All' || u.assignedProducts.includes(selectedProductFilter as ProductScope);
    return matchesSearch && matchesProduct;
  });

  const triggerBanner = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const getAvailableRoles = (): string[] => {
    const assigned = formData.assignedProducts || [];
    if (assigned.length === 0) return ['Super Admin'];

    const rolesSet = new Set<string>();
    assigned.forEach((prod) => {
      const roles = PRODUCT_ROLES_MAP[prod] || [];
      roles.forEach((r) => rolesSet.add(r));
    });

    return Array.from(rolesSet);
  };

  const handleOpenCreate = () => {
    setIsCreating(true);
    const initialProducts: ProductScope[] = ['PD Life'];
    const initialRoles = PRODUCT_ROLES_MAP['PD Life'];

    setFormData({
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: '',
      lastName: '',
      email: '',
      role: initialRoles[0],
      assignedProducts: initialProducts,
      status: 'Active'
    });
  };

  const handleToggleProductForm = (prod: ProductScope) => {
    const current = formData.assignedProducts || [];
    let updatedProducts: ProductScope[];

    if (current.includes(prod)) {
      updatedProducts = current.filter((p) => p !== prod);
    } else {
      updatedProducts = [...current, prod];
    }

    const availableRoles: string[] = [];
    updatedProducts.forEach((p) => {
      (PRODUCT_ROLES_MAP[p] || []).forEach((r) => {
        if (!availableRoles.includes(r)) availableRoles.push(r);
      });
    });

    const newRole = availableRoles.includes(formData.role || '') 
      ? formData.role 
      : (availableRoles[0] || 'Super Admin');

    setFormData({ 
      ...formData, 
      assignedProducts: updatedProducts,
      role: newRole 
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) return;

    if (isCreating) {
      const newUser = { ...formData, lastLogin: 'Never' } as UserAccount;
      setUsers([newUser, ...users]);
      triggerBanner(`User ${newUser.firstName} ${newUser.lastName} created successfully.`);
    } else {
      setUsers(users.map((u) => u.id === formData.id ? ({ ...u, ...formData } as UserAccount) : u));
      triggerBanner(`User account ${formData.id} updated.`);
    }

    setActiveModalUser(null);
    setIsCreating(false);
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
          <Users className="w-6 h-6 text-[#d0112b]" />
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
              USER MANAGEMENT
            </h1>
            <p className="text-xs text-slate-500 font-medium">Provision employee accounts and product line scopes</p>
          </div>
        </div>

        <button onClick={handleOpenCreate} className="flex items-center space-x-2 bg-[#008cb4] hover:bg-[#007396] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md">
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl border border-white/60 bg-white/70 backdrop-blur-md shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search User Name or Email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#008cb4]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Filter Product:</span>
          <select
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white/80 outline-none cursor-pointer"
          >
            <option value="All">All Products</option>
            <option value="PD Life">PD Life</option>
            <option value="OFW">OFW</option>
            <option value="CTPL">CTPL</option>
            <option value="GTP">GTP</option>
          </select>
        </div>
      </div>

      {/* User Accounts Table */}
      <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 font-extrabold uppercase">
              <th className="py-3 px-3">User ID</th>
              <th className="py-3 px-3">Employee Name</th>
              <th className="py-3 px-3">System Role</th>
              <th className="py-3 px-3">Product Line Access</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-4 px-3 font-mono font-bold">{user.id}</td>
                <td className="py-4 px-3 font-extrabold text-slate-800">
                  <div>{user.firstName} {user.lastName}</div>
                  <span className="text-[10px] text-slate-400 block font-normal">{user.email}</span>
                </td>
                <td className="py-4 px-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#008cb4] border border-blue-200">
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-3">
                  <div className="flex flex-wrap gap-1">
                    {user.assignedProducts.map((p) => (
                      <span key={p} className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-4 px-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    user.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-4 px-3 text-center">
                  <button
                    onClick={() => { setIsCreating(false); setActiveModalUser(user); setFormData({ ...user }); }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-[#008cb4] hover:text-white text-slate-700 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Add User Modal */}
      {(activeModalUser || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-base font-bold uppercase">{isCreating ? 'Provision User' : `Edit User — ${formData.id}`}</h2>
              <button onClick={() => { setActiveModalUser(null); setIsCreating(false); }} className="cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">First Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.firstName || ''} 
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border bg-slate-50 font-semibold" 
                    placeholder="e.g. Juan"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.lastName || ''} 
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border bg-slate-50 font-semibold" 
                    placeholder="e.g. Dela Cruz"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Corporate Email</label>
                <input 
                  type="email" 
                  required 
                  value={formData.email || ''} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border bg-slate-50 font-semibold" 
                  placeholder="juan.delacruz@paramount.com.ph"
                />
              </div>

              {/* Assigned Products Checkboxes */}
              <div>
                <label className="font-bold text-slate-700 block mb-2">Assigned Products</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PD Life', 'OFW', 'CTPL', 'GTP'] as ProductScope[]).map((prod) => (
                    <label key={prod} className="flex items-center space-x-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.assignedProducts?.includes(prod)} 
                        onChange={() => handleToggleProductForm(prod)} 
                        className="rounded text-[#d0112b] focus:ring-[#d0112b]" 
                      />
                      <span className="font-bold text-slate-800">{prod}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dynamic System Role Selector based on Checked Products */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">System Role</label>
                <select 
                  value={formData.role || ''} 
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border bg-slate-50 font-semibold"
                >
                  {getAvailableRoles().map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={() => { setActiveModalUser(null); setIsCreating(false); }} className="px-4 py-2 rounded-xl border font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#008cb4] text-white font-bold">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}