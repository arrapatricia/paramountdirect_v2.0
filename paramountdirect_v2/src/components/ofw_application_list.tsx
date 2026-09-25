import { useState } from 'react';
import {
  Search, Eye, X, ChevronLeft, ChevronRight, UserPlus,
  FileCheck2, FileX2, ShieldAlert, Plane, CheckCircle2, Send, Pencil, ArrowLeft,
  ClipboardList, User, Briefcase, FileStack, ShieldCheck, Lock
} from 'lucide-react';
import { OFW_STATUSES, OFW_STATUS_DESCRIPTIONS, getOfwPolicyStatus, type OfwApplication, type OfwPolicyStatus } from './ofw_types';
import { PolicyDocumentsSection, PrintableDocumentModal, DocRow, type PolicyDocumentSpec } from './policy_documents';
import { Section, FieldGrid, Field } from './application_detail_ui';
import { documentsApi, ApiError } from '../lib/api';
import OfwPolicyEndorsements from './ofw_policy_endorsements';

interface Props {
  data: OfwApplication[];
  onCreateNew?: () => void;
  onUpdate?: (id: string, patch: Partial<OfwApplication>) => void;
  // Controlled from App.tsx so the currently-open application has a real,
  // bookmarkable URL (/ofw/applications/:id) - see lib/routes.ts. A paid
  // application is still a quick-preview modal over the list (nothing to
  // edit); an unpaid one navigates to its own full detail page since it
  // supports editing and the verify/payment workflow.
  viewingId?: string | null;
  onView?: (id: string) => void;
  onCloseView?: () => void;
  // Live backend available (App.tsx's ofwConnected) - endorsements are
  // server-only, so the Endorsements section needs it.
  connected?: boolean;
}

const OFW_DOCUMENTS: PolicyDocumentSpec[] = [
  { key: 'coi', label: 'Certificate of Insurance (COI)' },
  { key: 'serviceInvoice', label: 'Service Invoice' },
  { key: 'or', label: 'Official Receipt (OR)' },
];

const ITEMS_PER_PAGE = 20;
const STATUS_TABS = ['All', ...OFW_STATUSES] as const;

// Only statuses that make sense for an application still awaiting payment -
// Reversed requires a prior payment to reverse, so it's excluded here.
const EDITABLE_UNPAID_STATUSES = ['Received', 'Spoiled', 'Duplicate', 'Cancelled'] as const;

type OfwEditForm = Pick<
  OfwApplication,
  'firstName' | 'middleName' | 'lastName' | 'gender' | 'civilStatus' | 'occupation' | 'employerName' | 'employerCountry' | 'premium' | 'screenedBy' | 'status'
>;

const buildEditForm = (app: OfwApplication): OfwEditForm => ({
  firstName: app.firstName, middleName: app.middleName, lastName: app.lastName,
  gender: app.gender, civilStatus: app.civilStatus, occupation: app.occupation,
  employerName: app.employerName, employerCountry: app.employerCountry,
  premium: app.premium, screenedBy: app.screenedBy, status: app.status,
});

const editInputClass = 'w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const editLabelClass = 'text-slate-400 font-bold block mb-1 dark:text-slate-500';

// Drops the year from an already-formatted "M/D/YYYY h:mm AM" string (e.g.
// "9/22/2026 1:55 PM" -> "9/22 1:55 PM") so the table's Received/Processed/
// Issued column has room for a full time-of-day without wrapping.
const shortDateTime = (s?: string) => s ? s.replace(/\/\d{4}(?=\s|$)/, '') : s;

