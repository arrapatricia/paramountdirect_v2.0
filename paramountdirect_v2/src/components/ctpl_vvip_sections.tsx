import { useState } from 'react';
import { ShieldCheck, MessageSquare, Paperclip, Plus, Printer, Send, Trash2, Eye } from 'lucide-react';
import { Section, FieldGrid, Field } from './application_detail_ui';
import { PrintableDocumentModal, DocRow } from './policy_documents';

// Three sections mirroring the real admin system's per-application page
// (Consent / DPA, Remarks, VVIP Document upload) - UI-first pass per request,
// local state only for now; wiring to real endpoints (consent capture,
// remarks CRUD, document upload/delete/send) comes in a follow-up.

const DPA_ROWS = [
  { key: 'processing', label: 'A. Processing of Data' },
  { key: 'retention', label: 'B. Retention' },
  { key: 'marketing', label: 'C. Marketing & Promotions' },
  { key: 'services', label: 'D. Services' },
  { key: 'sharing', label: 'E. Sharing of Data' },
] as const;

export function ConsentSection({ ownerName, referenceNo }: { ownerName: string; referenceNo: string }) {
  const [viewingDpa, setViewingDpa] = useState(false);
  return (
    <Section icon={ShieldCheck} title="Consent" isEditing={false} onToggleEdit={() => {}} hideEditButton iconColorClass="text-[#002f6c] dark:text-[#49b1ea]">
      <div className="flex justify-end -mt-1 mb-1">
        <button
          type="button"
          onClick={() => setViewingDpa(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#002f6c] text-white text-[11px] font-bold hover:bg-[#00224f] cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" /><span>Print DPA</span>
        </button>
      </div>
      <FieldGrid>
        {DPA_ROWS.map((row) => (
          <Field key={row.key} label={row.label} editing={false} edit={null} view={<span className="text-emerald-600 dark:text-emerald-400">Yes</span>} />
        ))}
      </FieldGrid>

      {viewingDpa && (
        <PrintableDocumentModal title="Data Privacy Act Consent" onClose={() => setViewingDpa(false)}>
          <p className="text-center text-sm font-extrabold uppercase tracking-wide text-slate-900">Data Privacy Act Consent</p>
          <DocRow label="Reference No." value={referenceNo} />
          <DocRow label="Data Subject" value={ownerName} />
          {DPA_ROWS.map((row) => <DocRow key={row.key} label={row.label} value="Yes" />)}
          <p className="text-[9px] text-slate-500 leading-relaxed pt-1">
            By completing this application, the data subject consents to Paramount Life &amp; General Insurance Corporation's collection, processing, retention, and sharing of personal data as described above, in accordance with the Data Privacy Act of 2012 (RA 10173).
          </p>
        </PrintableDocumentModal>
      )}
    </Section>
  );
}

interface Remark {
  id: string;
  remarks: string;
  recipients: string;
  sender: string;
  date: string;
  time: string;
}

export function RemarksSection() {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({ remarks: '', recipients: '', sender: '' });

  const addRemark = () => {
    if (!draft.remarks.trim()) return;
    const now = new Date();
    setRemarks((prev) => [
      {
        id: `${Date.now()}`,
        remarks: draft.remarks.trim(),
        recipients: draft.recipients.trim() || '-',
        sender: draft.sender.trim() || 'System Admin',
        date: now.toLocaleDateString('en-US'),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev,
    ]);
    setDraft({ remarks: '', recipients: '', sender: '' });
    setIsAdding(false);
  };

  return (
    <Section icon={MessageSquare} title="Remarks" isEditing={false} onToggleEdit={() => {}} hideEditButton iconColorClass="text-[#002f6c] dark:text-[#49b1ea]">
      <div className="flex justify-end -mt-1 mb-1">
        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#002f6c] hover:text-white text-slate-600 text-[11px] font-bold cursor-pointer transition-colors dark:bg-slate-800 dark:text-slate-300"
        >
          <Plus className="w-3.5 h-3.5" /><span>Add Remark</span>
        </button>
      </div>

      {isAdding && (
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 space-y-2 mb-2">
          <textarea
            value={draft.remarks}
            onChange={(e) => setDraft({ ...draft, remarks: e.target.value })}
            placeholder="Remarks (e.g. authentication/issuance note)"
            rows={2}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={draft.sender}
              onChange={(e) => setDraft({ ...draft, sender: e.target.value })}
              placeholder="Sender (Authenticator/Issuer)"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <input
              value={draft.recipients}
              onChange={(e) => setDraft({ ...draft, recipients: e.target.value })}
              placeholder="Recipients"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49b1ea] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={addRemark} className="px-3 py-1.5 rounded-lg bg-[#002f6c] text-white text-[11px] font-bold hover:bg-[#00224f] cursor-pointer">Save Remark</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wide dark:border-slate-800 dark:text-slate-500">
              <th className="py-2 px-2">Remarks</th>
              <th className="py-2 px-2">Recipients</th>
              <th className="py-2 px-2">Sender</th>
              <th className="py-2 px-2">Date</th>
              <th className="py-2 px-2">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {remarks.length === 0 ? (
              <tr><td colSpan={5} className="py-4 text-center text-slate-400 font-semibold dark:text-slate-500">No remarks added yet.</td></tr>
            ) : (
              remarks.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 px-2 font-semibold text-slate-800 dark:text-slate-200">{r.remarks}</td>
                  <td className="py-2 px-2 text-slate-600 dark:text-slate-400">{r.recipients}</td>
                  <td className="py-2 px-2 text-slate-600 dark:text-slate-400">{r.sender}</td>
                  <td className="py-2 px-2 text-slate-600 dark:text-slate-400">{r.date}</td>
                  <td className="py-2 px-2 text-slate-600 dark:text-slate-400">{r.time}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

interface UploadedDoc {
  id: string;
  name: string;
  uploader: string;
  date: string;
  time: string;
  url: string;
}

export function UploadedDocumentsSection({ notify }: { notify: (message: string) => void }) {
  const [docs, setDocs] = useState<UploadedDoc[]>([]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const now = new Date();
    setDocs((prev) => [
      {
        id: `${Date.now()}`,
        name: file.name,
        uploader: 'System Admin',
        date: now.toLocaleDateString('en-US'),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        url: URL.createObjectURL(file),
      },
      ...prev,
    ]);
  };

  const removeDoc = (id: string) => setDocs((prev) => prev.filter((d) => d.id !== id));

  return (
    <Section icon={Paperclip} title="Uploaded Documents" isEditing={false} onToggleEdit={() => {}} hideEditButton iconColorClass="text-[#002f6c] dark:text-[#49b1ea]">
      <div className="flex justify-end -mt-1 mb-1">
        <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#002f6c] text-white text-[11px] font-bold hover:bg-[#00224f] cursor-pointer">
          <Plus className="w-3.5 h-3.5" /><span>Upload Document</span>
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wide dark:border-slate-800 dark:text-slate-500">
              <th className="py-2 px-2">File / Document</th>
              <th className="py-2 px-2">Uploader</th>
              <th className="py-2 px-2">Date</th>
              <th className="py-2 px-2">Time</th>
              <th className="py-2 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {docs.length === 0 ? (
              <tr><td colSpan={5} className="py-4 text-center text-slate-400 font-semibold dark:text-slate-500">No documents uploaded yet.</td></tr>
            ) : (
              docs.map((d) => (
                <tr key={d.id}>
                  <td className="py-2 px-2 font-semibold text-slate-800 dark:text-slate-200">{d.name}</td>
                  <td className="py-2 px-2 text-slate-600 dark:text-slate-400">{d.uploader}</td>
                  <td className="py-2 px-2 text-slate-600 dark:text-slate-400">{d.date}</td>
                  <td className="py-2 px-2 text-slate-600 dark:text-slate-400">{d.time}</td>
                  <td className="py-2 px-2">
                    <div className="flex items-center justify-center space-x-1.5">
                      <a href={d.url} target="_blank" rel="noreferrer" title="View / Print" className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-[#002f6c] hover:text-white cursor-pointer dark:bg-slate-800 dark:text-slate-300">
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <button type="button" title="Send" onClick={() => notify(`${d.name} sent.`)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-[#002f6c] hover:text-white cursor-pointer dark:bg-slate-800 dark:text-slate-300">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" title="Delete" onClick={() => removeDoc(d.id)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white cursor-pointer dark:bg-slate-800 dark:text-slate-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
