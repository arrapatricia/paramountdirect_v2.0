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
const cardClass = 'bg-white border border-slate-200 rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800';
const sectionHeadingClass = 'text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 dark:text-white dark:border-slate-800';

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

  const premiumValue = getPremium(rates, policyType, mvType);

  const [step, setStep] = useState<'form' | 'review' | 'confirmed'>('form');
  const [submittedApp, setSubmittedApp] = useState<CtplApplication | null>(null);

  const canSubmit =
    ownerFirstName && ownerSurname && email && mobileNumber &&
    plateNumber && mvFileNumber && chassisNumber &&
    (sameAsOwner || (applicantFirstName && applicantSurname));

  const buildApplication = (): CtplApplication => ({
    id: `MCOC${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
    policyType, mvType, renewalType,
    clientType, ownerFirstName, ownerMiddleName, ownerSurname,
    sameAsOwner,
    applicantFirstName: sameAsOwner ? ownerFirstName : applicantFirstName,
    applicantSurname: sameAsOwner ? ownerSurname : applicantSurname,
    email, mobileNumber,
    plateNumber: plateNumber.toUpperCase(),
    mvFileNumber, chassisNumber: chassisNumber.toUpperCase(),
    requiresCOV,
    premium: `₱${premiumValue.toFixed(2)}`,
    dateReceived: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    status: 'Completed',
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

  if (step === 'confirmed' && submittedApp) {
    return (
      <div className="p-4 md:p-8 max-w-[700px] mx-auto font-sans text-slate-800 dark:text-slate-100">
        <div className={`${cardClass} text-center py-12`}>
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">Application Submitted</h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
            {submittedApp.ownerFirstName} {submittedApp.ownerSurname}'s CTPL application has been added to the queue.
          </p>
          <div className="mt-6 inline-flex flex-col items-start space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-5 py-4">
            <span>Reference No. <span className="font-black text-slate-900 dark:text-white">{submittedApp.id}</span></span>
            <span>Policy <span className="font-black text-slate-900 dark:text-white">{submittedApp.policyType} ({submittedApp.mvType})</span></span>
            <span>Premium <span className="font-black text-[#002f6c]">{submittedApp.premium}</span></span>
          </div>
          <div className="mt-8">
            <button onClick={onBack} className="px-6 py-2.5 rounded-xl bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold cursor-pointer shadow-md transition-all">
              Back to CTPL Applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[900px] mx-auto font-sans text-slate-800 dark:text-slate-100">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-y-2 space-x-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <button onClick={step === 'review' ? () => setStep('form') : onBack} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black uppercase tracking-wider text-[#002f6c] font-['Montserrat']">
            {step === 'review' ? 'Review Application' : 'NEW CTPL APPLICATION'}
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 dark:text-slate-400">
            {step === 'review' ? 'Check the details below before submitting.' : 'Based on the Compulsory Third Party Liability form at ctpl.ph'}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Estimated Premium</p>
          <p className="text-xl font-black text-[#002f6c]">₱{premiumValue.toFixed(2)}</p>
        </div>
      </div>

      {step === 'review' ? (
        <CtplReviewSummary
          renewalType={renewalType}
          policyType={policyType}
          mvType={mvType}
          clientType={clientType}
          ownerFirstName={ownerFirstName}
          ownerMiddleName={ownerMiddleName}
          ownerSurname={ownerSurname}
          sameAsOwner={sameAsOwner}
          applicantFirstName={applicantFirstName}
          applicantSurname={applicantSurname}
          email={email}
          mobileNumber={mobileNumber}
          plateNumber={plateNumber}
          mvFileNumber={mvFileNumber}
          chassisNumber={chassisNumber}
          requiresCOV={requiresCOV}
          premiumValue={premiumValue}
          onEdit={() => setStep('form')}
          onConfirm={handleConfirmSubmit}
        />
      ) : (
      <form onSubmit={handleReview} className="space-y-6 pb-10">

        {/* Choose Your Policy */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Choose Your Policy</h2>
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
            <span className="text-xl font-black text-[#002f6c]">₱ {premiumValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Personal Information */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Personal Information</h2>
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
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Vehicle Details</h2>
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

function CtplReviewSummary({
  renewalType, policyType, mvType, clientType, ownerFirstName, ownerMiddleName, ownerSurname,
  sameAsOwner, applicantFirstName, applicantSurname, email, mobileNumber,
  plateNumber, mvFileNumber, chassisNumber, requiresCOV, premiumValue, onEdit, onConfirm,
}: {
  renewalType: 'New (1 Year)' | 'Renewal';
  policyType: typeof CTPL_POLICY_TYPES[number];
  mvType: string;
  clientType: 'Individual' | 'Corporate without assignee' | 'Corporate with assignee';
  ownerFirstName: string;
  ownerMiddleName: string;
  ownerSurname: string;
  sameAsOwner: boolean;
  applicantFirstName: string;
  applicantSurname: string;
  email: string;
  mobileNumber: string;
  plateNumber: string;
  mvFileNumber: string;
  chassisNumber: string;
  requiresCOV: boolean;
  premiumValue: number;
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
        <h2 className={sectionHeadingClass}>Choose Your Policy</h2>
        <div className="text-xs">
          {row('Renewal', renewalType)}
          {row('Policy Type', policyType)}
          {row('LTO MV Type', mvType)}
          {row('Estimated Premium', <span className="text-[#002f6c]">₱{premiumValue.toFixed(2)}</span>)}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className={sectionHeadingClass}>Personal Information</h2>
        <div className="text-xs">
          {row('Client Type', clientType)}
          {row('Registered Owner', `${ownerFirstName} ${ownerMiddleName} ${ownerSurname}`.replace(/\s+/g, ' ').trim())}
          {row('Applicant', sameAsOwner ? 'Same as Registered Owner' : `${applicantFirstName} ${applicantSurname}`.trim())}
          {row('Email', email || '-')}
          {row('Mobile Number', mobileNumber || '-')}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className={sectionHeadingClass}>Vehicle Details</h2>
        <div className="text-xs">
          {row('Plate Number', plateNumber ? plateNumber.toUpperCase() : '-')}
          {row('MV File Number', mvFileNumber || '-')}
          {row('Serial/Chassis Number', chassisNumber ? chassisNumber.toUpperCase() : '-')}
          {row('Requires COV', requiresCOV ? 'Yes (+₱60.00)' : 'No')}
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
