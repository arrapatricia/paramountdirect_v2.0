import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, HeartPulse, ShieldPlus, GraduationCap, Plus, Trash2 } from 'lucide-react';
import {
  PD_LIFE_PLAN_CODES,
  PAYOR_RELATIONSHIPS,
  type PdLifePlanCategory,
  type PdLifeApplication,
  type PolicyOwnerInfo,
  type ContactInfo,
  type PayorInfo,
  type ChildBeneficiary,
  type Beneficiary,
  type NonForfeitureOption,
} from './pdlife_types';

interface Props {
  onCreate: (app: PdLifeApplication) => void;
  onBack: () => void;
  currentUser: string;
}

const PH_REGIONS = ['NCR', 'Region III', 'Region IV-A'];
const PH_CITIES = ['Pasay City', 'Makati City', 'Manila City', 'Quezon City'];
const PH_BARANGAYS = ['Barangay 101', 'Barangay 102', 'Barangay 103'];
const NATIONALITIES = ['Filipino', 'American', 'Chinese', 'Japanese', 'Korean', 'Others'];
const PAYMENT_OPTIONS = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'] as const;
const NON_FORFEITURE_OPTIONS: NonForfeitureOption[] = ['Paid-up Insurance', 'Automatic Payment of Premium', 'Cash Surrender'];

// Flat indicative premium per plan code - the live wizards compute this from
// plan tier/units/age, this mirrors that with a simple lookup.
const PREMIUM_BY_PLAN_CODE: Record<string, number> = {
  HCP: 500, HIP: 350, PCP: 420, PHC: 680,
  GLP: 450, GLA: 600, GPR: 380,
  MPR: 500, SSP: 892, PHP: 620, DRE: 750,
};

const CATEGORY_ICON: Record<PdLifePlanCategory, typeof HeartPulse> = {
  'Health': HeartPulse,
  'Life & Accident': ShieldPlus,
  'Comprehensive': GraduationCap,
};

const CATEGORY_DESCRIPTION: Record<PdLifePlanCategory, string> = {
  'Health': 'HealthCARE Cash Plan, Hospital Income Benefit, PrimeCARE Cash Plan, Premium HealthCare Plus',
  'Life & Accident': 'Guaranteed Life Plan, Golden Life Advantage, Go Protect Plan',
  'Comprehensive': 'MoneyPlus Protection, Sure Savings, PrimeHealth Cash, Dream College Plan',
};

const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d0112b] focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-white';
const labelClass = 'text-xs font-bold text-slate-700 block mb-1 dark:text-slate-300';
const cardClass = 'bg-white border border-slate-200 rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800';
const sectionHeadingClass = 'text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 dark:text-white dark:border-slate-800';

