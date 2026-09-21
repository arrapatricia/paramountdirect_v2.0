import React, { useState } from 'react';
import { UserCircle2, MapPin, Users, Wallet, ClipboardList, Briefcase } from 'lucide-react';
import {
  NotificationBanner, DetailHeader, StatusControl, Section, Field, FieldGrid, AddRowButton,
  editInputClass, editSelectClass, type NotificationState,
} from './application_detail_ui';
import {
  PD_LIFE_REFERRAL_SOURCES,
  type PolicyOwnerInfo, type ContactInfo, type PayorInfo, type HealthDetails,
} from './pdlife_types';

interface Props {
  applicationId: string;
  planCode: string;
  initialStatus: string;
  onUpdateStatus: (status: string) => void;
  onBack: () => void;
  // Application Inquiry is a lookup view - opened from there, this page is
  // fully read-only (no status changes, no section editing).
  readOnly?: boolean;
  // The application's actual submitted data - see pdlife_types.ts's
  // PdLifeApplicationDetails.
  payor: string;
  premium: string;
  source: string;
  planDesc: string;
  details: Record<string, unknown>;
}

export default function ApplicationDetailHealth({
  applicationId,
  planCode,
  initialStatus,
  onUpdateStatus,
  onBack,
  readOnly = false,
  premium,
  source,
  planDesc,
  details,
}: Props) {
  const productNames: Record<string, string> = {
    'HCP': 'HealthCare Cash Plan',
    'HIP': 'Hospital Income Benefit Plan',
    'PCP': 'PrimeCare Cash Plan',
    'PHC': 'Premium HealthCare Plus Plan'
  };
  const productName = productNames[planCode] || 'Health Plan';

  const owner = (details?.policyOwner ?? {}) as Partial<PolicyOwnerInfo>;
  const contact = (details?.contact ?? {}) as Partial<ContactInfo>;
  const payorInfo = (details?.payor ?? {}) as Partial<PayorInfo>;
  const cat = (details?.category ?? {}) as Partial<HealthDetails>;
  const fullName = [owner.firstName, owner.middleName, owner.lastName].filter(Boolean).join(' ');
  const fullAddress = [contact.houseNumber, contact.street, contact.building, contact.barangay, contact.city, contact.region, contact.zipcode]
    .filter(Boolean).join(', ');

  const [status, setStatus] = useState(initialStatus);
  const [savedStatus, setSavedStatus] = useState(initialStatus);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusOptions = ['For Verification', 'For Evaluation', 'Paid', 'Issued'];

  const [notification, setNotification] = useState<NotificationState>(null);

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [birthdate, setBirthdate] = useState(owner.birthdate ?? '');

  const [region, setRegion] = useState(contact.region ?? 'NCR');
  const [city, setCity] = useState(contact.city ?? 'Pasay City');
  const [barangay, setBarangay] = useState(contact.barangay ?? 'Barangay 101');

  const [insuredOption, setInsuredOption] = useState<'Individual' | 'Married Couple' | 'Family'>(cat.insuredOption ?? 'Individual');
  const [isPayorSameAsInsured, setIsPayorSameAsInsured] = useState(payorInfo.sameAsInsured ?? true);
  const [mailToDifferentAddress, setMailToDifferentAddress] = useState(false);

  const phRegions = Array.from(new Set(['NCR', 'Region III', 'Region IV-A', region]));
  const phCities = Array.from(new Set(['Pasay City', 'Makati City', 'Manila City', 'Quezon City', city]));
  const phBarangays = Array.from(new Set(['Barangay 101', 'Barangay 102', 'Barangay 103', barangay]));

  const calculateAge = (dobString: string) => {
    if (!dobString) return '--';
    const dob = new Date(dobString);
    const today = new Date();
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
        premium={`Premium: ₱${premium.replace(/^₱/, '')}`}
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
              label="Campaign Source" editing={editingSection === 'general'} view={source}
              edit={<select className={editSelectClass} defaultValue={source}>{PD_LIFE_REFERRAL_SOURCES.map(s => <option key={s}>{s}</option>)}</select>}
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
              label="Plan" editing={editingSection === 'general'} view={planDesc}
              edit={<select className={editSelectClass} defaultValue={planDesc}><option>{planDesc}</option></select>}
            />
            <Field
              label="Payment Option" editing={editingSection === 'general'} view={cat.paymentOption ?? null}
              edit={<select className={editSelectClass} defaultValue={cat.paymentOption}><option>Monthly</option><option>Quarterly</option><option>Semi-Annual</option><option>Annual</option></select>}
            />
          </FieldGrid>
        </Section>

        {/* 2. Personal Information */}
        <Section icon={UserCircle2} title="Personal Information" isEditing={editingSection === 'personal'} onToggleEdit={() => toggleEdit('personal')} hideEditButton={readOnly}>
          <Field
            label="Name" editing={editingSection === 'personal'} view={fullName || null}
            edit={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" defaultValue={owner.firstName ?? ''} placeholder="First Name" className={editInputClass} />
                <input type="text" defaultValue={owner.middleName ?? ''} placeholder="Middle Name" className={editInputClass} />
                <input type="text" defaultValue={owner.lastName ?? ''} placeholder="Last Name" className={editInputClass} />
              </div>
            }
          />

          <FieldGrid>
            <Field
              label="Title" editing={editingSection === 'personal'} view={owner.title ?? null}
              edit={<select className={`${editSelectClass} max-w-[120px]`} defaultValue={owner.title}><option>Mr.</option><option>Ms.</option><option>Mrs.</option></select>}
            />

            <Field
              label="Birthdate" editing={editingSection === 'personal'}
              view={birthdate ? <span>{birthdate} <span className="ml-2 px-2 py-0.5 bg-red-50 border border-red-100 text-[#d0112b] font-black rounded-lg dark:bg-red-950/30 dark:border-red-900/40">{calculateAge(birthdate)} yrs</span></span> : null}
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
              label="Place Of Birth" editing={editingSection === 'personal'} view={owner.placeOfBirth ?? null}
              edit={<input type="text" defaultValue={owner.placeOfBirth ?? ''} className={editInputClass} />}
            />

            <Field
              label="Nationality" editing={editingSection === 'personal'} view={owner.nationality ?? null}
              edit={<select className={`${editSelectClass} max-w-[192px]`} defaultValue={owner.nationality}><option>Filipino</option><option>American</option><option>Chinese</option><option>Japanese</option><option>Korean</option><option>Others</option></select>}
            />

            <Field
              label="Weight (kg)" editing={editingSection === 'personal'} view={cat.weightKg ?? null}
              edit={
                <div className="w-48 relative">
                  <input type="number" defaultValue={cat.weightKg ?? ''} className={editInputClass} />
                  <span className="absolute right-3 top-2 text-slate-400 font-medium dark:text-slate-500">kg</span>
                </div>
              }
            />
            <Field
              label="Height (cm)" editing={editingSection === 'personal'} view={cat.heightCm ?? null}
              edit={
                <div className="w-48 relative">
                  <input type="number" defaultValue={cat.heightCm ?? ''} className={editInputClass} />
                  <span className="absolute right-3 top-2 text-slate-400 font-medium dark:text-slate-500">cm</span>
                </div>
              }
            />
          </FieldGrid>
        </Section>

        {/* 2b. Employment Information */}
        <Section icon={Briefcase} title="Employment Information" isEditing={editingSection === 'employment'} onToggleEdit={() => toggleEdit('employment')} hideEditButton={readOnly}>
          <FieldGrid>
            <Field label="Occupation" editing={editingSection === 'employment'} view={cat.occupation ?? null} edit={<input type="text" defaultValue={cat.occupation ?? ''} className={editInputClass} />} />
            <Field label="Office address" editing={editingSection === 'employment'} view={cat.officeAddress ?? null} edit={<input type="text" defaultValue={cat.officeAddress ?? ''} className={editInputClass} />} />
            <Field label="Zipcode" editing={editingSection === 'employment'} view={cat.officeZipcode ?? null} edit={<input type="text" defaultValue={cat.officeZipcode ?? ''} className={`w-48 ${editInputClass}`} />} />
            <Field
              label="Office Tel. No." editing={editingSection === 'employment'} view={cat.officeTelephone ?? null}
              edit={
                <div className="flex items-center space-x-2">
                  <input type="text" defaultValue={cat.officeTelephone ?? ''} placeholder="Phone number" className={`w-32 ${editInputClass}`} />
                </div>
              }
            />
          </FieldGrid>
        </Section>

        {/* 3. Contact Information */}
        <Section icon={MapPin} title="Contact Information" isEditing={editingSection === 'contact'} onToggleEdit={() => toggleEdit('contact')} hideEditButton={readOnly}>
          <Field
            label="Address" editing={editingSection === 'contact'} align="start"
            view={fullAddress || null}
            edit={
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" defaultValue={contact.houseNumber ?? ''} placeholder="Unit / House No." className={editInputClass} />
                  <input type="text" defaultValue={contact.street ?? ''} placeholder="Street" className={editInputClass} />
                  <input type="text" defaultValue={contact.building ?? ''} placeholder="Building Name (Optional)" className={editInputClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select value={barangay} onChange={(e) => setBarangay(e.target.value)} className={editSelectClass}>{phBarangays.map(b => <option key={b} value={b}>{b}</option>)}</select>
                  <select value={city} onChange={(e) => setCity(e.target.value)} className={editSelectClass}>{phCities.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  <select value={region} onChange={(e) => setRegion(e.target.value)} className={editSelectClass}>{phRegions.map(r => <option key={r} value={r}>{r}</option>)}</select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" defaultValue={contact.zipcode ?? ''} placeholder="Zip Code" className={editInputClass} />
                </div>
              </div>
            }
          />

          <FieldGrid>
            <Field label="Mobile Number" editing={editingSection === 'contact'} view={contact.mobileNumber ?? null} edit={<input type="text" defaultValue={contact.mobileNumber ?? ''} className={`w-48 ${editInputClass}`} />} />
            <Field label="Telephone Number" editing={editingSection === 'contact'} view={contact.telephoneNumber ?? null} edit={<input type="text" defaultValue={contact.telephoneNumber ?? ''} className={`w-48 ${editInputClass}`} />} />
            <Field label="Email Address" editing={editingSection === 'contact'} view={contact.email ?? null} edit={<input type="text" defaultValue={contact.email ?? ''} className={`w-72 ${editInputClass}`} />} />
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
                label="Include spouse?" editing={editingSection === 'otherInfo'} view={cat.hasLegalSpouse ? 'Yes' : 'No'}
                edit={<select className={`${editSelectClass} max-w-[100px]`} defaultValue={cat.hasLegalSpouse ? 'Yes' : 'No'}><option>No</option><option>Yes</option></select>}
              />
            )}
            <div className="flex items-center text-slate-400 font-extrabold uppercase text-[10px] tracking-wide pt-2 dark:text-slate-500">
              <div className="flex-1 px-1">Full Name</div><div className="w-48 px-1">Birthdate</div><div className="w-48 px-1">Relationship</div>
            </div>
            {(cat.children ?? []).length === 0 ? (
              <p className="text-slate-300 dark:text-slate-700 text-xs">No additional persons added.</p>
            ) : (cat.children ?? []).map((child, idx) => (
              <div className="flex items-center" key={idx}>
                <div className="flex-1 px-1">{editingSection === 'otherInfo' ? <input type="text" defaultValue={child.fullName} placeholder="Full Name" className={editInputClass} /> : <span className="text-xs font-bold text-slate-900 dark:text-white">{child.fullName}</span>}</div>
                <div className="w-48 px-1">{editingSection === 'otherInfo' ? <input type="date" defaultValue={child.birthdate} className={editInputClass} /> : <span className="text-xs font-bold text-slate-900 dark:text-white">{child.birthdate}</span>}</div>
                <div className="w-48 px-1">{editingSection === 'otherInfo' ? <select className={editSelectClass} defaultValue={child.relationship}><option>Spouse</option><option>Child</option></select> : <span className="text-xs font-bold text-slate-900 dark:text-white">{child.relationship}</span>}</div>
              </div>
            ))}
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
                label="Name" editing={editingSection === 'payor'} view={payorInfo.name || null}
                edit={<input type="text" defaultValue={payorInfo.name ?? ''} placeholder="Full Name" className={editInputClass} />}
              />
              <FieldGrid>
                <Field label="Contact Number" editing={editingSection === 'payor'} view={payorInfo.contactNumber ?? null} edit={<input type="text" defaultValue={payorInfo.contactNumber ?? ''} className={`w-48 ${editInputClass}`} />} />
                <Field label="Email Address" editing={editingSection === 'payor'} view={payorInfo.email ?? null} edit={<input type="text" defaultValue={payorInfo.email ?? ''} className={`w-72 ${editInputClass}`} />} />
                <Field
                  label="Relationship" editing={editingSection === 'payor'} view={payorInfo.relationship ?? null}
                  edit={
                    <select className={`${editSelectClass} max-w-xs`} defaultValue={payorInfo.relationship}>
                      <option>Aunt</option><option>Brother</option><option>Cousin</option><option>Daughter</option>
                      <option>Father</option><option>Grandfather</option><option>Grandmother</option><option>Husband</option>
                      <option>Mother</option><option>Nephew</option><option>Niece</option><option>Sister</option>
                      <option>Son</option><option>Uncle</option><option>Wife</option><option>Others</option>
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
