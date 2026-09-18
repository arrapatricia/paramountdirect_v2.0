import React, { useMemo, useState } from 'react';
import { CheckCircle2, Check, X, Send, Upload, RefreshCw, Download, CircleCheck, CalendarClock, Search, PlusCircle, ArrowLeft, BellRing } from 'lucide-react';
import {
  INITIAL_REGULAR_BILLING,
  INITIAL_E_BILLING,
  INITIAL_CREDIT_CARD_BILLING,
  INITIAL_POLICY_DIRECTORY,
  INITIAL_REMINDER_SCHEDULE,
  CARD_TYPES,
  ISSUING_BANKS,
  E_BILLING_PLAN_CODES,
  formatCurrency,
  formatDatePH,
  type CardType,
  type IssuingBank,
  type BillingRecord,
  type PolicyDirectoryEntry,
} from './billing_types';

// Billing, unified. All three collection channels (Regular mail, E-Billing,
// Credit Card auto-charge) are really iPeak's due-billing data sliced by
// channel - see billing_types.ts for the LEAP-shaped mock this is built
// from - and every channel runs off the same question: "what's due on this
// date, and has it gone out?" - so a single Due Date is the one control
// that drives every list tab. Styled as a plain list, not a bordered grid
// or a dashboard card: no cell borders/box outline anywhere, just a header
// underline and a hairline between rows.
//
// Create Billing (below) is the manual counterpart: search the policy
// directory, multi-select, and send them as a new billing batch on a
// chosen due date/channel - for policies iPeak hasn't already scheduled.

type Channel = 'Regular' | 'E-Billing' | 'Credit Card';
type View = 'list' | 'create' | 'reminders';
const CHANNELS: Channel[] = ['Regular', 'E-Billing', 'Credit Card'];
const TODAY = '2026-09-18';

const blankBillingRecord = (
  entry: PolicyDirectoryEntry,
  channel: Channel,
  dueDate: string,
  cardType: CardType,
  issuingBank: IssuingBank
): BillingRecord => ({
  policyNumber: entry.policyNumber,
  payorName: entry.payorName,
  planCode: entry.planCode,
  mode: entry.mode,
  premium: entry.premium,
  policyYear: entry.policyYear,
  billingType: entry.billingType,
  dueDate,
  channel,
  premiumDeposit: 0,
  underpayment: 0,
  courier: channel === 'Regular' ? 'Courier' : '',
  burialRider: 0,
  hospitalRider: 0,
  dateBill: channel === 'E-Billing' ? TODAY : null,
  dateSent: null,
  remarks: '',
  ...(channel === 'Credit Card'
    ? {
        cardType,
        issuingBank,
        cardNumber: '**** **** **** 0000',
        cardHolder: entry.payorName.toUpperCase(),
        cardExpiry: '12/30',
        authNo: '',
      }
    : {}),
});

