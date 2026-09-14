import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldAlert, Info } from 'lucide-react';
import {
  GTP_PLAN_VARIANTS, SCHENGEN_COUNTRIES, HIGH_COST_DESTINATIONS, POPULAR_DESTINATIONS,
  type GtpApplication,
} from './gtp_types';
import { getPremiumRate, type PremiumRate } from './premium_rates';

interface Props {
  onCreate: (app: GtpApplication) => void;
  onBack: () => void;
  currentUser: string;
  rates: PremiumRate[];
}

const calculateAge = (dobString: string) => {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

const calculateDays = (start: string, end: string) => {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
};

const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const labelClass = 'text-xs font-bold text-slate-700 block mb-1 dark:text-slate-300';

export default function GtpCreateApplication({ onCreate, onBack, currentUser, rates }: Props) {
  const [travelType, setTravelType] = useState<'International' | 'Domestic'>('International');
  const [destinations, setDestinations] = useState<string[]>([POPULAR_DESTINATIONS[0]]);
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [applicationType, setApplicationType] = useState<'Individual' | 'Family'>('Individual');

  const [travelerFirstName, setTravelerFirstName] = useState('');
  const [travelerSurname, setTravelerSurname] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const [planVariant, setPlanVariant] = useState<typeof GTP_PLAN_VARIANTS[number]>('Single Trip');
  const [cruiseCoverage, setCruiseCoverage] = useState(false);
  const [hazardousSportsCoverage, setHazardousSportsCoverage] = useState(false);
  const [schengenAcknowledged, setSchengenAcknowledged] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const age = calculateAge(birthdate);
  const daysOfTravel = calculateDays(departureDate, returnDate);
  const isSchengenDestination = destinations.some((d) => SCHENGEN_COUNTRIES.includes(d));
  const isHighCostDestination = destinations.some((d) => HIGH_COST_DESTINATIONS.includes(d));
  const isSeniorApplicant = age !== null && age > 65;

  const dailyRateFallback = planVariant === 'Single Trip' ? 55 : planVariant === 'Multi-Trip 90' ? 42 : 38;
  const basePremium = Math.max(1, daysOfTravel) * getPremiumRate(rates, 'GTP', planVariant, dailyRateFallback);
  const addOnFee =
    (cruiseCoverage ? getPremiumRate(rates, 'GTP', 'cruiseCoverage', 150) : 0) +
    (hazardousSportsCoverage ? getPremiumRate(rates, 'GTP', 'hazardousSportsCoverage', 200) : 0);
  const premium = basePremium + addOnFee;

  const canSubmit =
    travelerFirstName && travelerSurname && birthdate && email && mobileNumber &&
    departureDate && returnDate && destinations.length > 0 &&
    !isSeniorApplicant &&
    (!isSchengenDestination || schengenAcknowledged);

  const toggleDestination = (country: string) => {
    setDestinations((prev) => prev.includes(country) ? prev.filter((d) => d !== country) : [...prev, country]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const newApp: GtpApplication = {
      id: `GTP${Math.floor(10000 + Math.random() * 90000)}`,
      travelType, destinations, departureDate, returnDate, daysOfTravel, applicationType,
      travelerFirstName, travelerSurname, birthdate, email, mobileNumber,
      planVariant, cruiseCoverage, hazardousSportsCoverage, isSchengenDestination,
      premium: `₱${premium.toFixed(2)}`,
      dateReceived: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      status: 'Received',
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
            NEW GTP APPLICATION
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 dark:text-slate-400">Based on the Global Travel Protect Premium form at yourtravelinsurance.ph</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-10">

        {/* Travel Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 dark:text-white dark:border-slate-800">Travel Details</h2>

          <div className="mb-4">
            <label className={labelClass}>Travel Type</label>
            <div className="flex flex-wrap gap-2">
              {(['International', 'Domestic'] as const).map((t) => (
                <label key={t} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer ${travelType === t ? 'border-[#49b1ea] bg-[#ebf3fc] dark:bg-[#49b1ea]/10' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>
                  <input type="radio" checked={travelType === t} onChange={() => setTravelType(t)} className="accent-[#002f6c]" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className={labelClass}>Country Destination(s)</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {POPULAR_DESTINATIONS.map((country) => (
                <label key={country} className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-lg border cursor-pointer text-[11px] ${destinations.includes(country) ? 'border-[#49b1ea] bg-[#ebf3fc] dark:bg-[#49b1ea]/10' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>
                  <input type="checkbox" checked={destinations.includes(country)} onChange={() => toggleDestination(country)} className="accent-[#002f6c]" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{country}</span>
                </label>
              ))}
            </div>
            {isHighCostDestination && (
              <p className="text-[10px] font-semibold text-amber-700 mt-2 flex items-center space-x-1 dark:text-amber-400">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>High cost-of-living destination selected — make sure coverage amounts are correctly indicated.</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={labelClass}>Departure Date</label><input required type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Return Date</label><input required type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Days of Travel</label>
              <input readOnly value={daysOfTravel} className={`${inputClass} bg-slate-100 dark:bg-slate-700`} />
            </div>

            <div>
              <label className={labelClass}>Application Type</label>
              <select value={applicationType} onChange={(e) => setApplicationType(e.target.value as typeof applicationType)} className={inputClass}>
                <option>Individual</option>
                <option>Family</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Plan</label>
              <select value={planVariant} onChange={(e) => setPlanVariant(e.target.value as typeof planVariant)} className={inputClass}>
                {GTP_PLAN_VARIANTS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {isSchengenDestination && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-2 dark:bg-amber-950/30 dark:border-amber-800">
              <div className="flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  SCHENGEN requires €30,000 or ₱2.5M coverage for medical emergencies. Make sure this application is compliant before proceeding.
                </p>
              </div>
              <label className="flex items-center space-x-2 pl-6 cursor-pointer">
                <input type="checkbox" checked={schengenAcknowledged} onChange={(e) => setSchengenAcknowledged(e.target.checked)} className="accent-[#002f6c]" />
                <span className="font-bold text-amber-800 dark:text-amber-300">Coverage amount confirmed compliant.</span>
              </label>
            </div>
          )}
        </div>

        {/* Traveler Information */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 dark:text-white dark:border-slate-800">Traveler Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={labelClass}>First Name</label><input required value={travelerFirstName} onChange={(e) => setTravelerFirstName(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Surname</label><input required value={travelerSurname} onChange={(e) => setTravelerSurname(e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Birthdate {age !== null && <span className={isSeniorApplicant ? 'text-rose-600' : 'text-[#002f6c]'}>&middot; {age} yrs old</span>}</label>
              <input required type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className={inputClass} />
            </div>
            <div><label className={labelClass}>Email Address</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Mobile Number</label><input required value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className={inputClass} placeholder="09XXXXXXXXX" /></div>
          </div>

          {isSeniorApplicant && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-300 text-xs dark:bg-rose-950/30 dark:border-rose-800">
              <p className="font-semibold text-rose-800 dark:text-rose-300">
                Applicants aged 66 and up cannot apply through this form. Please email yourtravelinsurance@paramount.com.ph with the traveler's full name, date of birth, destination, mobile number, and travel dates for manual assistance.
              </p>
            </div>
          )}
        </div>

        {/* Add-ons */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 dark:text-white dark:border-slate-800">Extra Protection</h2>
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={cruiseCoverage} onChange={(e) => setCruiseCoverage(e.target.checked)} className="accent-[#002f6c]" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cruise Coverage &mdash; for International Cruise Programs</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={hazardousSportsCoverage} onChange={(e) => setHazardousSportsCoverage(e.target.checked)} className="accent-[#002f6c]" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hazardous Non-Professional &amp; Non-Competition Sports Coverage &mdash; winter sports, gymnastics, scuba diving, etc.</span>
            </label>
          </div>
        </div>

        {/* Premium Summary */}
        <div className="p-4 rounded-xl bg-[#ebf3fc] flex items-center justify-between dark:bg-[#49b1ea]/10">
          <span className="text-xs font-bold text-slate-600 uppercase dark:text-slate-300">Premium</span>
          <span className="text-xl font-black text-[#002f6c]">₱ {premium.toFixed(2)}</span>
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
