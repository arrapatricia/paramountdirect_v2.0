import React, { useState } from 'react';
import { ArrowLeft, UploadCloud, FileCheck2, CheckCircle2, ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { CONFLICT_ZONE_COUNTRIES, OFW_OCCUPATIONS, type OfwApplication } from './ofw_types';
import { getPremiumRate, type PremiumRate } from './premium_rates';
import { PH_REGIONS, citiesForRegion, GENERIC_BARANGAYS } from './ph_geography';

interface Props {
  onCreate: (app: OfwApplication) => void;
  onBack: () => void;
  currentUser: string;
  rates: PremiumRate[];
}

// Every country an OFW could plausibly be deployed to, not just the handful
// of high-volume destinations - the live form should never block someone
// from picking their actual country of employment.
const FOREIGN_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina',
  'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
  'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada',
  'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo (DRC)', 'Congo (Republic)', 'Costa Rica', "Cote d'Ivoire", 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan',
  'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon',
  'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macau', 'Madagascar',
  'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique',
  'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
  'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
  'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga',
  'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe', 'Others',
];

const BENEFICIARY_RELATIONSHIPS = [
  'Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Grandchild', 'Aunt', 'Uncle',
  'Cousin', 'Common Law Partner', 'In-Law', 'Other',
];