export default function Billing() {
  const [view, setView] = useState<View>('list');
  const [dueDate, setDueDate] = useState(TODAY);
  const [channel, setChannel] = useState<Channel>('Regular');
  const [cardType, setCardType] = useState<CardType>('Visa / MasterCard');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  const [regularRecords, setRegularRecords] = useState(INITIAL_REGULAR_BILLING);
  const [eBillingRecords, setEBillingRecords] = useState(INITIAL_E_BILLING);
  const [creditCardRecords, setCreditCardRecords] = useState(INITIAL_CREDIT_CARD_BILLING);

  // Create Billing form state
  const [createSearch, setCreateSearch] = useState('');
  const [createSelected, setCreateSelected] = useState<Set<string>>(new Set());
  const [createDueDate, setCreateDueDate] = useState(TODAY);
  const [createChannel, setCreateChannel] = useState<Channel>('Regular');
  const [createCardType, setCreateCardType] = useState<CardType>('Visa / MasterCard');
  const [createIssuingBank, setCreateIssuingBank] = useState<IssuingBank>('BDO');

  // Reminder Schedule (FY/RB) state
  const [reminderSchedule, setReminderSchedule] = useState(INITIAL_REMINDER_SCHEDULE);
  const toggleReminderCell = (offsetDays: number, column: 'firstYear' | 'renewal') => {
    setReminderSchedule((prev) =>
      prev.map((row) => (row.offsetDays === offsetDays ? { ...row, [column]: !row[column] } : row))
    );
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const switchChannel = (c: Channel) => {
    setView('list');
    setChannel(c);
    setSelectedIds(new Set());
  };

  const regularRows = useMemo(() => regularRecords.filter((r) => r.dueDate === dueDate), [regularRecords, dueDate]);
  const eBillingRows = useMemo(() => eBillingRecords.filter((r) => r.dueDate === dueDate), [eBillingRecords, dueDate]);
  const creditCardRows = useMemo(
    () => creditCardRecords.filter((r) => r.dueDate === dueDate && r.cardType === cardType),
    [creditCardRecords, dueDate, cardType]
  );

  const toggleSelected = (policyNumber: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(policyNumber)) next.delete(policyNumber);
      else next.add(policyNumber);
      return next;
    });
  };

  const handleSendRegular = () => {
    if (selectedIds.size === 0) return showNotification('Select at least one policy to send.');
    showNotification(`Billing notice sent for ${selectedIds.size} ${selectedIds.size === 1 ? 'policy' : 'policies'}.`);
    setSelectedIds(new Set());
  };

  const handleResendEBilling = () => {
    if (selectedIds.size === 0) return showNotification('Select at least one record to resend.');
    setEBillingRecords((prev) =>
      prev.map((r) => (selectedIds.has(r.policyNumber) ? { ...r, dateSent: TODAY } : r))
    );
    showNotification(`Resent e-billing for ${selectedIds.size} ${selectedIds.size === 1 ? 'record' : 'records'}.`);
    setSelectedIds(new Set());
  };

  const handleUploadConfirm = () => {
    if (!uploadFileName) return showNotification('Choose a file to upload first.');
    showNotification(`"${uploadFileName}" uploaded and queued for e-billing.`);
    setUploadOpen(false);
    setUploadFileName('');
  };

  const handleCreditCardAction = (action: string) => {
    if (selectedIds.size === 0) return showNotification('Select at least one transaction first.');
    showNotification(`${action}: ${selectedIds.size} ${selectedIds.size === 1 ? 'transaction' : 'transactions'}.`);
    setSelectedIds(new Set());
  };

  // --- Create Billing ---
  const createResults = useMemo(() => {
    const term = createSearch.trim().toLowerCase();
    if (!term) return [];
    return INITIAL_POLICY_DIRECTORY.filter(
      (p) => p.policyNumber.toLowerCase().includes(term) || p.payorName.toLowerCase().includes(term)
    );
  }, [createSearch]);

  const toggleCreateSelected = (policyNumber: string) => {
    setCreateSelected((prev) => {
      const next = new Set(prev);
      if (next.has(policyNumber)) next.delete(policyNumber);
      else next.add(policyNumber);
      return next;
    });
  };

  const toggleCreateSelectAll = () => {
    setCreateSelected((prev) => {
      const allSelected = createResults.length > 0 && createResults.every((p) => prev.has(p.policyNumber));
      if (allSelected) return new Set();
      return new Set(createResults.map((p) => p.policyNumber));
    });
  };

  const handleCreateSend = () => {
    if (createSelected.size === 0) return showNotification('Search and select at least one policy first.');
    const entries = INITIAL_POLICY_DIRECTORY.filter((p) => createSelected.has(p.policyNumber));

    // Renewal installments always bill through Regular.
    if (createChannel !== 'Regular') {
      const renewals = entries.filter((e) => e.billingType === 'Renewal');
      if (renewals.length > 0) {
        return showNotification(
          `${renewals.length} selected ${renewals.length === 1 ? 'policy is a Renewal' : 'policies are Renewals'} (${renewals.map((r) => r.policyNumber).join(', ')}) - renewal billing must go through Regular Billing.`
        );
      }
    }
    // E-Billing is only eligible for specific plan codes.
    if (createChannel === 'E-Billing') {
      const ineligible = entries.filter((e) => !E_BILLING_PLAN_CODES.includes(e.planCode));
      if (ineligible.length > 0) {
        return showNotification(
          `${ineligible.length} selected ${ineligible.length === 1 ? 'policy isn’t' : 'policies aren’t'} eligible for E-Billing (only ${E_BILLING_PLAN_CODES.join('/')} plans): ${ineligible.map((r) => r.policyNumber).join(', ')}.`
        );
      }
    }

    const newRecords = entries.map((e) => blankBillingRecord(e, createChannel, createDueDate, createCardType, createIssuingBank));

    if (createChannel === 'Regular') setRegularRecords((prev) => [...newRecords, ...prev]);
    else if (createChannel === 'E-Billing') setEBillingRecords((prev) => [...newRecords, ...prev]);
    else setCreditCardRecords((prev) => [...newRecords, ...prev]);

    showNotification(
      `Created ${createChannel} billing for ${entries.length} ${entries.length === 1 ? 'policy' : 'policies'}, due ${formatDatePH(createDueDate)}.`
    );

    // Jump to the list view for what was just created, so the send is visible.
    setDueDate(createDueDate);
    if (createChannel === 'Credit Card') setCardType(createCardType);
    setChannel(createChannel);
    setView('list');
    setCreateSearch('');
    setCreateSelected(new Set());
  };

  const currentRows = channel === 'Regular' ? regularRows : channel === 'E-Billing' ? eBillingRows : creditCardRows;
  const totalPremium = currentRows.reduce((sum, r) => sum + r.premium, 0);

  const thClass = 'py-2.5 pr-6 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400';
  const tdClass = 'py-3 pr-6 text-slate-800 dark:text-slate-200';
  const rowClass = 'group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors';

  return (
    <div className="p-4 md:p-8 max-w-[1500px] mx-auto font-sans text-slate-900 dark:text-slate-100 relative">

      {notification && (
        <div className="fixed top-6 right-6 z-[100] max-w-md px-4 py-3 bg-slate-900 text-white text-xs font-semibold shadow-lg flex items-center justify-between gap-3 border-l-4 border-emerald-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="cursor-pointer text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Title */}
      <div className="mb-5">
        <h1 className="text-lg font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-100">Billing</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Policies due for premium collection, from iPeak</p>
      </div>

      {/* Tabs + Create Billing entry point */}
      <div className="flex flex-wrap items-center gap-6 mb-6 border-b border-slate-200 dark:border-slate-800">
        {CHANNELS.map((c) => (
          <button
            key={c}
            onClick={() => switchChannel(c)}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wide cursor-pointer border-b-2 -mb-px transition-colors ${
              view === 'list' && channel === c
                ? 'border-[#d0112b] text-[#d0112b]'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200'
            }`}
          >
            {c === 'Regular' ? 'Regular Billing' : c === 'E-Billing' ? 'E-Billing' : 'Credit Card Billing'}
          </button>
        ))}
        <button
          onClick={() => setView('create')}
          className={`pb-2.5 ml-auto text-xs font-bold uppercase tracking-wide cursor-pointer border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            view === 'create'
              ? 'border-[#d0112b] text-[#d0112b]'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Create Billing
        </button>
        <button
          onClick={() => setView('reminders')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wide cursor-pointer border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            view === 'reminders'
              ? 'border-[#d0112b] text-[#d0112b]'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          Reminder Schedule
        </button>
      </div>

      {view === 'list' && (
        <>
          {/* Due Date - the one control every channel runs off of */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <CalendarClock className="w-4 h-4 text-slate-400" />
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => { setDueDate(e.target.value); setSelectedIds(new Set()); }}
              className="px-2 py-1 text-xs font-bold bg-transparent text-slate-900 border-b border-slate-300 focus:outline-none focus:border-slate-800 dark:text-white dark:border-slate-600 dark:focus:border-slate-300"
            />
            <button
              onClick={() => { setDueDate(TODAY); setSelectedIds(new Set()); }}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer dark:text-slate-400 dark:hover:text-white"
            >
              Today
            </button>
            <span className="ml-auto text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {currentRows.length} {currentRows.length === 1 ? 'item' : 'items'} due &middot; {formatCurrency(totalPremium)} total
            </span>
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {channel === 'Regular' && (
              <button
                onClick={handleSendRegular}
                className="px-3.5 py-1.5 text-xs font-bold bg-[#d0112b] text-white hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5 rounded"
              >
                <Send className="w-3.5 h-3.5" />
                Send{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </button>
            )}
            {channel === 'E-Billing' && (
              <>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 rounded dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
                <button
                  onClick={handleResendEBilling}
                  className="px-3.5 py-1.5 text-xs font-bold bg-[#d0112b] text-white hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5 rounded"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                </button>
              </>
            )}
            {channel === 'Credit Card' && (
              <>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Card Type</label>
                  <select
                    value={cardType}
                    onChange={(e) => { setCardType(e.target.value as CardType); setSelectedIds(new Set()); }}
                    className="px-2 py-1 text-xs font-semibold bg-transparent text-slate-900 border-b border-slate-300 focus:outline-none focus:border-slate-800 dark:text-white dark:border-slate-600 cursor-pointer"
                  >
                    {CARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => handleCreditCardAction('Exported to CSV')}
                  className="px-3.5 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 rounded dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
                <button
                  onClick={() => handleCreditCardAction('Marked as processed')}
                  className="px-3.5 py-1.5 text-xs font-bold bg-[#d0112b] text-white hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5 rounded"
                >
                  <CircleCheck className="w-3.5 h-3.5" />
                  Mark Processed{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                </button>
              </>
            )}
          </div>

          {/* List - no cell borders/box, just a header underline + row hairlines */}
          <div className="overflow-x-auto">
            {channel === 'Regular' && (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-800 dark:border-slate-200">
                    <th className={`${thClass} w-8`}></th>
                    <th className={thClass}>Policy Number</th>
                    <th className={thClass}>Mode</th>
                    <th className={thClass}>Premium</th>
                    <th className={thClass}>Policy Year</th>
                    <th className={thClass}>Payor</th>
                    <th className={thClass}>Courier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {regularRows.length === 0 ? (
                    <tr><td colSpan={7} className="py-6 text-slate-400 font-semibold dark:text-slate-500">No policies due for Regular Billing on {formatDatePH(dueDate)}.</td></tr>
                  ) : regularRows.map((r) => (
                    <tr key={r.policyNumber} className={rowClass}>
                      <td className={tdClass}>
                        <input type="checkbox" checked={selectedIds.has(r.policyNumber)} onChange={() => toggleSelected(r.policyNumber)} className="cursor-pointer" />
                      </td>
                      <td className={`${tdClass} font-bold`}>{r.policyNumber}</td>
                      <td className={tdClass}>{r.mode}</td>
                      <td className={`${tdClass} font-bold text-[#d0112b]`}>{formatCurrency(r.premium)}</td>
                      <td className={tdClass}>{r.policyYear}</td>
                      <td className={`${tdClass} font-semibold`}>{r.payorName}</td>
                      <td className={tdClass}>{r.courier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {channel === 'E-Billing' && (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-800 dark:border-slate-200">
                    <th className={`${thClass} w-8`}></th>
                    <th className={thClass}>Policy Number</th>
                    <th className={thClass}>Payor</th>
                    <th className={thClass}>Mode</th>
                    <th className={thClass}>Premium</th>
                    <th className={thClass}>Burial Rider</th>
                    <th className={thClass}>Hospital Rider</th>
                    <th className={thClass}>Deposit</th>
                    <th className={thClass}>Underpay</th>
                    <th className={thClass}>Total</th>
                    <th className={thClass}>Remarks</th>
                    <th className={thClass}>Date Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {eBillingRows.length === 0 ? (
                    <tr><td colSpan={12} className="py-6 text-slate-400 font-semibold dark:text-slate-500">No e-billing records due on {formatDatePH(dueDate)}.</td></tr>
                  ) : eBillingRows.map((r) => (
                    <tr key={r.policyNumber} className={rowClass}>
                      <td className={tdClass}>
                        <input type="checkbox" checked={selectedIds.has(r.policyNumber)} onChange={() => toggleSelected(r.policyNumber)} className="cursor-pointer" />
                      </td>
                      <td className={`${tdClass} font-bold`}>{r.policyNumber}</td>
                      <td className={`${tdClass} font-semibold`}>{r.payorName}</td>
                      <td className={tdClass}>{r.mode}</td>
                      <td className={tdClass}>{formatCurrency(r.premium)}</td>
                      <td className={tdClass}>{formatCurrency(r.burialRider)}</td>
                      <td className={tdClass}>{formatCurrency(r.hospitalRider)}</td>
                      <td className={tdClass}>{formatCurrency(r.premiumDeposit)}</td>
                      <td className={tdClass}>{formatCurrency(r.underpayment)}</td>
                      <td className={`${tdClass} font-bold text-[#d0112b]`}>
                        {formatCurrency(r.premium + r.burialRider + r.hospitalRider + r.underpayment - r.premiumDeposit)}
                      </td>
                      <td className={`${tdClass} text-amber-600 font-semibold dark:text-amber-400`}>{r.remarks}</td>
                      <td className={tdClass}>{r.dateSent ? formatDatePH(r.dateSent) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {channel === 'Credit Card' && (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-800 dark:border-slate-200">
                    <th className={`${thClass} w-8`}></th>
                    <th className={thClass}>Policy Number</th>
                    <th className={thClass}>Premium</th>
                    <th className={thClass}>Mode</th>
                    <th className={thClass}>Card Number</th>
                    <th className={thClass}>Card Holder</th>
                    <th className={thClass}>Issuing Bank</th>
                    <th className={thClass}>Expiry Date</th>
                    <th className={thClass}>Auth. No.</th>
                    <th className={thClass}>Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {creditCardRows.length === 0 ? (
                    <tr><td colSpan={10} className="py-6 text-slate-400 font-semibold dark:text-slate-500">No {cardType} transactions due on {formatDatePH(dueDate)}.</td></tr>
                  ) : creditCardRows.map((r) => (
                    <tr key={r.policyNumber} className={rowClass}>
                      <td className={tdClass}>
                        <input type="checkbox" checked={selectedIds.has(r.policyNumber)} onChange={() => toggleSelected(r.policyNumber)} className="cursor-pointer" />
                      </td>
                      <td className={`${tdClass} font-bold`}>{r.policyNumber}</td>
                      <td className={`${tdClass} font-bold text-[#d0112b]`}>{formatCurrency(r.premium)}</td>
                      <td className={tdClass}>{r.mode}</td>
                      <td className={`${tdClass} font-mono`}>{r.cardNumber}</td>
                      <td className={`${tdClass} font-semibold`}>{r.cardHolder}</td>
                      <td className={tdClass}>{r.issuingBank}</td>
                      <td className={tdClass}>{r.cardExpiry}</td>
                      <td className={tdClass}>{r.authNo || '—'}</td>
                      <td className={`${tdClass} text-amber-600 font-semibold dark:text-amber-400`}>{r.authNo ? '' : 'Pending Charge'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {view === 'create' && (
        <div>
          <button
            onClick={() => setView('list')}
            className="mb-4 text-[11px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer flex items-center gap-1 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to due list
          </button>

          {/* Search */}
          <div className="flex items-center gap-2 mb-5 max-w-md border-b border-slate-300 pb-2 dark:border-slate-600">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={createSearch}
              onChange={(e) => { setCreateSearch(e.target.value); setCreateSelected(new Set()); }}
              placeholder="Search by Policy Number or Payor Name..."
              className="w-full bg-transparent text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
            />
          </div>

          {/* Results */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-800 dark:border-slate-200">
                  <th className={`${thClass} w-8`}>
                    {createResults.length > 0 && (
                      <input
                        type="checkbox"
                        checked={createResults.every((p) => createSelected.has(p.policyNumber))}
                        onChange={toggleCreateSelectAll}
                        className="cursor-pointer"
                      />
                    )}
                  </th>
                  <th className={thClass}>Policy Number</th>
                  <th className={thClass}>Payor</th>
                  <th className={thClass}>Plan</th>
                  <th className={thClass}>Billing Type</th>
                  <th className={thClass}>Mode</th>
                  <th className={thClass}>Premium</th>
                  <th className={thClass}>Policy Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {!createSearch.trim() ? (
                  <tr><td colSpan={8} className="py-6 text-slate-400 font-semibold dark:text-slate-500">Search for a policy by number or payor name to add it to a billing run.</td></tr>
                ) : createResults.length === 0 ? (
                  <tr><td colSpan={8} className="py-6 text-slate-400 font-semibold dark:text-slate-500">No policies match "{createSearch}".</td></tr>
                ) : createResults.map((p) => (
                  <tr key={p.policyNumber} className={rowClass}>
                    <td className={tdClass}>
                      <input type="checkbox" checked={createSelected.has(p.policyNumber)} onChange={() => toggleCreateSelected(p.policyNumber)} className="cursor-pointer" />
                    </td>
                    <td className={`${tdClass} font-bold`}>{p.policyNumber}</td>
                    <td className={`${tdClass} font-semibold`}>{p.payorName}</td>
                    <td className={tdClass}>{p.planCode}</td>
                    <td className={`${tdClass} ${p.billingType === 'Renewal' ? 'text-amber-600 dark:text-amber-400' : ''} font-semibold`}>{p.billingType}</td>
                    <td className={tdClass}>{p.mode}</td>
                    <td className={tdClass}>{formatCurrency(p.premium)}</td>
                    <td className={tdClass}>{p.policyYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Multiple sending form */}
          <div className="max-w-2xl border-t border-slate-200 pt-5 dark:border-slate-800">
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-700 mb-1 dark:text-slate-200">
              Send Billing{createSelected.size > 0 ? ` — ${createSelected.size} ${createSelected.size === 1 ? 'policy' : 'policies'} selected` : ''}
            </h2>
            <p className="text-[11px] text-slate-400 mb-3 dark:text-slate-500">
              Renewal policies can only be sent via Regular Billing. E-Billing only accepts {E_BILLING_PLAN_CODES.join('/')} plans.
            </p>
            <div className="flex flex-wrap items-end gap-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1 dark:text-slate-400">Due Date</label>
                <input
                  type="date"
                  value={createDueDate}
                  onChange={(e) => setCreateDueDate(e.target.value)}
                  className="px-2 py-1 text-xs font-bold bg-transparent text-slate-900 border-b border-slate-300 focus:outline-none focus:border-slate-800 dark:text-white dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1 dark:text-slate-400">Channel</label>
                <select
                  value={createChannel}
                  onChange={(e) => setCreateChannel(e.target.value as Channel)}
                  className="px-2 py-1 text-xs font-semibold bg-transparent text-slate-900 border-b border-slate-300 focus:outline-none focus:border-slate-800 dark:text-white dark:border-slate-600 cursor-pointer"
                >
                  {CHANNELS.map((c) => (
                    <option key={c} value={c}>{c === 'Regular' ? 'Regular Billing' : c === 'E-Billing' ? 'E-Billing' : 'Credit Card Billing'}</option>
                  ))}
                </select>
              </div>
              {createChannel === 'Credit Card' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1 dark:text-slate-400">Card Type</label>
                    <select
                      value={createCardType}
                      onChange={(e) => setCreateCardType(e.target.value as CardType)}
                      className="px-2 py-1 text-xs font-semibold bg-transparent text-slate-900 border-b border-slate-300 focus:outline-none focus:border-slate-800 dark:text-white dark:border-slate-600 cursor-pointer"
                    >
                      {CARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1 dark:text-slate-400">Issuing Bank</label>
                    <select
                      value={createIssuingBank}
                      onChange={(e) => setCreateIssuingBank(e.target.value as IssuingBank)}
                      className="px-2 py-1 text-xs font-semibold bg-transparent text-slate-900 border-b border-slate-300 focus:outline-none focus:border-slate-800 dark:text-white dark:border-slate-600 cursor-pointer"
                    >
                      {ISSUING_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </>
              )}
              <button
                onClick={handleCreateSend}
                className="px-4 py-2 text-xs font-bold bg-[#d0112b] text-white hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5 rounded"
              >
                <Send className="w-3.5 h-3.5" />
                Send Billing
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'reminders' && (
        <div>
          <p className="text-xs text-slate-500 mb-5 max-w-2xl dark:text-slate-400">
            Which due-date offsets fire a billing reminder notice, First Year vs Renewal. Click a mark to toggle it. Mock/local only - not wired to an actual notification job.
          </p>
          <div className="overflow-x-auto max-w-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-800 dark:border-slate-200">
                  <th className={thClass}>FY/RB</th>
                  <th className={`${thClass} text-center`}>First Year</th>
                  <th className={`${thClass} text-center`}>Renewal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reminderSchedule.map((row) => (
                  <tr key={row.offsetDays} className={rowClass}>
                    <td className={`${tdClass} font-semibold`}>{row.label}</td>
                    <td className="py-3 pr-6 text-center">
                      <button
                        onClick={() => toggleReminderCell(row.offsetDays, 'firstYear')}
                        className={`inline-flex items-center justify-center w-6 h-6 rounded cursor-pointer ${
                          row.firstYear ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {row.firstYear ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="py-3 pr-6 text-center">
                      <button
                        onClick={() => toggleReminderCell(row.offsetDays, 'renewal')}
                        className={`inline-flex items-center justify-center w-6 h-6 rounded cursor-pointer ${
                          row.renewal ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {row.renewal ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal (E-Billing only) */}
      {uploadOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md bg-white p-5 shadow-xl rounded dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-100">Upload Billing File</h2>
              <button onClick={() => setUploadOpen(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block border border-dashed border-slate-300 rounded p-6 text-center cursor-pointer hover:border-slate-800 transition-colors dark:border-slate-700">
              <Upload className="w-5 h-5 mx-auto text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {uploadFileName || 'Click to choose a .csv or .xlsx billing extract'}
              </span>
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => setUploadFileName(e.target.files?.[0]?.name ?? '')} />
            </label>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setUploadOpen(false)} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleUploadConfirm} className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 rounded cursor-pointer dark:bg-slate-700">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
