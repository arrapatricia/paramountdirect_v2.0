import React, { useState } from 'react';
import { ArrowLeft, Edit, Plus, X, ChevronDown, CheckCircle2, Lock } from 'lucide-react';

interface Props {
  applicationId: string;
  planCode: string;
  initialStatus: string;
  onUpdateStatus: (status: string) => void;
  onBack: () => void;
}

export default function ApplicationDetailComprehensive({ 
  applicationId, 
  planCode, 
  initialStatus, 
  onUpdateStatus, 
  onBack 
}: Props) {
  // Map Plan Code to Product Name
  const productNames: Record<string, string> = {
    'MPR': 'MoneyPlus Protection Plan',
    'SSP': 'Sure Savings Plan',
    'PHP': 'PrimeHealth Cash Plan',
    'DRE': 'Dream College Plan'
  };
  const productName = productNames[planCode] || 'Comprehensive Plan';

  // Status Tracking
  const [status, setStatus] = useState(initialStatus);
  const [savedStatus, setSavedStatus] = useState(initialStatus);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusOptions = ['For Verification', 'For Evaluation', 'Paid', 'Issued'];

  // Edit Mode Tracking
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Date Tracking
  const [birthdate, setBirthdate] = useState('1994-01-08');

  // PH Geo Mock State
  const [region, setRegion] = useState('NCR');
  const [city, setCity] = useState('Makati City');
  const [barangay, setBarangay] = useState('San Lorenzo');

  // Calculate Age dynamically
  const calculateAge = (dobString: string) => {
    if (!dobString) return '--';
    const dob = new Date(dobString);
    const today = new Date('2026-08-29');
    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const toggleEdit = (section: string) => setEditingSection(editingSection === section ? null : section);

  // Helper for dynamic input styling based on edit state
  const getInputProps = (section: string, defaultValue: string, placeholder?: string) => ({
    defaultValue,
    placeholder,
    readOnly: editingSection !== section,
    disabled: editingSection !== section,
    className: `w-full px-3 py-2 rounded outline-none transition-colors ${
      editingSection === section ? 'bg-white border border-[#008cb4] focus:ring-2 focus:ring-[#008cb4]/20 text-slate-900 shadow-sm' : 'bg-gray-100 border border-gray-200 text-slate-700'
    }`
  });

  const getSelectProps = (section: string) => ({
    disabled: editingSection !== section,
    className: `flex-1 w-full px-3 py-2 rounded outline-none transition-colors ${
      editingSection === section ? 'bg-white border border-[#008cb4] focus:ring-2 focus:ring-[#008cb4]/20 text-slate-900 shadow-sm' : 'bg-gray-100 border border-gray-200 text-slate-700'
    }`
  });

  const EditButton = ({ section }: { section: string }) => {
    const isEditing = editingSection === section;
    return (
      <button 
        onClick={() => toggleEdit(section)}
        className={`mt-6 ${isEditing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#008cb4] hover:bg-[#007396]'} text-white px-4 py-2 rounded text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm`}
      >
        {isEditing ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
        <span>{isEditing ? 'Save Changes' : 'Edit'}</span>
      </button>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
              APPLICATION ID: {applicationId}
            </h1>
            <div className="flex items-center space-x-3 mt-1.5">
              <p className="text-xs font-bold text-slate-500">Viewing Application Details</p>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-xs font-bold text-slate-700">{productName} ({planCode})</span>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-xs font-black text-[#d0112b] bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-md tracking-wide">
                Premium: ₱892.00
              </span>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center space-x-3">
          {status !== savedStatus && savedStatus !== 'Issued' && (
            <button 
              onClick={() => {
                setSavedStatus(status);
                onUpdateStatus(status);
              }} 
              className="flex items-center space-x-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /><span>Save & Continue</span>
            </button>
          )}

          <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 px-2 uppercase tracking-wider">Current Status:</span>
            
            {savedStatus === 'Issued' ? (
              <span className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700">
                <span>Issued</span>
                <Lock className="w-3.5 h-3.5" />
              </span>
            ) : (
              <div className="relative">
                <button onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)} className="flex items-center space-x-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-200 cursor-pointer">
                  <span>{status}</span><ChevronDown className="w-4 h-4 text-slate-500" />
                </button>
                {isStatusMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1">
                    <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase border-b border-slate-100 mb-1">
                      Update Status To:
                    </div>
                    {statusOptions.map((opt) => (
                      <button key={opt} onClick={() => { setStatus(opt); setIsStatusMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold ${status === opt ? 'bg-[#d0112b] text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-20">
        {/* General Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl text-xs">
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">Campaign Source</label><select {...getSelectProps('general')}><option>Facebook</option></select></div><div className="hidden md:block"></div>
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">Plan</label><select {...getSelectProps('general')}><option>Plan 100 - 10 years to pay</option><option>Plan 200 - 10 years to pay</option></select></div><div className="hidden md:block"></div>
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">Payment Option</label><select {...getSelectProps('general')}><option>Monthly</option></select></div>
          </div>
          <EditButton section="general" />
        </div>

        {/* Personal Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4">Personal Information</h2>
          <div className="space-y-4 text-xs max-w-4xl">
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">Title</label><select {...getSelectProps('personal')} className={`${getSelectProps('personal').className} max-w-[120px]`}><option>Ms</option><option>Mr</option></select></div>
            <div className="flex items-center">
              <label className="w-40 font-semibold text-slate-700">Name</label>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" {...getInputProps('personal', 'Rea', 'First Name')} />
                <input type="text" {...getInputProps('personal', '', 'Middle Name (Optional)')} />
                <input type="text" {...getInputProps('personal', 'Test To', 'Last Name')} />
              </div>
            </div>
            <div className="flex items-center">
              <label className="w-40 font-semibold text-slate-700">Birthdate</label>
              <div className="flex-1 flex items-center space-x-4">
                <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} disabled={editingSection !== 'personal'} className={`w-48 px-3 py-2 rounded outline-none transition-colors ${editingSection === 'personal' ? 'bg-white border border-[#008cb4] text-slate-900' : 'bg-gray-100 border border-gray-200 text-slate-700'}`} />
                <div className="flex items-center space-x-2"><span className="text-slate-500 font-semibold">Age:</span><span className="px-3 py-1.5 bg-red-50 border border-red-100 text-[#d0112b] font-black rounded-lg">{calculateAge(birthdate)} yrs</span></div>
              </div>
            </div>
            <div className="flex items-start"><label className="w-40 font-semibold text-slate-700 mt-2">Place Of Birth</label><div className="flex-1"><input type="text" {...getInputProps('personal', '')} /></div></div>
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">Nationality</label><select {...getSelectProps('personal')} className={`${getSelectProps('personal').className} max-w-[192px]`}><option>Filipino</option></select></div>
            
            {/* SSP Specific Fields */}
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">Weight (kg)</label><div className="w-48 relative"><input type="number" {...getInputProps('personal', '')} /><span className="absolute right-3 top-2 text-slate-400 font-medium">kg</span></div></div>
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">Height (cm)</label><div className="w-48 relative"><input type="number" {...getInputProps('personal', '')} /><span className="absolute right-3 top-2 text-slate-400 font-medium">cm</span></div></div>
          </div>
          <EditButton section="personal" />
        </div>
        
        {/* Employment Information (Comprehensive Specific) */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4">Employment Information</h2>
          <div className="space-y-4 text-xs max-w-4xl">
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">Occupation</label><div className="flex-1"><input type="text" {...getInputProps('employment', 'Adult Literacy, Remedial Education, and GED Teachers')} /></div></div>
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">Specific duties</label><div className="flex-1"><input type="text" {...getInputProps('employment', 'Teacher')} /></div></div>
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">Office address</label><div className="flex-1"><input type="text" {...getInputProps('employment', 'Sta. Ana Manila')} /></div></div>
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">Zipcode</label><div className="w-48"><input type="text" {...getInputProps('employment', '1009')} /></div></div>
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">Office Tel. No.</label><div className="w-48"><input type="text" {...getInputProps('employment', '(000) 000-0000')} /></div></div>
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">Source of Funds</label><div className="flex-1"><input type="text" {...getInputProps('employment', 'Salary')} /></div></div>
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">TIN</label><div className="w-48"><input type="text" {...getInputProps('employment', '125447555844799929')} /></div></div>
            <div className="flex items-center"><label className="w-40 font-semibold text-slate-700">GSIS / SSS</label><div className="w-48"><input type="text" {...getInputProps('employment', '484948982')} /></div></div>
          </div>
          <EditButton section="employment" />
        </div>

        {/* Beneficiaries */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4">Beneficiaries</h2>
          <div className="space-y-4 text-xs max-w-5xl">
            <div className="flex items-center text-slate-500 font-semibold">
              <div className="flex-1 px-1">Full Name</div><div className="w-48 px-1">Relationship to you</div><div className="w-48 px-1">Birthdate</div><div className="w-32 px-1">Revocable?</div>
            </div>
            <div className="flex items-center">
              <div className="flex-1 px-1"><input type="text" {...getInputProps('beneficiaries', 'TEST TORIBIO')} /></div>
              <div className="w-48 px-1">
                <select {...getSelectProps('beneficiaries')}>
                  <option>Child</option><option>Spouse</option><option>Parent</option>
                </select>
              </div>
              <div className="w-48 px-1"><input type="date" {...getInputProps('beneficiaries', '')} /></div>
              <div className="w-32 px-1">
                <select {...getSelectProps('beneficiaries')}>
                  <option>Revocable</option><option>Irrevocable</option>
                </select>
              </div>
            </div>
            <div className="pt-2"><button disabled={editingSection !== 'beneficiaries'} className={`w-full font-bold py-2 rounded flex items-center justify-center space-x-1 transition-colors ${editingSection === 'beneficiaries' ? 'bg-gray-200 hover:bg-gray-300 text-slate-700 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}><Plus className="w-4 h-4" /><span>ADD BENEFICIARY</span></button></div>
          </div>
          <EditButton section="beneficiaries" />
        </div>

        {/* Non-forfeiture Options */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4">Non-forfeiture Options</h2>
          <div className="space-y-4 text-xs max-w-4xl">
            <p className="text-slate-600 font-medium mb-2">If premium is unpaid on expiry of grace period, apply cash value, if any, to effect:</p>
            <select {...getSelectProps('forfeiture')} className={`${getSelectProps('forfeiture').className} max-w-xs`}>
              <option>Paid-up Insurance</option>
              <option>Extended Term Insurance</option>
              <option>Premium Loan</option>
              <option>Automatic Payment of Premium</option>
              <option>Cash Surrender</option>
            </select>
          </div>
          <EditButton section="forfeiture" />
        </div>

        {/* Benefits Table (Static) */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4">Benefits Included</h2>
          <div className="border border-slate-200 rounded overflow-hidden text-xs max-w-2xl">
            <div className="flex border-b border-slate-200 bg-slate-50"><div className="flex-1 p-3 font-semibold text-slate-700">Life Benefit</div><div className="w-40 p-3 text-right font-bold">100,000.00</div></div>
            <div className="flex border-b border-slate-200"><div className="flex-1 p-3 font-semibold text-slate-700">Hospital Income Benefit</div><div className="w-40 p-3 text-right font-bold">500.00</div></div>
            <div className="flex border-b border-slate-200 bg-slate-50"><div className="flex-1 p-3 font-semibold text-slate-700">Accidental Death Benefit</div><div className="w-40 p-3 text-right font-bold">100,000.00</div></div>
            <div className="flex"><div className="flex-1 p-3 font-semibold text-slate-700">Waiver of Premium</div><div className="w-40 p-3 text-right font-bold">Yes</div></div>
          </div>
        </div>

      </div>
    </div>
  );
}