import { useMemo, useState } from 'react';
import { X, FilePen, CalendarPlus, Ban, ArrowLeft, AlertTriangle } from 'lucide-react';
import type { CtplApplication } from './ctpl_types';
import { endorsementsApi, toApiCtplClientType, ApiError, type EndorsementApi, type EndorsementPreviewApi } from '../lib/api';
import { PH_REGIONS, citiesForRegion, GENERIC_BARANGAYS } from './ph_geography';
import { CTPL_VEHICLE_YEARS, CTPL_VEHICLE_MAKERS } from './ctpl_vehicle_reference';
import { AmountsTable, ENDORSEMENT_TYPE_LABEL, inputClass, labelClass, peso, displayDate, toDateInput } from './endorsement_shared';

// "New Endorsement" for an issued CTPL policy, opened from the policy's
// quick-preview modal (ctpl_application_list.tsx).
//
//   Non-Financial  - corrections that don't touch premium; applied and
//                    documented immediately.
//   Term Extension - pushes the expiry date out; additional premium at the
//                    policy's own daily rate. Goes to review/approval.
//   Cancellation   - Flat (on/before the effectivity date: full refund) or
//                    Pro Rata (unexpired share of the premium) - the server
//                    decides which from the cancellation date. Goes to
//                    review/approval, issues a Credit Memo once approved.

type Kind = 'Non_Financial' | 'Term_Extension' | 'Cancellation';

interface Props {
  app: CtplApplication;
  onClose: () => void;
  onSubmitted: (endorsement: EndorsementApi) => void;
}

const NON_FINANCIAL_REASONS = ["Client's request", 'Wrong input by encoder', 'Transfer of ownership'];

// Legacy CTPL cancellation remarks (c2c _modal_cancellation_endorsement).
const CANCELLATION_REASONS = [
  'Did not materialize',
  'Double issuance',
  'Non-accreditation',
  'Non-payment of premium',
  'Not taken-up',
  'Property sold',
  'Stop operation',
  'Transfer of location',
  'Unit sold',
];

const CLIENT_TYPES = ['Individual', 'Corporate without assignee', 'Corporate with assignee'] as const;

type EditableField =
  | 'clientType' | 'ownerFirstName' | 'ownerMiddleName' | 'ownerSurname' | 'ownerAddress' | 'ownerRegion' | 'ownerCity' | 'ownerBarangay'
  | 'applicantFirstName' | 'applicantSurname' | 'email' | 'mobileNumber'
  | 'vehicleYear' | 'vehicleMake' | 'vehicleSeries' | 'vehicleColor' | 'vehicleBodyType' | 'plateNumber' | 'mvFileNumber' | 'chassisNumber' | 'motorNumber';

const VEHICLE_FIELDS: EditableField[] = ['vehicleYear', 'vehicleMake', 'vehicleSeries', 'vehicleColor', 'vehicleBodyType', 'plateNumber', 'mvFileNumber', 'chassisNumber', 'motorNumber'];

const FIELD_LABEL: Record<EditableField, string> = {
  clientType: 'Client Type', ownerFirstName: 'First Name', ownerMiddleName: 'Middle Name', ownerSurname: 'Surname',
  ownerAddress: 'Address', ownerRegion: 'Region', ownerCity: 'City/Municipality', ownerBarangay: 'Barangay',
  applicantFirstName: 'Applicant First Name', applicantSurname: 'Applicant Surname', email: 'Email Address', mobileNumber: 'Mobile Number',
  vehicleYear: 'Year Model', vehicleMake: 'Vehicle Make', vehicleSeries: 'Vehicle Series', vehicleColor: 'Color', vehicleBodyType: 'Body Type',
  plateNumber: 'Plate Number', mvFileNumber: 'MV File Number', chassisNumber: 'Serial/Chassis Number', motorNumber: 'Motor Number',
};

