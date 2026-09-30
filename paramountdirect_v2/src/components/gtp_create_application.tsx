import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldAlert, Info, X, ChevronDown, AlertTriangle } from 'lucide-react';
import {
  GTP_PLAN_VARIANTS, SCHENGEN_COUNTRIES, HIGH_COST_DESTINATIONS, POPULAR_DESTINATIONS, ALL_COUNTRIES,
  GTP_ADULT_COMPANION_RELATIONSHIPS,
  type GtpApplication, type GtpCompanion, type GtpCompanionRelationship,
} from './gtp_types';
import { getPremiumRate, getGtpSingleTripRate, getGtpMultiTripRate, type PremiumRate, type GtpDestinationCategory } from './premium_rates';
import { PH_REGIONS, citiesForRegion, barangaysForCity } from './ph_geography';

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

const addDays = (start: string, days: number) => {
  if (!start) return '';
  const d = new Date(start);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const MULTI_TRIP_COVERAGE_DAYS = 365;
// Short Term Period cap per the Tips & Guidelines (International Trip /
// Domestic Plan via Air): up to 180 consecutive days.
const SINGLE_TRIP_MAX_DAYS = 180;
const MAX_CHILD_COMPANIONS = 3;
// "2 adults" in the Family Plan's 5-person cap includes the main insured,
// so at most 1 more adult-relationship companion (Spouse/Parent/Fiancé/Guardian).
const MAX_ADULT_COMPANIONS = 1;

const isCompanionAgeValid = (relationship: GtpCompanionRelationship, age: number) =>
  GTP_ADULT_COMPANION_RELATIONSHIPS.includes(relationship) ? (age >= 18 && age <= 65) : (age >= 0 && age <= 21);

const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const labelClass = 'text-xs font-bold text-slate-700 block mb-1 dark:text-slate-300';
const cardClass = 'bg-white border border-slate-200 rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800';
const sectionHeadingClass = 'text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 dark:text-white dark:border-slate-800';

export default function GtpCreateApplication({ onCreate, onBack, currentUser, rates }: Props) {
  const [travelType, setTravelType] = useState<'International' | 'Domestic'>('International');
  const [destinations, setDestinations] = useState<string[]>([POPULAR_DESTINATIONS[0]]);
  const [domesticRegion, setDomesticRegion] = useState(PH_REGIONS[0].name);
  const [domesticCity, setDomesticCity] = useState(citiesForRegion(PH_REGIONS[0].name)[0]);
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [applicationType, setApplicationType] = useState<'Individual' | 'Family'>('Individual');
  const [companions, setCompanions] = useState<GtpCompanion[]>([]);
  const [companionName, setCompanionName] = useState('');
  const [companionRelationship, setCompanionRelationship] = useState<GtpCompanionRelationship>('Child');
  const [companionAge, setCompanionAge] = useState('');
  const [companionError, setCompanionError] = useState('');
  const [showTips, setShowTips] = useState(false);

  const [travelerFirstName, setTravelerFirstName] = useState('');
  const [travelerSurname, setTravelerSurname] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [phAddress, setPhAddress] = useState('');
  const [phRegion, setPhRegion] = useState(PH_REGIONS[0].name);
  const [phCity, setPhCity] = useState(citiesForRegion(PH_REGIONS[0].name)[0]);
  const [phBarangay, setPhBarangay] = useState(() => barangaysForCity(citiesForRegion(PH_REGIONS[0].name)[0])[0]);

  const [planVariant, setPlanVariant] = useState<typeof GTP_PLAN_VARIANTS[number]>('Single Trip');
  const [cruiseCoverage, setCruiseCoverage] = useState(false);
  const [hazardousSportsCoverage, setHazardousSportsCoverage] = useState(false);

  const age = calculateAge(birthdate);
  const isMultiTrip = planVariant !== 'Single Trip';
  // Multi-Trip plans are a 365-day annual coverage period, not a specific
  // round-trip - there's no real return date to collect.
  const effectiveReturnDate = isMultiTrip ? addDays(departureDate, MULTI_TRIP_COVERAGE_DAYS) : returnDate;
  const daysOfTravel = isMultiTrip
    ? (departureDate ? MULTI_TRIP_COVERAGE_DAYS : 0)
    : calculateDays(departureDate, returnDate);
  const isSchengenDestination = destinations.some((d) => SCHENGEN_COUNTRIES.includes(d));
  const isHighCostDestination = destinations.some((d) => HIGH_COST_DESTINATIONS.includes(d));
  const isSeniorApplicant = age !== null && age > 65;
  const isMinorApplicant = age !== null && age <= 17;
  const childCompanionCount = companions.filter((c) => c.relationship === 'Child').length;
  const adultCompanionCount = companions.filter((c) => GTP_ADULT_COMPANION_RELATIONSHIPS.includes(c.relationship)).length;
  const familyCompanionRequirementMet = applicationType !== 'Family' || childCompanionCount >= 1;
  // Short Term Period cap (Tips & Guidelines) - only applies to Single Trip;
  // Multi-Trip's 365-day annual coverage is a different period entirely.
  const exceedsSingleTripMaxDays = !isMultiTrip && daysOfTravel > SINGLE_TRIP_MAX_DAYS;

  // Premium is priced off destination category (auto-detected: Including
  // USA/Canada/HK, Excluding, or Domestic) and days of travel - matches
  // Paramount's own GTPH Computation rate card.
  const destinationCategory: GtpDestinationCategory =
    travelType === 'Domestic' ? 'Domestic' : isHighCostDestination ? 'Including' : 'Excluding';
  // Don't show a premium until the trip is actually specified - departure
  // (and, for Single Trip, return) date is the trigger; without them
  // there's nothing real to price (Single Trip previously fell back to a
  // fabricated 1-day quote). Multi-Trip only needs a departure date since
  // its 365-day coverage period is fixed.
  const hasTravelDates = isMultiTrip ? departureDate !== '' : (departureDate !== '' && returnDate !== '' && daysOfTravel > 0);
  const basePremium = !hasTravelDates
    ? 0
    : planVariant === 'Single Trip'
      ? getGtpSingleTripRate(rates, destinationCategory, applicationType, daysOfTravel)
      : getGtpMultiTripRate(rates, planVariant, destinationCategory);
  // Cruise/Hazardous Sports Coverage are priced as a % of the base premium
  // (see premium_rates.ts), not a flat fee - matches how the live rate
  // calculator scales these add-ons with the selected plan.
  const addOnFee = !hasTravelDates ? 0 :
    basePremium * (
      (cruiseCoverage ? getPremiumRate(rates, 'GTP', 'cruiseCoveragePercent', 21.90) : 0) +
      (hazardousSportsCoverage ? getPremiumRate(rates, 'GTP', 'hazardousSportsCoveragePercent', 126.30) : 0)
    ) / 100;
  const premiumValue = basePremium + addOnFee;

  const [step, setStep] = useState<'form' | 'review' | 'confirmed'>('form');
  const [submittedApp, setSubmittedApp] = useState<GtpApplication | null>(null);

  const canSubmit = Boolean(
    travelerFirstName && travelerSurname && birthdate && email && mobileNumber && phAddress &&
    departureDate && (isMultiTrip || returnDate) && destinations.length > 0 &&
    !isSeniorApplicant && !exceedsSingleTripMaxDays &&
    (travelType !== 'International' || passportNumber) &&
    (!isMinorApplicant || guardianName) &&
    familyCompanionRequirementMet
  );

  const toggleDestination = (country: string) => {
    setDestinations((prev) => prev.includes(country) ? prev.filter((d) => d !== country) : [...prev, country]);
  };

  const addDomesticDestination = () => {
    const label = `${domesticCity}, ${domesticRegion}`;
    setDestinations((prev) => prev.includes(label) ? prev : [...prev, label]);
  };

  const addCompanion = () => {
    setCompanionError('');
    if (!companionName.trim()) return;
    const isAdultRelationship = GTP_ADULT_COMPANION_RELATIONSHIPS.includes(companionRelationship);
    if (isAdultRelationship && adultCompanionCount >= MAX_ADULT_COMPANIONS) {
      setCompanionError(`Family Plan allows at most ${MAX_ADULT_COMPANIONS} additional adult companion (2 adults total, including the insured).`);
      return;
    }
    if (!isAdultRelationship && childCompanionCount >= MAX_CHILD_COMPANIONS) {
      setCompanionError(`Family Plan allows at most ${MAX_CHILD_COMPANIONS} children.`);
      return;
    }
    const ageNum = Number(companionAge);
    if (!companionAge || !Number.isFinite(ageNum) || !isCompanionAgeValid(companionRelationship, ageNum)) {
      setCompanionError(isAdultRelationship ? 'Adult companions must be 18 to 65 years old.' : 'Child companions must be 0 to 21 years old.');
      return;
    }
    setCompanions((prev) => [...prev, { name: companionName.trim(), relationship: companionRelationship, age: ageNum }]);
    setCompanionName('');
    setCompanionAge('');
  };

  const removeCompanion = (index: number) => {
    setCompanions((prev) => prev.filter((_, i) => i !== index));
  };

  const buildApplication = (): GtpApplication => ({
    id: `GTPH-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
    travelType, destinations, departureDate, returnDate: effectiveReturnDate, daysOfTravel, applicationType,
    travelerFirstName, travelerSurname, birthdate, email, mobileNumber,
    passportNumber: travelType === 'International' ? passportNumber : undefined,
    guardianName: isMinorApplicant ? guardianName : undefined,
    phAddress, phRegion, phCity, phBarangay,
    companions: applicationType === 'Family' ? companions : undefined,
    planVariant, cruiseCoverage, hazardousSportsCoverage, isSchengenDestination,
    premium: `₱${premiumValue.toFixed(2)}`,
    dateReceived: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    status: 'Received',
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
            {submittedApp.travelerFirstName} {submittedApp.travelerSurname}'s GTP application has been added to the queue.
          </p>
          <div className="mt-6 inline-flex flex-col items-start space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-5 py-4">
            <span>Reference No. <span className="font-black text-slate-900 dark:text-white">{submittedApp.id}</span></span>
            <span>Plan <span className="font-black text-slate-900 dark:text-white">{submittedApp.planVariant}</span></span>
            <span>Premium <span className="font-black text-[#002f6c] dark:text-[#49b1ea]">{submittedApp.premium}</span></span>
          </div>
          <div className="mt-8">
            <button onClick={onBack} className="px-6 py-2.5 rounded-xl bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold cursor-pointer shadow-md transition-all">
              Back to GTP Applications
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
            {step === 'review' ? 'Review Application' : 'NEW GTP APPLICATION'}
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 dark:text-slate-400">
            {step === 'review' ? 'Check the details below before submitting.' : 'Based on the Global Travel Protect Premium form at yourtravelinsurance.ph'}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Estimated Premium</p>
          <p className="text-xl font-black text-[#002f6c] dark:text-[#49b1ea]">₱{premiumValue.toFixed(2)}</p>
        </div>
      </div>

      {step === 'review' ? (
        <GtpReviewSummary
          travelType={travelType}
          destinations={destinations}
          departureDate={departureDate}
          returnDate={effectiveReturnDate}
          daysOfTravel={daysOfTravel}
          isMultiTrip={isMultiTrip}
          applicationType={applicationType}
          travelerFirstName={travelerFirstName}
          travelerSurname={travelerSurname}
          birthdate={birthdate}
          email={email}
          mobileNumber={mobileNumber}
          passportNumber={passportNumber}
          guardianName={isMinorApplicant ? guardianName : ''}
          companions={applicationType === 'Family' ? companions : []}
          phAddress={phAddress}
          phRegion={phRegion}
          phCity={phCity}
          phBarangay={phBarangay}
          planVariant={planVariant}
          cruiseCoverage={cruiseCoverage}
          hazardousSportsCoverage={hazardousSportsCoverage}
          premiumValue={premiumValue}
          onEdit={() => setStep('form')}
          onConfirm={handleConfirmSubmit}
        />
      ) : (
      <form onSubmit={handleReview} className="space-y-6 pb-10">

        <GtpTipsAndGuidelines expanded={showTips} onToggle={() => setShowTips((v) => !v)} />

        {/* Travel Details */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Travel Details</h2>

          <div className="mb-4">
            <label className={labelClass}>Travel Type</label>
            <div className="flex flex-wrap gap-2">
              {(['International', 'Domestic'] as const).map((t) => (
                <label key={t} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer ${travelType === t ? 'border-[#49b1ea] bg-[#ebf3fc] dark:bg-[#49b1ea]/10' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>
                  <input type="radio" checked={travelType === t} onChange={() => { setTravelType(t); setDestinations([]); }} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {travelType === 'International' ? (
          <div className="mb-4">
            <label className={labelClass}>Country Destination(s)</label>

            {/* Quick picks for the most common destinations */}
            <div className="flex flex-wrap gap-2 mb-2">
              {POPULAR_DESTINATIONS.map((country) => (
                <button
                  type="button"
                  key={country}
                  onClick={() => toggleDestination(country)}
                  className={`px-2.5 py-1.5 rounded-lg border cursor-pointer text-[11px] font-semibold transition-colors ${destinations.includes(country) ? 'border-[#49b1ea] bg-[#ebf3fc] text-[#002f6c] dark:bg-[#49b1ea]/10 dark:text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#49b1ea] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  {country}
                </button>
              ))}
            </div>

            {/* Full country list, for anything not in the quick picks */}
            <select
              value=""
              onChange={(e) => { if (e.target.value) toggleDestination(e.target.value); }}
              className={inputClass}
            >
              <option value="">+ Add another country&hellip;</option>
              {ALL_COUNTRIES.filter((c) => !destinations.includes(c)).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Selected destinations */}
            {destinations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {destinations.map((country) => (
                  <span key={country} className="flex items-center space-x-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg bg-[#002f6c] text-white text-[11px] font-bold">
                    <span>{country}</span>
                    <button type="button" onClick={() => toggleDestination(country)} className="p-0.5 rounded hover:bg-white/20 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {isHighCostDestination && (
              <p className="text-[10px] font-semibold text-amber-700 mt-2 flex items-center space-x-1 dark:text-amber-400">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>USA / Canada / Hong Kong selected — the higher "Including" rate is automatically applied to this application.</span>
              </p>
            )}
          </div>
          ) : (
          <div className="mb-4">
            <label className={labelClass}>Domestic Destination(s)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={domesticRegion}
                onChange={(e) => { const r = e.target.value; setDomesticRegion(r); setDomesticCity(citiesForRegion(r)[0]); }}
                className={inputClass}
              >
                {PH_REGIONS.map((r) => <option key={r.name}>{r.name}</option>)}
              </select>
              <select value={domesticCity} onChange={(e) => setDomesticCity(e.target.value)} className={inputClass}>
                {citiesForRegion(domesticRegion).map((c) => <option key={c}>{c}</option>)}
              </select>
              <button type="button" onClick={addDomesticDestination} className="px-3 py-2 rounded-lg bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold cursor-pointer">
                + Add Destination
              </button>
            </div>

            {destinations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {destinations.map((place) => (
                  <span key={place} className="flex items-center space-x-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg bg-[#002f6c] text-white text-[11px] font-bold">
                    <span>{place}</span>
                    <button type="button" onClick={() => toggleDestination(place)} className="p-0.5 rounded hover:bg-white/20 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={labelClass}>Departure Date</label><input required type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className={inputClass} /></div>
            {isMultiTrip ? (
              <div>
                <label className={labelClass}>Coverage Ends</label>
                <input readOnly value={effectiveReturnDate} className={`${inputClass} bg-slate-100 dark:bg-slate-700`} />
              </div>
            ) : (
              <div><label className={labelClass}>Return Date</label><input required type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={inputClass} /></div>
            )}
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

          {isMultiTrip && (
            <p className="text-[10px] font-semibold text-slate-500 mt-3 flex items-center space-x-1 dark:text-slate-400">
              <Info className="w-3 h-3 flex-shrink-0" />
              <span>Multi-Trip plans provide 365 days of annual coverage — the return date is fixed and not collected per-trip.</span>
            </p>
          )}

          {exceedsSingleTripMaxDays && (
            <p className="text-[10px] font-semibold text-rose-600 mt-3 flex items-center space-x-1 dark:text-rose-400">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>Short Term Period cannot exceed {SINGLE_TRIP_MAX_DAYS} consecutive days. Please shorten the trip or apply for a Multi-Trip plan instead.</span>
            </p>
          )}

          {isSchengenDestination && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs dark:bg-emerald-950/30 dark:border-emerald-800">
              <div className="flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5 dark:text-emerald-400" />
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                  Schengen destination selected — the required €30,000 / ₱2.5M medical emergency coverage is automatically applied to this application. No further action needed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Traveler Information */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Traveler Information</h2>
          <p className="text-[10px] font-semibold text-amber-700 mb-4 -mt-2 flex items-center space-x-1 dark:text-amber-400">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span>Reminder: the insured's name cannot be endorsed once the electronic policy is issued — double-check spelling before submitting.</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={labelClass}>First Name</label><input required value={travelerFirstName} onChange={(e) => setTravelerFirstName(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Surname</label><input required value={travelerSurname} onChange={(e) => setTravelerSurname(e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Birthdate {age !== null && <span className={isSeniorApplicant ? 'text-rose-600' : 'text-[#002f6c] dark:text-[#49b1ea]'}>&middot; {age} yrs old</span>}</label>
              <input required type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className={inputClass} />
            </div>
            <div><label className={labelClass}>Email Address</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Mobile Number</label><input required value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className={inputClass} placeholder="09XXXXXXXXX" /></div>
            {travelType === 'International' && (
              <div><label className={labelClass}>Passport Number</label><input required value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} className={inputClass} /></div>
            )}
            {isMinorApplicant && (
              <div><label className={labelClass}>Guardian Name</label><input required value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className={inputClass} placeholder="Parent/legal guardian's full name" /></div>
            )}
            <div className="md:col-span-3"><label className={labelClass}>Philippine Address (House No., Street)</label><input required value={phAddress} onChange={(e) => setPhAddress(e.target.value)} className={inputClass} placeholder="House No., Street" /></div>
            <div>
              <label className={labelClass}>Region</label>
              <select
                value={phRegion}
                onChange={(e) => {
                  const r = e.target.value;
                  const c = citiesForRegion(r)[0];
                  setPhRegion(r);
                  setPhCity(c);
                  setPhBarangay(barangaysForCity(c)[0]);
                }}
                className={inputClass}
              >
                {PH_REGIONS.map((r) => <option key={r.name}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>City/Municipality</label>
              <select
                value={phCity}
                onChange={(e) => { const c = e.target.value; setPhCity(c); setPhBarangay(barangaysForCity(c)[0]); }}
                className={inputClass}
              >
                {citiesForRegion(phRegion).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Barangay</label>
              <select value={phBarangay} onChange={(e) => setPhBarangay(e.target.value)} className={inputClass}>
                {barangaysForCity(phCity).map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {isSeniorApplicant && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-300 text-xs dark:bg-rose-950/30 dark:border-rose-800">
              <p className="font-semibold text-rose-800 dark:text-rose-300">
                Applicants aged 66 and up cannot apply through this form. Please email yourtravelinsurance@paramount.com.ph with the traveler's full name, date of birth, destination, mobile number, and travel dates for manual assistance.
              </p>
            </div>
          )}
        </div>

        {/* Companion(s) - Family applications only */}
        {applicationType === 'Family' && (
          <div className={cardClass}>
            <h2 className={sectionHeadingClass}>Companion(s)</h2>
            <p className="text-[10px] font-semibold text-slate-500 mb-3 dark:text-slate-400">
              Family Plan covers a maximum of 5 persons: 2 adults (including the insured, 18&ndash;65 yrs old) and 3 children (0&ndash;21 yrs old). Eligible relationships: Spouse, Child, Parent, Fiancé, Guardian.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="md:col-span-2">
                <input value={companionName} onChange={(e) => setCompanionName(e.target.value)} className={inputClass} placeholder="Companion full name" />
              </div>
              <select value={companionRelationship} onChange={(e) => setCompanionRelationship(e.target.value as typeof companionRelationship)} className={inputClass}>
                <option>Child</option>
                <option>Spouse</option>
                <option>Parent</option>
                <option>Fiancé</option>
                <option>Guardian</option>
              </select>
              <div className="flex gap-2">
                <input type="number" min={0} max={65} value={companionAge} onChange={(e) => setCompanionAge(e.target.value)} className={inputClass} placeholder="Age" />
                <button type="button" onClick={addCompanion} className="px-3 py-2 rounded-lg bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold cursor-pointer whitespace-nowrap">
                  + Add
                </button>
              </div>
            </div>

            {companionError && (
              <p className="text-[10px] font-semibold text-rose-600 mt-2 flex items-center space-x-1 dark:text-rose-400">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>{companionError}</span>
              </p>
            )}

            {companions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {companions.map((c, i) => (
                  <span key={`${c.name}-${i}`} className="flex items-center space-x-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg bg-[#002f6c] text-white text-[11px] font-bold">
                    <span>{c.name} ({c.relationship}, {c.age})</span>
                    <button type="button" onClick={() => removeCompanion(i)} className="p-0.5 rounded hover:bg-white/20 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {!familyCompanionRequirementMet && (
              <p className="text-[10px] font-semibold text-rose-600 mt-3 flex items-center space-x-1 dark:text-rose-400">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>Family applications must include at least one Child companion.</span>
              </p>
            )}
          </div>
        )}

        {/* Add-ons */}
        <div className={cardClass}>
          <h2 className={sectionHeadingClass}>Extra Protection</h2>
          <div className="space-y-4">
            <label className="flex items-start space-x-2 cursor-pointer">
              <input type="checkbox" checked={cruiseCoverage} onChange={(e) => setCruiseCoverage(e.target.checked)} className="mt-0.5 accent-[#002f6c] dark:accent-[#49b1ea]" />
              <span className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Cruise Coverage</span> &mdash; for International Cruise Programs starting from the Philippines via cruise, or trips that commence via commercial airline.
                <span className="block text-[10px] font-semibold text-slate-500 mt-0.5 dark:text-slate-400">If approved, a corresponding surcharge will be added to the premium.</span>
              </span>
            </label>
            <label className="flex items-start space-x-2 cursor-pointer">
              <input type="checkbox" checked={hazardousSportsCoverage} onChange={(e) => setHazardousSportsCoverage(e.target.checked)} className="mt-0.5 accent-[#002f6c] dark:accent-[#49b1ea]" />
              <span className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Hazardous Non-Professional &amp; Non-Competition Sports Coverage</span> &mdash; hazardous adventure sports (all winter sports included), excluding competitive, dangerous, and extra hazardous sports, and excluding participation in competitions/tournaments organized by sporting federations or similar organizations.
                <span className="block text-[10px] font-semibold text-slate-500 mt-0.5 dark:text-slate-400">If approved, a corresponding surcharge will be added to the premium.</span>
              </span>
            </label>
          </div>
        </div>

        {/* Premium Summary */}
        <div className="p-4 rounded-xl bg-[#ebf3fc] flex items-center justify-between dark:bg-[#49b1ea]/10">
          <span className="text-xs font-bold text-slate-600 uppercase dark:text-slate-300">Premium</span>
          <span className="text-xl font-black text-[#002f6c] dark:text-[#49b1ea]">₱ {premiumValue.toFixed(2)}</span>
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

function GtpReviewSummary({
  travelType, destinations, departureDate, returnDate, daysOfTravel, isMultiTrip, applicationType,
  travelerFirstName, travelerSurname, birthdate, email, mobileNumber, passportNumber, guardianName, companions,
  phAddress, phRegion, phCity, phBarangay,
  planVariant, cruiseCoverage, hazardousSportsCoverage, premiumValue, onEdit, onConfirm,
}: {
  travelType: 'International' | 'Domestic';
  destinations: string[];
  departureDate: string;
  returnDate: string;
  daysOfTravel: number;
  isMultiTrip: boolean;
  applicationType: 'Individual' | 'Family';
  travelerFirstName: string;
  travelerSurname: string;
  birthdate: string;
  email: string;
  mobileNumber: string;
  passportNumber: string;
  guardianName: string;
  companions: GtpCompanion[];
  phAddress: string;
  phRegion: string;
  phCity: string;
  phBarangay: string;
  planVariant: typeof GTP_PLAN_VARIANTS[number];
  cruiseCoverage: boolean;
  hazardousSportsCoverage: boolean;
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

  const addOns = [
    cruiseCoverage && 'Cruise Coverage',
    hazardousSportsCoverage && 'Hazardous Sports Coverage',
  ].filter(Boolean).join(', ') || 'None';

  return (
    <div className="space-y-6 pb-10">
      <div className={cardClass}>
        <h2 className={sectionHeadingClass}>Travel Details</h2>
        <div className="text-xs">
          {row('Travel Type', travelType)}
          {row('Destination(s)', destinations.join(', ') || '-')}
          {row('Travel Dates', departureDate && returnDate
            ? isMultiTrip
              ? `${departureDate} to ${returnDate} (365-day annual coverage)`
              : `${departureDate} to ${returnDate} (${daysOfTravel} days)`
            : '-')}
          {row('Application Type', applicationType)}
          {applicationType === 'Family' && row('Companion(s)', companions.length > 0 ? companions.map((c) => `${c.name} (${c.relationship}, ${c.age})`).join(', ') : 'None')}
          {row('Plan', planVariant)}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className={sectionHeadingClass}>Traveler Information</h2>
        <div className="text-xs">
          {row('Name', `${travelerFirstName} ${travelerSurname}`.trim())}
          {row('Birthdate', birthdate || '-')}
          {row('Email', email || '-')}
          {row('Mobile Number', mobileNumber || '-')}
          {travelType === 'International' && row('Passport Number', passportNumber || '-')}
          {guardianName && row('Guardian Name', guardianName)}
          {row('Address', [phAddress, phBarangay !== 'N/A' ? phBarangay : null, phCity, phRegion].filter(Boolean).join(', ') || '-')}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className={sectionHeadingClass}>Coverage &amp; Premium</h2>
        <div className="text-xs">
          {row('Extra Protection', addOns)}
          {row('Estimated Premium', <span className="text-[#002f6c] dark:text-[#49b1ea]">₱{premiumValue.toFixed(2)}</span>)}
        </div>
      </div>

      <p className="text-[10px] font-semibold text-amber-700 flex items-center justify-end space-x-1 dark:text-amber-400">
        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
        <span>Reminder: the insured's name cannot be endorsed once the electronic policy is issued — double-check spelling before confirming.</span>
      </p>

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

// ---------------------------------------------------------------------------
// Reference panel for the issuer - reformatted verbatim from the product's
// official Tips & Guidelines sheet. Collapsed by default to stay out of the
// way; the Group Plan (Domestic Land & Sea, 10+ persons) and COVID Coverage
// sections are informational only - this form doesn't yet model a Land &
// Sea "mode" or a group/bulk-manifest application flow.
// ---------------------------------------------------------------------------

function GtpTipsAndGuidelines({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <div className={cardClass}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between cursor-pointer"
      >
        <h2 className="text-sm font-bold text-slate-800 dark:text-white">Tips &amp; Guidelines</h2>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 text-[11px] text-slate-700 dark:text-slate-300">
          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Period of Insurance</h3>
            <ul className="list-disc list-inside space-y-0.5">
              <li>International Trip / Domestic Plan (via Air): Short Term Period up to a maximum of 180 consecutive days from the usual country of residence, the Philippines.</li>
              <li>Annual Multi Trip: not exceeding 90 or 180 consecutive days per travel.</li>
              <li>Annual Single Trip: up to 365 days travel.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Insured / Insured Person</h3>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Filipino Citizen; or</li>
              <li>Foreigners officially residing in the Philippines at the time of purchase of the policy, living/working/studying, who want to travel abroad to a third-party country. In both cases, the Philippines is considered the Home Country. Also applies to emergency repatriation.</li>
            </ul>
            <p className="font-semibold mt-1">Eligibility and surcharges:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Maximum age is up to 65 years old.</li>
              <li>For age 66 and above: subject for review and approval. No guaranteed acceptance.</li>
            </ul>
            <p className="mt-1 font-semibold text-amber-700 dark:text-amber-400">
              Reminder: Name of the insured person/s cannot be endorsed once the electronic policy is issued. Please check the spelling again before clicking the "ISSUE" button.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Hazardous Sports</h3>
            <p>Hazardous Adventure Sports, excluding Competitive, Dangerous, and Extra Hazardous Sports. For clarity, all winter sports are "hazardous sports." Participation in competitions or tournaments organized by sporting federations or similar organizations is not included.</p>
            <p className="italic mt-1">Note: If application is approved (which includes hazardous sports), a corresponding surcharge will be added to the premium.</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Cruise Coverage</h3>
            <p>Applicable for International Cruise Programs which may (a) start from the Philippines via cruise, or (b) commence via commercial airline.</p>
            <p className="italic mt-1">Note: If application is approved (which includes cruise coverage), a corresponding surcharge will be added to the premium.</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Family Plan</h3>
            <p>Maximum of 5 persons: 2 adults and 3 children (adults: 18 to 65 years old at the time of application; children: 0 to 21 years old at the time of application). Eligible persons: Insured, Spouse, Child, Parent, Fiancé, and Guardian.</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Domestic Travel via Land &amp; Sea</h3>
            <p className="font-semibold">Group Plan</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Maximum of 5 days per trip.</li>
              <li>Minimum of 10 persons per trip who shall be leaving on the same day and with the same itinerary.</li>
            </ul>
            <p className="font-semibold mt-1">Individual Plan</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Maximum of 15 days per trip.</li>
            </ul>
            <p className="font-semibold mt-1">Reminders</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Domestic Travel via Land &amp; Sea plan is not applicable to Family Application.</li>
              <li>The destination must be 150 km from point of origin.</li>
            </ul>
            <p className="italic mt-1 text-slate-500 dark:text-slate-400">
              Not yet modeled in this form - it currently prices Domestic trips as a single Air-style plan (180-day Short Term cap) without a Land/Sea "mode" selector or a group/bulk-manifest flow for 10+ travelers.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">COVID Coverage</h3>
            <p>Applicable only to: Emergency Medical Treatment; Hospital Income/Daily Hospital Cash Benefit due to Covid; Emergency Repatriation (Return of Mortal Remains - covered up to the Policy Schedule's maximum limit; Medical Repatriation - not covered). Emergency Medical Evacuation is not covered.</p>
            <p className="font-semibold mt-1">Conditions</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Specific to Covid-19 only - does not extend to any other epidemic, pandemic, or communicable disease.</li>
              <li>Period of cover starts upon commencement of travel to the country of destination.</li>
              <li>Covid-19 coverage is capped at 90 days, regardless of travel duration or term of insurance.</li>
              <li>Coverage ceases upon return to the Philippines (subject to item 5 below).</li>
              <li>Hospital confinement in the Philippines is covered if the insured contracted and/or manifested Covid-19 during the travel period.</li>
              <li>For insureds on a One-way Trip package, hospital confinement in the country of final destination is covered if Covid-19 was contracted and/or manifested during the travel period.</li>
            </ol>
            <p className="mt-1">Rebooking charges, meals, and accommodation if stranded abroad (due to Covid-19) are NOT covered.</p>
            <p className="italic mt-1">Note: If hospitalized or receiving outpatient care amounting to more than $100 USD, the Insured MUST notify the Insurer prior to being discharged from the hospital. Failure to do so is grounds for denial of the claim.</p>
          </section>

          <p className="font-bold text-slate-900 dark:text-white">
            For 24/7 Travel Assistance call: +632 8811 2521 / Mobile / Viber / WhatsApp: +63917 562 2100
          </p>
        </div>
      )}
    </div>
  );
}
