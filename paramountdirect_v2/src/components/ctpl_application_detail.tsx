import { useState } from 'react';
import { ArrowLeft, Pencil, ShieldCheck, ShieldAlert, CheckCircle2, ClipboardList, User, Car } from 'lucide-react';
import type { CtplApplication, CtplPolicyStatus } from './ctpl_types';
import { CTPL_POLICY_TYPES, CTPL_MV_TYPES_BY_POLICY, CTPL_STATUS_DESCRIPTIONS, COV_FEE, getCtplPolicyStatus } from './ctpl_types';
import { PolicyDocumentsSection, PrintableDocumentModal, DocRow, type PolicyDocumentSpec } from './policy_documents';
import { getPremiumRate, type PremiumRate } from './premium_rates';
import { PH_REGIONS, citiesForRegion, GENERIC_BARANGAYS } from './ph_geography';
import { Section, FieldGrid, Field } from './application_detail_ui';

// Unpaid CTPL applications land here as a full page rather than the quick-
// preview modal in ctpl_application_list.tsx, since - unlike a paid, already
// -issued policy - they can still be edited, and that needs more room than a
// modal comfortably gives. Default view mirrors ofw_application_list.tsx's
// icon-based Section/FieldGrid/Field read-only layout; Edit swaps to the
// flat form below, same as OFW's pattern.

interface Props {
  app: CtplApplication;
  onBack: () => void;
  onUpdate: (id: string, patch: Partial<CtplApplication>) => void;
  rates: PremiumRate[];
}

const getPremium = (rates: PremiumRate[], policyType: string, mvType: string, renewalType: string) =>
  !policyType || !mvType ? 0 : getPremiumRate(rates, 'CTPL', `${policyType}|${mvType}|${renewalType}`, getPremiumRate(rates, 'CTPL', 'default', 606));

const CTPL_DOCUMENTS: PolicyDocumentSpec[] = [
  { key: 'policySchedule', label: 'Policy Schedule' },
  { key: 'policyJacket', label: 'Policy Jacket' },
  { key: 'coc', label: 'Certificate of Cover (COC)' },
  { key: 'serviceInvoice', label: 'Service Invoice' },
];

// Only statuses that make sense for an application still awaiting payment -
// Reversed requires a prior payment to reverse, so it's excluded here.
const EDITABLE_UNPAID_STATUSES = ['Completed', 'Spoiled', 'Duplicate', 'Cancelled'] as const;

const getPolicyStatusBadgeStyle = (status: CtplPolicyStatus) => {
  switch (status) {
    case 'Issued': return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    case 'Spoiled': return 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    case 'Cancelled': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
  }
};

const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const labelClass = 'text-xs font-bold text-slate-700 block mb-1 dark:text-slate-300';

