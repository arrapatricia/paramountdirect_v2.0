import React from 'react';
import { ArrowLeft, Edit, ChevronDown, CheckCircle2, Lock, AlertCircle, ShieldAlert, ShieldCheck, Plus, X, type LucideIcon } from 'lucide-react';

// Shared visual language for the three PD Life application detail pages
// (Health / Life & Accident / Comprehensive) - replaces the old flat gray
// "disabled input everywhere" look with the rounded-3xl card + badge
// conventions used across the rest of the app, and moves each section's
// Edit control into its own header instead of an orphaned button at the
// bottom of the card.

export const editInputClass =
  'w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#008cb4] shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white';
export const editSelectClass = `${editInputClass} cursor-pointer`;

export type NotificationState = { type: 'success' | 'error' | 'info'; message: string } | null;

export function NotificationBanner({ notification, onDismiss }: { notification: NotificationState; onDismiss: () => void }) {
  if (!notification) return null;
  return (
    <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold shadow-md animate-fadeIn ${
      notification.type === 'success'
        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
        : notification.type === 'error'
        ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'
        : 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300'
    }`}>
      <div className="flex items-center space-x-2.5">
        {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
        {notification.type === 'error' && <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />}
        {notification.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />}
        <span>{notification.message}</span>
      </div>
      <button onClick={onDismiss} className="cursor-pointer p-1 rounded-lg hover:bg-black/5">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface StatusControlProps {
  status: string;
  savedStatus: string;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  statusOptions: string[];
  onSelect: (status: string) => void;
  // Application Inquiry is a lookup view, not a workflow tool - status
  // changes only happen from Application Screening, so this renders a
  // plain badge with no dropdown when true.
  locked?: boolean;
}

export function StatusControl({ status, savedStatus, isMenuOpen, setIsMenuOpen, statusOptions, onSelect, locked }: StatusControlProps) {
  if (locked) {
    return (
      <span className="flex items-center space-x-2 bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide dark:text-slate-500">Status</span>
        <span>{savedStatus}</span>
        <Lock className="w-3.5 h-3.5 text-slate-400" />
      </span>
    );
  }

  if (savedStatus === 'Issued') {
    return (
      <span className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="w-3.5 h-3.5" /><span>Issued</span><Lock className="w-3 h-3" />
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2.5 bg-white border border-slate-200 pl-4 pr-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:border-[#d0112b]/40 cursor-pointer transition-all shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
      >
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide dark:text-slate-500">Status</span>
        <span>{status}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 dark:bg-slate-900 dark:border-slate-800">
          <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase border-b border-slate-100 mb-1 dark:text-slate-500 dark:border-slate-800">
            Update Status To:
          </div>
          {statusOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                status === opt ? 'bg-[#d0112b] text-white' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span>{opt}</span>
              {status === opt && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface IssueConfirmModalProps {
  signed: boolean | null;
  onSelectSigned: (signed: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

// Gates the move to "Issued" - the screener must record whether the
// client's physical application form has already been signed, since that
// determines whether the policy lands straight in Signed Applications or
// in the Follow-Up Signature chasing queue.
export function IssueConfirmModal({ signed, onSelectSigned, onConfirm, onCancel }: IssueConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5 font-sans dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 uppercase dark:text-white">Confirm Issuance</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-700 mb-3 dark:text-slate-300">Has the client's application form been signed?</p>
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
              <input
                type="radio"
                name="issue-signed"
                checked={signed === true}
                onChange={() => onSelectSigned(true)}
                className="accent-[#d0112b] w-4 h-4 cursor-pointer"
              />
              <span>Signed</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
              <input
                type="radio"
                name="issue-signed"
                checked={signed === false}
                onChange={() => onSelectSigned(false)}
                className="accent-[#d0112b] w-4 h-4 cursor-pointer"
              />
              <span>Unsigned</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={signed === null}
            className="px-5 py-2 rounded-xl bg-[#d0112b] hover:bg-[#a80d22] text-white text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            Confirm Issue
          </button>
        </div>
      </div>
    </div>
  );
}

interface DetailHeaderProps {
  applicationId: string;
  productName: string;
  planCode: string;
  premium: string;
  onBack: () => void;
  statusControl: React.ReactNode;
}

export function DetailHeader({ applicationId, productName, planCode, premium, onBack, statusControl }: DetailHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
            Application {applicationId}
          </h1>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-500">{productName} ({planCode})</span>
            <span className="text-[10px] font-black text-[#d0112b] bg-red-50 border border-red-100 px-2 py-0.5 rounded-md dark:bg-red-950/30 dark:border-red-900/40">
              {premium}
            </span>
          </div>
        </div>
      </div>
      {statusControl}
    </div>
  );
}

interface SectionProps {
  icon: LucideIcon;
  title: string;
  isEditing: boolean;
  onToggleEdit: () => void;
  children: React.ReactNode;
  // Application Inquiry opens this same detail page as a read-only lookup -
  // hides the Edit control entirely rather than just disabling it.
  hideEditButton?: boolean;
  // Non-Life products (OFW/CTPL/GTP) use navy (#002f6c) instead of PD Life's
  // red brand color - defaults to Life's color so existing call sites don't
  // need to change.
  iconColorClass?: string;
}

export function Section({ icon: Icon, title, isEditing, onToggleEdit, children, hideEditButton, iconColorClass = 'text-[#d0112b]' }: SectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <Icon className={`w-4 h-4 ${iconColorClass}`} />
          <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide dark:text-slate-100">{title}</h2>
        </div>
        {!hideEditButton && (
          <button
            onClick={onToggleEdit}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
              isEditing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-100 hover:bg-[#008cb4] hover:text-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {isEditing ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Save' : 'Edit'}</span>
          </button>
        )}
      </div>
      <div className="space-y-2.5 text-xs">{children}</div>
    </div>
  );
}

// Lays short single-line Fields (Title, Nationality, Zipcode, etc.) out side
// by side instead of one per row - the single biggest source of dead
// whitespace on these pages, since a fixed-width label + a two-word value
// used to claim a full 1200px-wide row each.
export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{children}</div>;
}

interface FieldProps {
  label: string;
  editing: boolean;
  view: React.ReactNode;
  edit: React.ReactNode;
  // No longer affects layout now that the label always sits above the value
  // (stacked, boxed) rather than beside it - kept so existing call sites
  // that still pass it don't need to change.
  align?: 'center' | 'start';
}

export function Field({ label, editing, view, edit }: FieldProps) {
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-700/60">
      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">
        {label}
      </label>
      {editing ? edit : (
        <span className="text-xs font-bold text-slate-900 dark:text-white">
          {view || <span className="text-slate-300 dark:text-slate-700">&mdash;</span>}
        </span>
      )}
    </div>
  );
}

export function AddRowButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick?: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full font-bold py-2 rounded-xl flex items-center justify-center space-x-1.5 text-xs transition-colors ${
        disabled
          ? 'bg-slate-50 text-slate-300 cursor-not-allowed dark:bg-slate-800/50 dark:text-slate-700'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200'
      }`}
    >
      <Plus className="w-3.5 h-3.5" /><span>{label}</span>
    </button>
  );
}
