import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import { CTPL_MV_TYPES_BY_POLICY, CTPL_POLICY_TYPES, COV_FEE, type CtplApplication } from './ctpl_types';
import { CTPL_VEHICLE_YEARS, CTPL_VEHICLE_MAKERS } from './ctpl_vehicle_reference';
import { getPremiumRate, type PremiumRate } from './premium_rates';
import { PH_REGIONS, citiesForRegion, GENERIC_BARANGAYS } from './ph_geography';

interface Props {
  onCreate: (app: CtplApplication) => void | Promise<void>;
  onBack: () => void;
  currentUser: string;
  rates: PremiumRate[];
}

const getPremium = (rates: PremiumRate[], policyType: string, mvType: string, renewalType: string) =>
  !policyType || !mvType ? 0 : getPremiumRate(rates, 'CTPL', `${policyType}|${mvType}|${renewalType}`, getPremiumRate(rates, 'CTPL', 'default', 606));

const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const labelClass = 'text-xs font-bold text-slate-700 block mb-1 dark:text-slate-300';
const cardClass = 'bg-white border border-slate-200 rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800';
const sectionHeadingClass = 'text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 dark:text-white dark:border-slate-800';

export default function CtplCreateApplication({ onCreate, onBack, currentUser, rates }: Props) {
  const [renewalType, setRenewalType] = useState<'1 Year' | '3 Years'>('1 Year');
  const [policyType, setPolicyType] = useState<typeof CTPL_POLICY_TYPES[number] | ''>('');
  const [mvType, setMvType] = useState('');

  const [clientType, setClientType] = useState<'Individual' | 'Corporate without assignee' | 'Corporate with assignee'>('Individual');
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerMiddleName, setOwnerMiddleName] = useState('');
  const [ownerSurname, setOwnerSurname] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [ownerRegion, setOwnerRegion] = useState(PH_REGIONS[0].name);
  const [ownerCity, setOwnerCity] = useState(citiesForRegion(PH_REGIONS[0].name)[0]);
  const [ownerBarangay, setOwnerBarangay] = useState(GENERIC_BARANGAYS[0]);
  const [sameAsOwner, setSameAsOwner] = useState(true);
  const [applicantFirstName, setApplicantFirstName] = useState('');
  const [applicantSurname, setApplicantSurname] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const [plateNumber, setPlateNumber] = useState('');
  const [mvFileNumber, setMvFileNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleSeries, setVehicleSeries] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehicleBodyType, setVehicleBodyType] = useState('');
  const [motorNumber, setMotorNumber] = useState('');
  const [authorizedCapacity, setAuthorizedCapacity] = useState('');
  const [unladenWeight, setUnladenWeight] = useState('');
  const [requiresCOV, setRequiresCOV] = useState(false);
  const [forPublicUse, setForPublicUse] = useState(false);

  const premiumValue = getPremium(rates, policyType, mvType, renewalType);
  const totalDue = premiumValue + (requiresCOV ? COV_FEE : 0);

  const [step, setStep] = useState<'form' | 'review' | 'confirmed'>('form');
  const [submittedApp, setSubmittedApp] = useState<CtplApplication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit =
    policyType && mvType &&
    ownerFirstName && ownerSurname && ownerAddress && email && mobileNumber &&
    plateNumber && mvFileNumber && chassisNumber &&
    vehicleYear && vehicleMake && vehicleSeries &&
    (sameAsOwner || (applicantFirstName && applicantSurname));

  const buildApplication = (): CtplApplication => ({
    id: `MCOC${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
    policyType: policyType as typeof CTPL_POLICY_TYPES[number], mvType, renewalType,
    clientType, ownerFirstName, ownerMiddleName, ownerSurname,
    ownerAddress, ownerRegion, ownerCity, ownerBarangay,
    sameAsOwner,
    applicantFirstName: sameAsOwner ? ownerFirstName : applicantFirstName,
    applicantSurname: sameAsOwner ? ownerSurname : applicantSurname,
    email, mobileNumber,
    plateNumber: plateNumber.toUpperCase(),
    mvFileNumber, chassisNumber: chassisNumber.toUpperCase(),
    vehicleYear, vehicleMake, vehicleSeries,
    vehicleColor, vehicleBodyType, motorNumber: motorNumber.toUpperCase(),
    authorizedCapacity, unladenWeight,
    requiresCOV,
    forPublicUse: policyType === 'Motorcycle' && forPublicUse,
    premium: `₱${totalDue.toFixed(2)}`,
    dateReceived: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    status: 'Completed',
    screenedBy: currentUser,
    // Straight-through payment on the client's website - by the time it
    // reaches this admin system, it's already paid.
    isPaid: true,
  });

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmSubmit = async () => {
    const newApp = buildApplication();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onCreate(newApp);
      setSubmittedApp(newApp);
      setStep('confirmed');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit the application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            <span>Premium <span className="font-black text-[#002f6c] dark:text-[#49b1ea]">{submittedApp.premium}</span></span>
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
          <h1 className="text-xl font-black uppercase tracking-wider text-[#002f6c] dark:text-[#49b1ea] font-['Montserrat']">
            {step === 'review' ? 'Review Application' : 'NEW CTPL APPLICATION'}
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 dark:text-slate-400">
            {step === 'review' ? 'Check the details below before submitting.' : 'Based on the Compulsory Third Party Liability form at ctpl.ph'}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wide">{requiresCOV ? 'Total Amount Due' : 'Estimated Premium'}</p>
          <p className="text-xl font-black text-[#002f6c] dark:text-[#49b1ea]">₱{totalDue.toFixed(2)}</p>
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
          ownerAddress={ownerAddress}
          ownerRegion={ownerRegion}
          ownerCity={ownerCity}
          ownerBarangay={ownerBarangay}
          sameAsOwner={sameAsOwner}
          applicantFirstName={applicantFirstName}
          applicantSurname={applicantSurname}
          email={email}
          mobileNumber={mobileNumber}
          plateNumber={plateNumber}
          mvFileNumber={mvFileNumber}
          chassisNumber={chassisNumber}
          vehicleYear={vehicleYear}
          vehicleMake={vehicleMake}
          vehicleSeries={vehicleSeries}
          vehicleColor={vehicleColor}
          vehicleBodyType={vehicleBodyType}
          motorNumber={motorNumber}
          authorizedCapacity={authorizedCapacity}
          unladenWeight={unladenWeight}
          requiresCOV={requiresCOV}
          forPublicUse={forPublicUse}
          premiumValue={premiumValue}
          totalDue={totalDue}
          onEdit={() => setStep('form')}
          onConfirm={handleConfirmSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      ) : (
      <form onSubmit={handleReview} className="space-y-6 pb-10">

        {/* Choose Your Policy */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Choose Your Policy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Term</label>
              <select value={renewalType} onChange={(e) => setRenewalType(e.target.value as typeof renewalType)} className={inputClass}>
                <option>1 Year</option>
                <option>3 Years</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Policy Type</label>
              <select required value={policyType} onChange={(e) => { const v = e.target.value as typeof policyType; setPolicyType(v); setMvType(''); if (v !== 'Motorcycle') setForPublicUse(false); }} className={inputClass}>
                <option value="">-- Select --</option>
                {CTPL_POLICY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>LTO MV Type</label>
              <select required value={mvType} onChange={(e) => setMvType(e.target.value)} className={inputClass} disabled={!policyType}>
                <option value="">-- Select --</option>
                {(policyType ? CTPL_MV_TYPES_BY_POLICY[policyType] : []).map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {policyType === 'Motorcycle' && (
            <label className="flex items-center space-x-2 mt-4 cursor-pointer">
              <input type="checkbox" checked={forPublicUse} onChange={(e) => setForPublicUse(e.target.checked)} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">For Public Use (e.g. habal-habal / public utility motorcycle) &mdash; issued under its own LCOC policy series</span>
            </label>
          )}

          <div className="mt-4 p-4 rounded-xl bg-[#ebf3fc] flex items-center justify-between dark:bg-[#49b1ea]/10">
            <span className="text-xs font-bold text-slate-600 uppercase dark:text-slate-300">Base Premium</span>
            <span className="text-xl font-black text-[#002f6c] dark:text-[#49b1ea]">₱ {premiumValue.toFixed(2)}</span>
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

            <div className="md:col-span-3"><label className={labelClass}>Address (House No., Street)</label><input required value={ownerAddress} onChange={(e) => setOwnerAddress(e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Region</label>
              <select
                value={ownerRegion}
                onChange={(e) => { const r = e.target.value; setOwnerRegion(r); setOwnerCity(citiesForRegion(r)[0]); }}
                className={inputClass}
              >
                {PH_REGIONS.map((r) => <option key={r.name}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>City/Municipality</label>
              <select value={ownerCity} onChange={(e) => setOwnerCity(e.target.value)} className={inputClass}>
                {citiesForRegion(ownerRegion).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Barangay</label>
              <select value={ownerBarangay} onChange={(e) => setOwnerBarangay(e.target.value)} className={inputClass}>
                {GENERIC_BARANGAYS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className={labelClass}>Is the Applicant the same as the Registered Owner?</label>
              <div className="flex space-x-3 pt-1">
                {[true, false].map((val) => (
                  <label key={String(val)} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input type="radio" checked={sameAsOwner === val} onChange={() => setSameAsOwner(val)} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
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

          <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wide pt-4 pb-2 dark:text-slate-400">Vehicle Description</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Year Model</label>
              <select required value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} className={inputClass}>
                <option value="">-- Select --</option>
                {CTPL_VEHICLE_YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Vehicle Maker</label>
              <select required value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} className={inputClass}>
                <option value="">-- Select --</option>
                {CTPL_VEHICLE_MAKERS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Series</label>
              <input required value={vehicleSeries} onChange={(e) => setVehicleSeries(e.target.value)} className={inputClass} placeholder="ALTIS 1.8 G A/T" />
            </div>
            <div><label className={labelClass}>Color</label><input value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Body Type</label><input value={vehicleBodyType} onChange={(e) => setVehicleBodyType(e.target.value)} className={inputClass} placeholder="Sedan" /></div>
            <div><label className={labelClass}>Motor Number</label><input value={motorNumber} onChange={(e) => setMotorNumber(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Authorized Capacity</label><input value={authorizedCapacity} onChange={(e) => setAuthorizedCapacity(e.target.value)} className={inputClass} placeholder="5" /></div>
            <div><label className={labelClass}>Unladen Weight (kg)</label><input value={unladenWeight} onChange={(e) => setUnladenWeight(e.target.value)} className={inputClass} /></div>
          </div>

          <label className="flex items-center space-x-2 mt-4 cursor-pointer">
            <input type="checkbox" checked={requiresCOV} onChange={(e) => setRequiresCOV(e.target.checked)} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Requires Certificate of Validation (COV) &mdash; adds a ₱{COV_FEE.toFixed(2)} verification fee via DBP-DCI</span>
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
  ownerAddress, ownerRegion, ownerCity, ownerBarangay,
  sameAsOwner, applicantFirstName, applicantSurname, email, mobileNumber,
  plateNumber, mvFileNumber, chassisNumber,
  vehicleYear, vehicleMake, vehicleSeries, vehicleColor, vehicleBodyType, motorNumber, authorizedCapacity, unladenWeight,
  requiresCOV, forPublicUse, premiumValue, totalDue, onEdit, onConfirm, isSubmitting, submitError,
}: {
  renewalType: '1 Year' | '3 Years';
  policyType: typeof CTPL_POLICY_TYPES[number] | '';
  mvType: string;
  clientType: 'Individual' | 'Corporate without assignee' | 'Corporate with assignee';
  ownerFirstName: string;
  ownerMiddleName: string;
  ownerSurname: string;
  ownerAddress: string;
  ownerRegion: string;
  ownerCity: string;
  ownerBarangay: string;
  sameAsOwner: boolean;
  applicantFirstName: string;
  applicantSurname: string;
  email: string;
  mobileNumber: string;
  plateNumber: string;
  mvFileNumber: string;
  chassisNumber: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleSeries: string;
  vehicleColor: string;
  vehicleBodyType: string;
  motorNumber: string;
  authorizedCapacity: string;
  unladenWeight: string;
  requiresCOV: boolean;
  forPublicUse: boolean;
  premiumValue: number;
  totalDue: number;
  onEdit: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  submitError: string | null;
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
          {row('Term', renewalType)}
          {row('Policy Type', policyType)}
          {row('LTO MV Type', mvType)}
          {policyType === 'Motorcycle' && row('For Public Use', forPublicUse ? 'Yes (LCOC series)' : 'No')}
          {row('Base Premium', <span className="text-[#002f6c] dark:text-[#49b1ea]">₱{premiumValue.toFixed(2)}</span>)}
          {requiresCOV && row('COV Fee', <span className="text-[#002f6c] dark:text-[#49b1ea]">₱{COV_FEE.toFixed(2)}</span>)}
          {row('Total Amount Due', <span className="text-[#002f6c] dark:text-[#49b1ea]">₱{totalDue.toFixed(2)}</span>)}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className={sectionHeadingClass}>Personal Information</h2>
        <div className="text-xs">
          {row('Client Type', clientType)}
          {row('Registered Owner', `${ownerFirstName} ${ownerMiddleName} ${ownerSurname}`.replace(/\s+/g, ' ').trim())}
          {row('Owner Address', [ownerAddress, ownerBarangay !== 'N/A' ? ownerBarangay : null, ownerCity, ownerRegion].filter(Boolean).join(', ') || '-')}
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
          {row('Vehicle', [vehicleYear, vehicleMake, vehicleSeries].filter(Boolean).join(' ') || '-')}
          {row('Color / Body Type', [vehicleColor, vehicleBodyType].filter(Boolean).join(' / ') || '-')}
          {row('Motor Number', motorNumber ? motorNumber.toUpperCase() : '-')}
          {row('Authorized Capacity / Unladen Weight', [authorizedCapacity, unladenWeight ? `${unladenWeight} kg` : ''].filter(Boolean).join(' / ') || '-')}
          {row('Requires COV', requiresCOV ? `Yes (+₱${COV_FEE.toFixed(2)})` : 'No')}
        </div>
      </div>

      {submitError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs font-semibold text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300">
          {submitError} The application was not saved — please try again.
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <button type="button" onClick={onEdit} disabled={isSubmitting} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">
          Back to Edit
        </button>
        <button type="button" onClick={onConfirm} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold cursor-pointer shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
        </button>
      </div>
    </div>
  );
}
