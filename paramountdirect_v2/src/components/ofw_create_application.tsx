import React, { useState } from 'react';
import { ArrowLeft, UploadCloud, FileCheck2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CONFLICT_ZONE_COUNTRIES, OFW_OCCUPATIONS, type OfwApplication } from './ofw_types';
import { getPremiumRate, type PremiumRate } from './premium_rates';

interface Props {
  onCreate: (app: OfwApplication) => void;
  onBack: () => void;
  currentUser: string;
  rates: PremiumRate[];
}

const PH_CITIES = ['Pasay City', 'Makati City', 'Manila City', 'Quezon City'];
const FOREIGN_COUNTRIES = [
  'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Hong Kong', 'Singapore', 'Kuwait',
  'Israel', 'Ukraine', 'Yemen', 'Syria', 'Others',
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
  const [referralSource, setReferralSource] = useState('Facebook');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [phAddress, setPhAddress] = useState('');
  const [phCity, setPhCity] = useState(PH_CITIES[0]);
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [civilStatus, setCivilStatus] = useState<'Single' | 'Married' | 'Widower' | 'Separated'>('Single');
  const [birthdate, setBirthdate] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [natureOfEmployment, setNatureOfEmployment] = useState<'Direct-hired' | 'Balik-Manggagawa'>('Direct-hired');
  const [coverageType, setCoverageType] = useState<'Land-based' | 'Sea-based'>('Land-based');
  const [occupation, setOccupation] = useState(OFW_OCCUPATIONS[0]);
  const [passportNumber, setPassportNumber] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState<'PHP' | 'USD' | 'HKD' | 'Others'>('USD');
  const [employerName, setEmployerName] = useState('');
  const [employerCountry, setEmployerCountry] = useState(FOREIGN_COUNTRIES[0]);
  const [contractStart, setContractStart] = useState('');
  const [contractEnd, setContractEnd] = useState('');
  const [insuranceStart, setInsuranceStart] = useState('');
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);

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

  const premiumValue = getPremiumRate(rates, 'OFW', coverageType, coverageType === 'Sea-based' ? 58 : 42);

  const [step, setStep] = useState<'form' | 'review' | 'confirmed'>('form');
  const [submittedApp, setSubmittedApp] = useState<OfwApplication | null>(null);

  const canSubmit =
    lastName && firstName && phAddress && birthdate && placeOfBirth && phone && email &&
    passportNumber && salaryAmount && employerName &&
    contractStart && contractEnd && insuranceStart &&
    (!isConflictZone || conflictAcknowledged);

  const handleFileChange = (key: keyof typeof documents) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocuments(prev => ({ ...prev, [key]: e.target.files?.[0] || null }));
  };

  const buildApplication = (): OfwApplication => ({
    id: `800${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
    lastName, firstName, middleName,
    gender, civilStatus, birthdate, placeOfBirth,
    phAddress, phCity, phone, email, referralSource,
    natureOfEmployment, coverageType, occupation, passportNumber,
    salaryAmount: Number(salaryAmount), salaryCurrency,
    employerName, employerCountry,
    contractStart, contractEnd, insuranceStart,
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
            <span>Premium <span className="font-black text-[#002f6c]">{submittedApp.premium}</span></span>
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
          <h1 className="text-xl font-black uppercase tracking-wider text-[#002f6c] font-['Montserrat']">
            {step === 'review' ? 'Review Application' : 'NEW OFW APPLICATION'}
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 dark:text-slate-500">
            {step === 'review' ? 'Check the details below before submitting.' : 'Based on the OFW Compulsory Insurance form at ofwinsurance.ph'}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Estimated Premium</p>
          <p className="text-xl font-black text-[#002f6c]">${premiumValue.toFixed(2)}</p>
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
          phCity={phCity}
          phone={phone}
          email={email}
          referralSource={referralSource}
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
          insuranceStart={insuranceStart}
          premiumValue={premiumValue}
          documentsUploadedCount={documentsUploadedCount}
          onEdit={() => setStep('form')}
          onConfirm={handleConfirmSubmit}
        />
      ) : (
      <form onSubmit={handleReview} className="space-y-6 pb-10">

        {/* Referral */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>How did you learn about Paramount Life &amp; General Insurance Corp.?</h2>
          <div className="flex flex-wrap gap-3 text-xs">
            {['Facebook', 'Google', 'Paramount Website', 'POEA/POLO', 'Referral', 'Others'].map((src) => (
              <label key={src} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer ${referralSource === src ? 'border-[#49b1ea] bg-[#ebf3fc] dark:bg-[#49b1ea]/10' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>
                <input type="radio" name="referral" checked={referralSource === src} onChange={() => setReferralSource(src)} className="accent-[#002f6c]" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{src}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Personal Information */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={labelClass}>Last Name</label><input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>First Name</label><input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Middle Name</label><input value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={inputClass} /></div>

            <div className="md:col-span-2"><label className={labelClass}>Philippine Address</label><input required value={phAddress} onChange={(e) => setPhAddress(e.target.value)} className={inputClass} placeholder="House No., Street" /></div>
            <div>
              <label className={labelClass}>City/Municipality</label>
              <select value={phCity} onChange={(e) => setPhCity(e.target.value)} className={inputClass}>
                {PH_CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Gender</label>
              <div className="flex space-x-3 pt-2">
                {(['Male', 'Female'] as const).map((g) => (
                  <label key={g} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input type="radio" checked={gender === g} onChange={() => setGender(g)} className="accent-[#002f6c]" /><span>{g}</span>
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
              <label className={labelClass}>Birthdate {age !== null && <span className="text-[#002f6c]">&middot; {age} yrs old</span>}</label>
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
                    <input type="radio" checked={natureOfEmployment === n} onChange={() => setNatureOfEmployment(n)} className="accent-[#002f6c]" /><span>{n}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Type of Package</label>
              <div className="flex flex-col space-y-1.5 pt-1">
                {(['Land-based', 'Sea-based'] as const).map((t) => (
                  <label key={t} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input type="radio" checked={coverageType === t} onChange={() => setCoverageType(t)} className="accent-[#002f6c]" /><span>{t}</span>
                  </label>
                ))}
              </div>
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
            <div><label className={labelClass}>Insurance Start Date</label><input required type="date" value={insuranceStart} onChange={(e) => setInsuranceStart(e.target.value)} className={inputClass} /></div>
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
                <input type="checkbox" checked={conflictAcknowledged} onChange={(e) => setConflictAcknowledged(e.target.checked)} className="accent-[#002f6c]" />
                <span className="font-bold text-amber-800 dark:text-amber-300">I understand and would like to proceed.</span>
              </label>
            </div>
          )}
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
  lastName, firstName, middleName, gender, civilStatus, birthdate, phAddress, phCity, phone, email, referralSource,
  natureOfEmployment, coverageType, occupation, passportNumber, salaryAmount, salaryCurrency, employerName, employerCountry,
  contractStart, contractEnd, insuranceStart, premiumValue, documentsUploadedCount, onEdit, onConfirm,
}: {
  lastName: string;
  firstName: string;
  middleName: string;
  gender: 'Male' | 'Female';
  civilStatus: 'Single' | 'Married' | 'Widower' | 'Separated';
  birthdate: string;
  phAddress: string;
  phCity: string;
  phone: string;
  email: string;
  referralSource: string;
  natureOfEmployment: 'Direct-hired' | 'Balik-Manggagawa';
  coverageType: 'Land-based' | 'Sea-based';
  occupation: string;
  passportNumber: string;
  salaryAmount: string;
  salaryCurrency: 'PHP' | 'USD' | 'HKD' | 'Others';
  employerName: string;
  employerCountry: string;
  contractStart: string;
  contractEnd: string;
  insuranceStart: string;
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
          {row('Address', `${phAddress}, ${phCity}`.replace(/^,\s*/, '') || '-')}
          {row('Mobile Number', phone || '-')}
          {row('Email', email || '-')}
          {row('Referral Source', referralSource)}
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
          {row('Contract Period', contractStart && contractEnd ? `${contractStart} to ${contractEnd}` : '-')}
          {row('Insurance Start Date', insuranceStart || '-')}
          {row('Estimated Premium', <span className="text-[#002f6c]">${premiumValue.toFixed(2)}</span>)}
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
