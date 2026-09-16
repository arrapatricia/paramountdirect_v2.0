import React, { useState } from 'react';
import { UserCircle2, MapPin, Users, Wallet, ClipboardList, Briefcase } from 'lucide-react';
import {
  NotificationBanner, DetailHeader, StatusControl, Section, Field, FieldGrid, AddRowButton,
  editInputClass, editSelectClass, type NotificationState,
} from './application_detail_ui';
import { PD_LIFE_REFERRAL_SOURCES } from './pdlife_types';

interface Props {
  applicationId: string;
  planCode: string;
  initialStatus: string;
  onUpdateStatus: (status: string) => void;
  onBack: () => void;
  // Application Inquiry is a lookup view - opened from there, this page is
  // fully read-only (no status changes, no section editing).
  readOnly?: boolean;
}

export default function ApplicationDetailHealth({
  applicationId,
  planCode,
  initialStatus,
  onUpdateStatus,
  onBack,
  readOnly = false
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

  const [notification, setNotification] = useState<NotificationState>(null);

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [birthdate, setBirthdate] = useState('2007-02-01');

  const [region, setRegion] = useState('NCR');
  const [city, setCity] = useState('Pasay City');
  const [barangay, setBarangay] = useState('Barangay 101');

  const [insuredOption, setInsuredOption] = useState<'Individual' | 'Married Couple' | 'Family'>('Individual');
  const [isPayorSameAsInsured, setIsPayorSameAsInsured] = useState(true);
  const [mailToDifferentAddress, setMailToDifferentAddress] = useState(false);

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
    if (readOnly) return;
    setEditingSection(editingSection === section ? null : section);
  };

  const handleSelectStatus = (newStatus: string) => {
    setStatus(newStatus);
    setIsStatusMenuOpen(false);

    if (newStatus === 'Issued') {
      setSavedStatus('Issued');
      onUpdateStatus('Issued');
      setNotification({ type: 'success', message: 'The application has been successfully issued and transmitted to iPeak' });
    } else {
      setSavedStatus(newStatus);
      onUpdateStatus(newStatus);
      setNotification({ type: 'info', message: `The application is updated to ${newStatus}` });
    }

    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto font-sans text-slate-800 dark:text-slate-200">

      <NotificationBanner notification={notification} onDismiss={() => setNotification(null)} />

      <DetailHeader
        applicationId={applicationId}
        productName={productName}
        planCode={planCode}
        premium="Premium: ₱500.00"
        onBack={onBack}
        statusControl={
          <StatusControl
            status={status}
            savedStatus={savedStatus}
            isMenuOpen={isStatusMenuOpen}
            setIsMenuOpen={setIsStatusMenuOpen}
            statusOptions={statusOptions}
            onSelect={handleSelectStatus}
            locked={readOnly}
          />
        }
      />

      <div className="space-y-4 pb-10">

        {/* 1. General Details */}
        <Section icon={ClipboardList} title="General Details" isEditing={editingSection === 'general'} onToggleEdit={() => toggleEdit('general')} hideEditButton={readOnly}>
          <FieldGrid>
            <Field
              label="Campaign Source" editing={editingSection === 'general'} view="Facebook"
              edit={<select className={editSelectClass}>{PD_LIFE_REFERRAL_SOURCES.map(s => <option key={s}>{s}</option>)}</select>}
            />
            <Field
              label="Insured Option" editing={editingSection === 'general'} view={insuredOption}
              edit={
                <select value={insuredOption} onChange={(e) => setInsuredOption(e.target.value as typeof insuredOption)} className={editSelectClass}>
                  <option>Individual</option><option>Married Couple</option><option>Family</option>
                </select>
              }
            />
            <Field
              label="Plan" editing={editingSection === 'general'} view={`Plan 500 - ${insuredOption}`}
              edit={<select className={editSelectClass}><option>Plan 500 - {insuredOption}</option><option>Plan 1000 - {insuredOption}</option><option>Plan 2000 - {insuredOption}</option></select>}
            />
            <Field
              label="Payment Option" editing={editingSection === 'general'} view="Monthly"
              edit={<select className={editSelectClass}><option>Monthly</option><option>Quarterly</option><option>Semi-Annual</option><option>Annual</option></select>}
            />
          </FieldGrid>
        </Section>

        {/* 2. Personal Information */}
        <Section icon={UserCircle2} title="Personal Information" isEditing={editingSection === 'personal'} onToggleEdit={() => toggleEdit('personal')} hideEditButton={readOnly}>
          <Field
            label="Name" editing={editingSection === 'personal'} view="Paramount Life & General Insurance Corp"
            edit={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" defaultValue="Paramount" placeholder="First Name" className={editInputClass} />
                <input type="text" defaultValue="Life & General Insurance" placeholder="Middle Name" className={editInputClass} />
                <input type="text" defaultValue="Corp" placeholder="Last Name" className={editInputClass} />
              </div>
            }
          />

          <FieldGrid>
            <Field
              label="Title" editing={editingSection === 'personal'} view="Mr"
              edit={<select className={`${editSelectClass} max-w-[120px]`}><option>Mr</option><option>Ms</option><option>Mrs</option></select>}
            />

            <Field
              label="Birthdate" editing={editingSection === 'personal'}
              view={<span>{birthdate} <span className="ml-2 px-2 py-0.5 bg-red-50 border border-red-100 text-[#d0112b] font-black rounded-lg dark:bg-red-950/30 dark:border-red-900/40">{calculateAge(birthdate)} yrs</span></span>}
              edit={
                <div className="flex items-center space-x-4">
                  <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className={`w-48 ${editInputClass}`} />
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 font-semibold dark:text-slate-400">Current Age:</span>
                    <span className="px-3 py-1.5 bg-red-50 border border-red-100 text-[#d0112b] font-black rounded-lg dark:bg-red-950/30 dark:border-red-900/40">{calculateAge(birthdate)} yrs</span>
                  </div>
                </div>
              }
            />

            <Field
              label="Place Of Birth" editing={editingSection === 'personal'} view={null}
              edit={<input type="text" className={editInputClass} />}
            />

            <Field
              label="Nationality" editing={editingSection === 'personal'} view="Filipino"
              edit={<select className={`${editSelectClass} max-w-[192px]`}><option>Filipino</option></select>}
            />

            <Field
              label="Weight (kg)" editing={editingSection === 'personal'} view={null}
              edit={
                <div className="w-48 relative">
                  <input type="number" className={editInputClass} />
                  <span className="absolute right-3 top-2 text-slate-400 font-medium dark:text-slate-500">kg</span>
                </div>
              }
            />
            <Field
              label="Height (cm)" editing={editingSection === 'personal'} view={null}
              edit={
                <div className="w-48 relative">
                  <input type="number" className={editInputClass} />
                  <span className="absolute right-3 top-2 text-slate-400 font-medium dark:text-slate-500">cm</span>
                </div>
              }
            />
          </FieldGrid>
        </Section>

        {/* 2b. Employment Information */}
        <Section icon={Briefcase} title="Employment Information" isEditing={editingSection === 'employment'} onToggleEdit={() => toggleEdit('employment')} hideEditButton={readOnly}>
          <FieldGrid>
            <Field label="Occupation" editing={editingSection === 'employment'} view={null} edit={<input type="text" className={editInputClass} />} />
            <Field label="Office address" editing={editingSection === 'employment'} view={null} edit={<input type="text" className={editInputClass} />} />
            <Field label="Zipcode" editing={editingSection === 'employment'} view={null} edit={<input type="text" className={`w-48 ${editInputClass}`} />} />
            <Field
              label="Office Tel. No." editing={editingSection === 'employment'} view={null}
              edit={
                <div className="flex items-center space-x-2">
                  <input type="text" placeholder="Area Code" className={`w-20 ${editInputClass}`} />
                  <input type="text" placeholder="Phone number" className={`w-32 ${editInputClass}`} />
                </div>
              }
            />
          </FieldGrid>
        </Section>

        {/* 3. Contact Information */}
        <Section icon={MapPin} title="Contact Information" isEditing={editingSection === 'contact'} onToggleEdit={() => toggleEdit('contact')} hideEditButton={readOnly}>
          <Field
            label="Address" editing={editingSection === 'contact'} align="start"
            view={`12313 1231, ${barangay}, ${city}, ${region} 1300`}
            edit={
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" defaultValue="12313" placeholder="Unit / House No." className={editInputClass} />
                  <input type="text" defaultValue="1231" placeholder="Street" className={editInputClass} />
                  <input type="text" placeholder="Building Name (Optional)" className={editInputClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select value={barangay} onChange={(e) => setBarangay(e.target.value)} className={editSelectClass}>{phBarangays.map(b => <option key={b} value={b}>{b}</option>)}</select>
                  <select value={city} onChange={(e) => setCity(e.target.value)} className={editSelectClass}>{phCities.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  <select value={region} onChange={(e) => setRegion(e.target.value)} className={editSelectClass}>{phRegions.map(r => <option key={r} value={r}>{r}</option>)}</select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" defaultValue="1300" placeholder="Zip Code" className={editInputClass} />
                </div>
              </div>
            }
          />

          <FieldGrid>
            <Field label="Mobile Number" editing={editingSection === 'contact'} view="09087161263" edit={<input type="text" defaultValue="09087161263" className={`w-48 ${editInputClass}`} />} />
            <Field label="Telephone Number" editing={editingSection === 'contact'} view={null} edit={<input type="text" className={`w-48 ${editInputClass}`} />} />
            <Field label="Email Address" editing={editingSection === 'contact'} view="jeoffrey.balaga@paramount.com.ph" edit={<input type="text" defaultValue="jeoffrey.balaga@paramount.com.ph" className={`w-72 ${editInputClass}`} />} />
          </FieldGrid>

          <label className="flex items-center space-x-2 text-slate-700 font-semibold dark:text-slate-300">
            <input
              type="checkbox"
              checked={mailToDifferentAddress}
              onChange={(e) => setMailToDifferentAddress(e.target.checked)}
              disabled={editingSection !== 'contact'}
              className="w-3.5 h-3.5 accent-[#008cb4] rounded"
            />
            <span>Mail to a different address?</span>
          </label>
          {mailToDifferentAddress && (
            <Field
              label="Mailing Address" editing={editingSection === 'contact'} align="start" view={null}
              edit={
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="Unit / House No." className={editInputClass} />
                    <input type="text" placeholder="Street" className={editInputClass} />
                    <input type="text" placeholder="Building Name (Optional)" className={editInputClass} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select className={editSelectClass}>{phBarangays.map(b => <option key={b} value={b}>{b}</option>)}</select>
                    <select className={editSelectClass}>{phCities.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <select className={editSelectClass}>{phRegions.map(r => <option key={r} value={r}>{r}</option>)}</select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="Zip Code" className={editInputClass} />
                  </div>
                </div>
              }
            />
          )}
        </Section>

        {/* 4. Persons to be Insured (Married Couple / Family only) */}
        {insuredOption !== 'Individual' && (
          <Section icon={Users} title="Persons to be Insured" isEditing={editingSection === 'otherInfo'} onToggleEdit={() => toggleEdit('otherInfo')} hideEditButton={readOnly}>
            {insuredOption === 'Family' && (
              <Field
                label="Include spouse?" editing={editingSection === 'otherInfo'} view="No"
                edit={<select className={`${editSelectClass} max-w-[100px]`}><option>No</option><option>Yes</option></select>}
              />
            )}
            <div className="flex items-center text-slate-400 font-extrabold uppercase text-[10px] tracking-wide pt-2 dark:text-slate-500">
              <div className="flex-1 px-1">Full Name</div><div className="w-48 px-1">Birthdate</div><div className="w-48 px-1">Relationship</div>
            </div>
            <div className="flex items-center">
              <div className="flex-1 px-1">{editingSection === 'otherInfo' ? <input type="text" placeholder="Full Name" className={editInputClass} /> : <span className="text-slate-300 dark:text-slate-700">&mdash;</span>}</div>
              <div className="w-48 px-1">{editingSection === 'otherInfo' ? <input type="date" className={editInputClass} /> : null}</div>
              <div className="w-48 px-1">{editingSection === 'otherInfo' ? <select className={editSelectClass}><option>Spouse</option><option>Child</option></select> : null}</div>
            </div>
            {insuredOption === 'Family' && (
              <div className="pt-2"><AddRowButton label="Add Child" disabled={editingSection !== 'otherInfo'} /></div>
            )}
          </Section>
        )}

        {/* 5. Payor Information */}
        <Section icon={Wallet} title="Payor Information" isEditing={editingSection === 'payor'} onToggleEdit={() => toggleEdit('payor')} hideEditButton={readOnly}>
          <label className="flex items-center space-x-2 text-slate-700 font-semibold dark:text-slate-300">
            <input
              type="checkbox"
              checked={isPayorSameAsInsured}
              onChange={(e) => setIsPayorSameAsInsured(e.target.checked)}
              disabled={editingSection !== 'payor'}
              className="w-3.5 h-3.5 accent-[#008cb4] rounded"
            />
            <span>Is Payor the same with the Insured?</span>
          </label>
          {!isPayorSameAsInsured && (
            <>
              <Field
                label="Name" editing={editingSection === 'payor'} view={null}
                edit={
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="First Name" className={editInputClass} />
                    <input type="text" placeholder="Middle Name (Optional)" className={editInputClass} />
                    <input type="text" placeholder="Last Name" className={editInputClass} />
                  </div>
                }
              />
              <FieldGrid>
                <Field label="Contact Number" editing={editingSection === 'payor'} view={null} edit={<input type="text" className={`w-48 ${editInputClass}`} />} />
                <Field label="Email Address" editing={editingSection === 'payor'} view={null} edit={<input type="text" className={`w-72 ${editInputClass}`} />} />
                <Field
                  label="Relationship" editing={editingSection === 'payor'} view={null}
                  edit={
                    <select className={`${editSelectClass} max-w-xs`}>
                      <option>Aunt</option><option>Child</option><option>Common Law Partner</option>
                      <option>Cousin</option><option>Employer</option><option>Granddaughter</option>
                      <option>Grandparent</option><option>Grandson</option><option>In-Law</option>
                      <option>Nephew</option><option>Niece</option><option>Other</option>
                      <option>Parent</option><option>Sibling</option><option>Spouse</option><option>Uncle</option>
                    </select>
                  }
                />
              </FieldGrid>
            </>
          )}
        </Section>

      </div>
    </div>
  );
}