const KIND_OPTIONS: { kind: Kind; label: string; description: string; icon: typeof FilePen }[] = [
  { kind: 'Non_Financial', label: 'Non-Financial', description: 'Correct the insured, address or vehicle details. No premium change — approved immediately.', icon: FilePen },
  { kind: 'Term_Extension', label: 'Term Extension', description: 'Extend the expiry date. Additional premium is computed and sent for review and approval.', icon: CalendarPlus },
  { kind: 'Cancellation', label: 'Cancellation', description: 'Cancel the policy — flat or pro rata refund, sent for review and approval. Issues a Credit Memo.', icon: Ban },
];

export default function CtplEndorsementModal({ app, onClose, onSubmitted }: Props) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [effectiveDate, setEffectiveDate] = useState(toDateInput(new Date()));
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [withDeedOfSale, setWithDeedOfSale] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [preview, setPreview] = useState<EndorsementPreviewApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const original = useMemo(() => {
    const values = {} as Record<EditableField, string>;
    (Object.keys(FIELD_LABEL) as EditableField[]).forEach((f) => { values[f] = String(app[f] ?? ''); });
    return values;
  }, [app]);
  const [form, setForm] = useState<Record<EditableField, string>>(original);
  const set = (field: EditableField, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const changedFields = (Object.keys(FIELD_LABEL) as EditableField[]).filter((f) => form[f].trim() !== original[f].trim());
  const vehicleChanged = changedFields.some((f) => VEHICLE_FIELDS.includes(f));
  const finalReason = reason === 'Others' ? otherReason.trim() : reason;

  const pickKind = (k: Kind) => {
    setKind(k);
    setReason(k === 'Non_Financial' ? NON_FINANCIAL_REASONS[0] : '');
    setPreview(null);
    setError(null);
  };

  // Financial amounts always come from the server, so the preview the user
  // confirms is exactly what gets stored.
  const compute = async () => {
    if (!kind || kind === 'Non_Financial') return;
    setError(null);
    setPreview(null);
    try {
      const result = kind === 'Term_Extension'
        ? await endorsementsApi.previewCtpl(app.id, { kind, newExpiryDate })
        : await endorsementsApi.previewCtpl(app.id, { kind, effectiveDate });
      setPreview(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to compute premium.');
    }
  };

  const submit = async () => {
    if (!kind) return;
    setBusy(true);
    setError(null);
    try {
      let created: EndorsementApi;
      if (kind === 'Non_Financial') {
        const changes = Object.fromEntries(changedFields.map((f) => [f, f === 'clientType' ? toApiCtplClientType(form[f]) : form[f].trim()]));
        created = await endorsementsApi.submitCtpl(app.id, { kind, effectiveDate, reason: finalReason, withDeedOfSale, changes });
      } else if (kind === 'Term_Extension') {
        created = await endorsementsApi.submitCtpl(app.id, { kind, effectiveDate, reason: finalReason, newExpiryDate });
      } else {
        created = await endorsementsApi.submitCtpl(app.id, { kind, effectiveDate, reason: finalReason });
      }
      onSubmitted(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit endorsement.');
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    !busy && !!finalReason && !!effectiveDate &&
    (kind === 'Non_Financial' ? changedFields.length > 0 && !(withDeedOfSale && vehicleChanged) : !!preview);

  const textInput = (field: EditableField, opts: { upper?: boolean; disabled?: boolean; span?: string } = {}) => (
    <div className={opts.span}>
      <label className={labelClass}>{FIELD_LABEL[field]}{form[field].trim() !== original[field].trim() && <span className="ml-1 text-[#49b1ea]">•</span>}</label>
      <input
        value={form[field]}
        disabled={opts.disabled}
        onChange={(e) => set(field, opts.upper ? e.target.value.toUpperCase() : e.target.value)}
        className={inputClass}
      />
    </div>
  );

  const selectInput = (field: EditableField, options: readonly string[], opts: { disabled?: boolean; onChange?: (v: string) => void } = {}) => (
    <div>
      <label className={labelClass}>{FIELD_LABEL[field]}{form[field] !== original[field] && <span className="ml-1 text-[#49b1ea]">•</span>}</label>
      <select value={form[field]} disabled={opts.disabled} onChange={(e) => (opts.onChange ? opts.onChange(e.target.value) : set(field, e.target.value))} className={inputClass}>
        {!options.includes(form[field]) && <option value={form[field]}>{form[field] || '-- Select --'}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const reasonOptions = kind === 'Cancellation' ? CANCELLATION_REASONS : NON_FINANCIAL_REASONS;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {kind && (
              <button type="button" onClick={() => setKind(null)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer dark:hover:bg-slate-800" title="Choose another type">
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">New Endorsement{kind && ` — ${KIND_OPTIONS.find((k) => k.kind === kind)?.label}`}</h2>
              <p className="text-[11px] font-bold text-slate-500 font-mono dark:text-slate-400">{app.policyNumber} · {app.plateNumber} · {displayDate(app.effectiveDate)} to {displayDate(app.expiryDate)}</p>
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {!kind && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {KIND_OPTIONS.map(({ kind: k, label, description, icon: Icon }) => (
              <button
                key={k}
                type="button"
                onClick={() => pickKind(k)}
                className="text-left p-4 rounded-2xl border border-slate-200 hover:border-[#49b1ea] hover:bg-[#ebf3fc] cursor-pointer transition-colors dark:border-slate-700 dark:hover:bg-[#49b1ea]/10"
              >
                <Icon className="w-5 h-5 text-[#002f6c] mb-2 dark:text-[#49b1ea]" />
                <p className="text-sm font-black text-slate-900 dark:text-white">{label}</p>
                <p className="text-[11px] font-semibold text-slate-500 mt-1 dark:text-slate-400">{label === 'Non-Financial' ? '' : 'Financial · '}{description}</p>
              </button>
            ))}
          </div>
        )}

        {kind && (
          <div className="space-y-5">
            {/* Common: effective date + reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{kind === 'Cancellation' ? 'Cancellation Date' : 'Effective Date'}</label>
                <input type="date" value={effectiveDate} onChange={(e) => { setEffectiveDate(e.target.value); setPreview(null); }} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Reason</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass}>
                  <option value="">-- Select --</option>
                  {reasonOptions.map((r) => <option key={r}>{r}</option>)}
                  <option value="Others">Others</option>
                </select>
                {reason === 'Others' && <input value={otherReason} onChange={(e) => setOtherReason(e.target.value)} placeholder="Specify reason" className={`${inputClass} mt-2`} />}
              </div>
            </div>

            {kind === 'Non_Financial' && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={withDeedOfSale} onChange={(e) => setWithDeedOfSale(e.target.checked)} className="accent-[#002f6c] dark:accent-[#49b1ea]" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    With Deed of Sale — transfer of ownership to a new insured (vehicle details can't be changed)
                  </span>
                </label>

                <div>
                  <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-3 dark:text-slate-400">Insured</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectInput('clientType', CLIENT_TYPES)}
                    {textInput('email')}
                    {textInput('mobileNumber')}
                    {textInput('ownerFirstName')}
                    {textInput('ownerMiddleName')}
                    {textInput('ownerSurname')}
                    {textInput('ownerAddress', { span: 'md:col-span-3' })}
                    {selectInput('ownerRegion', PH_REGIONS.map((r) => r.name), {
                      onChange: (r) => setForm((prev) => ({ ...prev, ownerRegion: r, ownerCity: citiesForRegion(r)[0] ?? '' })),
                    })}
                    {selectInput('ownerCity', citiesForRegion(form.ownerRegion))}
                    {selectInput('ownerBarangay', GENERIC_BARANGAYS)}
                    {!app.sameAsOwner && textInput('applicantFirstName')}
                    {!app.sameAsOwner && textInput('applicantSurname')}
                  </div>
                </div>

                <div className={withDeedOfSale ? 'opacity-60' : ''}>
                  <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-3 dark:text-slate-400">Vehicle</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectInput('vehicleYear', CTPL_VEHICLE_YEARS, { disabled: withDeedOfSale })}
                    {selectInput('vehicleMake', CTPL_VEHICLE_MAKERS, { disabled: withDeedOfSale })}
                    {textInput('vehicleSeries', { disabled: withDeedOfSale })}
                    {textInput('vehicleColor', { disabled: withDeedOfSale })}
                    {textInput('vehicleBodyType', { disabled: withDeedOfSale })}
                    {textInput('plateNumber', { upper: true, disabled: withDeedOfSale })}
                    {textInput('mvFileNumber', { disabled: withDeedOfSale })}
                    {textInput('chassisNumber', { upper: true, disabled: withDeedOfSale })}
                    {textInput('motorNumber', { upper: true, disabled: withDeedOfSale })}
                  </div>
                </div>

                {withDeedOfSale && vehicleChanged && (
                  <p className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4" /> Undo the vehicle changes, or untick “With Deed of Sale”.
                  </p>
                )}

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs dark:bg-slate-800/60 dark:border-slate-700">
                  <p className="font-black uppercase text-[10px] tracking-wide text-slate-500 mb-1">Changes to endorse ({changedFields.length})</p>
                  {changedFields.length === 0 ? (
                    <p className="font-semibold text-slate-400">No changes yet — edit a field above.</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {changedFields.map((f) => (
                        <li key={f} className="font-semibold text-slate-700 dark:text-slate-300">
                          {FIELD_LABEL[f]}: <span className="line-through text-slate-400">{original[f] || '—'}</span> → <span className="font-black text-slate-900 dark:text-white">{form[f] || '—'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}

            {kind === 'Term_Extension' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className={labelClass}>New Expiry Date (current: {displayDate(app.expiryDate)})</label>
                  <input
                    type="date"
                    value={newExpiryDate}
                    min={app.expiryDate ? toDateInput(new Date(new Date(app.expiryDate).getTime() + 86400000)) : undefined}
                    onChange={(e) => { setNewExpiryDate(e.target.value); setPreview(null); }}
                    className={inputClass}
                  />
                </div>
                <button type="button" onClick={compute} disabled={!newExpiryDate} className="px-4 py-2 rounded-xl border border-[#002f6c] text-[#002f6c] text-xs font-bold hover:bg-[#ebf3fc] cursor-pointer disabled:opacity-40 dark:border-[#49b1ea] dark:text-[#49b1ea] dark:hover:bg-[#49b1ea]/10">
                  Compute Additional Premium
                </button>
              </div>
            )}

            {kind === 'Cancellation' && !preview && (
              <button type="button" onClick={compute} disabled={!effectiveDate} className="px-4 py-2 rounded-xl border border-[#002f6c] text-[#002f6c] text-xs font-bold hover:bg-[#ebf3fc] cursor-pointer disabled:opacity-40 dark:border-[#49b1ea] dark:text-[#49b1ea] dark:hover:bg-[#49b1ea]/10">
                Compute Refund
              </button>
            )}

            {preview && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {preview.type === 'Term_Extension' && <>Extending by <b>{preview.addedDays} day(s)</b> at the policy's own rate ({preview.termDays}-day term).</>}
                  {preview.type === 'Cancellation_Flat' && <><b>{ENDORSEMENT_TYPE_LABEL[preview.type]}</b> — cancelled on or before the effectivity date, so the full premium, taxes and fees are refunded.</>}
                  {preview.type === 'Cancellation_Pro_Rata' && <><b>{ENDORSEMENT_TYPE_LABEL[preview.type]}</b> — {preview.daysUsed} of {preview.termDays} days used; {preview.unexpiredDays} unexpired day(s) of the base premium are refunded. Taxes and fees are not refundable.</>}
                </p>
                <AmountsTable amounts={preview.amounts} />
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  This goes to review and approval. The policy won't change until it's approved.
                  {preview.type !== 'Term_Extension' && ` Refund of ${peso(preview.amounts.total)} will be issued as a Credit Memo.`}
                </p>
              </div>
            )}

            {error && <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button type="button" onClick={submit} disabled={!canSubmit} className="px-5 py-2 rounded-xl bg-[#002f6c] hover:bg-[#00224f] text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
                {busy ? 'Submitting…' : kind === 'Non_Financial' ? 'Submit & Issue Endorsement' : 'Submit for Review'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
