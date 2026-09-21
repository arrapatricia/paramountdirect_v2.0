import { useState } from 'react';
import { ClipboardList, UserCircle2, MapPin, Briefcase, Users, ShieldQuestion, FileWarning, ListChecks, Wallet, Stethoscope } from 'lucide-react';
import {
  NotificationBanner, DetailHeader, StatusControl, Section, Field, FieldGrid, AddRowButton,
  editInputClass, editSelectClass, type NotificationState,
} from './application_detail_ui';
import {
  PD_LIFE_REFERRAL_SOURCES,
  type PolicyOwnerInfo, type ContactInfo, type PayorInfo, type ComprehensiveDetails,
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
  // PdLifeApplicationDetails. Loosely typed since it comes straight off the
  // backend's Json column; narrowed defensively below.
  payor: string;
  premium: string;
  source: string;
  planDesc: string;
  details: Record<string, unknown>;
}

export default function ApplicationDetailComprehensive({
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
  const owner = (details?.policyOwner ?? {}) as Partial<PolicyOwnerInfo>;
  const contact = (details?.contact ?? {}) as Partial<ContactInfo>;
  const payorInfo = (details?.payor ?? {}) as Partial<PayorInfo>;
  const cat = (details?.category ?? {}) as Partial<ComprehensiveDetails>;
  const fullName = [owner.firstName, owner.middleName, owner.lastName].filter(Boolean).join(' ');
  const fullAddress = [contact.houseNumber, contact.street, contact.building, contact.barangay, contact.city, contact.region, contact.zipcode]
    .filter(Boolean).join(', ');
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

  // Notification Prompt State
  const [notification, setNotification] = useState<NotificationState>(null);

  // Edit Mode Tracking
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Date Tracking - seeded from the real submitted birthdate.
  const [birthdate, setBirthdate] = useState(owner.birthdate ?? '');

  const [hasOtherLifeInsurance, setHasOtherLifeInsurance] = useState(cat.hasExistingPolicy ?? false);
  const [intendsToReplace, setIntendsToReplace] = useState(cat.intendsToReplaceExistingPolicy ?? false);
  const [isPayorSameAsInsured, setIsPayorSameAsInsured] = useState(payorInfo.sameAsInsured ?? true);
  const [mailToDifferentAddress, setMailToDifferentAddress] = useState(false);
  const [medicalAnswers, setMedicalAnswers] = useState({
    consulted: cat.medicalQuestionnaire?.consultedDoctorPast5Years ?? false,
    advised: cat.medicalQuestionnaire?.advisedOfSeriousCondition ?? false,
    impairment: cat.medicalQuestionnaire?.awareOfImpairment ?? false,
  });

  // Philippine Geo Tracking - seeded from the real submitted address; the
  // option lists are still a placeholder subset (see pdlife_create_application.tsx),
  // not the full PH geography, so the real value is included even if not in the list.
  const [region, setRegion] = useState(contact.region ?? 'NCR');
  const [city, setCity] = useState(contact.city ?? 'Manila City');
  const [barangay, setBarangay] = useState(contact.barangay ?? 'Barangay 101');

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
    setStatus(newStatus);
    setIsStatusMenuOpen(false);

    const simulateError = false; // Toggle to true to test issuance error prompt

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

        {/* General Details */}
        <Section icon={ClipboardList} title="General Details" isEditing={editingSection === 'general'} onToggleEdit={() => toggleEdit('general')} hideEditButton={readOnly}>
          <FieldGrid>
            <Field
              label="Campaign Source" editing={editingSection === 'general'} view={source}
              edit={<select className={editSelectClass} defaultValue={source}>{PD_LIFE_REFERRAL_SOURCES.map(s => <option key={s}>{s}</option>)}</select>}
            />
            <Field
              label="Plan" editing={editingSection === 'general'} view={planDesc}
              edit={<select className={editSelectClass} defaultValue={planDesc}><option>{planDesc}</option></select>}
            />
            <Field
              label="Payment Option" editing={editingSection === 'general'} view={null}
              edit={<select className={editSelectClass}><option>Monthly</option></select>}
            />
          </FieldGrid>
        </Section>

        {/* Personal Information */}
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
              edit={<select className={`${editSelectClass} max-w-[120px]`} defaultValue={owner.title}><option>Ms.</option><option>Mr.</option><option>Mrs.</option></select>}
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
              label="Nationality" editing={editingSection === 'personal'} view={owner.nationality ?? null}
              edit={<select className={`${editSelectClass} max-w-[192px]`} defaultValue={owner.nationality}><option>Filipino</option><option>American</option><option>Chinese</option><option>Japanese</option><option>Korean</option><option>Others</option></select>}
            />

            <Field
              label="Place Of Birth" editing={editingSection === 'personal'} view={owner.placeOfBirth ?? null}
              edit={<input type="text" defaultValue={owner.placeOfBirth ?? ''} className={editInputClass} />}
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

        {/* Contact Information */}
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

        {/* Employment Information */}
        <Section icon={Briefcase} title="Employment Information" isEditing={editingSection === 'employment'} onToggleEdit={() => toggleEdit('employment')} hideEditButton={readOnly}>
          <FieldGrid>
            <Field label="Occupation" editing={editingSection === 'employment'} view={cat.occupation ?? null} edit={<input type="text" defaultValue={cat.occupation ?? ''} className={editInputClass} />} />
            <Field label="Specific duties" editing={editingSection === 'employment'} view={cat.specificDuties ?? null} edit={<input type="text" defaultValue={cat.specificDuties ?? ''} className={editInputClass} />} />
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
            <Field label="Source of Funds" editing={editingSection === 'employment'} view={cat.sourceOfFunds ?? null} edit={<input type="text" defaultValue={cat.sourceOfFunds ?? ''} className={editInputClass} />} />
            <Field label="TIN" editing={editingSection === 'employment'} view={cat.tin ?? null} edit={<input type="text" defaultValue={cat.tin ?? ''} className={`w-48 ${editInputClass}`} />} />
            <Field label="GSIS / SSS" editing={editingSection === 'employment'} view={cat.gsisOrSss ?? null} edit={<input type="text" defaultValue={cat.gsisOrSss ?? ''} className={`w-48 ${editInputClass}`} />} />
          </FieldGrid>
        </Section>

        {/* Beneficiaries */}
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

        {/* Non-forfeiture Options */}
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

        {/* Declaration on Existing Policies */}
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

        {/* Medical Questionnaire */}
        <Section icon={Stethoscope} title="Medical Questionnaire" isEditing={editingSection === 'medical'} onToggleEdit={() => toggleEdit('medical')} hideEditButton={readOnly}>
          {([
            { key: 'consulted' as const, label: 'Have you consulted any doctor for medical treatment, or advice for treatment, or confined in a hospital, clinic or similar institution during the past five years?' },
            { key: 'advised' as const, label: 'Have you ever been advised that you had: heart trouble, high blood pressure, cancer, diabetes, epilepsy or tuberculosis?' },
            { key: 'impairment' as const, label: 'Are you aware of any impairment in your health, or physical condition?' },
          ]).map(q => (
            <div key={q.key} className="flex items-center justify-between gap-4">
              <label className="font-semibold text-slate-700 dark:text-slate-300">{q.label}</label>
              {editingSection === 'medical' ? (
                <select
                  value={medicalAnswers[q.key] ? 'Yes' : 'No'}
                  onChange={(e) => setMedicalAnswers(prev => ({ ...prev, [q.key]: e.target.value === 'Yes' }))}
                  className={`${editSelectClass} max-w-[100px] shrink-0`}
                >
                  <option>No</option><option>Yes</option>
                </select>
              ) : (
                <span className="text-xs font-bold text-slate-900 dark:text-white shrink-0">{medicalAnswers[q.key] ? 'Yes' : 'No'}</span>
              )}
            </div>
          ))}
          {(medicalAnswers.consulted || medicalAnswers.advised || medicalAnswers.impairment) && (
            <Field
              label="If yes to any, please give full details" editing={editingSection === 'medical'} align="start" view={cat.medicalQuestionnaire?.detailsIfYes ?? null}
              edit={<textarea rows={3} defaultValue={cat.medicalQuestionnaire?.detailsIfYes ?? ''} placeholder="Person treated, physician's name, address/name of hospital, date and nature of consultation/sickness/impairment" className={editInputClass} />}
            />
          )}
        </Section>

        {/* Benefits Table */}
        <Section icon={ListChecks} title="Benefits Included" isEditing={false} onToggleEdit={() => {}} hideEditButton>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-w-2xl dark:border-slate-800">
            <div className="flex border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60"><div className="flex-1 p-3 font-semibold text-slate-700 dark:text-slate-300">Life Benefit</div><div className="w-40 p-3 text-right font-bold">100,000.00</div></div>
            <div className="flex border-b border-slate-200 dark:border-slate-800"><div className="flex-1 p-3 font-semibold text-slate-700 dark:text-slate-300">Hospital Income Benefit</div><div className="w-40 p-3 text-right font-bold">500.00</div></div>
            <div className="flex border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60"><div className="flex-1 p-3 font-semibold text-slate-700 dark:text-slate-300">Accidental Death Benefit</div><div className="w-40 p-3 text-right font-bold">100,000.00</div></div>
            <div className="flex"><div className="flex-1 p-3 font-semibold text-slate-700 dark:text-slate-300">Waiver of Premium</div><div className="w-40 p-3 text-right font-bold">Yes</div></div>
          </div>
        </Section>

        {/* Payor Information */}
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
