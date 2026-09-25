import React, { useMemo, useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  MapPin,
  Phone,
  Mail,
  Globe,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Printer,
  Smartphone
} from 'lucide-react';
import type { ProductLine } from './sidebar';
import { brandTheme } from '../lib/brand';

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

// Transcribed from the live OFW Branch Locator (ofwinsurance.ph/ofw-branches)
// - that public page is the source of truth for the branch network, so this
// admin directory mirrors it: same branches, same regions, in the same
// order the site lists them. Every branch there is tagged "Division:
// Non-life". Barangays are kept inside the address, as the site shows them.
const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'BR-001',
    division: 'NON-LIFE',
    region: 'CAR',
    province: 'Benguet',
    city: 'Baguio City',
    address: 'Manongdo Building, 17 Private Road, Magsaysay Avenue, Baguio City',
    zipcode: '2600',
    telephone: '(074) 661-3887',
    mobile: '+639175972058',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-002',
    division: 'NON-LIFE',
    region: 'NCR',
    province: 'Metro Manila',
    city: 'Mandaluyong',
    address: 'Unit 2 Maranaw Plaza, 187 EDSA (beside POEA), Brgy. Wack-Wack, Greenhills East',
    zipcode: '1550',
    telephone: '(02) 8723-2156; 8705-1925',
    mobile: '+639178091646',
    fax: '(02) 8723-1691',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-003',
    division: 'NON-LIFE',
    region: 'NCR',
    province: 'Metro Manila',
    city: 'Ermita',
    address: 'Plaza Ambrosio Building Unit 2A, 1136-1144 Jorge Bocobo St., Ermita, Manila',
    zipcode: '1000',
    telephone: '(02) 8523-7779',
    mobile: '+639175856429',
    fax: '(02) 8523-7980',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-004',
    division: 'NON-LIFE',
    region: 'REGION I',
    province: 'La Union',
    city: 'San Fernando City',
    address: 'GF Kenny Plaza, Quezon Avenue, San Fernando City, La Union',
    zipcode: '2500',
    telephone: '(072) 607-1283',
    mobile: '+639088189837',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-005',
    division: 'NON-LIFE',
    region: 'REGION II',
    province: 'Cagayan',
    city: 'Tuguegarao City',
    address: 'Stall #1 Caritan Centro, Diversion Road, Tuguegarao City',
    zipcode: '3500',
    telephone: '(078) 824-8047',
    mobile: '+639171191777',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-006',
    division: 'NON-LIFE',
    region: 'REGION III',
    province: 'Pampanga',
    city: 'City of San Fernando',
    address: 'Rm. 302 SM City Pampanga, Brgy. San Jose, San Fernando City, Pampanga',
    zipcode: '2000',
    telephone: '(045) 652-7652',
    mobile: '+639175392934',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-007',
    division: 'NON-LIFE',
    region: 'REGION IV-A',
    province: 'Laguna',
    city: 'Calamba City',
    address: 'Andenson Building II, Ground Floor, Barangay Parian, Calamba City, Laguna',
    zipcode: '4027',
    telephone: '(049) 521-8242',
    mobile: '+639985955729',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-008',
    division: 'NON-LIFE',
    region: 'REGION IV-B',
    province: 'Palawan',
    city: 'Puerto Princesa City',
    address: 'Unit No. E-1 GF MJ Building, Burgos St., Brgy. Princesa, Puerto Princesa City',
    zipcode: '5300',
    telephone: '(048) 423-3674',
    mobile: '+639175972045',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-009',
    division: 'NON-LIFE',
    region: 'REGION IX',
    province: 'Zamboanga del Sur',
    city: 'Zamboanga City',
    address: 'Ground Floor, Goodwill Center Bldg., Mayor Jaldon St., Canelar, Zamboanga City',
    zipcode: '7000',
    telephone: '(062) 992-9386',
    mobile: '+639178870252',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-010',
    division: 'NON-LIFE',
    region: 'REGION V',
    province: 'Albay',
    city: 'Legazpi City',
    address: 'Mezzanine Floor, Tower Building 1, Landco Business Park, Brgy. 36 Kapantawan, City of Legazpi, Albay',
    zipcode: '4500',
    telephone: '',
    mobile: '+639171194861',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-011',
    division: 'NON-LIFE',
    region: 'REGION VI',
    province: 'Iloilo',
    city: 'Iloilo City',
    address: 'Level 3, Space No. E112, Robinsons Place Iloilo, Ledesma St. cor. Mabini St., Brgy. Roxas Village, Iloilo City',
    zipcode: '5000',
    telephone: '(033) 327 4809',
    mobile: '+639171083399',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-012',
    division: 'NON-LIFE',
    region: 'REGION VI',
    province: 'Negros Occidental',
    city: 'Bacolod City',
    address: '2nd Floor, China Banking Corporation Bldg., Araneta St. corner San Sebastian, Bacolod City, Negros Occidental',
    zipcode: '6100',
    telephone: '(034) 434 3010',
    mobile: '+639171068628',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-013',
    division: 'NON-LIFE',
    region: 'REGION VII',
    province: 'Cebu',
    city: 'Cebu City',
    address: 'Room 103 Marylee Arcade, Gorordo Avenue, Cebu City',
    zipcode: '6000',
    telephone: '(032) 236-1065',
    mobile: '+639171345914',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-014',
    division: 'NON-LIFE',
    region: 'REGION VIII',
    province: 'Leyte',
    city: 'Tacloban City',
    address: 'Door 1, 2nd Floor, No. 126 Senator Enage St., Brgy. 5-A, Tacloban City',
    zipcode: '6500',
    telephone: '(053) 839-8678',
    mobile: '+639175972044',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-015',
    division: 'NON-LIFE',
    region: 'REGION X',
    province: 'Misamis Oriental',
    city: 'Cagayan de Oro City',
    address: 'Room 202 YMCA Hostel, Julio Pacana Street, Barangay No. 21, Cagayan de Oro City',
    zipcode: '9000',
    telephone: '(088) 557-6901',
    mobile: '+639171050776',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-016',
    division: 'NON-LIFE',
    region: 'REGION XI',
    province: 'Davao del Sur',
    city: 'Davao City',
    address: 'SH 3021, NCCC Mall Buhangin, Tigatto Road, Buhangin, Davao City',
    zipcode: '8000',
    telephone: '(082) 227-2268',
    mobile: '+639171101909',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-017',
    division: 'NON-LIFE',
    region: 'REGION XII',
    province: 'South Cotabato',
    city: 'Koronadal City',
    address: 'Ground Floor Stall 5, Sanle Building, corner Lapu-Lapu and Aquino Streets, Koronadal City',
    zipcode: '9506',
    telephone: '(083) 552-0392',
    mobile: '+639972372579',
    website: 'ofwinsurance.ph',
    status: 'Active'
  },
  {
    id: 'BR-018',
    division: 'NON-LIFE',
    region: 'REGION XIII',
    province: 'Agusan del Norte',
    city: 'Butuan City',
    address: '2nd Floor, PS Arcade, Gov. Rosales Avenue, Imadejas Pob., Butuan City, Agusan del Norte',
    zipcode: '8600',
    telephone: '(085) 225-5304',
    mobile: '+639178870243',
    fax: '(085) 225-6257',
    website: 'ofwinsurance.ph',
    status: 'Active'
  }
];

