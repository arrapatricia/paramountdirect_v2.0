import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  Printer, 
  Globe, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  Filter,
  ExternalLink
} from 'lucide-react';

export interface Branch {
  id: string;
  division: 'LIFE' | 'NON-LIFE';
  region: string;
  province: string;
  city: string;
  address: string;
  barangay?: string;
  zipcode: string;
  mobile: string;
  telephone: string;
  fax?: string;
  email?: string;
  website: string;
  status: 'Active' | 'Inactive';
}

const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'BR-001',
    division: 'LIFE',
    region: 'NCR',
    province: 'METRO MANILA',
    city: 'MAKATI CITY',
    address: 'Unit 702 Cattleya Bldg., 235 Salcedo St., Legaspi Village',
    barangay: 'San Lorenzo',
    zipcode: '1229',
    mobile: '+639178611913',
    telephone: '(02) 8810-2051',
    fax: '(02) 8893-7069',
    email: 'makati.branch@paramount.com.ph',
    website: 'Paramount Direct',
    status: 'Active'
  },
  {
    id: 'BR-002',
    division: 'NON-LIFE',
    region: 'REGION XII',
    province: 'SOUTH COTABATO',
    city: 'GENERAL SANTOS CITY',
    address: 'A-201 GSC Security Building, National Highway',
    barangay: 'Dadiangas East',
    zipcode: '9500',
    mobile: '+639209876543',
    telephone: '(083) 552-1234',
    email: 'gensan@paramount.com.ph',
    website: 'Paramount Direct',
    status: 'Active'
  },
  {
    id: 'BR-003',
    division: 'NON-LIFE',
    region: 'REGION III',
    province: 'PAMPANGA',
    city: 'ANGELES CITY',
    address: 'Marquee Mall, Aniceto Gueco Ave, Pulung Maragul',
    barangay: 'Pulung Maragul',
    zipcode: '2009',
    mobile: '+639171234567',
    telephone: '(045) 625-1000',
    email: 'angeles@paramount.com.ph',
    website: 'Paramount Direct',
    status: 'Active'
  }
];