const calculateAge = (dobString: string) => {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-white';
const labelClass = 'text-xs font-bold text-slate-700 block mb-1 dark:text-slate-300';
const cardClass = 'bg-white border border-slate-200 rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800';
const sectionHeadingClass = 'text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 dark:text-white dark:border-slate-800';

export default function OfwCreateApplication({ onCreate, onBack, currentUser, rates }: Props) {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [phAddress, setPhAddress] = useState('');
  const [phRegion, setPhRegion] = useState(PH_REGIONS[0].name);
  const [phCity, setPhCity] = useState(citiesForRegion(PH_REGIONS[0].name)[0]);
  const [phBarangay, setPhBarangay] = useState(GENERIC_BARANGAYS[0]);
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [civilStatus, setCivilStatus] = useState<'Single' | 'Married' | 'Widower' | 'Separated'>('Single');
  const [birthdate, setBirthdate] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [natureOfEmployment, setNatureOfEmployment] = useState<'Direct-hired' | 'Balik-Manggagawa'>('Direct-hired');
  // Paramount Direct only sells the land-based OFW package - there's no
  // sea-based option to choose, so this isn't a form field.
  const coverageType = 'Land-based' as const;
  const [occupation, setOccupation] = useState(OFW_OCCUPATIONS[0]);
  const [passportNumber, setPassportNumber] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState<'PHP' | 'USD' | 'HKD' | 'Others'>('USD');
  const [employerName, setEmployerName] = useState('');
  const [employerCountry, setEmployerCountry] = useState(FOREIGN_COUNTRIES[0]);
  const [contractStart, setContractStart] = useState('');
  const [contractEnd, setContractEnd] = useState('');
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);

  const MAX_BENEFICIARIES = 3;
  const [beneficiaries, setBeneficiaries] = useState<{ fullName: string; relationship: string; birthdate: string }[]>([
    { fullName: '', relationship: BENEFICIARY_RELATIONSHIPS[0], birthdate: '' },
  ]);
  const addBeneficiary = () => {
    if (beneficiaries.length >= MAX_BENEFICIARIES) return;
    setBeneficiaries((prev) => [...prev, { fullName: '', relationship: BENEFICIARY_RELATIONSHIPS[0], birthdate: '' }]);
  };
  const removeBeneficiary = (index: number) => {
    if (beneficiaries.length <= 1) return;
    setBeneficiaries((prev) => prev.filter((_, i) => i !== index));
  };
  const updateBeneficiary = (index: number, patch: Partial<{ fullName: string; relationship: string; birthdate: string }>) => {
    setBeneficiaries((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const [documents, setDocuments] = useState({
    passport: null as File | null,
    visa: null as File | null,
    employmentContract: null as File | null,
    medicalCertificate: null as File | null,
  });

  const age = calculateAge(birthdate);
  const isConflictZone = CONFLICT_ZONE_COUNTRIES.includes(employerCountry);
  const allDocsUploaded = documents.passport && documents.visa && documents.employmentContract && documents.medicalCertificate;
  const documentsUploadedCount = [documents.passport, documents.visa, documents.employmentContract, documents.medicalCertificate].filter(Boolean).length;

  // No. of Months is the actual pricing driver on the live ofwinsurance.ph
  // form - a read-only field computed from the Term of Employment From/To
  // dates, with a 6-month minimum. Counts full calendar months (e.g.
  // 2026-01-01 to 2027-01-01 = 12), not a raw day count.
  const contractMonths = (() => {
    if (!contractStart || !contractEnd) return 0;
    const start = new Date(contractStart);
    const end = new Date(contractEnd);
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (end.getDate() < start.getDate()) months -= 1;
    return Math.max(0, months);
  })();
  const MIN_CONTRACT_MONTHS = 6;
  const isContractTooShort = contractStart !== '' && contractEnd !== '' && contractMonths < MIN_CONTRACT_MONTHS;

  // Insurance can't be backdated: if the contract already started in the
  // past, coverage starts today; a contract starting today or later gets
  // coverage aligned to that same date. Both are yyyy-mm-dd, so string
  // comparison sorts the same as date comparison.
  const todayIso = new Date().toISOString().slice(0, 10);
  const insuranceStart = contractStart ? (contractStart >= todayIso ? contractStart : todayIso) : '';

  const monthlyRate = getPremiumRate(rates, 'OFW', 'monthlyRate', 2.90);
  const premiumValue = Number((contractMonths * monthlyRate).toFixed(2));

  const [step, setStep] = useState<'form' | 'review' | 'confirmed'>('form');
  const [submittedApp, setSubmittedApp] = useState<OfwApplication | null>(null);

  const canSubmit =
    lastName && firstName && phAddress && birthdate && placeOfBirth && phone && email &&
    passportNumber && salaryAmount && employerName &&
    contractStart && contractEnd && insuranceStart &&
    !isContractTooShort &&
    beneficiaries[0]?.fullName &&
    (!isConflictZone || conflictAcknowledged);

  const handleFileChange = (key: keyof typeof documents) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocuments(prev => ({ ...prev, [key]: e.target.files?.[0] || null }));
  };

  const buildApplication = (): OfwApplication => ({
    id: `800${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
    lastName, firstName, middleName,
    gender, civilStatus, birthdate, placeOfBirth,
    phAddress, phRegion, phCity, phBarangay, phone, email, referralSource: 'Staff-Assisted (Internal)',
    natureOfEmployment, coverageType, occupation, passportNumber,
    salaryAmount: Number(salaryAmount), salaryCurrency,
    employerName, employerCountry,
    contractStart, contractEnd, insuranceStart,
    beneficiaries: beneficiaries.filter((b) => b.fullName.trim() !== ''),
    isConflictZone,
    documents: {
      passport: documents.passport ? 'Uploaded' : 'Missing',
      visa: documents.visa ? 'Uploaded' : 'Missing',
      employmentContract: documents.employmentContract ? 'Uploaded' : 'Missing',
      medicalCertificate: documents.medicalCertificate ? 'Uploaded' : 'Missing',
    },
    premium: `$${premiumValue.toFixed(2)}`,
    dateReceived: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    status: 'Received',
    screenedBy: currentUser,
    employmentVerified: 'Pending',
    paymentInstructionSent: false,
    isPaid: false,
  });

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmSubmit = () => {
    const newApp = buildApplication();
    onCreate(newApp);
    setSubmittedApp(newApp);
    setStep('confirmed');
  };

  const DocUploadField = ({ label, docKey }: { label: string; docKey: keyof typeof documents }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <label className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
        documents[docKey] ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-slate-200 bg-slate-50 hover:border-[#49b1ea] dark:border-slate-700 dark:bg-slate-800'
      }`}>
        {documents[docKey] ? <FileCheck2 className="w-4 h-4 text-emerald-600 flex-shrink-0 dark:text-emerald-400" /> : <UploadCloud className="w-4 h-4 text-slate-400 flex-shrink-0" />}
        <span className={`text-xs font-semibold truncate ${documents[docKey] ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
          {documents[docKey]?.name || 'Choose file (PDF, JPEG, PNG, GIF)'}
        </span>
        <input type="file" accept=".pdf,.jpeg,.jpg,.png,.gif" className="hidden" onChange={handleFileChange(docKey)} />
      </label>
    </div>
  );

  if (step === 'confirmed' && submittedApp) {
    return (
      <div className="p-4 md:p-8 max-w-[700px] mx-auto font-sans text-slate-800 dark:text-slate-200">
        <div className={`${cardClass} text-center py-12`}>
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">Application Submitted</h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
            {submittedApp.firstName} {submittedApp.lastName}'s OFW application has been added to the screening queue.
          </p>
          <div className="mt-6 inline-flex flex-col items-start space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-5 py-4">
            <span>Reference No. <span className="font-black text-slate-900 dark:text-white">{submittedApp.id}</span></span>
            <span>Coverage <span className="font-black text-slate-900 dark:text-white">{submittedApp.coverageType}</span></span>
            <span>Premium <span className="font-black text-[#002f6c] dark:text-[#49b1ea]">{submittedApp.premium}</span></span>
          </div>
          <div className="mt-8">
            <button onClick={onBack} className="px-6 py-2.5 rounded-xl bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold cursor-pointer shadow-md transition-all">
              Back to OFW Applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1000px] mx-auto font-sans text-slate-800 dark:text-slate-200">

      {/* Header */}
      <div className="flex items-center space-x-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <button onClick={step === 'review' ? () => setStep('form') : onBack} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black uppercase tracking-wider text-[#002f6c] dark:text-[#49b1ea] font-['Montserrat']">
            {step === 'review' ? 'Review Application' : 'NEW OFW APPLICATION'}
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 dark:text-slate-500">
            {step === 'review' ? 'Check the details below before submitting.' : 'Based on the OFW Compulsory Insurance form at ofwinsurance.ph'}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Estimated Premium</p>
          <p className="text-xl font-black text-[#002f6c] dark:text-[#49b1ea]">${premiumValue.toFixed(2)}</p>
        </div>
      </div>

      {step === 'review' ? (
        <OfwReviewSummary
          lastName={lastName}
          firstName={firstName}
          middleName={middleName}
          gender={gender}
          civilStatus={civilStatus}
          birthdate={birthdate}
          phAddress={phAddress}
          phRegion={phRegion}
          phCity={phCity}
          phBarangay={phBarangay}
          phone={phone}
          email={email}
          natureOfEmployment={natureOfEmployment}
          coverageType={coverageType}
          occupation={occupation}
          passportNumber={passportNumber}
          salaryAmount={salaryAmount}
          salaryCurrency={salaryCurrency}
          employerName={employerName}
          employerCountry={employerCountry}
          contractStart={contractStart}
          contractEnd={contractEnd}
          contractMonths={contractMonths}
          insuranceStart={insuranceStart}
          beneficiaries={beneficiaries}
          premiumValue={premiumValue}
          documentsUploadedCount={documentsUploadedCount}
          onEdit={() => setStep('form')}
          onConfirm={handleConfirmSubmit}
        />
      ) : (
      <form onSubmit={handleReview} className="space-y-6 pb-10">

        {/* Personal Information */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={labelClass}>Last Name</label><input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>First Name</label><input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Middle Name</label><input value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={inputClass} /></div>

            <div className="md:col-span-3"><label className={labelClass}>Philippine Address (House No., Street)</label><input required value={phAddress} onChange={(e) => setPhAddress(e.target.value)} className={inputClass} placeholder="House No., Street" /></div>
            <div>
              <label className={labelClass}>Region</label>
              <select
                value={phRegion}
                onChange={(e) => { const r = e.target.value; setPhRegion(r); setPhCity(citiesForRegion(r)[0]); }}
                className={inputClass}
              >
                {PH_REGIONS.map((r) => <option key={r.name}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>City/Municipality</label>
              <select value={phCity} onChange={(e) => setPhCity(e.target.value)} className={inputClass}>
                {citiesForRegion(phRegion).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Barangay</label>
              <select value={phBarangay} onChange={(e) => setPhBarangay(e.target.value)} className={inputClass}>
                {GENERIC_BARANGAYS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Gender</label>
              <div className="flex space-x-3 pt-2">
                {(['Male', 'Female'] as const).map((g) => (
                  <label key={g} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input type="radio" checked={gender === g} onChange={() => setGender(g)} className="accent-[#002f6c] dark:accent-[#49b1ea]" /><span>{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Civil Status</label>
              <select value={civilStatus} onChange={(e) => setCivilStatus(e.target.value as typeof civilStatus)} className={inputClass}>
                {(['Single', 'Married', 'Widower', 'Separated'] as const).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Birthdate {age !== null && <span className="text-[#002f6c] dark:text-[#49b1ea]">&middot; {age} yrs old</span>}</label>
              <input required type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className={inputClass} />
            </div>

            <div><label className={labelClass}>Place of Birth</label><input required value={placeOfBirth} onChange={(e) => setPlaceOfBirth(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Mobile Number</label><input required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="09XXXXXXXXX" /></div>
            <div><label className={labelClass}>Email Address</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></div>
          </div>
        </div>

        {/* Employment Information */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Employment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Nature of Employment</label>
              <div className="flex flex-col space-y-1.5 pt-1">
                {(['Direct-hired', 'Balik-Manggagawa'] as const).map((n) => (
                  <label key={n} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input type="radio" checked={natureOfEmployment === n} onChange={() => setNatureOfEmployment(n)} className="accent-[#002f6c] dark:accent-[#49b1ea]" /><span>{n}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Type of Package</label>
              <input disabled value={coverageType} className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-70`} />
            </div>
            <div>
              <label className={labelClass}>Occupation</label>
              <select value={occupation} onChange={(e) => setOccupation(e.target.value)} className={inputClass}>
                {OFW_OCCUPATIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div><label className={labelClass}>Passport Number</label><input required value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Estimated Salary</label>
              <div className="flex space-x-2">
                <input required type="number" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} className={inputClass} />
                <select value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value as typeof salaryCurrency)} className={`${inputClass} max-w-[90px]`}>
                  {(['PHP', 'USD', 'HKD', 'Others'] as const).map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div><label className={labelClass}>Foreign Employer</label><input required value={employerName} onChange={(e) => setEmployerName(e.target.value)} className={inputClass} /></div>

            <div>
              <label className={labelClass}>Country of Employment</label>
              <select value={employerCountry} onChange={(e) => { setEmployerCountry(e.target.value); setConflictAcknowledged(false); }} className={inputClass}>
                {FOREIGN_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Contract Start Date</label><input required type="date" value={contractStart} onChange={(e) => setContractStart(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Contract End Date</label><input required type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>No. of Months</label>
              <input
                disabled
                value={contractStart && contractEnd ? contractMonths : ''}
                placeholder="Auto-computed"
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-70`}
              />
              {isContractTooShort && (
                <p className="text-[10px] font-bold text-rose-600 mt-1 dark:text-rose-400">Contract period should not be less than 6 months.</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Insurance Start Date</label>
              <input disabled type="date" value={insuranceStart} placeholder="Auto-computed" className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-70`} />
              <p className="text-[10px] font-semibold text-slate-400 mt-1 dark:text-slate-500">
                {contractStart && contractStart < todayIso
                  ? "Contract already started, so coverage begins today."
                  : "Matches the contract start date."}
              </p>
            </div>
          </div>

          {isConflictZone && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-2 dark:bg-amber-950/30 dark:border-amber-800">
              <div className="flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5 dark:text-amber-400" />
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  Ang bansang pinili ay kasalukuyang nasa listahan ng mga countries with ongoing conflict. Some benefits may be limited, ngunit mahalaga pa rin sa amin ang iyong proteksyon.
                </p>
              </div>
              <label className="flex items-center space-x-2 pl-6 cursor-pointer">
                <input type="checkbox" checked={conflictAcknowledged} onChange={(e) => setConflictAcknowledged(e.target.checked)} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
                <span className="font-bold text-amber-800 dark:text-amber-300">I understand and would like to proceed.</span>
              </label>
            </div>
          )}
        </div>

        {/* Beneficiaries */}
        <div className={cardClass}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Beneficiaries</h2>
            <button
              type="button"
              onClick={addBeneficiary}
              disabled={beneficiaries.length >= MAX_BENEFICIARIES}
              className="flex items-center space-x-1.5 text-xs font-bold text-[#002f6c] hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline cursor-pointer dark:text-[#49b1ea]"
            >
              <Plus className="w-3.5 h-3.5" /><span>Add Beneficiary ({beneficiaries.length}/{MAX_BENEFICIARIES})</span>
            </button>
          </div>
          <div className="space-y-4">
            {beneficiaries.map((b, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end pb-4 border-b border-slate-100 last:border-0 last:pb-0 dark:border-slate-800">
                <div>
                  <label className={labelClass}>Full Name {i === 0 && <span className="text-rose-500">*</span>}</label>
                  <input required={i === 0} value={b.fullName} onChange={(e) => updateBeneficiary(i, { fullName: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Relationship</label>
                  <select value={b.relationship} onChange={(e) => updateBeneficiary(i, { relationship: e.target.value })} className={inputClass}>
                    {BENEFICIARY_RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Birthdate</label>
                  <input type="date" value={b.birthdate} onChange={(e) => updateBeneficiary(i, { birthdate: e.target.value })} className={inputClass} />
                </div>
                <button
                  type="button"
                  onClick={() => removeBeneficiary(i)}
                  disabled={beneficiaries.length <= 1}
                  className="p-2.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer transition-colors dark:hover:bg-rose-950/30"
                  title="Remove beneficiary"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-3 dark:text-slate-500">At least one beneficiary is required; up to three may be added.</p>
        </div>

        {/* Documents */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Required Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DocUploadField label="Passport" docKey="passport" />
            <DocUploadField label="Working Visa" docKey="visa" />
            <DocUploadField label="Employment Contract" docKey="employmentContract" />
            <DocUploadField label="Medical Certificate" docKey="medicalCertificate" />
          </div>
          {!allDocsUploaded && (
            <p className="text-[10px] font-semibold text-slate-400 mt-3 dark:text-slate-500">Documents can be uploaded later during screening if not available now.</p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button type="button" onClick={onBack} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-6 py-2.5 rounded-xl bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Review Application
          </button>
        </div>
      </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Read-only summary shown before the application is actually created - lets
// the user double-check everything (including the premium) instead of the
// form silently submitting straight to the queue.
// ---------------------------------------------------------------------------

function OfwReviewSummary({
  lastName, firstName, middleName, gender, civilStatus, birthdate, phAddress, phRegion, phCity, phBarangay, phone, email,
  natureOfEmployment, coverageType, occupation, passportNumber, salaryAmount, salaryCurrency, employerName, employerCountry,
  contractStart, contractEnd, contractMonths, insuranceStart, beneficiaries, premiumValue, documentsUploadedCount, onEdit, onConfirm,
}: {
  lastName: string;
  firstName: string;
  middleName: string;
  gender: 'Male' | 'Female';
  civilStatus: 'Single' | 'Married' | 'Widower' | 'Separated';
  birthdate: string;
  phAddress: string;
  phRegion: string;
  phCity: string;
  phBarangay: string;
  phone: string;
  email: string;
  natureOfEmployment: 'Direct-hired' | 'Balik-Manggagawa';
  coverageType: 'Land-based';
  occupation: string;
  passportNumber: string;
  salaryAmount: string;
  salaryCurrency: 'PHP' | 'USD' | 'HKD' | 'Others';
  employerName: string;
  employerCountry: string;
  contractStart: string;
  contractEnd: string;
  contractMonths: number;
  insuranceStart: string;
  beneficiaries: { fullName: string; relationship: string; birthdate: string }[];
  premiumValue: number;
  documentsUploadedCount: number;
  onEdit: () => void;
  onConfirm: () => void;
}) {
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-slate-500 dark:text-slate-400 font-semibold">{label}</span>
      <span className="text-slate-900 dark:text-white font-bold text-right">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <div className={cardClass}>
        <h2 className={sectionHeadingClass}>Personal Information</h2>
        <div className="text-xs">
          {row('Name', `${lastName}, ${firstName} ${middleName}`.replace(/\s+/g, ' ').trim())}
          {row('Gender / Civil Status', `${gender} · ${civilStatus}`)}
          {row('Birthdate', birthdate || '-')}
          {row('Address', [phAddress, phBarangay !== 'N/A' ? phBarangay : null, phCity, phRegion].filter(Boolean).join(', ') || '-')}
          {row('Mobile Number', phone || '-')}
          {row('Email', email || '-')}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className={sectionHeadingClass}>Employment Information</h2>
        <div className="text-xs">
          {row('Nature of Employment', natureOfEmployment)}
          {row('Type of Package', coverageType)}
          {row('Occupation', occupation)}
          {row('Passport Number', passportNumber || '-')}
          {row('Estimated Salary', salaryAmount ? `${salaryAmount} ${salaryCurrency}` : '-')}
          {row('Foreign Employer', employerName ? `${employerName} (${employerCountry})` : '-')}
          {row('Contract Period', contractStart && contractEnd ? `${contractStart} to ${contractEnd} (${contractMonths} months)` : '-')}
          {row('Insurance Start Date', insuranceStart || '-')}
          {row('Estimated Premium', <span className="text-[#002f6c] dark:text-[#49b1ea]">${premiumValue.toFixed(2)}</span>)}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className={sectionHeadingClass}>Beneficiaries</h2>
        <div className="text-xs">
          {beneficiaries.filter((b) => b.fullName.trim() !== '').map((b, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">{b.relationship}</span>
              <span className="text-slate-900 dark:text-white font-bold text-right">{b.fullName}{b.birthdate ? ` · ${b.birthdate}` : ''}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className={sectionHeadingClass}>Documents</h2>
        <div className="text-xs">
          {row('Documents Uploaded', `${documentsUploadedCount} of 4`)}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <button type="button" onClick={onEdit} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
          Back to Edit
        </button>
        <button type="button" onClick={onConfirm} className="px-6 py-2.5 rounded-xl bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold cursor-pointer shadow-md transition-all">
          Confirm &amp; Submit
        </button>
      </div>
    </div>
  );
}