type ViewMode = 'locator' | 'grid' | 'table';

// "Tel: … | Mobile: … | Fax: …" - the contact line format used on
// ofwinsurance.ph/ofw-branches.
function contactLine(b: Branch): string {
  return [
    b.telephone && `Tel: ${b.telephone}`,
    b.mobile && `Mobile: ${b.mobile}`,
    b.fax && `Fax: ${b.fax}`,
  ].filter(Boolean).join(' | ');
}

const divisionLabel = (d: Branch['division']) => (d === 'LIFE' ? 'Life' : 'Non-life');

interface Props {
  activeProduct: ProductLine;
}

export default function BranchDirectory({ activeProduct }: Props) {
  const brand = brandTheme(activeProduct);
  const isNonLife = activeProduct !== 'PD Life';

  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  // Non-Life product lines open on the same Branch Locator layout as the
  // public OFW site; PD Life keeps the card grid.
  const [viewMode, setViewMode] = useState<ViewMode>(isNonLife ? 'locator' : 'grid');

  // Branch Locator state - the site's "Select a branch" dropdown picks a
  // region, and each region expands to show its branches.
  const [locatorRegion, setLocatorRegion] = useState<string>('All');
  const [openRegions, setOpenRegions] = useState<string[]>([]);

  // Modal / Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Branch>>({
    division: 'NON-LIFE',
    status: 'Active',
    website: 'ofwinsurance.ph'
  });

  const filteredBranches = branches.filter((b) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      b.city.toLowerCase().includes(term) ||
      b.address.toLowerCase().includes(term) ||
      b.province.toLowerCase().includes(term) ||
      b.region.toLowerCase().includes(term);
    const matchesDivision = selectedDivision === 'All' || b.division === selectedDivision;
    const matchesStatus = selectedStatus === 'All' || b.status === selectedStatus;

    return matchesSearch && matchesDivision && matchesStatus;
  });

  // Regions in first-appearance order, matching the site's list.
  const regions = useMemo(() => {
    const seen: string[] = [];
    for (const b of branches) if (!seen.includes(b.region)) seen.push(b.region);
    return seen;
  }, [branches]);

  const branchesByRegion = useMemo(() => {
    const groups: Record<string, Branch[]> = {};
    for (const b of filteredBranches) (groups[b.region] ??= []).push(b);
    return groups;
  }, [filteredBranches]);

  const visibleRegions = regions.filter(
    (r) => branchesByRegion[r]?.length && (locatorRegion === 'All' || r === locatorRegion)
  );

  const toggleRegion = (region: string) =>
    setOpenRegions((prev) => (prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]));

  const handleLocatorSelect = (region: string) => {
    setLocatorRegion(region);
    if (region !== 'All') setOpenRegions((prev) => (prev.includes(region) ? prev : [...prev, region]));
  };

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setFormData({
      division: isNonLife ? 'NON-LIFE' : 'LIFE',
      status: 'Active',
      website: isNonLife ? 'ofwinsurance.ph' : 'Paramount Direct',
      region: '',
      province: '',
      city: '',
      address: '',
      zipcode: '',
      mobile: '',
      telephone: '',
      fax: '',
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
      const nextNumber = Math.max(0, ...branches.map(b => Number(b.id.replace('BR-', '')) || 0)) + 1;
      const newBranch: Branch = {
        ...formData,
        id: `BR-${String(nextNumber).padStart(3, '0')}`
      } as Branch;
      setBranches(prev => [...prev, newBranch]);
    }
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this branch entry?')) {
      setBranches(prev => prev.filter(b => b.id !== id));
    }
  };

  const inputClass = `w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 ${brand.focusRing} outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100`;
  const filterSelectClass = `px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 ${brand.focusRing} cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100`;

  const divisionBadge = (division: Branch['division']) =>
    division === 'LIFE'
      ? 'bg-red-50 text-[#d0112b] border border-red-100 dark:bg-red-950/30 dark:border-red-900'
      : 'bg-[#002f6c]/[0.06] text-[#002f6c] border border-[#002f6c]/15 dark:bg-[#49b1ea]/10 dark:text-[#49b1ea] dark:border-[#49b1ea]/30';

  const rowActions = (branch: Branch) => (
    <>
      <button
        onClick={() => handleOpenEdit(branch)}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer dark:hover:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-200"
        title="Edit Branch"
      >
        <Edit3 className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDelete(branch.id)}
        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer dark:hover:bg-red-950/30 dark:text-slate-500 dark:hover:text-red-400"
        title="Delete Branch"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </>
  );

  const mapsHref = (b: Branch) =>
    `https://maps.google.com/?q=${encodeURIComponent(`${b.address} ${b.city} ${b.province}`)}`;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900 dark:text-slate-100">

      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-2xl border ${brand.iconChip}`}>
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-xl font-bold uppercase tracking-wider font-['Montserrat'] ${brand.text}`}>
              BRANCH DIRECTORY
            </h1>
            <p className="text-xs text-slate-500 font-medium dark:text-slate-400">
              {isNonLife
                ? 'Branches listed on the ofwinsurance.ph Branch Locator - regional office addresses and contact numbers'
                : 'Manage physical office locations, regional contact details, and division assignments'}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${brand.button}`}
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      {/* Filter and View Bar */}
      <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center justify-between gap-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1">

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Region, City, Address, Province..."
              className={`w-64 max-w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 ${brand.focusRing} dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100`}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Division Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">Division:</span>
            <select value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)} className={filterSelectClass}>
              <option value="All">All Divisions</option>
              <option value="LIFE">Life</option>
              <option value="NON-LIFE">Non-Life</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">Status:</span>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={filterSelectClass}>
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
          {([
            ['locator', 'Branch Locator'],
            ['grid', 'Grid Cards'],
            ['table', 'Table View'],
          ] as [ViewMode, string][]).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === mode ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredBranches.length === 0 && (
        <div className="p-10 text-center text-xs font-semibold text-slate-400 bg-white border border-slate-200 rounded-3xl dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500">
          No branches match the current filters.
        </div>
      )}

      {/* Branch Locator View - mirrors ofwinsurance.ph/ofw-branches */}
      {viewMode === 'locator' && filteredBranches.length > 0 && (
        <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
          <div className="relative px-6 py-10 md:py-14 text-center bg-gradient-to-br from-[#002f6c] via-[#0a4d97] to-[#1f7fbf] overflow-hidden">
            {/* Faint skyline stripes standing in for the site's building photo */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff 0 2px, transparent 2px 38px)' }}
            />
            <div className="relative max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-4xl font-semibold tracking-wide text-white">BRANCH LOCATOR</h2>
              <p className="text-xs md:text-sm mt-2 text-white opacity-90">Find the nearest PLGIC OFW branch near you.</p>
              <div className="relative mt-5">
                <select
                  value={locatorRegion}
                  onChange={(e) => handleLocatorSelect(e.target.value)}
                  aria-label="Select a branch"
                  // Inline so it beats index.css's global `.dark select`
                  // color - this field stays white in both themes, like the site.
                  style={{ color: '#1e293b' }}
                  className="w-full appearance-none bg-white text-slate-800 text-sm font-semibold rounded-md pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-[#49b1ea] cursor-pointer"
                >
                  <option value="All">Select a branch</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleRegions.map((region) => {
              const isOpen = openRegions.includes(region);
              const regionBranches = branchesByRegion[region];
              return (
                <div key={region}>
                  <button
                    onClick={() => toggleRegion(region)}
                    className="w-full flex items-center justify-between px-6 py-3.5 text-left hover:bg-slate-50 transition-colors cursor-pointer dark:hover:bg-slate-800/60"
                  >
                    <span className="flex items-center space-x-3">
                      <strong className={`text-sm font-extrabold ${isOpen ? brand.text : 'text-slate-800 dark:text-slate-100'}`}>{region}</strong>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        {regionBranches.length} {regionBranches.length === 1 ? 'branch' : 'branches'}
                      </span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {regionBranches.map((branch) => (
                        <div
                          key={branch.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                        >
                          <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2 mb-3 dark:border-slate-700">
                            <div className="min-w-0">
                              <p className={`text-sm font-bold ${brand.text}`}>{branch.city}</p>
                              <p className="font-extrabold text-slate-700 mt-0.5 dark:text-slate-200">
                                Division: {divisionLabel(branch.division)}
                                {branch.status === 'Inactive' && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">Inactive</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center flex-shrink-0">{rowActions(branch)}</div>
                          </div>
                          <p className="text-slate-600 leading-relaxed dark:text-slate-300">
                            {branch.address}{branch.barangay ? `, ${branch.barangay}` : ''}
                            <br />
                            {branch.province}, {branch.zipcode}
                          </p>
                          {contactLine(branch) && (
                            <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">{contactLine(branch)}</p>
                          )}
                          {branch.email && (
                            <p className={`mt-1 font-medium ${brand.accentText}`}>{branch.email}</p>
                          )}
                          <a
                            href={mapsHref(branch)}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center space-x-1 mt-3 font-bold hover:underline ${brand.accentText}`}
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>View Map</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid Card View */}
      {viewMode === 'grid' && filteredBranches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800"
            >
              <div>
                {/* Top Badge & Division */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase ${divisionBadge(branch.division)}`}>
                    {branch.division}
                  </span>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      branch.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                    }`}>
                      {branch.status}
                    </span>
                    {rowActions(branch)}
                  </div>
                </div>

                {/* Branch Location Title */}
                <h3 className="text-base font-bold text-slate-900 mb-1 dark:text-white">
                  {branch.city}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mb-4 uppercase tracking-wide dark:text-slate-400">
                  {branch.province} • {branch.region}
                </p>

                {/* Contact Details List */}
                <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4 dark:text-slate-400 dark:border-slate-800">
                  <div className="flex items-start space-x-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 dark:text-slate-500" />
                    <span>{branch.address}, {branch.barangay ? `${branch.barangay}, ` : ''}{branch.zipcode}</span>
                  </div>
                  {branch.telephone && (
                    <div className="flex items-center space-x-2.5">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 dark:text-slate-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{branch.telephone}</span>
                    </div>
                  )}
                  {branch.mobile && (
                    <div className="flex items-center space-x-2.5">
                      <Smartphone className="w-4 h-4 text-slate-400 flex-shrink-0 dark:text-slate-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{branch.mobile}</span>
                    </div>
                  )}
                  {branch.fax && (
                    <div className="flex items-center space-x-2.5">
                      <Printer className="w-4 h-4 text-slate-400 flex-shrink-0 dark:text-slate-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{branch.fax}</span>
                    </div>
                  )}
                  {branch.email && (
                    <div className="flex items-center space-x-2.5">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0 dark:text-slate-500" />
                      <span className={`font-medium ${brand.accentText}`}>{branch.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-medium dark:border-slate-800 dark:text-slate-500">
                <span className="flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{branch.website}</span>
                </span>
                <a
                  href={mapsHref(branch)}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center space-x-1 hover:underline font-bold ${brand.accentText}`}
                >
                  <span>View Map</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredBranches.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto dark:bg-slate-900 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 px-3">Division</th>
                <th className="py-3 px-3">Region / Province</th>
                <th className="py-3 px-3">City / Address</th>
                <th className="py-3 px-3">Contact Details</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBranches.map((branch) => (
                <tr key={branch.id} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/60">
                  <td className="py-4 px-3 font-bold">
                    <span className={`px-2 py-1 rounded-md text-[10px] ${divisionBadge(branch.division)}`}>
                      {branch.division}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{branch.region}</p>
                    <p className="text-slate-400 text-[10px] dark:text-slate-500">{branch.province}</p>
                  </td>
                  <td className="py-4 px-3">
                    <p className="font-bold text-slate-900 dark:text-white">{branch.city}</p>
                    <p className="text-slate-500 max-w-xs truncate dark:text-slate-400" title={branch.address}>{branch.address}</p>
                  </td>
                  <td className="py-4 px-3 space-y-0.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{contactLine(branch) || 'No number registered'}</p>
                    <p className="text-slate-400 text-[10px] dark:text-slate-500">{branch.email || 'No email registered'}</p>
                  </td>
                  <td className="py-4 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      branch.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {branch.status}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">{rowActions(branch)}</div>
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

          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl z-10 flex flex-col justify-between font-sans dark:bg-slate-900">

            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex items-center space-x-2">
                <Building2 className={`w-5 h-5 ${brand.text}`} />
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide dark:text-white">
                  {editingBranch ? 'Edit Branch Location' : 'Add New Branch'}
                </h2>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <form id="branch-form" onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Division</label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value as 'LIFE' | 'NON-LIFE' })}
                    className={inputClass}
                  >
                    <option value="LIFE">LIFE</option>
                    <option value="NON-LIFE">NON-LIFE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                    className={inputClass}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Street Address</label>
                <input
                  type="text"
                  required
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Unit No., Building, Street Name, Barangay"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Region</label>
                  <input
                    type="text"
                    required
                    list="branch-region-options"
                    value={formData.region || ''}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="e.g. NCR, REGION III"
                    className={inputClass}
                  />
                  <datalist id="branch-region-options">
                    {regions.map((r) => <option key={r} value={r} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Province</label>
                  <input
                    type="text"
                    required
                    value={formData.province || ''}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="e.g. Pampanga"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">City / Municipality</label>
                  <input
                    type="text"
                    required
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Makati City"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Zipcode</label>
                  <input
                    type="text"
                    required
                    value={formData.zipcode || ''}
                    onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                    placeholder="e.g. 1229"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                <h4 className="font-bold mb-2 uppercase text-[10px] tracking-wider text-slate-400 dark:text-slate-500">Communication Numbers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Telephone</label>
                    <input
                      type="text"
                      value={formData.telephone || ''}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      placeholder="(02) 8000-0000"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Mobile No.</label>
                    <input
                      type="text"
                      value={formData.mobile || ''}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="+639170000000"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Fax</label>
                    <input
                      type="text"
                      value={formData.fax || ''}
                      onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                      placeholder="(02) 8000-0000"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="branch@paramount.com.ph"
                  className={inputClass}
                />
              </div>

            </form>

            {/* Drawer Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3 dark:border-slate-800 dark:bg-slate-800/60">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-200 text-xs transition-colors cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                form="branch-form"
                type="submit"
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm cursor-pointer flex items-center space-x-1.5 ${brand.button}`}
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