export default function BranchDirectory() {
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal / Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Branch>>({
    division: 'LIFE',
    status: 'Active',
    website: 'Paramount Direct'
  });

  const filteredBranches = branches.filter((b) => {
    const matchesSearch = 
      b.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.province.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDivision = selectedDivision === 'All' || b.division === selectedDivision;
    const matchesRegion = selectedRegion === 'All' || b.region === selectedRegion;
    const matchesStatus = selectedStatus === 'All' || b.status === selectedStatus;

    return matchesSearch && matchesDivision && matchesRegion && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setFormData({
      division: 'LIFE',
      status: 'Active',
      website: 'Paramount Direct',
      region: '',
      province: '',
      city: '',
      address: '',
      zipcode: '',
      mobile: '',
      telephone: '',
      email: ''
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({ ...branch });
    setIsDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      setBranches(prev => prev.map(b => b.id === editingBranch.id ? { ...b, ...formData } as Branch : b));
    } else {
      const newBranch: Branch = {
        ...formData,
        id: `BR-00${branches.length + 1}`
      } as Branch;
      setBranches(prev => [newBranch, ...prev]);
    }
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this branch entry?')) {
      setBranches(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900">
      
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-red-50 text-[#d0112b] rounded-2xl border border-red-100">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
              BRANCH DIRECTORY
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage physical office locations, regional contact details, and division assignments
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 bg-[#d0112b] hover:bg-[#b00e24] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-red-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      {/* Filter and View Bar */}
      <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search City, Address, Province..."
              className="w-64 pl-9 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Division Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Division:</span>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer"
            >
              <option value="All">All Divisions</option>
              <option value="LIFE">Life</option>
              <option value="NON-LIFE">Non-Life</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Grid Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Table View
          </button>
        </div>
      </div>

      {/* Grid Card View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <div 
              key={branch.id} 
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                {/* Top Badge & Division */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase ${
                    branch.division === 'LIFE' 
                      ? 'bg-red-50 text-[#d0112b] border border-red-100' 
                      : 'bg-blue-50 text-[#008cb4] border border-blue-100'
                  }`}>
                    {branch.division}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      branch.status === 'Active' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {branch.status}
                    </span>
                    <button 
                      onClick={() => handleOpenEdit(branch)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Edit Branch"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(branch.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Branch Location Title */}
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {branch.city}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mb-4 uppercase tracking-wide">
                  {branch.province} • {branch.region}
                </p>

                {/* Contact Details List */}
                <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <div className="flex items-start space-x-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{branch.address}, {branch.barangay ? `${branch.barangay}, ` : ''}{branch.zipcode}</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-800">{branch.telephone} {branch.mobile ? `/ ${branch.mobile}` : ''}</span>
                  </div>
                  {branch.email && (
                    <div className="flex items-center space-x-2.5">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-[#008cb4] font-medium">{branch.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-medium">
                <span className="flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{branch.website}</span>
                </span>
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${branch.address} ${branch.city}`)}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center space-x-1 text-[#008cb4] hover:underline font-bold"
                >
                  <span>View Map</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Legacy Table Layout (Modernized) */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3">Division</th>
                <th className="py-3 px-3">Region / Province</th>
                <th className="py-3 px-3">City / Address</th>
                <th className="py-3 px-3">Contact Details</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBranches.map((branch) => (
                <tr key={branch.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-3 font-bold">
                    <span className={`px-2 py-1 rounded-md text-[10px] ${
                      branch.division === 'LIFE' ? 'bg-red-50 text-[#d0112b]' : 'bg-blue-50 text-[#008cb4]'
                    }`}>
                      {branch.division}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <p className="font-bold text-slate-800">{branch.region}</p>
                    <p className="text-slate-400 text-[10px]">{branch.province}</p>
                  </td>
                  <td className="py-4 px-3">
                    <p className="font-bold text-slate-900">{branch.city}</p>
                    <p className="text-slate-500 max-w-xs truncate">{branch.address}</p>
                  </td>
                  <td className="py-4 px-3 space-y-0.5">
                    <p className="font-semibold text-slate-800">{branch.telephone}</p>
                    <p className="text-slate-400 text-[10px]">{branch.email || 'No email registered'}</p>
                  </td>
                  <td className="py-4 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      branch.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {branch.status}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => handleOpenEdit(branch)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#d0112b] hover:text-white transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(branch.id)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 hover:text-white transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over Form Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl z-10 flex flex-col justify-between font-sans">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-[#d0112b]" />
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  {editingBranch ? 'Edit Branch Location' : 'Add New Branch'}
                </h2>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <form id="branch-form" onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Division</label>
                  <select 
                    value={formData.division} 
                    onChange={(e) => setFormData({ ...formData, division: e.target.value as 'LIFE' | 'NON-LIFE' })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-[#008cb4] outline-none"
                  >
                    <option value="LIFE">LIFE</option>
                    <option value="NON-LIFE">NON-LIFE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-[#008cb4] outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                <input 
                  type="text" 
                  required
                  value={formData.address || ''} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Unit No., Building, Street Name"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-[#008cb4] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Region</label>
                  <input 
                    type="text" 
                    required
                    value={formData.region || ''} 
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="e.g. NCR, Region III"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-[#008cb4] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Province</label>
                  <input 
                    type="text" 
                    required
                    value={formData.province || ''} 
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="e.g. Pampanga"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-[#008cb4] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City / Municipality</label>
                  <input 
                    type="text" 
                    required
                    value={formData.city || ''} 
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Makati City"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-[#008cb4] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Zipcode</label>
                  <input 
                    type="text" 
                    required
                    value={formData.zipcode || ''} 
                    onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                    placeholder="e.g. 1229"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-[#008cb4] outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-900 mb-2 uppercase text-[10px] tracking-wider text-slate-400">Communication Numbers</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Telephone</label>
                    <input 
                      type="text" 
                      required
                      value={formData.telephone || ''} 
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      placeholder="(02) 8000-0000"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-[#008cb4] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mobile No.</label>
                    <input 
                      type="text" 
                      value={formData.mobile || ''} 
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="+639170000000"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-[#008cb4] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email || ''} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="branch@paramount.com.ph"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-[#008cb4] outline-none"
                />
              </div>

            </form>

            {/* Drawer Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => setIsDrawerOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-200 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                form="branch-form"
                type="submit" 
                className="px-5 py-2.5 rounded-xl bg-[#008cb4] hover:bg-[#007396] text-white font-bold text-xs transition-colors shadow-sm cursor-pointer flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Location</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}