export default function CtplApplicationDetail({ app, onBack, onUpdate, rates }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    clientType: app.clientType, ownerFirstName: app.ownerFirstName, ownerMiddleName: app.ownerMiddleName, ownerSurname: app.ownerSurname,
    ownerAddress: app.ownerAddress, ownerRegion: app.ownerRegion, ownerCity: app.ownerCity, ownerBarangay: app.ownerBarangay,
    sameAsOwner: app.sameAsOwner, applicantFirstName: app.applicantFirstName, applicantSurname: app.applicantSurname,
    email: app.email, mobileNumber: app.mobileNumber,
    policyType: app.policyType, mvType: app.mvType, plateNumber: app.plateNumber, mvFileNumber: app.mvFileNumber, chassisNumber: app.chassisNumber,
    requiresCOV: app.requiresCOV, forPublicUse: app.forPublicUse, status: app.status, renewalType: app.renewalType,
  }));
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2500);
  };

  const premiumValue = getPremium(rates, form.policyType, form.mvType, form.renewalType);
  const totalDue = premiumValue + (form.requiresCOV ? COV_FEE : 0);
  const policyStatus = getCtplPolicyStatus(app);

  const startEdit = () => setIsEditing(true);
  const cancelEdit = () => {
    setForm({
      clientType: app.clientType, ownerFirstName: app.ownerFirstName, ownerMiddleName: app.ownerMiddleName, ownerSurname: app.ownerSurname,
      ownerAddress: app.ownerAddress, ownerRegion: app.ownerRegion, ownerCity: app.ownerCity, ownerBarangay: app.ownerBarangay,
      sameAsOwner: app.sameAsOwner, applicantFirstName: app.applicantFirstName, applicantSurname: app.applicantSurname,
      email: app.email, mobileNumber: app.mobileNumber,
      policyType: app.policyType, mvType: app.mvType, plateNumber: app.plateNumber, mvFileNumber: app.mvFileNumber, chassisNumber: app.chassisNumber,
      requiresCOV: app.requiresCOV, forPublicUse: app.forPublicUse, status: app.status, renewalType: app.renewalType,
    });
    setIsEditing(false);
  };

  const handleSave = () => {
    onUpdate(app.id, { ...form, premium: `₱${totalDue.toFixed(2)}` });
    notify('Application details saved.');
    setIsEditing(false);
  };

  const handleSimulatePayment = () => {
    onUpdate(app.id, { ...form, premium: `₱${totalDue.toFixed(2)}`, isPaid: true });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1000px] mx-auto font-sans text-slate-900 dark:text-slate-100">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300" title="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#002f6c] dark:text-[#49b1ea] font-['Montserrat']">
              Application {app.referenceNo ?? '(Reference No. pending)'}
            </h1>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-500">{app.ownerFirstName} {app.ownerSurname} &middot; {app.plateNumber}</span>
              <span className="text-[10px] font-black text-[#002f6c] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md dark:bg-[#49b1ea]/10 dark:text-[#49b1ea] dark:border-[#49b1ea]/30">
                ₱{totalDue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isEditing && (
            <button onClick={startEdit} className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
              <Pencil className="w-3.5 h-3.5" /><span>Edit</span>
            </button>
          )}
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            Unpaid
          </span>
          <span title={CTPL_STATUS_DESCRIPTIONS[app.status]} className={`inline-flex items-center px-3 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap ${getPolicyStatusBadgeStyle(policyStatus)}`}>
            {policyStatus}
          </span>
        </div>
      </div>

      {isEditing ? (
        <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-6 dark:bg-slate-900 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
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

            <div className="sm:col-span-2 text-xs font-extrabold text-slate-500 uppercase tracking-wide pt-2 dark:text-slate-400">Registered Owner's Information</div>
            <div><label className={labelClass}>First Name</label><input value={form.ownerFirstName} onChange={(e) => setForm({ ...form, ownerFirstName: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Middle Name</label><input value={form.ownerMiddleName} onChange={(e) => setForm({ ...form, ownerMiddleName: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Surname</label><input value={form.ownerSurname} onChange={(e) => setForm({ ...form, ownerSurname: e.target.value })} className={inputClass} /></div>
            <div className="sm:col-span-2"><label className={labelClass}>Address (House No., Street)</label><input value={form.ownerAddress} onChange={(e) => setForm({ ...form, ownerAddress: e.target.value })} className={inputClass} /></div>
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

            <div className="sm:col-span-2">
              <label className={labelClass}>Is the Applicant the same as the Registered Owner?</label>
              <div className="flex space-x-3 pt-1">
                {[true, false].map((val) => (
                  <label key={String(val)} className="flex items-center space-x-1.5 font-semibold text-slate-700 dark:text-slate-300">
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

            <div className="sm:col-span-2 border-t border-slate-100 pt-3 text-xs font-extrabold text-slate-500 uppercase tracking-wide dark:border-slate-800 dark:text-slate-400">Vehicle Details</div>
            <div>
              <label className={labelClass}>Application Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CtplApplication['status'] })} className={inputClass}>
                {EDITABLE_UNPAID_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Term</label>
              <select value={form.renewalType} onChange={(e) => setForm({ ...form, renewalType: e.target.value as CtplApplication['renewalType'] })} className={inputClass}>
                <option>1 Year</option>
                <option>3 Years</option>
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
            <div className="sm:col-span-2"><label className={labelClass}>Serial/Chassis Number</label><input value={form.chassisNumber} onChange={(e) => setForm({ ...form, chassisNumber: e.target.value.toUpperCase() })} className={inputClass} /></div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={form.requiresCOV} onChange={(e) => setForm({ ...form, requiresCOV: e.target.checked })} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Requires COV (+₱{COV_FEE.toFixed(2)})</span>
            </label>
            {form.policyType === 'Motorcycle' && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={form.forPublicUse} onChange={(e) => setForm({ ...form, forPublicUse: e.target.checked })} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">For Public Use (LCOC series)</span>
              </label>
            )}

            <div className="sm:col-span-2 p-3 rounded-xl bg-[#ebf3fc] flex items-center justify-between dark:bg-[#49b1ea]/10">
              <span className="font-bold text-slate-600 uppercase dark:text-slate-300">Total Premium</span>
              <span className="text-base font-black text-[#002f6c] dark:text-[#49b1ea]">₱{totalDue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Section icon={ClipboardList} title="Application Status" isEditing={false} onToggleEdit={() => {}} hideEditButton iconColorClass="text-[#002f6c] dark:text-[#49b1ea]">
            <FieldGrid>
              <Field label="Reference No." editing={false} edit={null} view={<span className="font-mono">{app.referenceNo ?? '—'}</span>} />
              <Field label="Policy No." editing={false} edit={null} view={<span className="font-mono">{app.policyNumber ?? '—'}</span>} />
              <Field label="Date Received" editing={false} edit={null} view={app.dateReceived} />
              <Field label="Term" editing={false} edit={null} view={app.renewalType} />
              <Field label="Application Status" editing={false} edit={null} view={<span title={CTPL_STATUS_DESCRIPTIONS[app.status]}>{app.status}</span>} />
              <Field label="Issuer" editing={false} edit={null} view={app.screenedBy || '-'} />
            </FieldGrid>
          </Section>

          <Section icon={User} title="Personal Information" isEditing={false} onToggleEdit={() => {}} hideEditButton iconColorClass="text-[#002f6c] dark:text-[#49b1ea]">
            <FieldGrid>
              <Field label="Client Type" editing={false} edit={null} view={app.clientType} />
              <Field label="Registered Owner" editing={false} edit={null} view={`${app.ownerFirstName} ${app.ownerMiddleName} ${app.ownerSurname}`} />
              <Field label="Email" editing={false} edit={null} view={app.email} />
              <Field label="Mobile" editing={false} edit={null} view={app.mobileNumber} />
              {!app.sameAsOwner && (
                <Field label="Applicant (if different from owner)" editing={false} edit={null} view={`${app.applicantFirstName} ${app.applicantSurname}`} />
              )}
              <div className="md:col-span-2 xl:col-span-3">
                <Field
                  label="Owner Address"
                  editing={false}
                  edit={null}
                  view={[app.ownerAddress, app.ownerBarangay !== 'N/A' ? app.ownerBarangay : null, app.ownerCity, app.ownerRegion].filter(Boolean).join(', ')}
                />
              </div>
            </FieldGrid>
          </Section>

          <Section icon={Car} title="Vehicle Details" isEditing={false} onToggleEdit={() => {}} hideEditButton iconColorClass="text-[#002f6c] dark:text-[#49b1ea]">
            <FieldGrid>
              <Field label="Policy Type" editing={false} edit={null} view={`${app.policyType}${app.forPublicUse ? ' — For Public Use' : ''}`} />
              <Field label="MV Type" editing={false} edit={null} view={app.mvType} />
              <Field label="Plate Number" editing={false} edit={null} view={<span className="font-mono">{app.plateNumber}</span>} />
              <Field label="MV File Number" editing={false} edit={null} view={<span className="font-mono">{app.mvFileNumber}</span>} />
              <Field label="Serial/Chassis Number" editing={false} edit={null} view={<span className="font-mono">{app.chassisNumber}</span>} />
              <Field
                label="Requires COV"
                editing={false}
                edit={null}
                view={
                  app.requiresCOV ? (
                    <span className="flex items-center space-x-1 text-amber-700 dark:text-amber-400">
                      <ShieldAlert className="w-3.5 h-3.5" /><span>Yes (+₱{COV_FEE.toFixed(2)})</span>
                    </span>
                  ) : 'No'
                }
              />
            </FieldGrid>
          </Section>

          <Section icon={ShieldCheck} title="Payment" isEditing={false} onToggleEdit={() => {}} hideEditButton iconColorClass="text-[#002f6c] dark:text-[#49b1ea]">
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
          </Section>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <PolicyDocumentsSection
              isPaid={false}
              documents={CTPL_DOCUMENTS}
              onView={setViewingDoc}
              onSend={() => {}}
              lockedMessage="Documents will be available once the client completes payment on the website."
            />
          </div>
        </div>
      )}

      <div className={`flex justify-end gap-2 pt-2 ${isEditing ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}>
        {isEditing ? (
          <>
            <button onClick={cancelEdit} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-[#002f6c] text-white text-xs font-bold hover:bg-[#00224f] cursor-pointer">
              Save Changes
            </button>
          </>
        ) : (
          <button onClick={onBack} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Back to CTPL Applications
          </button>
        )}
      </div>

      {/* Printable Document Modal - only reachable once paid, kept for parity with the list's viewer */}
      {viewingDoc && (
        <PrintableDocumentModal
          title={CTPL_DOCUMENTS.find((d) => d.key === viewingDoc)?.label ?? 'Document'}
          onClose={() => setViewingDoc(null)}
        >
          <DocRow label="Reference No." value={app.referenceNo ?? '—'} />
          <DocRow label="Registered Owner" value={`${app.ownerFirstName} ${app.ownerMiddleName} ${app.ownerSurname}`} />
          <DocRow label="Policy Type" value={app.policyType} />
          <DocRow label="MV Type" value={app.mvType} />
          <DocRow label="Plate Number" value={app.plateNumber} />
          <DocRow label="Premium" value={app.premium} />
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
