import { useState } from 'react';
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
  RotateCcw,
  Layers,
  Save,
  SlidersHorizontal,
  FolderTree,
  CheckCheck,
  Ban,
} from 'lucide-react';
import {
  ROLE_DEFINITIONS,
  ROLE_GROUP_ORDER,
  getRoleDefinition,
  productsForRole,
  getDefaultPermissions,
  MODULE_DESCRIPTIONS,
  MODULES_NOT_YET_BUILT,
  type ProductScope,
} from '../lib/roles';

export interface UserAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  assignedProducts: ProductScope[];
  status: 'Active' | 'Inactive';
  lastLogin: string;
  // Only ever set at creation time in this mock - there's no change-password
  // flow here, and it's never rendered back anywhere (table, edit modal).
  password?: string;
}

// Fresh-environment reset: only the retained access stays provisioned here.
// admin@paramount.com.ph isn't in this list at all - it's the separate
// hardcoded demo login in login.tsx, unaffected by this array.
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'USR-1001',
    firstName: 'Arra',
    lastName: 'Del Mundo',
    email: 'arra.delmundo@paramount.com.ph',
    role: 'System Admin',
    assignedProducts: productsForRole('System Admin'),
    status: 'Active',
    lastLogin: '2026-09-02 08:45 AM',
  },
];

const DEFAULT_NEW_USER_ROLE = 'DM Operations';