// Shared by both detail views (the paid quick-preview modal and the unpaid
// full page) so the printed COI / Service Invoice / OR templates aren't
// maintained in two places.
function printableDocBody(app: OfwApplication, viewingDoc: string) {
  if (viewingDoc === 'coi') {
    // Matches the real "Certificate of Insurance" (BM/DH variant) template -
    // see DM_Certificate of Insurance BM/DH_withFields.pdf. Benefit amounts
    // and wording are identical between the two variants; only the covered
    // wording (Balik Manggagawa vs. Direct Hired) differs.
    return (
      <>
        <p className="text-center text-sm font-extrabold uppercase tracking-wide text-slate-900">Certificate of Insurance</p>
        <p className="text-[11px] leading-relaxed text-slate-700 border-b border-dashed border-slate-300 pb-3">
          <strong>{app.firstName} {app.middleName} {app.lastName}</strong> is covered under the{' '}
          <strong>Compulsory Migrant Workers Insurance &ndash; {app.natureOfEmployment === 'Balik-Manggagawa' ? 'Balik Manggagawa' : 'Direct Hired'}</strong>{' '}
          of Paramount Life &amp; General Insurance Corporation (PLGIC). This certificate of insurance is governed by the terms and conditions, warranties, and clauses of said Policy and all claims will be adjusted in accordance therewith. The insurance coverage shall be effective from the date set forth below and premium payment is received by Paramount Life &amp; General Insurance Corporation's Head Office, Branch Office, or Authorized Representative.
        </p>
        <DocRow label="COI No." value={app.policyNumber ?? '—'} />
        <DocRow label="Insured" value={`${app.firstName} ${app.middleName} ${app.lastName}`} />
        <DocRow label="Employer / Country" value={`${app.employerName}, ${app.employerCountry}`} />
        <DocRow label="Contract Period" value={`${app.contractStart} to ${app.contractEnd}`} />
        <DocRow label="Insurance Start Date" value={app.insuranceStart} />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <table className="w-full text-[10px] border border-slate-300">
            <thead><tr className="bg-slate-100"><th className="text-left px-2 py-1 border-b border-slate-300">Benefits</th><th className="text-right px-2 py-1 border-b border-slate-300">Amount of Benefits</th></tr></thead>
            <tbody>
              <tr><td className="px-2 py-1 border-b border-dashed border-slate-200">Accidental Death</td><td className="px-2 py-1 border-b border-dashed border-slate-200 text-right font-bold">US $20,000.00</td></tr>
              <tr><td className="px-2 py-1 border-b border-dashed border-slate-200">Natural Death</td><td className="px-2 py-1 border-b border-dashed border-slate-200 text-right font-bold">US $10,000.00</td></tr>
              <tr><td className="px-2 py-1 border-b border-dashed border-slate-200">Permanent Total Disablement</td><td className="px-2 py-1 border-b border-dashed border-slate-200 text-right font-bold">US $7,500.00</td></tr>
              <tr><td className="px-2 py-1 border-b border-dashed border-slate-200">Repatriation (in case of death)</td><td className="px-2 py-1 border-b border-dashed border-slate-200 text-right font-bold">Actual Cost</td></tr>
              <tr><td className="px-2 py-1">Termination of Employment</td><td className="px-2 py-1 text-right font-bold">Actual Cost</td></tr>
            </tbody>
          </table>
          <table className="w-full text-[10px] border border-slate-300">
            <thead><tr className="bg-slate-100"><th className="text-left px-2 py-1 border-b border-slate-300">Benefits (continuation)</th><th className="text-right px-2 py-1 border-b border-slate-300">Amount of Benefits</th></tr></thead>
            <tbody>
              <tr><td className="px-2 py-1 border-b border-dashed border-slate-200">Subsistence Benefit</td><td className="px-2 py-1 border-b border-dashed border-slate-200 text-right font-bold">US $100.00, not exceeding 6 months</td></tr>
              <tr><td className="px-2 py-1 border-b border-dashed border-slate-200">Money Claims Benefit</td><td className="px-2 py-1 border-b border-dashed border-slate-200 text-right font-bold">US $1,000 max/mo, not exceeding 6 months</td></tr>
              <tr><td className="px-2 py-1 border-b border-dashed border-slate-200">Compassionate Visit</td><td className="px-2 py-1 border-b border-dashed border-slate-200 text-right font-bold">Actual Cost</td></tr>
              <tr><td className="px-2 py-1 border-b border-dashed border-slate-200">Medical Evacuation</td><td className="px-2 py-1 border-b border-dashed border-slate-200 text-right font-bold">Actual Cost</td></tr>
              <tr><td className="px-2 py-1">Medical Repatriation</td><td className="px-2 py-1 text-right font-bold">Actual Cost</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-600 pt-1"><strong>Term of Insurance:</strong> Coverage starts upon the insured Migrant Worker's departure from the Philippines and shall continue during the entire term of his/her employment contract but not to exceed one (1) year from the date of his/her departure from the Philippines.</p>
        <DocRow label="Premium" value={app.premium} />
        <p className="text-[10px] text-slate-500 pt-2 text-right">Paramount Life &amp; General Insurance Corporation<br /><strong>George T. Tiu</strong> &mdash; President</p>
        <p className="text-[9px] text-slate-400 pt-2 border-t border-dashed border-slate-300 leading-relaxed">
          The reader policy may be viewed and printed thru any of the websites of the Insurance Commission (www.insurance.gov.ph), Philippine Overseas Employment Administration (www.poea.gov.ph), Paramount Life &amp; General Insurance Corporation (www.paramount.com.ph) and the recruitment agency. For 24/7 Medical Evacuation and Repatriation, call our hotline +632 8396 9697.
        </p>
      </>
    );
  }
  if (viewingDoc === 'serviceInvoice') {
    // Matches the real Service Invoice template.
    return (
      <>
        <p className="text-center text-sm font-extrabold uppercase tracking-wide text-slate-900">Service Invoice</p>
        <DocRow label="Invoice No." value={`INV-${app.referenceNo ?? app.id}`} />
        <DocRow label="Invoice Date" value={app.dateReceived} />
        <DocRow label="COI No." value={app.policyNumber ?? '—'} />
        <DocRow label="Insured" value={`${app.firstName} ${app.middleName} ${app.lastName}`} />
        <DocRow label="Term of Insurance" value={`${app.contractStart} to ${app.contractEnd}`} />
        <table className="w-full text-[10px] border border-slate-300 mt-1">
          <thead><tr className="bg-[#002f6c] text-white"><th className="text-left px-2 py-1.5">Item Description / Nature of Service</th><th className="text-right px-2 py-1.5">Amount</th></tr></thead>
          <tbody>
            <tr><td className="px-2 py-1.5 border-b border-dashed border-slate-200">OFW Compulsory Insurance Premium</td><td className="px-2 py-1.5 border-b border-dashed border-slate-200 text-right font-bold">{app.premium}</td></tr>
          </tbody>
        </table>
        <DocRow label="Total Amount" value={app.premium} />
        <p className="text-[10px] text-slate-500 pt-2">Please make check payments payable to Paramount Life &amp; General Insurance Corporation.</p>
      </>
    );
  }
  return (
    <>
      <DocRow label="Reference No." value={app.referenceNo ?? app.id} />
      <DocRow label="Insured" value={`${app.firstName} ${app.middleName} ${app.lastName}`} />
      <DocRow label="Coverage Type" value={app.coverageType} />
      <DocRow label="Employer / Country" value={`${app.employerName}, ${app.employerCountry}`} />
      <DocRow label="Contract Period" value={`${app.contractStart} to ${app.contractEnd}`} />
      <DocRow label="Insurance Start Date" value={app.insuranceStart} />
      <DocRow label="Premium" value={app.premium} />
      {viewingDoc === 'or' && <DocRow label="OR Status" value="PAID" />}
    </>
  );
}

