import { useState } from 'react';
import { ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { CtplApplication } from './ctpl_types';
import { CTPL_POLICY_TYPES, CTPL_MV_TYPES_BY_POLICY, COV_FEE } from './ctpl_types';
import { PolicyDocumentsSection, PrintableDocumentModal, DocRow, type PolicyDocumentSpec } from './policy_documents';
import { getPremiumRate, type PremiumRate } from './premium_rates';
import { PH_REGIONS, citiesForRegion, GENERIC_BARANGAYS } from './ph_geography';

// Unpaid CTPL applications land here as a full page rather than the quick-
// preview modal in ctpl_application_list.tsx, since - unlike a paid, already
// -issued policy - they can still be edited, and that needs more room than a
// modal comfortably gives.

interface Props {
  app: CtplApplication;
  onBack: () => void;
  onUpdate: (id: string, patch: Partial<CtplApplication>) => void;
  rates: PremiumRate[];
}

const getPremium = (rates: PremiumRate[], policyType: string, mvType: string) =>
  !policyType || !mvType ? 0 : getPremiumRate(rates, 'CTPL', `${policyType}|${mvType}`, getPremiumRate(rates, 'CTPL', 'default', 606));

const CTPL_DOCUMENTS: PolicyDocumentSpec[] = [
  { key: 'policySchedule', label: 'Policy Schedule' },
  { key: 'policyJacket', label: 'Policy Jacket' },
  { key: 'coc', label: 'Certificate of Cover (COC)' },
  { key: 'serviceInvoice', label: 'Service Invoice' },
];

// Only statuses that make sense for an application still awaiting payment -
// Reversed requires a prior payment to reverse, so it's excluded here.
const EDITABLE_UNPAID_STATUSES = ['Completed', 'Spoiled', 'Duplicate', 'Cancelled'] as const;

const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const labelClass = 'text-xs font-bold text-slate-700 block mb-1 dark:text-slate-300';
const cardClass = 'bg-white border border-slate-200 rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800';
const sectionHeadingClass = 'text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 dark:text-white dark:border-slate-800';

export default function CtplApplicationDetail({ app, onBack, onUpdate, rates }: Props) {
  const [form, setForm] = useState(() => ({
    clientType: app.clientType, ownerFirstName: app.ownerFirstName, ownerMiddleName: app.ownerMiddleName, ownerSurname: app.ownerSurname,
    ownerAddress: app.ownerAddress, ownerRegion: app.ownerRegion, ownerCity: app.ownerCity, ownerBarangay: app.ownerBarangay,
    sameAsOwner: app.sameAsOwner, applicantFirstName: app.applicantFirstName, applicantSurname: app.applicantSurname,
    email: app.email, mobileNumber: app.mobileNumber,
    policyType: app.policyType, mvType: app.mvType, plateNumber: app.plateNumber, mvFileNumber: app.mvFileNumber, chassisNumber: app.chassisNumber,
    requiresCOV: app.requiresCOV, forPublicUse: app.forPublicUse, status: app.status,
  }));
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2500);
  };

  const premiumValue = getPremium(rates, form.policyType, form.mvType);
  const totalDue = premiumValue + (form.requiresCOV ? COV_FEE : 0);

  const handleSave = () => {
    onUpdate(app.id, { ...form, premium: `₱${totalDue.toFixed(2)}` });
    notify('Application details saved.');
  };

  const handleSimulatePayment = () => {
    onUpdate(app.id, { ...form, premium: `₱${totalDue.toFixed(2)}`, isPaid: true });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[900px] mx-auto font-sans text-slate-800 dark:text-slate-100">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-y-2 space-x-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <button onClick={onBack} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black uppercase tracking-wider text-[#002f6c] dark:text-[#49b1ea] font-['Montserrat']">
            Application {app.referenceNo ?? '(Reference No. pending)'}
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 dark:text-slate-400">
            Unpaid - editable until the client completes payment on the website.
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wide">{form.requiresCOV ? 'Total Amount Due' : 'Premium'}</p>
          <p className="text-xl font-black text-[#002f6c] dark:text-[#49b1ea]">₱{totalDue.toFixed(2)}</p>
        </div>
      </div>

      {/* Personal Information */}
      <div className={cardClass}>
        <h2 className={sectionHeadingClass}>Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Client Type</label>
            <select value={form.clientType} onChange={(e) => setForm({ ...form, clientType: e.target.value as CtplApplication['clientType'] })} className={inputClass}>
              <option>Individual</option>
              <option>Corporate without assignee</option>
              <option>Corporate with assignee</option>
            </select>
          </div>
          <div><label className={labelClass}>Email Address</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Mobile Number</label><input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} className={inputClass} /></div>

          <div className="md:col-span-3 text-xs font-extrabold text-slate-500 uppercase tracking-wide pt-2 dark:text-slate-400">Registered Owner's Information</div>
          <div><label className={labelClass}>First Name</label><input value={form.ownerFirstName} onChange={(e) => setForm({ ...form, ownerFirstName: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Middle Name</label><input value={form.ownerMiddleName} onChange={(e) => setForm({ ...form, ownerMiddleName: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Surname</label><input value={form.ownerSurname} onChange={(e) => setForm({ ...form, ownerSurname: e.target.value })} className={inputClass} /></div>

          <div className="md:col-span-3"><label className={labelClass}>Address (House No., Street)</label><input value={form.ownerAddress} onChange={(e) => setForm({ ...form, ownerAddress: e.target.value })} className={inputClass} /></div>
          <div>
            <label className={labelClass}>Region</label>
            <select value={form.ownerRegion} onChange={(e) => { const r = e.target.value; setForm({ ...form, ownerRegion: r, ownerCity: citiesForRegion(r)[0] }); }} className={inputClass}>
              {PH_REGIONS.map((r) => <option key={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>City/Municipality</label>
            <select value={form.ownerCity} onChange={(e) => setForm({ ...form, ownerCity: e.target.value })} className={inputClass}>
              {citiesForRegion(form.ownerRegion).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Barangay</label>
            <select value={form.ownerBarangay} onChange={(e) => setForm({ ...form, ownerBarangay: e.target.value })} className={inputClass}>
              {GENERIC_BARANGAYS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className={labelClass}>Is the Applicant the same as the Registered Owner?</label>
            <div className="flex space-x-3 pt-1">
              {[true, false].map((val) => (
                <label key={String(val)} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input type="radio" checked={form.sameAsOwner === val} onChange={() => setForm({ ...form, sameAsOwner: val })} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
                  <span>{val ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
          </div>

          {!form.sameAsOwner && (
            <>
              <div><label className={labelClass}>Applicant First Name</label><input value={form.applicantFirstName} onChange={(e) => setForm({ ...form, applicantFirstName: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Applicant Surname</label><input value={form.applicantSurname} onChange={(e) => setForm({ ...form, applicantSurname: e.target.value })} className={inputClass} /></div>
            </>
          )}
        </div>
      </div>

      {/* Vehicle Details */}
      <div className={cardClass}>
        <h2 className={sectionHeadingClass}>Vehicle Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Application Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CtplApplication['status'] })} className={inputClass}>
              {EDITABLE_UNPAID_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Policy Type</label>
            <select
              value={form.policyType}
              onChange={(e) => { const v = e.target.value as CtplApplication['policyType']; setForm({ ...form, policyType: v, mvType: '', forPublicUse: v === 'Motorcycle' ? form.forPublicUse : false }); }}
              className={inputClass}
            >
              {CTPL_POLICY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>LTO MV Type</label>
            <select value={form.mvType} onChange={(e) => setForm({ ...form, mvType: e.target.value })} className={inputClass}>
              <option value="">-- Select --</option>
              {CTPL_MV_TYPES_BY_POLICY[form.policyType].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className={labelClass}>Plate Number</label><input value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })} className={inputClass} /></div>
          <div><label className={labelClass}>MV File Number</label><input value={form.mvFileNumber} onChange={(e) => setForm({ ...form, mvFileNumber: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Serial/Chassis Number</label><input value={form.chassisNumber} onChange={(e) => setForm({ ...form, chassisNumber: e.target.value.toUpperCase() })} className={inputClass} /></div>
        </div>

        <label className="flex items-center space-x-2 mt-4 cursor-pointer">
          <input type="checkbox" checked={form.requiresCOV} onChange={(e) => setForm({ ...form, requiresCOV: e.target.checked })} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Requires Certificate of Validation (COV) &mdash; adds a ₱{COV_FEE.toFixed(2)} verification fee via DBP-DCI</span>
        </label>
        {form.policyType === 'Motorcycle' && (
          <label className="flex items-center space-x-2 mt-2 cursor-pointer">
            <input type="checkbox" checked={form.forPublicUse} onChange={(e) => setForm({ ...form, forPublicUse: e.target.checked })} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">For Public Use (e.g. habal-habal / public utility motorcycle) &mdash; issued under its own LCOC policy series</span>
          </label>
        )}

        {form.requiresCOV && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center space-x-2 dark:bg-amber-950/30 dark:border-amber-800">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Certificate of Validation (COV) required &mdash; additional ₱{COV_FEE.toFixed(2)} verification fee via DBP-DCI.</span>
          </div>
        )}

        <div className="mt-4 p-4 rounded-xl bg-[#ebf3fc] flex items-center justify-between dark:bg-[#49b1ea]/10">
          <span className="text-xs font-bold text-slate-600 uppercase dark:text-slate-300">Total Premium</span>
          <span className="text-xl font-black text-[#002f6c] dark:text-[#49b1ea]">₱{totalDue.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className={cardClass}>
        <h2 className={sectionHeadingClass}>Payment</h2>
        <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Awaiting client payment</span>
          <button
            type="button"
            onClick={handleSimulatePayment}
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 cursor-pointer"
          >
            Simulate Payment Received
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 mt-4">
          <PolicyDocumentsSection
            isPaid={false}
            documents={CTPL_DOCUMENTS}
            onView={setViewingDoc}
            onSend={() => {}}
            lockedMessage="Documents will be available once the client completes payment on the website."
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <button type="button" onClick={onBack} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
          Back to CTPL Applications
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold cursor-pointer shadow-md transition-all"
        >
          Save Changes
        </button>
      </div>

      {/* Printable Document Modal - only reachable once paid, kept for parity with the list's viewer */}
      {viewingDoc && (
        <PrintableDocumentModal
          title={CTPL_DOCUMENTS.find((d) => d.key === viewingDoc)?.label ?? 'Document'}
          onClose={() => setViewingDoc(null)}
        >
          <DocRow label="Reference No." value={app.referenceNo ?? '—'} />
          <DocRow label="Registered Owner" value={`${form.ownerFirstName} ${form.ownerMiddleName} ${form.ownerSurname}`} />
          <DocRow label="Policy Type" value={form.policyType} />
          <DocRow label="MV Type" value={form.mvType} />
          <DocRow label="Plate Number" value={form.plateNumber} />
          <DocRow label="Premium" value={`₱${(totalDue - (form.requiresCOV ? COV_FEE : 0)).toFixed(2)}`} />
        </PrintableDocumentModal>
      )}

      {/* Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
