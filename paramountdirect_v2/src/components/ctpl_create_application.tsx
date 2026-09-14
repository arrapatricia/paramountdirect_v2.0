import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import { CTPL_MV_TYPES, CTPL_POLICY_TYPES, type CtplApplication } from './ctpl_types';
import { getPremiumRate, type PremiumRate } from './premium_rates';

interface Props {
  onCreate: (app: CtplApplication) => void;
  onBack: () => void;
  currentUser: string;
  rates: PremiumRate[];
}

const getPremium = (rates: PremiumRate[], policyType: string, mvType: string) =>
  getPremiumRate(rates, 'CTPL', `${policyType}|${mvType}`, getPremiumRate(rates, 'CTPL', 'default', 606));

const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const labelClass = 'text-xs font-bold text-slate-700 block mb-1 dark:text-slate-300';

export default function CtplCreateApplication({ onCreate, onBack, currentUser, rates }: Props) {
  const [renewalType, setRenewalType] = useState<'New (1 Year)' | 'Renewal'>('New (1 Year)');
  const [policyType, setPolicyType] = useState<typeof CTPL_POLICY_TYPES[number]>('Private Car');
  const [mvType, setMvType] = useState(CTPL_MV_TYPES[0]);

  const [clientType, setClientType] = useState<'Individual' | 'Corporate without assignee' | 'Corporate with assignee'>('Individual');
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerMiddleName, setOwnerMiddleName] = useState('');
  const [ownerSurname, setOwnerSurname] = useState('');
  const [sameAsOwner, setSameAsOwner] = useState(true);
  const [applicantFirstName, setApplicantFirstName] = useState('');
  const [applicantSurname, setApplicantSurname] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const [plateNumber, setPlateNumber] = useState('');
  const [mvFileNumber, setMvFileNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [requiresCOV, setRequiresCOV] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const premium = getPremium(rates, policyType, mvType);

  const canSubmit =
    ownerFirstName && ownerSurname && email && mobileNumber &&
    plateNumber && mvFileNumber && chassisNumber &&
    (sameAsOwner || (applicantFirstName && applicantSurname));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const newApp: CtplApplication = {
      id: `CTP${Math.floor(10000 + Math.random() * 90000)}`,
      policyType, mvType, renewalType,
      clientType, ownerFirstName, ownerMiddleName, ownerSurname,
      sameAsOwner,
      applicantFirstName: sameAsOwner ? ownerFirstName : applicantFirstName,
      applicantSurname: sameAsOwner ? ownerSurname : applicantSurname,
      email, mobileNumber,
      plateNumber: plateNumber.toUpperCase(),
      mvFileNumber, chassisNumber: chassisNumber.toUpperCase(),
      requiresCOV,
      premium: `₱${premium.toFixed(2)}`,
      dateReceived: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      status: 'Completed',
      screenedBy: currentUser,
    };

    onCreate(newApp);
    setSubmitted(true);
    setTimeout(() => onBack(), 1200);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[900px] mx-auto font-sans text-slate-800 dark:text-slate-100">

      {submitted && (
        <div className="fixed top-6 right-6 z-[100] p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>Application submitted and added to the queue.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-y-2 space-x-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <button onClick={onBack} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider text-[#002f6c] font-['Montserrat']">
            NEW CTPL APPLICATION
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 dark:text-slate-400">Based on the Compulsory Third Party Liability form at ctpl.ph</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-10">

        {/* Choose Your Policy */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 dark:text-white dark:border-slate-800">Choose Your Policy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Renewal</label>
              <select value={renewalType} onChange={(e) => setRenewalType(e.target.value as typeof renewalType)} className={inputClass}>
                <option>New (1 Year)</option>
                <option>Renewal</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Policy Type</label>
              <select value={policyType} onChange={(e) => { setPolicyType(e.target.value as typeof policyType); setMvType(CTPL_MV_TYPES[0]); }} className={inputClass}>
                {CTPL_POLICY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>LTO MV Type</label>
              <select value={mvType} onChange={(e) => setMvType(e.target.value)} className={inputClass}>
                {CTPL_MV_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-[#ebf3fc] flex items-center justify-between dark:bg-[#49b1ea]/10">
            <span className="text-xs font-bold text-slate-600 uppercase dark:text-slate-300">Premium</span>
            <span className="text-xl font-black text-[#002f6c]">₱ {premium.toFixed(2)}</span>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 dark:text-white dark:border-slate-800">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Client Type</label>
              <select value={clientType} onChange={(e) => setClientType(e.target.value as typeof clientType)} className={inputClass}>
                <option>Individual</option>
                <option>Corporate without assignee</option>
                <option>Corporate with assignee</option>
              </select>
            </div>
            <div><label className={labelClass}>Email Address</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Mobile Number</label><input required value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className={inputClass} placeholder="09XXXXXXXXX" /></div>

            <div className="md:col-span-3 text-xs font-extrabold text-slate-500 uppercase tracking-wide pt-2 dark:text-slate-400">Registered Owner's Information</div>
            <div><label className={labelClass}>First Name</label><input required value={ownerFirstName} onChange={(e) => setOwnerFirstName(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Middle Name</label><input value={ownerMiddleName} onChange={(e) => setOwnerMiddleName(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Surname</label><input required value={ownerSurname} onChange={(e) => setOwnerSurname(e.target.value)} className={inputClass} /></div>

            <div className="md:col-span-3">
              <label className={labelClass}>Is the Applicant the same as the Registered Owner?</label>
              <div className="flex space-x-3 pt-1">
                {[true, false].map((val) => (
                  <label key={String(val)} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input type="radio" checked={sameAsOwner === val} onChange={() => setSameAsOwner(val)} className="accent-[#002f6c]" />
                    <span>{val ? 'Yes' : 'No'}</span>
                  </label>
                ))}
              </div>
            </div>

            {!sameAsOwner && (
              <>
                <div><label className={labelClass}>Applicant First Name</label><input required value={applicantFirstName} onChange={(e) => setApplicantFirstName(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Applicant Surname</label><input required value={applicantSurname} onChange={(e) => setApplicantSurname(e.target.value)} className={inputClass} /></div>
              </>
            )}
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 dark:text-white dark:border-slate-800">Vehicle Details</h2>
          <p className="text-[10px] font-semibold text-slate-400 mb-4 flex items-start space-x-1.5 dark:text-slate-500">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Vehicle details can be found on the Certificate of Registration. Incorrect details will delay the application.</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Plate Number</label>
              <input required value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} className={inputClass} placeholder="ABC 1234" />
              <p className="text-[10px] text-slate-400 mt-1 dark:text-slate-500">6-7 alphanumeric characters</p>
            </div>
            <div>
              <label className={labelClass}>MV File Number</label>
              <input required value={mvFileNumber} onChange={(e) => setMvFileNumber(e.target.value)} className={inputClass} placeholder="1301-00001002045" />
              <p className="text-[10px] text-slate-400 mt-1 dark:text-slate-500">15 numeric digits</p>
            </div>
            <div>
              <label className={labelClass}>Serial/Chassis Number</label>
              <input required value={chassisNumber} onChange={(e) => setChassisNumber(e.target.value)} className={inputClass} placeholder="JT4BR38J2R0123456" />
              <p className="text-[10px] text-slate-400 mt-1 dark:text-slate-500">17 alphanumeric characters</p>
            </div>
          </div>

          <label className="flex items-center space-x-2 mt-4 cursor-pointer">
            <input type="checkbox" checked={requiresCOV} onChange={(e) => setRequiresCOV(e.target.checked)} className="accent-[#002f6c]" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Requires Certificate of Validation (COV) &mdash; adds a ₱60.00 verification fee via DBP-DCI</span>
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button type="button" onClick={onBack} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
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
