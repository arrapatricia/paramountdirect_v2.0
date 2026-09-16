import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Edit3,
  X,
  CheckCircle2,
  UserCheck,
  UserX,
  ShieldCheck,
  RotateCcw
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

// Direct Marketing's own operating roles for this system, ahead of the
// broader legacy PD Life role list carried over from the wider Paramount
// system.
const DIRECT_MARKETING_ROLES = ['Operations', 'Marketing', 'Contact Center'];

const PRODUCT_ROLES_MAP: Record<ProductScope, string[]> = {
  'PD Life': [
    ...DIRECT_MARKETING_ROLES,
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
    role: 'Operations',
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
  },
  {
    id: 'USR-1004',
    firstName: 'Oliver',
    lastName: 'Rodrigo',
    email: 'oliver.rodrigo@paramount.com.ph',
    role: 'Operations',
    assignedProducts: ['PD Life'],
    status: 'Inactive',
    lastLogin: '2026-09-13 09:05 AM'
  },
  {
    id: 'USR-1005',
    firstName: 'Isabelle',
    lastName: 'Marasigan',
    email: 'isabelle.marasigan@paramount.com.ph',
    role: 'Marketing',
    assignedProducts: ['PD Life'],
    status: 'Active',
    lastLogin: '2026-09-12 10:15 AM'
  },
  {
    id: 'USR-1006',
    firstName: 'Ramon',
    lastName: 'Aquino',
    email: 'ramon.aquino@paramount.com.ph',
    role: 'Contact Center',
    assignedProducts: ['PD Life'],
    status: 'Active',
    lastLogin: '2026-09-12 02:40 PM'
  }
];

const PRODUCT_BADGE_STYLES: Record<ProductScope, string> = {
  'PD Life': 'bg-red-50 text-[#d0112b] border-red-200 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300',
  'OFW': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-300',
  'CTPL': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300',
  'GTP': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300'
};

const AVATAR_PALETTE = [
  'bg-red-100 text-[#d0112b] dark:bg-red-950/40 dark:text-red-300',
  'bg-blue-100 text-[#008cb4] dark:bg-blue-950/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
];

function avatarStyleFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[hash];
}

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