const getPolicyStatusBadgeStyle = (status: OfwPolicyStatus) => {
  switch (status) {
    case 'Issued': return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    case 'Spoiled': return 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    case 'Cancelled': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
  }
};

const getRowTintStyle = (status: string) => {
  switch (status) {
    case 'Received': return 'bg-[#002f6c]/[0.03] hover:bg-[#002f6c]/[0.06] dark:bg-[#49b1ea]/[0.04] dark:hover:bg-[#49b1ea]/[0.08]';
    case 'Spoiled': return 'bg-rose-50/60 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/30';
    case 'Cancelled': return 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800';
    case 'Duplicate': return 'bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30';
    case 'Reversed': return 'bg-purple-50/60 hover:bg-purple-50 dark:bg-purple-950/20 dark:hover:bg-purple-950/30';
    default: return 'hover:bg-slate-50 dark:hover:bg-slate-800/60';
  }
};

export default function OfwApplicationList({ data, onCreateNew, onUpdate, viewingId = null, onView, onCloseView, connected = false }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<OfwEditForm | null>(null);

  // Look up from `data` (rather than holding a snapshot) so the view stays
  // in sync as verification/payment fields change.
  // viewingId is the Reference No. when one exists (readable URL, e.g.
  // /ofw/applications/3000871241) - id is only a fallback for the rare
  // legacy row that predates always-assigned reference numbers.
  const viewingApp = viewingId ? data.find((d) => (d.referenceNo ?? d.id) === viewingId) ?? null : null;

  const closeModal = () => { onCloseView?.(); setEditForm(null); };
  const startEdit = () => { if (viewingApp) setEditForm(buildEditForm(viewingApp)); };
  const cancelEdit = () => setEditForm(null);
  const saveEdit = () => {
    if (!viewingApp || !editForm) return;
    onUpdate?.(viewingApp.id, editForm);
    notify('Application details updated.');
    setEditForm(null);
  };

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2500);
  };

  // Only the Service Invoice has a real generated PDF (ofwDocumentFill.ts) -
  // fetch and open the actual file via a short-lived presigned S3 URL. COI
  // and OR have no real template/service yet, so they still fall back to
  // the in-app mock modal below.
  const handleViewDoc = async (key: string) => {
    if (key !== 'serviceInvoice' || !viewingApp) { setViewingDoc(key); return; }
    const label = OFW_DOCUMENTS.find((d) => d.key === key)?.label ?? 'Document';
    try {
      const docs = await documentsApi.list('OFW', viewingApp.id);
      const doc = docs.find((d) => d.docKey === 'ofw-service-invoice');
      if (!doc) { notify(`${label} hasn't been generated for this application yet.`); return; }
      const { url } = await documentsApi.getUrl(doc.id);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : `Failed to open ${label}.`);
    }
  };

  const handleSendDoc = async (key: string) => {
    const label = OFW_DOCUMENTS.find((d) => d.key === key)?.label ?? 'Document';
    if (key !== 'serviceInvoice' || !viewingApp) { notify(`${label} emailed to ${viewingApp?.email}.`); return; }
    try {
      const docs = await documentsApi.list('OFW', viewingApp.id);
      const doc = docs.find((d) => d.docKey === 'ofw-service-invoice');
      if (!doc) { notify(`${label} hasn't been generated for this application yet.`); return; }
      notify(`${label} emailed to ${viewingApp.email}.`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : `Failed to send ${label}.`);
    }
  };

  const tabCounts: Record<string, number> = {
    'All': data.length,
    ...Object.fromEntries(OFW_STATUSES.map((s) => [s, data.filter(d => d.status === s).length])),
  };

  const filteredData = data.filter((item) => {
    const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesTab = activeTab === 'All' || item.status === activeTab;
    const matchesSearch = fullName.includes(term) || (item.referenceNo ?? '').toLowerCase().includes(term) || (item.policyNumber ?? '').toLowerCase().includes(term);
    return matchesTab && matchesSearch;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleTabChange = (tab: (typeof STATUS_TABS)[number]) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const docBadge = (label: string, status: 'Uploaded' | 'Missing') => (
    <span
      key={label}
      title={`${label}: ${status}`}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg ${
        status === 'Uploaded' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
      }`}
    >
      {status === 'Uploaded' ? <FileCheck2 className="w-3.5 h-3.5" /> : <FileX2 className="w-3.5 h-3.5" />}
    </span>
  );

  // Payment/Policy Status now live in the page header (see OfwDetailHeader
  // below) rather than buried as plain text fields in the body - matches
  // the PD Life application detail template's header badges.
  const paymentStatusBadge = (app: OfwApplication) => (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap ${app.isPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
      {app.isPaid ? 'Paid' : 'Unpaid'}
    </span>
  );
  const policyStatusBadge = (app: OfwApplication) => {
    const policyStatus = getOfwPolicyStatus(app);
    return (
      <span title={OFW_STATUS_DESCRIPTIONS[app.status]} className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap ${getPolicyStatusBadgeStyle(policyStatus)}`}>
        <span>{policyStatus}</span>
        {app.isPaid && <Lock className="w-3 h-3" />}
      </span>
    );
  };

  const OfwDetailHeader = ({ app, onBack, right }: { app: OfwApplication; onBack: () => void; right?: React.ReactNode }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300" title="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#002f6c] dark:text-[#49b1ea] font-['Montserrat']">
            Application {app.referenceNo ?? app.id}
          </h1>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-500">{app.firstName} {app.lastName} &middot; {app.employerCountry}</span>
            <span className="text-[10px] font-black text-[#002f6c] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md dark:bg-[#49b1ea]/10 dark:text-[#49b1ea] dark:border-[#49b1ea]/30">
              {app.premium}
              {app.premiumPhp ? ` · ${app.premiumPhp}` : ''}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {right}
        {paymentStatusBadge(app)}
        {policyStatusBadge(app)}
      </div>
    </div>
  );

  // Shared read-only body for both the unpaid full page and the paid
  // quick-preview modal, built from the same Section/FieldGrid/Field
  // primitives as the PD Life application detail pages so labels and data
  // are visually distinct instead of a flat two-column text dump.
  const renderDetailSections = (app: OfwApplication) => (
    <>
      <Section icon={ClipboardList} title="Application Status" isEditing={false} onToggleEdit={() => {}} hideEditButton iconColorClass="text-[#002f6c] dark:text-[#49b1ea]">
        <FieldGrid>
          <Field label="Reference No." editing={false} edit={null} view={<span className="font-mono">{app.referenceNo ?? '—'}</span>} />
          <Field label="COI No." editing={false} edit={null} view={<span className="font-mono">{app.policyNumber ?? '—'}</span>} />
          <Field label="Date Received" editing={false} edit={null} view={app.dateReceived} />
          <Field label="Date Processed" editing={false} edit={null} view={app.dateProcessed} />
          <Field label="Payment Instruction Sent By" editing={false} edit={null} view={app.paymentInstructionSentBy} />
          <Field label="Date Issued" editing={false} edit={null} view={app.dateIssued} />
        </FieldGrid>
      </Section>

      <Section icon={User} title="Applicant Information" isEditing={false} onToggleEdit={() => {}} hideEditButton iconColorClass="text-[#002f6c] dark:text-[#49b1ea]">
        <FieldGrid>
          <Field label="Applicant" editing={false} edit={null} view={`${app.firstName} ${app.middleName} ${app.lastName}`} />
          <Field label="Gender / Civil Status" editing={false} edit={null} view={`${app.gender} · ${app.civilStatus}`} />
          <Field label="Birthdate" editing={false} edit={null} view={app.birthdate} />
          <Field label="Place of Birth" editing={false} edit={null} view={app.placeOfBirth} />
          <Field label="Mobile" editing={false} edit={null} view={app.phone} />
          <Field label="Email" editing={false} edit={null} view={app.email} />
          <div className="md:col-span-2 xl:col-span-3">
            <Field
              label="PH Address"
              editing={false}
              edit={null}
              view={[app.phAddress, app.phBarangay !== 'N/A' ? app.phBarangay : null, app.phCity, app.phRegion].filter(Boolean).join(', ')}
            />
          </div>
        </FieldGrid>
      </Section>

      <Section icon={Briefcase} title="Employment Information" isEditing={false} onToggleEdit={() => {}} hideEditButton iconColorClass="text-[#002f6c] dark:text-[#49b1ea]">
        <FieldGrid>
          <Field label="Nature of Employment" editing={false} edit={null} view={app.natureOfEmployment} />
          <Field label="Coverage Type" editing={false} edit={null} view={app.coverageType} />
          <Field label="Occupation" editing={false} edit={null} view={app.occupation} />
          <Field label="Passport No." editing={false} edit={null} view={app.passportNumber} />
          <Field label="Estimated Salary" editing={false} edit={null} view={`${app.salaryAmount.toLocaleString()} ${app.salaryCurrency}`} />
          <Field label="Foreign Employer" editing={false} edit={null} view={app.employerName} />
          <Field
            label="Country of Employment"
            editing={false}
            edit={null}
            view={
              <span className="flex items-center space-x-1">
                <span>{app.employerCountry}</span>
                {app.isConflictZone && <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              </span>
            }
          />
          <Field label="Contract Period" editing={false} edit={null} view={`${app.contractStart} to ${app.contractEnd}`} />
        </FieldGrid>
      </Section>

      <Section icon={FileStack} title="Uploaded Documents" isEditing={false} onToggleEdit={() => {}} hideEditButton iconColorClass="text-[#002f6c] dark:text-[#49b1ea]">
        <div className="flex items-center flex-wrap gap-4">
          {docBadge('Passport', app.documents.passport)}
          {docBadge('Visa', app.documents.visa)}
          {docBadge('Employment Contract', app.documents.employmentContract)}
          {docBadge('Medical Certificate', app.documents.medicalCertificate)}
        </div>
      </Section>

      <Section icon={ShieldCheck} title="Employment Verification & Payment" isEditing={false} onToggleEdit={() => {}} hideEditButton iconColorClass="text-[#002f6c] dark:text-[#49b1ea]">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Employment Contract Verification</span>
            {app.employmentVerified === 'Yes' ? (
              <div className="flex items-center space-x-2">
                {app.dateVerified && <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{app.dateVerified}</span>}
                <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /><span>Verified</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onUpdate?.(app.id, { employmentVerified: 'Yes' })}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate?.(app.id, { employmentVerified: 'No' })}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    app.employmentVerified === 'No' ? 'bg-rose-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  No
                </button>
              </div>
            )}
          </div>

          {app.employmentVerified === 'Yes' && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {app.paymentInstructionSent ? 'Payment instruction sent to client' : 'Send payment instruction to client'}
              </span>
              {app.paymentInstructionSent ? (
                <div className="flex items-center space-x-2">
                  {app.dateProcessed && <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{app.dateProcessed}{app.paymentInstructionSentBy ? ` · ${app.paymentInstructionSentBy}` : ''}</span>}
                  <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /><span>Sent</span>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { onUpdate?.(app.id, { paymentInstructionSent: true }); notify(`Payment instruction sent to ${app.email}.`); }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#002f6c] text-white text-[11px] font-bold hover:bg-[#00224f] cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /><span>Send Payment Instruction</span>
                </button>
              )}
            </div>
          )}

          {app.paymentInstructionSent && !app.isPaid && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Awaiting client payment</span>
              <button
                type="button"
                onClick={() => { onUpdate?.(app.id, { isPaid: true }); notify('Payment confirmed — documents are now available.'); }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 cursor-pointer"
              >
                Simulate Payment Received
              </button>
            </div>
          )}

          {/* Dev-only shortcut, local testing only (import.meta.env.DEV is
              false in a production build). Only enabled once the real
              prerequisites - employment verified Yes and payment instruction
              sent - are already met, same gate as the button above; it just
              skips having to also click through Verified/Sent to get there. */}
          {import.meta.env.DEV && !app.isPaid && (
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border border-dashed ${app.employmentVerified === 'Yes' && app.paymentInstructionSent ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800' : 'border-slate-200 bg-slate-50 dark:bg-slate-800/40 dark:border-slate-700'}`}>
              <span className={`text-xs font-bold ${app.employmentVerified === 'Yes' && app.paymentInstructionSent ? 'text-purple-800 dark:text-purple-300' : 'text-slate-400 dark:text-slate-500'}`}>
                Dev only: simulate payment
                {!(app.employmentVerified === 'Yes' && app.paymentInstructionSent) && ' (requires Verified + Sent above)'}
              </span>
              <button
                type="button"
                disabled={!(app.employmentVerified === 'Yes' && app.paymentInstructionSent)}
                onClick={() => { onUpdate?.(app.id, { isPaid: true }); notify('Test payment simulated — application marked Paid.'); }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[11px] font-bold hover:bg-purple-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
              >
                Simulate Payment (Test)
              </button>
            </div>
          )}
        </div>
      </Section>

      <Section icon={FileStack} title="Documents & Endorsements" isEditing={false} onToggleEdit={() => {}} hideEditButton iconColorClass="text-[#002f6c] dark:text-[#49b1ea]">
        <PolicyDocumentsSection
          isPaid={app.isPaid}
          documents={OFW_DOCUMENTS}
          onView={handleViewDoc}
          onSend={handleSendDoc}
          lockedMessage={
            app.employmentVerified !== 'Yes'
              ? 'Documents will be available once employment is verified, payment instructions are sent, and the client completes payment.'
              : !app.paymentInstructionSent
              ? 'Send the payment instruction to the client to proceed.'
              : 'Awaiting confirmation that the client has completed payment.'
          }
        />
        {app.isPaid && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <OfwPolicyEndorsements app={app} connected={connected} notify={notify} />
          </div>
        )}
      </Section>
    </>
  );

  // An unpaid application gets its own full detail page (editable, with the
  // verify/payment workflow) instead of the list, matching the URL App.tsx
  // gave it - a paid one stays a quick-preview overlay, rendered further down.
  if (viewingApp && !viewingApp.isPaid) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-[1000px] mx-auto font-sans text-slate-900 dark:text-slate-100">
        <OfwDetailHeader
          app={viewingApp}
          onBack={closeModal}
          right={
            !editForm && (
              <button onClick={startEdit} className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                <Pencil className="w-3.5 h-3.5" /><span>Edit</span>
              </button>
            )
          }
        />

        <div className={editForm ? 'p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-6 dark:bg-slate-900 dark:border-slate-800' : 'space-y-4'}>
          {editForm ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div><label className={editLabelClass}>First Name</label><input className={editInputClass} value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} /></div>
              <div><label className={editLabelClass}>Middle Name</label><input className={editInputClass} value={editForm.middleName} onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })} /></div>
              <div><label className={editLabelClass}>Last Name</label><input className={editInputClass} value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} /></div>
              <div>
                <label className={editLabelClass}>Gender</label>
                <select className={editInputClass} value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as OfwApplication['gender'] })}>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div>
                <label className={editLabelClass}>Civil Status</label>
                <select className={editInputClass} value={editForm.civilStatus} onChange={(e) => setEditForm({ ...editForm, civilStatus: e.target.value as OfwApplication['civilStatus'] })}>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Widower</option>
                  <option>Separated</option>
                </select>
              </div>
              <div><label className={editLabelClass}>Occupation</label><input className={editInputClass} value={editForm.occupation} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} /></div>
              <div><label className={editLabelClass}>Foreign Employer</label><input className={editInputClass} value={editForm.employerName} onChange={(e) => setEditForm({ ...editForm, employerName: e.target.value })} /></div>
              <div><label className={editLabelClass}>Country of Employment</label><input className={editInputClass} value={editForm.employerCountry} onChange={(e) => setEditForm({ ...editForm, employerCountry: e.target.value })} /></div>
              <div><label className={editLabelClass}>Premium</label><input className={editInputClass} value={editForm.premium} onChange={(e) => setEditForm({ ...editForm, premium: e.target.value })} /></div>
              <div><label className={editLabelClass}>Issuer</label><input className={editInputClass} value={editForm.screenedBy} onChange={(e) => setEditForm({ ...editForm, screenedBy: e.target.value })} /></div>
              <div>
                <label className={editLabelClass}>Application Status</label>
                <select className={editInputClass} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as OfwApplication['status'] })}>
                  {EDITABLE_UNPAID_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ) : (
            renderDetailSections(viewingApp)
          )}

          <div className={`flex justify-end gap-2 pt-2 ${editForm ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}>
            {editForm ? (
              <>
                <button onClick={cancelEdit} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button onClick={saveEdit} className="px-4 py-2 rounded-xl bg-[#002f6c] text-white text-xs font-bold hover:bg-[#00224f] cursor-pointer">
                  Save Changes
                </button>
              </>
            ) : (
              <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Back to Applications
              </button>
            )}
          </div>
        </div>

        {/* Printable Document Modal */}
        {viewingDoc && (
          <PrintableDocumentModal
            title={OFW_DOCUMENTS.find((d) => d.key === viewingDoc)?.label ?? 'Document'}
            onClose={() => setViewingDoc(null)}
          >
            {printableDocBody(viewingApp, viewingDoc)}
          </PrintableDocumentModal>
        )}

        {notification && (
          <div className="fixed top-6 right-6 z-[100] p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{notification}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900 dark:text-slate-100">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Plane className="h-6 w-6 text-[#002f6c] dark:text-[#49b1ea]" />
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#002f6c] dark:text-[#49b1ea] font-['Montserrat']">
              OFW APPLICATIONS
            </h1>
            <p className="text-xs text-slate-500 font-semibold dark:text-slate-500">OFW Compulsory Insurance — application registry and document verification</p>
          </div>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center space-x-2 bg-[#002f6c] hover:bg-[#00224f] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search by applicant name or reference no..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="rounded-2xl border border-slate-300 bg-slate-200/70 p-1 flex items-center justify-start space-x-1 overflow-x-auto dark:border-slate-700 dark:bg-slate-800/70">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {tab} <span className="font-extrabold ml-1">{tabCounts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Table - fixed layout with fitted column widths so it never needs
          horizontal scrolling on a normal desktop viewport. */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
        <div>
          <table className="w-full table-fixed text-left text-[11px]">
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[11%]" />
              <col className="w-[9%]" />
              <col className="w-[21%]" />
              <col className="w-[6%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[5%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-300 text-slate-800 font-extrabold uppercase tracking-wider dark:border-slate-700 dark:text-slate-300">
                <th className="py-3 px-2">Reference No.</th>
                <th className="py-3 px-2">COI No.</th>
                <th className="py-3 px-2">Insured Name</th>
                <th className="py-3 px-2">Country</th>
                <th className="py-3 px-2">Received / Processed / Issued</th>
                <th className="py-3 px-2">Premium</th>
                <th className="py-3 px-2 text-center">Payment</th>
                <th className="py-3 px-2 text-center">Policy Status</th>
                <th className="py-3 px-2">Issuer</th>
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-bold dark:text-slate-500">
                    No applications match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const policyStatus = getOfwPolicyStatus(row);
                  return (
                  <tr key={row.id} className={`transition-colors ${getRowTintStyle(row.status)}`}>
                    <td className="py-3 px-2 font-mono font-bold text-slate-800 dark:text-slate-200 truncate" title={row.referenceNo ?? '—'}>
                      {row.referenceNo ?? <span className="text-slate-300 text-[10px] font-bold dark:text-slate-600">&mdash;</span>}
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-800 dark:text-slate-200 truncate" title={row.policyNumber ?? '—'}>
                      {row.policyNumber ?? <span className="text-slate-300 text-[10px] font-bold dark:text-slate-600">&mdash;</span>}
                    </td>
                    <td className="py-3 px-2 truncate" title={`${row.firstName} ${row.lastName}`}>
                      <div className="font-bold text-slate-900 dark:text-white truncate">{row.firstName} {row.lastName}</div>
                      {row.isConflictZone && (
                        <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold text-amber-700 mt-0.5 dark:text-amber-400">
                          <ShieldAlert className="w-3 h-3 flex-shrink-0" /><span className="truncate">Conflict Zone</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 font-semibold text-slate-700 dark:text-slate-300 truncate" title={row.employerCountry}>{row.employerCountry}</td>
                    <td className="py-3 px-2 font-semibold text-slate-700 dark:text-slate-300 leading-tight" title={`Received ${row.dateReceived} · Processed ${row.dateProcessed ?? '—'} · Issued ${row.dateIssued ?? '—'}`}>
                      <div className="truncate"><span className="text-slate-400 dark:text-slate-500 font-bold mr-1">R</span>{shortDateTime(row.dateReceived)}</div>
                      <div className="truncate"><span className="text-slate-400 dark:text-slate-500 font-bold mr-1">P</span>{shortDateTime(row.dateProcessed) ?? '—'}</div>
                      <div className="truncate"><span className="text-slate-400 dark:text-slate-500 font-bold mr-1">I</span>{shortDateTime(row.dateIssued) ?? '—'}</div>
                    </td>
                    <td className="py-3 px-2 truncate">
                      <div className="font-black text-[#002f6c] dark:text-[#49b1ea] truncate">{row.premium}</div>
                      {row.premiumPhp && <div className="truncate text-[10px] font-bold text-slate-400 dark:text-slate-500">{row.premiumPhp}</div>}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg border text-[10px] font-bold ${row.isPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
                        {row.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        title={OFW_STATUS_DESCRIPTIONS[row.status]}
                        className={`inline-flex items-center px-2 py-1 rounded-lg border text-[10px] font-bold ${getPolicyStatusBadgeStyle(policyStatus)}`}
                      >
                        {policyStatus}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-semibold text-slate-700 dark:text-slate-300 truncate" title={row.screenedBy || '-'}>{row.screenedBy || '-'}</td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => onView?.(row.referenceNo ?? row.id)}
                        className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#002f6c] hover:text-white transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                        title="View Application Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-y-3 pt-4 mt-4 border-t border-slate-200 px-2 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-semibold dark:text-slate-500">
              Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> records
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <div className="text-xs font-bold text-slate-700 px-2 dark:text-slate-300">Page {currentPage} of {totalPages}</div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail View - a paid application is a quick-preview overlay (there's
          nothing to edit, so no reason to leave the list); an unpaid one
          still supports editing and the verify/payment workflow, so it gets
          its own full page instead (see the early return above). */}
      {viewingApp && viewingApp.isPaid && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex justify-between items-start gap-4 border-b pb-4 border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-wider text-[#002f6c] dark:text-[#49b1ea] font-['Montserrat']">Application {viewingApp.referenceNo ?? viewingApp.id}</h2>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-500">{viewingApp.firstName} {viewingApp.lastName} &middot; {viewingApp.employerCountry}</span>
                  <span className="text-[10px] font-black text-[#002f6c] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md dark:bg-[#49b1ea]/10 dark:text-[#49b1ea] dark:border-[#49b1ea]/30">
                    {viewingApp.premium}{viewingApp.premiumPhp ? ` · ${viewingApp.premiumPhp}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {paymentStatusBadge(viewingApp)}
                  {policyStatusBadge(viewingApp)}
                </div>
              </div>
              <button onClick={closeModal} className="cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {renderDetailSections(viewingApp)}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Document Modal */}
      {viewingApp && viewingDoc && (
        <PrintableDocumentModal
          title={OFW_DOCUMENTS.find((d) => d.key === viewingDoc)?.label ?? 'Document'}
          onClose={() => setViewingDoc(null)}
        >
          {printableDocBody(viewingApp, viewingDoc)}
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