const calculateAge = (dobString: string) => {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

export default function PdLifeCreateApplication({ onCreate, onBack, currentUser }: Props) {
  const [category, setCategory] = useState<PdLifePlanCategory | null>(null);

  if (!category) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-[1000px] mx-auto font-sans text-slate-800 dark:text-slate-200">
        <div className="flex items-center space-x-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <button onClick={onBack} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-[#d0112b] font-['Montserrat']">New PD Life Application</h1>
            <p className="text-xs font-bold text-slate-500 mt-1 dark:text-slate-500">Choose a plan category to continue - the form differs per category.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(PD_LIFE_PLAN_CODES) as PdLifePlanCategory[]).map((cat) => {
            const Icon = CATEGORY_ICON[cat];
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="text-left p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#d0112b] hover:shadow-md transition-all cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:hover:border-[#d0112b]"
              >
                <Icon className="w-6 h-6 text-[#d0112b] mb-3" />
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">{cat}</h3>
                <p className="text-xs font-medium text-slate-500 mt-1.5 dark:text-slate-400">{CATEGORY_DESCRIPTION[cat]}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <PdLifeCategoryForm
      category={category}
      onCreate={onCreate}
      onBackToCategories={() => setCategory(null)}
      onFinish={onBack}
      currentUser={currentUser}
    />
  );
}

// ---------------------------------------------------------------------------
// The actual form, once a category has been chosen. Common sections
// (Referral, Policy Owner, Contact, Payor) are always shown; the category
// branch renders whichever section set matches that plan category.
// ---------------------------------------------------------------------------

function PdLifeCategoryForm({
  category,
  onCreate,
  onBackToCategories,
  onFinish,
  currentUser,
}: {
  category: PdLifePlanCategory;
  onCreate: (app: PdLifeApplication) => void;
  onBackToCategories: () => void;
  onFinish: () => void;
  currentUser: string;
}) {
  const planOptions = PD_LIFE_PLAN_CODES[category];
  const [planCode, setPlanCode] = useState(planOptions[0].code);
  const [source, setSource] = useState('Paramount Website');

  const [owner, setOwner] = useState<PolicyOwnerInfo>({
    title: 'Mr.', firstName: '', middleName: '', lastName: '',
    gender: 'Male', birthdate: '', placeOfBirth: '', nationality: NATIONALITIES[0],
  });
  const [contact, setContact] = useState<ContactInfo>({
    houseNumber: '', street: '', building: '',
    region: PH_REGIONS[0], city: PH_CITIES[0], barangay: PH_BARANGAYS[0], zipcode: '',
    mobileNumber: '', telephoneNumber: '', email: '',
  });
  const [payorInfo, setPayorInfo] = useState<PayorInfo>({
    sameAsInsured: true, name: '', contactNumber: '', email: '', relationship: PAYOR_RELATIONSHIPS[0],
  });

  // Health-only
  const [insuredOption, setInsuredOption] = useState<'Individual' | 'Married Couple' | 'Family'>('Individual');
  const [hasLegalSpouse, setHasLegalSpouse] = useState(false);
  const [children, setChildren] = useState<ChildBeneficiary[]>([]);

  // Life & Accident / Comprehensive shared
  const [paymentOption, setPaymentOption] = useState<(typeof PAYMENT_OPTIONS)[number]>('Monthly');
  const [units, setUnits] = useState(1);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [nonForfeitureOption, setNonForfeitureOption] = useState<NonForfeitureOption>('Cash Surrender');
  const [hasExistingPolicy, setHasExistingPolicy] = useState(false);
  const [existingPolicyDetails, setExistingPolicyDetails] = useState('');

  // Comprehensive-only
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [occupation, setOccupation] = useState('');
  const [specificDuties, setSpecificDuties] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [officeZipcode, setOfficeZipcode] = useState('');
  const [officeTelephone, setOfficeTelephone] = useState('');
  const [sourceOfFunds, setSourceOfFunds] = useState('');
  const [tin, setTin] = useState('');
  const [gsisOrSss, setGsisOrSss] = useState('');
  const [consultedDoctor, setConsultedDoctor] = useState(false);
  const [advisedCondition, setAdvisedCondition] = useState(false);
  const [awareOfImpairment, setAwareOfImpairment] = useState(false);
  const [medicalDetails, setMedicalDetails] = useState('');

  const [submitted, setSubmitted] = useState(false);

  const age = calculateAge(owner.birthdate);
  const planName = planOptions.find((p) => p.code === planCode)?.name ?? planOptions[0].name;

  const canSubmit =
    owner.firstName && owner.lastName && owner.birthdate && owner.placeOfBirth &&
    contact.houseNumber && contact.street && contact.zipcode && contact.mobileNumber && contact.email &&
    (payorInfo.sameAsInsured || (payorInfo.name && payorInfo.contactNumber && payorInfo.email)) &&
    (category !== 'Comprehensive' || (occupation && weightKg && heightCm));

  const addChild = () => setChildren((prev) => [...prev, { fullName: '', birthdate: '', relationship: 'Child' }]);
  const removeChild = (idx: number) => setChildren((prev) => prev.filter((_, i) => i !== idx));
  const updateChild = (idx: number, patch: Partial<ChildBeneficiary>) =>
    setChildren((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const addBeneficiary = () => setBeneficiaries((prev) => [...prev, { fullName: '', relationship: PAYOR_RELATIONSHIPS[0], birthdate: '', revocable: true }]);
  const removeBeneficiary = (idx: number) => setBeneficiaries((prev) => prev.filter((_, i) => i !== idx));
  const updateBeneficiary = (idx: number, patch: Partial<Beneficiary>) =>
    setBeneficiaries((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const fullName = `${owner.firstName} ${owner.lastName}`;
    const premiumValue = PREMIUM_BY_PLAN_CODE[planCode] ?? 500;

    const baseDetails = { policyOwner: owner, contact, payor: payorInfo };
    const categoryDetails =
      category === 'Health'
        ? { insuredOption, paymentOption, hasLegalSpouse, children }
        : category === 'Life & Accident'
        ? { units, paymentOption, beneficiaries, nonForfeitureOption, hasExistingPolicy, existingPolicyDetails }
        : {
            weightKg: Number(weightKg), heightCm: Number(heightCm), occupation, specificDuties,
            officeAddress, officeZipcode, officeTelephone, sourceOfFunds, tin, gsisOrSss,
            beneficiaries, nonForfeitureOption, hasExistingPolicy, existingPolicyDetails,
            medicalQuestionnaire: {
              consultedDoctorPast5Years: consultedDoctor,
              advisedOfSeriousCondition: advisedCondition,
              awareOfImpairment,
              detailsIfYes: medicalDetails,
            },
          };

    const newApp: PdLifeApplication = {
      id: `3920${Math.floor(10 + Math.random() * 89)}`,
      payor: fullName,
      planCode,
      planDesc: planName,
      premium: `₱${premiumValue.toFixed(2)}`,
      source,
      dateReceived: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      dateScreened: '-',
      screenedBy: currentUser,
      status: 'Received',
      planCategory: category,
      details: { ...baseDetails, category: categoryDetails } as PdLifeApplication['details'],
    };

    onCreate(newApp);
    setSubmitted(true);
    setTimeout(() => onFinish(), 1200);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1000px] mx-auto font-sans text-slate-800 dark:text-slate-200">
      {submitted && (
        <div className="fixed top-6 right-6 z-[100] p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>Application submitted and added to the screening queue.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center space-x-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <button onClick={onBackToCategories} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider text-[#d0112b] font-['Montserrat']">New {category} Application</h1>
          <p className="text-xs font-bold text-slate-500 mt-1 dark:text-slate-500">Based on the {category} application forms at paramountdirectdev.herokuapp.com</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-10">
        {/* Campaign Source */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>How did you learn about Paramount Life &amp; General Insurance Corp.?</h2>
          <div className="flex flex-wrap gap-3 text-xs">
            {['Google', 'Email Newsletter', 'Facebook', 'Paramount Website', 'Referral', 'Others'].map((src) => (
              <label key={src} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer ${source === src ? 'border-[#d0112b] bg-red-50 dark:bg-[#d0112b]/10' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>
                <input type="radio" name="source" checked={source === src} onChange={() => setSource(src)} className="accent-[#d0112b]" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{src}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Plan selection - category-specific control */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Plan Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Plan</label>
              <select value={planCode} onChange={(e) => setPlanCode(e.target.value)} className={inputClass}>
                {planOptions.map((p) => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)}
              </select>
            </div>

            {category === 'Health' && (
              <div>
                <label className={labelClass}>Insured Option</label>
                <select value={insuredOption} onChange={(e) => setInsuredOption(e.target.value as typeof insuredOption)} className={inputClass}>
                  {(['Individual', 'Married Couple', 'Family'] as const).map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            )}

            {category === 'Life & Accident' && (
              <div>
                <label className={labelClass}>Units</label>
                <select value={units} onChange={(e) => setUnits(Number(e.target.value))} className={inputClass}>
                  {[1, 2, 3, 5, 7, 10, 15, 20].map((u) => <option key={u} value={u}>{u} Unit(s)</option>)}
                </select>
              </div>
            )}

            {category !== 'Health' && (
              <div>
                <label className={labelClass}>Payment Option</label>
                <select value={paymentOption} onChange={(e) => setPaymentOption(e.target.value as typeof paymentOption)} className={inputClass}>
                  {PAYMENT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            )}
            {category === 'Health' && (
              <div>
                <label className={labelClass}>Payment Option</label>
                <select value={paymentOption} onChange={(e) => setPaymentOption(e.target.value as typeof paymentOption)} className={inputClass}>
                  {PAYMENT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Policy Owner Information (common) */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Policy Owner Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Title</label>
              <select value={owner.title} onChange={(e) => setOwner((o) => ({ ...o, title: e.target.value as PolicyOwnerInfo['title'] }))} className={inputClass}>
                {(['Mr.', 'Ms.', 'Mrs.'] as const).map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>First Name</label><input required value={owner.firstName} onChange={(e) => setOwner((o) => ({ ...o, firstName: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Middle Name</label><input value={owner.middleName} onChange={(e) => setOwner((o) => ({ ...o, middleName: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Last Name</label><input required value={owner.lastName} onChange={(e) => setOwner((o) => ({ ...o, lastName: e.target.value }))} className={inputClass} /></div>

            <div>
              <label className={labelClass}>Gender</label>
              <div className="flex space-x-3 pt-2">
                {(['Male', 'Female'] as const).map((g) => (
                  <label key={g} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input type="radio" checked={owner.gender === g} onChange={() => setOwner((o) => ({ ...o, gender: g }))} className="accent-[#d0112b]" /><span>{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Birthdate {age !== null && <span className="text-[#d0112b]">&middot; {age} yrs old</span>}</label>
              <input required type="date" value={owner.birthdate} onChange={(e) => setOwner((o) => ({ ...o, birthdate: e.target.value }))} className={inputClass} />
            </div>
            <div><label className={labelClass}>Place of Birth</label><input required value={owner.placeOfBirth} onChange={(e) => setOwner((o) => ({ ...o, placeOfBirth: e.target.value }))} className={inputClass} /></div>

            <div>
              <label className={labelClass}>Nationality</label>
              <select value={owner.nationality} onChange={(e) => setOwner((o) => ({ ...o, nationality: e.target.value }))} className={inputClass}>
                {NATIONALITIES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>

            {category === 'Comprehensive' && (
              <>
                <div><label className={labelClass}>Weight (kg)</label><input required type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Height (cm)</label><input required type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={inputClass} /></div>
              </>
            )}
          </div>
        </div>

        {/* Contact Information (common) */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={labelClass}>House Number</label><input required value={contact.houseNumber} onChange={(e) => setContact((c) => ({ ...c, houseNumber: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Street Name</label><input required value={contact.street} onChange={(e) => setContact((c) => ({ ...c, street: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Building Name (optional)</label><input value={contact.building} onChange={(e) => setContact((c) => ({ ...c, building: e.target.value }))} className={inputClass} /></div>

            <div>
              <label className={labelClass}>Region</label>
              <select value={contact.region} onChange={(e) => setContact((c) => ({ ...c, region: e.target.value }))} className={inputClass}>
                {PH_REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>City/Municipality</label>
              <select value={contact.city} onChange={(e) => setContact((c) => ({ ...c, city: e.target.value }))} className={inputClass}>
                {PH_CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Barangay</label>
              <select value={contact.barangay} onChange={(e) => setContact((c) => ({ ...c, barangay: e.target.value }))} className={inputClass}>
                {PH_BARANGAYS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>

            <div><label className={labelClass}>Zip Code</label><input required value={contact.zipcode} onChange={(e) => setContact((c) => ({ ...c, zipcode: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Mobile Number</label><input required value={contact.mobileNumber} onChange={(e) => setContact((c) => ({ ...c, mobileNumber: e.target.value }))} className={inputClass} placeholder="09XXXXXXXXX" /></div>
            <div><label className={labelClass}>Telephone Number (optional)</label><input value={contact.telephoneNumber} onChange={(e) => setContact((c) => ({ ...c, telephoneNumber: e.target.value }))} className={inputClass} /></div>

            <div className="md:col-span-3"><label className={labelClass}>Email Address</label><input required type="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} className={inputClass} /></div>
          </div>
        </div>

        {/* Health-only: Persons to be Insured */}
        {category === 'Health' && insuredOption === 'Family' && (
          <div className={cardClass}>
            <h2 className={sectionHeadingClass}>Persons to be Insured</h2>
            <label className="flex items-center space-x-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={hasLegalSpouse} onChange={(e) => setHasLegalSpouse(e.target.checked)} className="accent-[#d0112b]" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Do you have a legal spouse?</span>
            </label>

            <div className="space-y-3">
              {children.map((child, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <div><label className={labelClass}>Full Name</label><input value={child.fullName} onChange={(e) => updateChild(idx, { fullName: e.target.value })} className={inputClass} /></div>
                  <div><label className={labelClass}>Birthdate</label><input type="date" value={child.birthdate} onChange={(e) => updateChild(idx, { birthdate: e.target.value })} className={inputClass} /></div>
                  <div>
                    <label className={labelClass}>Relationship</label>
                    <select value={child.relationship} onChange={(e) => updateChild(idx, { relationship: e.target.value as ChildBeneficiary['relationship'] })} className={inputClass}>
                      <option>Spouse</option>
                      <option>Child</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => removeChild(idx)} className="p-2 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 cursor-pointer dark:border-slate-700 dark:hover:bg-rose-950/30 justify-self-start">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addChild} className="mt-3 flex items-center space-x-1.5 text-xs font-bold text-[#d0112b] hover:underline cursor-pointer">
              <Plus className="w-3.5 h-3.5" /><span>Add Child</span>
            </button>
          </div>
        )}

        {/* Life & Accident + Comprehensive: Beneficiaries */}
        {category !== 'Health' && (
          <div className={cardClass}>
            <h2 className={sectionHeadingClass}>Beneficiaries</h2>
            <div className="space-y-3">
              {beneficiaries.map((b, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <div><label className={labelClass}>Full Name</label><input value={b.fullName} onChange={(e) => updateBeneficiary(idx, { fullName: e.target.value })} className={inputClass} /></div>
                  <div>
                    <label className={labelClass}>Relationship</label>
                    <select value={b.relationship} onChange={(e) => updateBeneficiary(idx, { relationship: e.target.value })} className={inputClass}>
                      {PAYOR_RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div><label className={labelClass}>Birthdate</label><input type="date" value={b.birthdate} onChange={(e) => updateBeneficiary(idx, { birthdate: e.target.value })} className={inputClass} /></div>
                  <div>
                    <label className={labelClass}>Designation</label>
                    <select value={b.revocable ? 'Revocable' : 'Irrevocable'} onChange={(e) => updateBeneficiary(idx, { revocable: e.target.value === 'Revocable' })} className={inputClass}>
                      <option>Revocable</option>
                      <option>Irrevocable</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => removeBeneficiary(idx)} className="p-2 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 cursor-pointer dark:border-slate-700 dark:hover:bg-rose-950/30 justify-self-start">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addBeneficiary} className="mt-3 flex items-center space-x-1.5 text-xs font-bold text-[#d0112b] hover:underline cursor-pointer">
              <Plus className="w-3.5 h-3.5" /><span>Add Beneficiary</span>
            </button>
          </div>
        )}

        {/* Comprehensive-only: Employment + Medical Questionnaire */}
        {category === 'Comprehensive' && (
          <>
            <div className={cardClass}>
              <h2 className={sectionHeadingClass}>Employment Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelClass}>Occupation</label><input required value={occupation} onChange={(e) => setOccupation(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Specific Duties</label><input value={specificDuties} onChange={(e) => setSpecificDuties(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Source of Funds</label><input value={sourceOfFunds} onChange={(e) => setSourceOfFunds(e.target.value)} className={inputClass} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Business/Office Address</label><input value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Office Zip Code</label><input value={officeZipcode} onChange={(e) => setOfficeZipcode(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Office Telephone No.</label><input value={officeTelephone} onChange={(e) => setOfficeTelephone(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>TIN</label><input value={tin} onChange={(e) => setTin(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>GSIS/SSS No.</label><input value={gsisOrSss} onChange={(e) => setGsisOrSss(e.target.value)} className={inputClass} /></div>
              </div>
            </div>

            <div className={cardClass}>
              <h2 className={sectionHeadingClass}>Medical Questionnaire</h2>
              <div className="space-y-3 text-xs">
                {[
                  { checked: consultedDoctor, set: setConsultedDoctor, label: 'Have you consulted any doctor in the past 5 years?' },
                  { checked: advisedCondition, set: setAdvisedCondition, label: 'Have you been advised of heart trouble, high blood pressure, cancer, diabetes, epilepsy, or tuberculosis?' },
                  { checked: awareOfImpairment, set: setAwareOfImpairment, label: 'Are you aware of any physical or mental impairment?' },
                ].map((q, idx) => (
                  <label key={idx} className="flex items-start space-x-2 cursor-pointer">
                    <input type="checkbox" checked={q.checked} onChange={(e) => q.set(e.target.checked)} className="accent-[#d0112b] mt-0.5" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{q.label}</span>
                  </label>
                ))}
              </div>
              {(consultedDoctor || advisedCondition || awareOfImpairment) && (
                <div className="mt-3">
                  <label className={labelClass}>Please provide details (person treated, physician/hospital, date &amp; nature of consultation)</label>
                  <textarea value={medicalDetails} onChange={(e) => setMedicalDetails(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
                </div>
              )}
            </div>
          </>
        )}

        {/* Non-forfeiture + Declaration - Life & Accident and Comprehensive */}
        {category !== 'Health' && (
          <div className={cardClass}>
            <h2 className={sectionHeadingClass}>Non-forfeiture Options &amp; Declaration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>In case of premium default</label>
                <select value={nonForfeitureOption} onChange={(e) => setNonForfeitureOption(e.target.value as NonForfeitureOption)} className={inputClass}>
                  {NON_FORFEITURE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Declaration on Existing Policy(ies)</label>
                <div className="flex space-x-3 pt-2">
                  {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(({ v, l }) => (
                    <label key={l} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input type="radio" checked={hasExistingPolicy === v} onChange={() => setHasExistingPolicy(v)} className="accent-[#d0112b]" /><span>{l}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {hasExistingPolicy && (
              <div className="mt-4">
                <label className={labelClass}>Please provide details</label>
                <textarea value={existingPolicyDetails} onChange={(e) => setExistingPolicyDetails(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
              </div>
            )}
          </div>
        )}

        {/* Payor Information (common) */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Payor Information</h2>
          <label className="flex items-center space-x-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={payorInfo.sameAsInsured} onChange={(e) => setPayorInfo((p) => ({ ...p, sameAsInsured: e.target.checked }))} className="accent-[#d0112b]" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Payor is the same as the Insured</span>
          </label>

          {!payorInfo.sameAsInsured && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Name</label><input required value={payorInfo.name} onChange={(e) => setPayorInfo((p) => ({ ...p, name: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Contact Number</label><input required value={payorInfo.contactNumber} onChange={(e) => setPayorInfo((p) => ({ ...p, contactNumber: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Email Address</label><input required type="email" value={payorInfo.email} onChange={(e) => setPayorInfo((p) => ({ ...p, email: e.target.value }))} className={inputClass} /></div>
              <div>
                <label className={labelClass}>Relationship to Insured</label>
                <select value={payorInfo.relationship} onChange={(e) => setPayorInfo((p) => ({ ...p, relationship: e.target.value }))} className={inputClass}>
                  {PAYOR_RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button type="button" onClick={onFinish} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-6 py-2.5 rounded-xl bg-[#d0112b] hover:bg-[#a80d22] text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );
}