const PRODUCT_BADGE_STYLES: Record<ProductScope, string> = {
  'PD Life': 'bg-red-50 text-[#d0112b] border-red-200 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300',
  'OFW': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-300',
  'CTPL': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300',
  'GTP': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300',
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

function RoleSelect({ value, onChange, className }: { value: string; onChange: (role: string) => void; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      {ROLE_GROUP_ORDER.map((group) => (
        <optgroup key={group} label={group}>
          {ROLE_DEFINITIONS.filter((r) => r.group === group).map((r) => (
            <option key={r.name} value={r.name}>{r.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

interface Props {
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
}

export default function UserRoleManagement({ users, setUsers }: Props) {
  const [view, setView] = useState<'users' | 'roles'>('users');
  const [notification, setNotification] = useState<string | null>(null);

  const triggerBanner = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // ---- Users tab state ----
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [activeModalUser, setActiveModalUser] = useState<UserAccount | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<UserAccount>>({});
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  const handleOpenCreate = () => {
    setIsCreating(true);
    setFormData({
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: DEFAULT_NEW_USER_ROLE,
      assignedProducts: productsForRole(DEFAULT_NEW_USER_ROLE),
      status: 'Active',
    });
    setConfirmPassword('');
    setPasswordError(null);
  };

  const handleFormRoleChange = (role: string) => {
    setFormData({ ...formData, role, assignedProducts: productsForRole(role) });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) return;

    if (isCreating) {
      if (!formData.password || formData.password.length < 8) {
        setPasswordError('Password must be at least 8 characters.');
        return;
      }
      if (formData.password !== confirmPassword) {
        setPasswordError('Passwords do not match.');
        return;
      }
      setPasswordError(null);

      const newUser = { ...formData, lastLogin: 'Never' } as UserAccount;
      setUsers([newUser, ...users]);
      triggerBanner(`User ${newUser.firstName} ${newUser.lastName} created successfully.`);
    } else {
      // Password is optional on edit - only touch it if the admin actually
      // typed a new one, so leaving both fields blank keeps the current
      // (never-displayed-back) password untouched.
      const patch = { ...formData };
      if (patch.password) {
        if (patch.password.length < 8) {
          setPasswordError('Password must be at least 8 characters.');
          return;
        }
        if (patch.password !== confirmPassword) {
          setPasswordError('Passwords do not match.');
          return;
        }
      } else {
        delete patch.password;
      }
      setPasswordError(null);

      setUsers(users.map((u) => u.id === formData.id ? ({ ...u, ...patch } as UserAccount) : u));
      triggerBanner(`User account ${formData.id} updated.`);
    }

    setActiveModalUser(null);
    setIsCreating(false);
    setConfirmPassword('');
  };

  const closeUserModal = () => {
    setActiveModalUser(null);
    setIsCreating(false);
    setConfirmPassword('');
    setPasswordError(null);
  };

  // ---- Role Access Matrix tab state ----
  const [selectedRole, setSelectedRole] = useState<string>(DEFAULT_NEW_USER_ROLE);
  const [selectedMatrixProduct, setSelectedMatrixProduct] = useState<ProductScope>(productsForRole(DEFAULT_NEW_USER_ROLE)[0]);
  const [moduleSearch, setModuleSearch] = useState('');
  const [permissionMatrix, setPermissionMatrix] = useState(getDefaultPermissions(DEFAULT_NEW_USER_ROLE, selectedMatrixProduct));

  const selectedRoleDef = getRoleDefinition(selectedRole);

  const handleRoleChange = (role: string) => {
    const def = getRoleDefinition(role);
    const product = def?.products[0] ?? 'PD Life';
    setSelectedRole(role);
    setSelectedMatrixProduct(product);
    setModuleSearch('');
    setPermissionMatrix(getDefaultPermissions(role, product));
  };

  const handleMatrixProductChange = (product: ProductScope) => {
    setSelectedMatrixProduct(product);
    setPermissionMatrix(getDefaultPermissions(selectedRole, product));
  };

  const handleResetToDefault = () => {
    setPermissionMatrix(getDefaultPermissions(selectedRole, selectedMatrixProduct));
    triggerBanner(`Matrix reset to the default template for ${selectedRole}.`);
  };

  const handleToggle = (moduleName: string, key: 'canRead' | 'canWrite' | 'canDelete') => {
    setPermissionMatrix((prev) => prev.map((p) => p.moduleName === moduleName ? { ...p, [key]: !p[key] } : p));
  };

  const handleToggleColumn = (key: 'canRead' | 'canWrite' | 'canDelete') => {
    const visibleNames = new Set(filteredMatrix.map((m) => m.moduleName));
    const allOn = filteredMatrix.every((m) => m[key]);
    setPermissionMatrix((prev) => prev.map((p) => visibleNames.has(p.moduleName) ? { ...p, [key]: !allOn } : p));
  };

  const handleRowFullAccess = (moduleName: string) => {
    setPermissionMatrix((prev) => prev.map((p) => p.moduleName === moduleName ? { ...p, canRead: true, canWrite: true, canDelete: true } : p));
  };

  const handleRowNoAccess = (moduleName: string) => {
    setPermissionMatrix((prev) => prev.map((p) => p.moduleName === moduleName ? { ...p, canRead: false, canWrite: false, canDelete: false } : p));
  };

  const handleSaveMatrix = () => {
    triggerBanner(`Permissions saved for ${selectedRole} under ${selectedMatrixProduct}.`);
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
          <ShieldCheck className="h-6 w-6 text-[#d0112b]" />
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
              USERS & ROLE MANAGEMENT
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">System Admin only — provision accounts and configure module access per role</p>
          </div>
        </div>

        {view === 'users' ? (
          <button onClick={handleOpenCreate} className="flex items-center space-x-2 bg-[#008cb4] hover:bg-[#007396] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md">
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        ) : (
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
        )}
      </div>

      {/* View Switcher */}
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <button
          onClick={() => setView('users')}
          className={`p-3.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
            view === 'users'
              ? 'bg-[#d0112b] text-white border-[#d0112b] shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users</span>
        </button>
        <button
          onClick={() => setView('roles')}
          className={`p-3.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
            view === 'roles'
              ? 'bg-[#d0112b] text-white border-[#d0112b] shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Role Access Matrix</span>
        </button>
      </div>

      {view === 'users' ? (
        <>
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
                          onClick={() => { setIsCreating(false); setActiveModalUser(user); setFormData({ ...user }); setConfirmPassword(''); setPasswordError(null); }}
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
                  <button onClick={closeUserModal} className="cursor-pointer"><X className="w-5 h-5 text-slate-400 dark:text-slate-500" /></button>
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

                  {/* Password - required when provisioning new access; optional
                      when editing (leave both blank to keep the current password). */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 dark:text-slate-300">
                        {isCreating ? 'Password' : 'New Password'}
                      </label>
                      <input
                        type="password"
                        required={isCreating}
                        minLength={8}
                        value={formData.password || ''}
                        onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setPasswordError(null); }}
                        className="w-full p-2.5 rounded-xl border bg-slate-50 font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        placeholder={isCreating ? 'Min. 8 characters' : 'Leave blank to keep current'}
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 dark:text-slate-300">Confirm Password</label>
                      <input
                        type="password"
                        required={isCreating || !!formData.password}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                        className="w-full p-2.5 rounded-xl border bg-slate-50 font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        placeholder="Re-enter password"
                      />
                    </div>
                    {passwordError && (
                      <p className="col-span-2 text-[11px] font-bold text-rose-600 dark:text-rose-400">{passwordError}</p>
                    )}
                  </div>

                  {/* Role - product access is derived from the role, not picked separately */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 dark:text-slate-300">System Role</label>
                    <RoleSelect
                      value={formData.role || DEFAULT_NEW_USER_ROLE}
                      onChange={handleFormRoleChange}
                      className="w-full p-2.5 rounded-xl border bg-slate-50 font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                    {getRoleDefinition(formData.role || '')?.description && (
                      <p className="text-[10px] font-medium text-slate-400 mt-1 dark:text-slate-500">{getRoleDefinition(formData.role || '')?.description}</p>
                    )}
                  </div>

                  {/* Derived Product Access (read-only) */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-2 dark:text-slate-300">Product Line Access</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(formData.assignedProducts || []).map((p) => (
                        <span key={p} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${PRODUCT_BADGE_STYLES[p]}`}>
                          {p}
                        </span>
                      ))}
                    </div>
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
                    <button type="button" onClick={closeUserModal} className="px-4 py-2 rounded-xl border font-bold text-slate-600 cursor-pointer dark:border-slate-700 dark:text-slate-300">Cancel</button>
                    <button type="submit" className="px-5 py-2 rounded-xl bg-[#008cb4] hover:bg-[#007396] text-white font-bold cursor-pointer transition-all">Save Record</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={`Modules in ${selectedMatrixProduct}`} value={permissionMatrix.length} />
            <StatCard label="Full Access Modules" value={fullAccessCount} tone="brand" />
            <StatCard label="Read-Only Modules" value={readOnlyCount} />
            <StatCard label="No Access" value={noAccessCount} tone="slate" />
          </div>

          {/* Role Selection + Module Search */}
          <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-bold text-slate-600 uppercase dark:text-slate-300">Target Role:</span>
              <RoleSelect
                value={selectedRole}
                onChange={handleRoleChange}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer max-w-md dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
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

          {selectedRoleDef && (
            <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/60 text-xs text-slate-700 font-semibold dark:bg-blue-950/30 dark:border-blue-900 dark:text-slate-300">
              {selectedRoleDef.description}
            </div>
          )}

          {/* Product Sub-Tabs - only shown for roles spanning more than one product */}
          {selectedRoleDef && selectedRoleDef.products.length > 1 && (
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedRoleDef.products.length}, minmax(0, 1fr))` }}>
              {selectedRoleDef.products.map((prod) => (
                <button
                  key={prod}
                  onClick={() => handleMatrixProductChange(prod)}
                  className={`p-3.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                    selectedMatrixProduct === prod
                      ? 'bg-[#d0112b] text-white border-[#d0112b] shadow-md'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span>{prod}</span>
                  <Layers className="w-4 h-4 opacity-70" />
                </button>
              ))}
            </div>
          )}

          {/* Access Control Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto dark:bg-slate-900 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-extrabold uppercase dark:border-slate-800 dark:text-slate-400">
                  <th className="py-3 px-3">Module Name ({selectedMatrixProduct})</th>
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
        </>
      )}

    </div>
  );
}