export default function UserManagement() {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [activeModalUser, setActiveModalUser] = useState<UserAccount | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<UserAccount>>({});

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = selectedProductFilter === 'All' || u.assignedProducts.includes(selectedProductFilter as ProductScope);
    const matchesStatus = selectedStatusFilter === 'All' || u.status === selectedStatusFilter;
    return matchesSearch && matchesProduct && matchesStatus;
  });

  const activeCount = users.filter((u) => u.status === 'Active').length;
  const inactiveCount = users.length - activeCount;
  const rolesInUse = new Set(users.map((u) => u.role)).size;

  const hasActiveFilters = searchTerm !== '' || selectedProductFilter !== 'All' || selectedStatusFilter !== 'All';

  const triggerBanner = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedProductFilter('All');
    setSelectedStatusFilter('All');
  };

  const handleToggleStatus = (user: UserAccount) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    setUsers(users.map((u) => u.id === user.id ? { ...u, status: nextStatus } : u));
    triggerBanner(`${user.firstName} ${user.lastName} is now ${nextStatus}.`);
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
          <Users className="h-6 w-6 text-[#d0112b]" />
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
              USER MANAGEMENT
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Provision employee accounts and product line scopes</p>
          </div>
        </div>

        <button onClick={handleOpenCreate} className="flex items-center space-x-2 bg-[#008cb4] hover:bg-[#007396] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md">
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="Active" value={activeCount} tone="emerald" />
        <StatCard label="Inactive" value={inactiveCount} tone="slate" />
        <StatCard label="Roles In Use" value={rolesInUse} tone="brand" />
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search User Name or Email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#008cb4] dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">Product:</span>
          <select
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white outline-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          >
            <option value="All">All Products</option>
            <option value="PD Life">PD Life</option>
            <option value="OFW">OFW</option>
            <option value="CTPL">CTPL</option>
            <option value="GTP">GTP</option>
          </select>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">Status:</span>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white outline-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-[#d0112b] hover:bg-red-50 transition-all cursor-pointer dark:text-slate-400 dark:hover:bg-red-950/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}

        <span className="text-[10px] font-bold text-slate-400 ml-auto dark:text-slate-500">
          Showing {filteredUsers.length} of {users.length}
        </span>
      </div>

      {/* User Accounts Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto dark:bg-slate-900 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 font-extrabold uppercase dark:border-slate-800 dark:text-slate-400">
              <th className="py-3 px-3">Employee</th>
              <th className="py-3 px-3">System Role</th>
              <th className="py-3 px-3">Product Line Access</th>
              <th className="py-3 px-3">Last Login</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-bold">No users match these filters.</p>
                </td>
              </tr>
            )}
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/60">
                <td className="py-4 px-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[11px] flex-shrink-0 ${avatarStyleFor(user.id)}`}>
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-800 dark:text-white">{user.firstName} {user.lastName}</div>
                      <span className="text-[10px] text-slate-400 block font-normal dark:text-slate-500">{user.email}</span>
                      <span className="text-[9px] text-slate-300 font-mono block dark:text-slate-600">{user.id}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#008cb4] border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-3">
                  <div className="flex flex-wrap gap-1">
                    {user.assignedProducts.map((p) => (
                      <span key={p} className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${PRODUCT_BADGE_STYLES[p]}`}>
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-4 px-3 text-slate-500 font-semibold dark:text-slate-400">{user.lastLogin}</td>
                <td className="py-4 px-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    user.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-4 px-3">
                  <div className="flex items-center justify-center space-x-1.5">
                    <button
                      onClick={() => { setIsCreating(false); setActiveModalUser(user); setFormData({ ...user }); }}
                      title="Edit user"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-[#008cb4] hover:text-white text-slate-700 transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      title={user.status === 'Active' ? 'Deactivate user' : 'Activate user'}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        user.status === 'Active'
                          ? 'bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {user.status === 'Active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Add User Modal */}
      {(activeModalUser || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 dark:bg-slate-900 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#008cb4]/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#008cb4]" />
                </div>
                <div>
                  <h2 className="text-base font-bold uppercase text-slate-800 dark:text-white">{isCreating ? 'Provision User' : 'Edit User'}</h2>
                  {!isCreating && <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{formData.id}</p>}
                </div>
              </div>
              <button onClick={() => { setActiveModalUser(null); setIsCreating(false); }} className="cursor-pointer"><X className="w-5 h-5 text-slate-400 dark:text-slate-500" /></button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 dark:text-slate-300">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    placeholder="e.g. Juan"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1 dark:text-slate-300">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    placeholder="e.g. Dela Cruz"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 dark:text-slate-300">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  placeholder="juan.delacruz@paramount.com.ph"
                />
              </div>

              {/* Assigned Products Checkboxes */}
              <div>
                <label className="font-bold text-slate-700 block mb-2 dark:text-slate-300">Assigned Products</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PD Life', 'OFW', 'CTPL', 'GTP'] as ProductScope[]).map((prod) => (
                    <label key={prod} className="flex items-center space-x-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.assignedProducts?.includes(prod)}
                        onChange={() => handleToggleProductForm(prod)}
                        className="rounded text-[#d0112b] focus:ring-[#d0112b]"
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{prod}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dynamic System Role Selector based on Checked Products */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 dark:text-slate-300">System Role</label>
                <select
                  value={formData.role || ''}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  {(() => {
                    const availableRoles = getAvailableRoles();
                    const directMarketing = availableRoles.filter((r) => DIRECT_MARKETING_ROLES.includes(r));
                    const otherRoles = availableRoles.filter((r) => !DIRECT_MARKETING_ROLES.includes(r));

                    if (directMarketing.length === 0) {
                      return otherRoles.map((role) => <option key={role} value={role}>{role}</option>);
                    }

                    return (
                      <>
                        <optgroup label="Direct Marketing Roles">
                          {directMarketing.map((role) => <option key={role} value={role}>{role}</option>)}
                        </optgroup>
                        {otherRoles.length > 0 && (
                          <optgroup label="Other Roles">
                            {otherRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                          </optgroup>
                        )}
                      </>
                    );
                  })()}
                </select>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="font-bold text-slate-700 block mb-2 dark:text-slate-300">Account Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Active' })}
                    className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border font-bold cursor-pointer transition-all ${
                      formData.status === 'Active'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Inactive' })}
                    className={`flex items-center justify-center space-x-2 p-2.5 rounded-xl border font-bold cursor-pointer transition-all ${
                      formData.status === 'Inactive'
                        ? 'bg-slate-600 border-slate-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Inactive</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-4 border-t dark:border-slate-800">
                <button type="button" onClick={() => { setActiveModalUser(null); setIsCreating(false); }} className="px-4 py-2 rounded-xl border font-bold text-slate-600 cursor-pointer dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#008cb4] hover:bg-[#007396] text-white font-bold cursor-pointer transition-all">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
