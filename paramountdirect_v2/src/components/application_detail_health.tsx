import React, { useState } from 'react';
import { ArrowLeft, Edit, Plus, X, ChevronDown, CheckCircle2, Lock, AlertCircle, ShieldAlert } from 'lucide-react';

interface Props {
  applicationId: string;
  planCode: string;
  initialStatus: string;
  onUpdateStatus: (status: string) => void;
  onBack: () => void;
}

export default function ApplicationDetailHealth({ 
  applicationId, 
  planCode, 
  initialStatus, 
  onUpdateStatus, 
  onBack 
}: Props) {
  const productNames: Record<string, string> = {
    'HCP': 'HealthCare Cash Plan',
    'HIP': 'Hospital Income Benefit Plan',
    'PCP': 'PrimeCare Cash Plan',
    'PHC': 'Premium HealthCare Plus Plan'
  };
  const productName = productNames[planCode] || 'Health Plan';

  const [status, setStatus] = useState(initialStatus);
  const [savedStatus, setSavedStatus] = useState(initialStatus);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusOptions = ['For Verification', 'For Evaluation', 'Paid', 'Issued'];

  // Notification Banner State
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [birthdate, setBirthdate] = useState('2007-02-01');

  const [region, setRegion] = useState('NCR');
  const [city, setCity] = useState('Pasay City');
  const [barangay, setBarangay] = useState('Barangay 101');

  const phRegions = ['NCR', 'Region III', 'Region IV-A'];
  const phCities = ['Pasay City', 'Makati City', 'Manila City', 'Quezon City'];
  const phBarangays = ['Barangay 101', 'Barangay 102', 'Barangay 103'];

  const calculateAge = (dobString: string) => {
    if (!dobString) return '--';
    const dob = new Date(dobString);
    const today = new Date('2026-08-29');
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const toggleEdit = (section: string) => {
    setEditingSection(editingSection === section ? null : section);
  };

  // Immediate Status Update & Banner Trigger Handler
  const handleSelectStatus = (newStatus: string) => {
    setStatus(newStatus);
    setIsStatusMenuOpen(false);

    const simulateError = false; // Toggle to true to test error banner

    if (newStatus === 'Issued') {
      if (simulateError) {
        setNotification({
          type: 'error',
          message: 'There is an error upon issuance of application.'
        });
        return;
      }

      setSavedStatus('Issued');
      onUpdateStatus('Issued');
      setNotification({
        type: 'success',
        message: 'The application has been successfully issued and transmitted to iPeak'
      });
    } else {
      setSavedStatus(newStatus);
      onUpdateStatus(newStatus);
      setNotification({
        type: 'info',
        message: `The application is updated to ${newStatus}`
      });
    }

    // Auto-dismiss banner after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const getInputProps = (section: string, defaultValue: string, placeholder?: string) => {
    const isEditing = editingSection === section;
    return {
      defaultValue,
      placeholder,
      readOnly: !isEditing,
      disabled: !isEditing,
      className: `w-full px-3 py-2 rounded outline-none transition-colors ${
        isEditing 
          ? 'bg-white border border-[#008cb4] focus:ring-2 focus:ring-[#008cb4]/20 text-slate-900 shadow-sm' 
          : 'bg-gray-100 border border-gray-200 text-slate-700'
      }`
    };
  };

  const getSelectProps = (section: string) => {
    const isEditing = editingSection === section;
    return {
      disabled: !isEditing,
      className: `flex-1 w-full px-3 py-2 rounded outline-none transition-colors ${
        isEditing 
          ? 'bg-white border border-[#008cb4] focus:ring-2 focus:ring-[#008cb4]/20 text-slate-900 shadow-sm' 
          : 'bg-gray-100 border border-gray-200 text-slate-700'
      }`
    };
  };

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
      
      {/* Top Banner Alert Prompt */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold shadow-md animate-fadeIn ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
            : notification.type === 'error'
            ? 'bg-rose-50 border-rose-300 text-rose-800'
            : 'bg-blue-50 border-blue-300 text-blue-800'
        }`}>
          <div className="flex items-center space-x-2.5">
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
            {notification.type === 'error' && <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />}
            {notification.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="cursor-pointer p-1 rounded-lg hover:bg-black/5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
            title="Back to Screening List"
          >
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
                Premium: ₱500.00
              </span>
            </div>
          </div>
        </div>

        {/* Current Status Dropdown */}
        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 px-2 uppercase tracking-wider">Current Status:</span>
          
          {savedStatus === 'Issued' ? (
            <span className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700">
              <span>Issued</span>
              <Lock className="w-3.5 h-3.5" />
            </span>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                className="flex items-center space-x-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-200 cursor-pointer transition-all"
              >
                <span>{status}</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {isStatusMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1">
                  <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase border-b border-slate-100 mb-1">
                    Update Status To:
                  </div>
                  {statusOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSelectStatus(opt)}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                        status === opt ? 'bg-[#d0112b] text-white' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt}</span>
                      {status === opt && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Form Content */}
      <div className="space-y-6 pb-20">
        
        {/* 1. General Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl text-xs">
            <div className="flex items-center">
              <label className="w-40 font-semibold text-slate-700">Campaign Source</label>
              <select {...getSelectProps('general')}>
                <option>Telemarketing</option>
                <option>PD Website</option>
                <option>Google</option>
                <option>Facebook Ads</option>
              </select>
            </div>
            <div className="hidden md:block"></div>
            
            <div className="flex items-center">
              <label className="w-40 font-semibold text-slate-700">Plan</label>
              <select {...getSelectProps('general')}>
                <option>Plan 500 - Family</option>
                <option>Plan 1000 - Family</option>
              </select>
            </div>
            <div className="hidden md:block"></div>

            <div className="flex items-center">
              <label className="w-40 font-semibold text-slate-700">Payment Option</label>
              <select {...getSelectProps('general')}>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Semi-Annual</option>
                <option>Annual</option>
              </select>
            </div>
          </div>
          <EditButton section="general" />
        </div>

        {/* 2. Personal Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4">Personal Information</h2>
          <div className="space-y-4 text-xs max-w-4xl">
            <div className="flex items-center">
              <label className="w-40 font-semibold text-slate-700">Title</label>
              <select {...getSelectProps('personal')} className={`${getSelectProps('personal').className} max-w-[120px]`}>
                <option>Mr</option>
                <option>Ms</option>
                <option>Mrs</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <label className="w-40 font-semibold text-slate-700">Name</label>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" {...getInputProps('personal', 'Paramount', 'First Name')} />
                <input type="text" {...getInputProps('personal', 'Life & General Insurance', 'Middle Name')} />
                <input type="text" {...getInputProps('personal', 'Corp', 'Last Name')} />
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-40 font-semibold text-slate-700">Birthdate</label>
              <div className="flex-1 flex items-center space-x-4">
                <input 
                  type="date" 
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  disabled={editingSection !== 'personal'}
                  className={`w-48 px-3 py-2 rounded outline-none transition-colors ${
                    editingSection === 'personal' 
                      ? 'bg-white border border-[#008cb4] focus:ring-2 focus:ring-[#008cb4]/20 text-slate-900 shadow-sm' 
                      : 'bg-gray-100 border border-gray-200 text-slate-700'
                  }`} 
                />
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 font-semibold">Current Age:</span>
                  <span className="px-3 py-1.5 bg-red-50 border border-red-100 text-[#d0112b] font-black rounded-lg">
                    {calculateAge(birthdate)} yrs
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <label className="w-40 font-semibold text-slate-700 mt-2">Place Of Birth<br/><span className="text-[10px] font-normal text-slate-400">(Optional)</span></label>
              <div className="flex-1">
                <input type="text" {...getInputProps('personal', '')} />
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-40 font-semibold text-slate-700">Nationality</label>
              <select {...getSelectProps('personal')} className={`${getSelectProps('personal').className} max-w-[192px]`}>
                <option>Filipino</option>
              </select>
            </div>
          </div>
          <EditButton section="personal" />
        </div>

        {/* 3. Contact Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4">Contact Information</h2>
          <div className="space-y-4 text-xs max-w-4xl">
            <div className="flex items-start">
              <label className="w-40 font-semibold text-slate-700 mt-2">Address</label>
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" {...getInputProps('contact', '12313')} placeholder="Unit / House No." />
                  <input type="text" {...getInputProps('contact', '1231')} placeholder="Street" />
                  <input type="text" {...getInputProps('contact', '', 'Building Name (Optional)')} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select 
                    value={barangay} 
                    onChange={(e) => setBarangay(e.target.value)} 
                    {...getSelectProps('contact')}
                  >
                    {phBarangays.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <select 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    {...getSelectProps('contact')}
                  >
                    {phCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select 
                    value={region} 
                    onChange={(e) => setRegion(e.target.value)} 
                    {...getSelectProps('contact')}
                  >
                    {phRegions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" {...getInputProps('contact', '1300')} placeholder="Zip Code" />
                </div>
              </div>
            </div>

            <div className="flex items-center pt-2">
              <label className="w-40 font-semibold text-slate-700">Mobile Number</label>
              <div className="w-48">
                <input type="text" {...getInputProps('contact', '09087161263')} />
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-40 font-semibold text-slate-700">Telephone Number</label>
              <div className="w-48">
                <input type="text" {...getInputProps('contact', '')} />
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-40 font-semibold text-slate-700">Email Address</label>
              <div className="w-72">
                <input type="text" {...getInputProps('contact', 'jeoffrey.balaga@paramount.com.ph')} />
              </div>
            </div>
          </div>
          <EditButton section="contact" />
        </div>

      </div>
    </div>
  );
}