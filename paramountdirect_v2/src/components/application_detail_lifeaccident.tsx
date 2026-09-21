import { useState } from 'react';
import { ClipboardList, UserCircle2, MapPin, Users, ShieldQuestion, FileWarning, Wallet, Briefcase } from 'lucide-react';
import {
  NotificationBanner, DetailHeader, StatusControl, IssueConfirmModal, Section, Field, FieldGrid, AddRowButton,
  editInputClass, editSelectClass, type NotificationState,
} from './application_detail_ui';
import {
  PD_LIFE_REFERRAL_SOURCES,
  type PolicyOwnerInfo, type ContactInfo, type PayorInfo, type LifeAccidentDetails,
} from './pdlife_types';

interface Props {
  applicationId: string;
  planCode: string;
  initialStatus: string;
  onUpdateStatus: (status: string) => void;
  // Reported once the screener confirms whether the client's application
  // form was already signed at the moment of issuance - see IssueConfirmModal.
  onIssueDecision?: (signed: boolean) => void;
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

export default function ApplicationDetailLifeAccident({
  applicationId,
  planCode,
  initialStatus,
  onUpdateStatus,
  onIssueDecision,
  onBack,
  readOnly = false,
  premium,
  source,
  planDesc,
  details,
}: Props) {
  // Map Plan Code to Life & Accident Product Name
  const productNames: Record<string, string> = {
    'GLP': 'Guaranteed Life Plan',
    'GLA': 'Golden Life Advantage Plan',
    'GPR': 'Go Protect Plan'
  };
  const productName = productNames[planCode] || 'Life & Accident Plan';

  const owner = (details?.policyOwner ?? {}) as Partial<PolicyOwnerInfo>;
  const contact = (details?.contact ?? {}) as Partial<ContactInfo>;
  const payorInfo = (details?.payor ?? {}) as Partial<PayorInfo>;
  const cat = (details?.category ?? {}) as Partial<LifeAccidentDetails>;
  const fullName = [owner.firstName, owner.middleName, owner.lastName].filter(Boolean).join(' ');
  const fullAddress = [contact.houseNumber, contact.street, contact.building, contact.barangay, contact.city, contact.region, contact.zipcode]
    .filter(Boolean).join(', ');

  // Status Tracking
  const [status, setStatus] = useState(initialStatus);
  const [savedStatus, setSavedStatus] = useState(initialStatus);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusOptions = ['For Verification', 'For Evaluation', 'Paid', 'Issued'];

  // Notification Prompt State
  const [notification, setNotification] = useState<NotificationState>(null);

  // Issuance Signature Gate - selecting "Issued" from the status menu opens
  // this instead of committing immediately; the status change and the
  // signed/unsigned decision are only applied together on confirm.
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [pendingIssueSigned, setPendingIssueSigned] = useState<boolean | null>(null);

  // Edit Mode Tracking
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Date and Age Tracking - seeded from the real submitted birthdate.
  const [birthdate, setBirthdate] = useState(owner.birthdate ?? '');

  const [hasOtherLifeInsurance, setHasOtherLifeInsurance] = useState(cat.hasExistingPolicy ?? false);
  const [intendsToReplace, setIntendsToReplace] = useState(cat.intendsToReplaceExistingPolicy ?? false);
  const [isPayorSameAsInsured, setIsPayorSameAsInsured] = useState(payorInfo.sameAsInsured ?? true);
  const [mailToDifferentAddress, setMailToDifferentAddress] = useState(false);

  // Philippine Geo Tracking - seeded from the real submitted address.
  const [region, setRegion] = useState(contact.region ?? 'CAR');
  const [city, setCity] = useState(contact.city ?? 'Bangued');
  const [barangay, setBarangay] = useState(contact.barangay ?? 'Agtangao');

  const phRegions = Array.from(new Set(['NCR', 'CAR', 'Region III', region]));
  const phCities = Array.from(new Set(['Bangued', 'Makati City', 'Manila City', city]));
  const phBarangays = Array.from(new Set(['Agtangao', 'Barangay 101', 'Barangay 102', barangay]));

  // Calculate age as of today from a yyyy-mm-dd birthdate.
  const calculateAge = (dobString: string) => {
    if (!dobString) return '--';
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const toggleEdit = (section: string) => {
    if (readOnly) return;
    setEditingSection(editingSection === section ? null : section);
  };

  // Immediate Status Update & Notification Trigger Handler
  const handleSelectStatus = (newStatus: string) => {
    setIsStatusMenuOpen(false);

    if (newStatus === 'Issued') {
      // Deferred to confirmIssue - the screener must record Signed/Unsigned
      // before the status change actually commits.
      setPendingIssueSigned(null);
      setShowIssueModal(true);
      return;
    }

    setStatus(newStatus);
    setSavedStatus(newStatus);
    onUpdateStatus(newStatus);
    setNotification({
      type: 'info',
      message: `The application is updated to ${newStatus}`
    });

    // Auto-dismiss banner after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const confirmIssue = () => {
    if (pendingIssueSigned === null) return;
    setShowIssueModal(false);

    const simulateError = false; // Set to true to simulate issuance error
    if (simulateError) {
      setNotification({
        type: 'error',
        message: 'There is an error upon issuance of application.'
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    setStatus('Issued');
    setSavedStatus('Issued');
    onUpdateStatus('Issued');
    onIssueDecision?.(pendingIssueSigned);
    setNotification({
      type: 'success',
      message: 'The application has been successfully issued and transmitted to iPeak'
    });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto font-sans text-slate-800 dark:text-slate-200">

      <NotificationBanner notification={notification} onDismiss={() => setNotification(null)} />

      {showIssueModal && (
        <IssueConfirmModal
          signed={pendingIssueSigned}
          onSelectSigned={setPendingIssueSigned}
          onConfirm={confirmIssue}
          onCancel={() => setShowIssueModal(false)}
        />
      )}

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

      {/* Main Form Content */}
      <div className="space-y-4 pb-10">

        {/* 1. General Details */}
        <Section icon={ClipboardList} title="General Details" isEditing={editingSection === 'general'} onToggleEdit={() => toggleEdit('general')} hideEditButton={readOnly}>
          <FieldGrid>
            <Field
              label="Campaign Source" editing={editingSection === 'general'} view={source}
              edit={<select className={editSelectClass} defaultValue={source}>{PD_LIFE_REFERRAL_SOURCES.map(s => <option key={s}>{s}</option>)}</select>}
            />
            <Field
              label="Plan" editing={editingSection === 'general'} view={cat.units ? `${cat.units} Unit(s)` : planDesc}
              edit={<select className={editSelectClass}><option>{cat.units ? `${cat.units} Unit(s)` : planDesc}</option></select>}
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
                <input type="text" defaultValue={owner.middleName ?? ''} placeholder="Middle Name (Optional)" className={editInputClass} />
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
                    <span className="text-slate-500 font-semibold dark:text-slate-400">Age:</span>
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

        {/* 4. Beneficiaries */}
        <Section icon={Users} title="Beneficiaries" isEditing={editingSection === 'beneficiaries'} onToggleEdit={() => toggleEdit('beneficiaries')} hideEditButton={readOnly}>
          <div className="flex items-center text-slate-400 font-extrabold uppercase text-[10px] tracking-wide dark:text-slate-500">
            <div className="flex-1 px-1">Full Name</div><div className="w-48 px-1">Relationship to you</div><div className="w-48 px-1">Birthdate</div><div className="w-32 px-1">Revocable?</div>
          </div>
          {(cat.beneficiaries ?? []).length === 0 ? (
            <p className="text-slate-300 dark:text-slate-700 text-xs">No beneficiaries added.</p>
          ) : (cat.beneficiaries ?? []).map((b, idx) => (
            <div className="flex items-center" key={idx}>
              <div className="flex-1 px-1">
                {editingSection === 'beneficiaries'
                  ? <input type="text" defaultValue={b.fullName} className={editInputClass} />
                  : <span className="text-xs font-bold text-slate-900 dark:text-white">{b.fullName}</span>}
              </div>
              <div className="w-48 px-1">
                {editingSection === 'beneficiaries' ? (
                  <select className={editSelectClass} defaultValue={b.relationship}>
                    <option>Aunt</option><option>Brother</option><option>Cousin</option><option>Daughter</option>
                    <option>Father</option><option>Grandfather</option><option>Grandmother</option><option>Husband</option>
                    <option>Mother</option><option>Nephew</option><option>Niece</option><option>Sister</option>
                    <option>Son</option><option>Uncle</option><option>Wife</option><option>Others</option>
                  </select>
                ) : <span className="text-xs font-bold text-slate-900 dark:text-white">{b.relationship}</span>}
              </div>
              <div className="w-48 px-1">
                {editingSection === 'beneficiaries'
                  ? <input type="date" defaultValue={b.birthdate} className={editInputClass} />
                  : <span className="text-xs font-bold text-slate-900 dark:text-white">{b.birthdate || <span className="text-slate-300 dark:text-slate-700">&mdash;</span>}</span>}
              </div>
              <div className="w-32 px-1">
                {editingSection === 'beneficiaries' ? (
                  <select className={editSelectClass} defaultValue={b.revocable ? 'Revocable' : 'Irrevocable'}><option>Revocable</option><option>Irrevocable</option></select>
                ) : <span className="text-xs font-bold text-slate-900 dark:text-white">{b.revocable ? 'Revocable' : 'Irrevocable'}</span>}
              </div>
            </div>
          ))}
          <div className="pt-2"><AddRowButton label="Add Beneficiary" disabled={editingSection !== 'beneficiaries'} /></div>
        </Section>

        {/* 5. Non-forfeiture Options */}
        <Section icon={ShieldQuestion} title="Non-forfeiture Options" isEditing={editingSection === 'forfeiture'} onToggleEdit={() => toggleEdit('forfeiture')} hideEditButton={readOnly}>
          <p className="text-slate-600 font-medium dark:text-slate-300">If premium is unpaid on expiry of grace period, apply cash value, if any, to effect:</p>
          {editingSection === 'forfeiture' ? (
            <select className={`${editSelectClass} max-w-xs`} defaultValue={cat.nonForfeitureOption}>
              <option>Paid-up Insurance</option>
              <option>Automatic Payment of Premium</option>
              <option>Cash Surrender</option>
            </select>
          ) : (
            <span className="text-xs font-bold text-slate-900 dark:text-white">{cat.nonForfeitureOption ?? <span className="text-slate-300 dark:text-slate-700 font-normal">&mdash;</span>}</span>
          )}
        </Section>

        {/* 6. Declaration on Existing Policies */}
        <Section icon={FileWarning} title="Declaration on Existing Policy(ies)" isEditing={editingSection === 'declaration'} onToggleEdit={() => toggleEdit('declaration')} hideEditButton={readOnly}>
          <div className="flex items-center space-x-4">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Do you have other life insurance policies inforce with other insurance companies?</label>
            {editingSection === 'declaration' ? (
              <select
                value={hasOtherLifeInsurance ? 'Yes' : 'No'}
                onChange={(e) => setHasOtherLifeInsurance(e.target.value === 'Yes')}
                className={`${editSelectClass} max-w-[100px]`}
              >
                <option>No</option><option>Yes</option>
              </select>
            ) : (
              <span className="text-xs font-bold text-slate-900 dark:text-white">{hasOtherLifeInsurance ? 'Yes' : 'No'}</span>
            )}
          </div>
          {hasOtherLifeInsurance && (
            <Field
              label="If yes, please provide details" editing={editingSection === 'declaration'} align="start" view={cat.existingPolicyDetails ?? null}
              edit={<textarea rows={2} defaultValue={cat.existingPolicyDetails ?? ''} className={editInputClass} />}
            />
          )}
          <div className="flex items-center space-x-4">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Is the policy applied for intended to change or replace any existing inforce policies?</label>
            {editingSection === 'declaration' ? (
              <select
                value={intendsToReplace ? 'Yes' : 'No'}
                onChange={(e) => setIntendsToReplace(e.target.value === 'Yes')}
                className={`${editSelectClass} max-w-[100px]`}
              >
                <option>No</option><option>Yes</option>
              </select>
            ) : (
              <span className="text-xs font-bold text-slate-900 dark:text-white">{intendsToReplace ? 'Yes' : 'No'}</span>
            )}
          </div>
        </Section>

        {/* 7. Payor Information */}
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
