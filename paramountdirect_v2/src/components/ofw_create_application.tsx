import React, { useState } from 'react';
import { ArrowLeft, UploadCloud, FileCheck2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CONFLICT_ZONE_COUNTRIES, OFW_OCCUPATIONS, type OfwApplication } from './ofw_types';

interface Props {
  onCreate: (app: OfwApplication) => void;
  onBack: () => void;
  currentUser: string;
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

// Flat annual premium by coverage type - the live form computes this from
// age/occupation/term, but this mirrors the two coverage-type rate tiers.
const PREMIUM_BY_COVERAGE: Record<'Land-based' | 'Sea-based', number> = {
  'Land-based': 42,
  'Sea-based': 58,
};

const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] focus:border-transparent';
const labelClass = 'text-xs font-bold text-slate-700 block mb-1';

export default function OfwCreateApplication({ onCreate, onBack, currentUser }: Props) {
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

  const [submitted, setSubmitted] = useState(false);

  const age = calculateAge(birthdate);
  const isConflictZone = CONFLICT_ZONE_COUNTRIES.includes(employerCountry);
  const allDocsUploaded = documents.passport && documents.visa && documents.employmentContract && documents.medicalCertificate;

  const canSubmit =
    lastName && firstName && phAddress && birthdate && placeOfBirth && phone && email &&
    passportNumber && salaryAmount && employerName &&
    contractStart && contractEnd && insuranceStart &&
    (!isConflictZone || conflictAcknowledged);

  const handleFileChange = (key: keyof typeof documents) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocuments(prev => ({ ...prev, [key]: e.target.files?.[0] || null }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const premiumValue = PREMIUM_BY_COVERAGE[coverageType];
    const newApp: OfwApplication = {
      id: `OFW${Math.floor(10000 + Math.random() * 90000)}`,
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
    };

    onCreate(newApp);
    setSubmitted(true);
    setTimeout(() => onBack(), 1200);
  };

  const DocUploadField = ({ label, docKey }: { label: string; docKey: keyof typeof documents }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <label className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
        documents[docKey] ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-[#49b1ea]'
      }`}>
        {documents[docKey] ? <FileCheck2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <UploadCloud className="w-4 h-4 text-slate-400 flex-shrink-0" />}
        <span className={`text-xs font-semibold truncate ${documents[docKey] ? 'text-emerald-700' : 'text-slate-500'}`}>
          {documents[docKey]?.name || 'Choose file (PDF, JPEG, PNG, GIF)'}
        </span>
        <input type="file" accept=".pdf,.jpeg,.jpg,.png,.gif" className="hidden" onChange={handleFileChange(docKey)} />
      </label>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1000px] mx-auto font-sans text-slate-800">

      {submitted && (
        <div className="fixed top-6 right-6 z-[100] p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>Application submitted and added to the queue.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center space-x-4 border-b border-slate-200 pb-4">
        <button onClick={onBack} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider text-[#002f6c] font-['Montserrat']">
            NEW OFW APPLICATION
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1">Based on the OFW Compulsory Insurance form at ofwinsurance.ph</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-10">

        {/* Referral */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">How did you learn about Paramount Life &amp; General Insurance Corp.?</h2>
          <div className="flex flex-wrap gap-3 text-xs">
            {['Facebook', 'Google', 'Paramount Website', 'POEA/POLO', 'Referral', 'Others'].map((src) => (
              <label key={src} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer ${referralSource === src ? 'border-[#49b1ea] bg-[#ebf3fc]' : 'border-slate-200 bg-slate-50'}`}>
                <input type="radio" name="referral" checked={referralSource === src} onChange={() => setReferralSource(src)} className="accent-[#002f6c]" />
                <span className="font-semibold text-slate-700">{src}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Personal Information</h2>
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
                  <label key={g} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
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
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Employment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Nature of Employment</label>
              <div className="flex flex-col space-y-1.5 pt-1">
                {(['Direct-hired', 'Balik-Manggagawa'] as const).map((n) => (
                  <label key={n} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                    <input type="radio" checked={natureOfEmployment === n} onChange={() => setNatureOfEmployment(n)} className="accent-[#002f6c]" /><span>{n}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Type of Package</label>
              <div className="flex flex-col space-y-1.5 pt-1">
                {(['Land-based', 'Sea-based'] as const).map((t) => (
                  <label key={t} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
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
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-2">
              <div className="flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="font-semibold text-amber-800">
                  Ang bansang pinili ay kasalukuyang nasa listahan ng mga countries with ongoing conflict. Some benefits may be limited, ngunit mahalaga pa rin sa amin ang iyong proteksyon.
                </p>
              </div>
              <label className="flex items-center space-x-2 pl-6 cursor-pointer">
                <input type="checkbox" checked={conflictAcknowledged} onChange={(e) => setConflictAcknowledged(e.target.checked)} className="accent-[#002f6c]" />
                <span className="font-bold text-amber-800">I understand and would like to proceed.</span>
              </label>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Required Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DocUploadField label="Passport" docKey="passport" />
            <DocUploadField label="Working Visa" docKey="visa" />
            <DocUploadField label="Employment Contract" docKey="employmentContract" />
            <DocUploadField label="Medical Certificate" docKey="medicalCertificate" />
          </div>
          {!allDocsUploaded && (
            <p className="text-[10px] font-semibold text-slate-400 mt-3">Documents can be uploaded later during screening if not available now.</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onBack} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-6 py-2.5 rounded-xl bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );
}
