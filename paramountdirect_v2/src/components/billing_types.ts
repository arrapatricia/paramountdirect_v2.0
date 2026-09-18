// Shared mock data + types for the Billing page (Regular / E-Billing /
// Credit Card, one due-date-driven view - see billing.tsx).
//
// Billing is fundamentally an iPeak (LEAP Services) concept: what's due for
// collection on a given date. iPeak has no due-billing retrieval method
// implemented yet (server/src/services/ipeak/ only does outbound Insert New
// Business / Update Status - see LifeNBPolicy/LifeLeap in that service's
// types.ts), so there's nothing real to fetch from here. Instead this models
// the mock pool as what a `GetDueBilling`-style LEAP response would look
// like - same PascalCase, prefixed, coded-enum style as the real LEAP
// payloads (LeapDueBilling below) - and maps it into the plain camelCase
// `BillingRecord` the page actually renders, the same way the backend keeps
// LEAP's wire format out of the rest of the app and only speaks it at the
// integration boundary.

export type BillingMode = 'Monthly' | 'Quarterly' | 'Semi Annual' | 'Annual';
export type CardType = 'Visa / MasterCard' | 'Bankard' | 'Diners' | 'Amex';
export type IssuingBank = 'BDO' | 'BPI' | 'Metrobank' | 'RCBC' | 'Security Bank' | 'UnionBank';
export type BillingChannel = 'Regular' | 'E-Billing' | 'Credit Card';
// First Year = the policy's first-year premium; Renewal = year 2 onward.
// Business rule: renewal installments always bill through Regular, never
// E-Billing/Credit Card - see BILLING_TYPE_BY_YEAR below and the channel
// validation in billing.tsx's Create Billing.
export type BillingType = 'First Year' | 'Renewal';

export const CARD_TYPES: CardType[] = ['Visa / MasterCard', 'Bankard', 'Diners', 'Amex'];
export const ISSUING_BANKS: IssuingBank[] = ['BDO', 'BPI', 'Metrobank', 'RCBC', 'Security Bank', 'UnionBank'];

export const PD_LIFE_PLAN_LABELS: Record<string, string> = {
  HCP: 'HealthCARE Cash Plan',
  HIP: 'Hospital Income Benefit Plan',
  PCP: 'PrimeCARE Cash Plan',
  PHC: 'Premium HealthCare Plus Plan',
  GLP: 'Guaranteed Life Plan',
  GLA: 'Golden Life Advantage',
  GPR: 'Go Protect Plan',
  MPR: 'MoneyPlus Protection Plan',
  SSP: 'Sure Savings Plan',
  PHP: 'PrimeHealth Cash Plan',
  DRE: 'Dream College Plan',
};

// Plan codes eligible for E-Billing specifically (business rule) - other
// plans can only be billed via Regular or Credit Card. DRE overlaps with
// PD_LIFE_PLAN_LABELS above; GSP/GPP/FIP are older/traditional plan codes
// not otherwise modeled in this app yet, so they have no full label here.
export const E_BILLING_PLAN_CODES = ['GSP', 'GPP', 'DRE', 'FIP', 'MSP'];

// --- LEAP (iPeak) wire shape --------------------------------------------
// Coded fields, matching how LifeNBPolicy.PolicyModeOfPayment/
// PolicyPaymentMethod are plain numeric codes rather than strings.

export const LEAP_MODE_CODE = { Monthly: 1, Quarterly: 2, SemiAnnual: 3, Annual: 4 } as const;
export const LEAP_BILLING_CHANNEL_CODE = { Regular: 1, EBilling: 2, CreditCard: 3 } as const;
export const LEAP_COURIER_CODE = { Courier: 1, RegisteredMail: 2, WalkIn: 3 } as const;
export const LEAP_CARD_TYPE_CODE = { VisaMasterCard: 1, Bankard: 2, Diners: 3, Amex: 4 } as const;
export const LEAP_ISSUING_BANK_CODE = { BDO: 1, BPI: 2, Metrobank: 3, RCBC: 4, SecurityBank: 5, UnionBank: 6 } as const;

type LeapModeCode = typeof LEAP_MODE_CODE[keyof typeof LEAP_MODE_CODE];
type LeapBillingChannelCode = typeof LEAP_BILLING_CHANNEL_CODE[keyof typeof LEAP_BILLING_CHANNEL_CODE];
type LeapCourierCode = typeof LEAP_COURIER_CODE[keyof typeof LEAP_COURIER_CODE];
type LeapCardTypeCode = typeof LEAP_CARD_TYPE_CODE[keyof typeof LEAP_CARD_TYPE_CODE];
type LeapIssuingBankCode = typeof LEAP_ISSUING_BANK_CODE[keyof typeof LEAP_ISSUING_BANK_CODE];

export interface LeapDueBilling {
  PolicyNo: string;
  PolicyPlanCode: string;
  PolicyDueDate: string; // yyyy-MM-dd
  PolicyYear: number;
  PolicyInstallmentNo: number;
  PolicyModeOfPayment: LeapModeCode;
  PolicyModalPremium: number;
  PolicyDeposit: number;
  PolicyUnderpay: number;
  PolicyBillingChannel: LeapBillingChannelCode;

  IFirstName: string;
  ILastName: string;
  ISuffix: string;

  // Regular Billing (mailed/courier notice)
  PolicyCourierCode: LeapCourierCode | null;

  // E-Billing
  PolicyBurialRider: number;
  PolicyHospitalRider: number;
  PolicyDateBilled: string | null;
  PolicyDateSent: string | null;
  PolicyRemarks: string;

  // Credit Card Billing (auto-charge)
  CCCardTypeCode: LeapCardTypeCode | null;
  CCIssuingBankCode: LeapIssuingBankCode | null;
  CCNumberMasked: string | null;
  CCHolderName: string | null;
  CCExpiry: string | null;
  CCAuthNo: string | null;
}

// --- UI-side shape --------------------------------------------------------
// What billing.tsx actually renders - plain camelCase, decoded, one shape
// shared across all three channel tabs.

export interface BillingRecord {
  policyNumber: string;
  payorName: string;
  planCode: string;
  mode: BillingMode;
  premium: number;
  policyYear: string; // "NN-NN" = policy year - installment number, matches the iPeak policy-year format used elsewhere
  billingType: BillingType;
  dueDate: string; // ISO yyyy-mm-dd
  channel: BillingChannel;

  premiumDeposit: number;
  underpayment: number;
  courier: string;

  burialRider: number;
  hospitalRider: number;
  dateBill: string | null;
  dateSent: string | null;
  remarks: string;

  cardType?: CardType;
  issuingBank?: IssuingBank;
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  authNo?: string;
}

const MODE_BY_CODE: Record<LeapModeCode, BillingMode> = {
  [LEAP_MODE_CODE.Monthly]: 'Monthly',
  [LEAP_MODE_CODE.Quarterly]: 'Quarterly',
  [LEAP_MODE_CODE.SemiAnnual]: 'Semi Annual',
  [LEAP_MODE_CODE.Annual]: 'Annual',
};
const CHANNEL_BY_CODE: Record<LeapBillingChannelCode, BillingChannel> = {
  [LEAP_BILLING_CHANNEL_CODE.Regular]: 'Regular',
  [LEAP_BILLING_CHANNEL_CODE.EBilling]: 'E-Billing',
  [LEAP_BILLING_CHANNEL_CODE.CreditCard]: 'Credit Card',
};
const COURIER_BY_CODE: Record<LeapCourierCode, string> = {
  [LEAP_COURIER_CODE.Courier]: 'Courier',
  [LEAP_COURIER_CODE.RegisteredMail]: 'Registered Mail',
  [LEAP_COURIER_CODE.WalkIn]: 'Walk-in',
};
const CARD_TYPE_BY_CODE: Record<LeapCardTypeCode, CardType> = {
  [LEAP_CARD_TYPE_CODE.VisaMasterCard]: 'Visa / MasterCard',
  [LEAP_CARD_TYPE_CODE.Bankard]: 'Bankard',
  [LEAP_CARD_TYPE_CODE.Diners]: 'Diners',
  [LEAP_CARD_TYPE_CODE.Amex]: 'Amex',
};
const ISSUING_BANK_BY_CODE: Record<LeapIssuingBankCode, IssuingBank> = {
  [LEAP_ISSUING_BANK_CODE.BDO]: 'BDO',
  [LEAP_ISSUING_BANK_CODE.BPI]: 'BPI',
  [LEAP_ISSUING_BANK_CODE.Metrobank]: 'Metrobank',
  [LEAP_ISSUING_BANK_CODE.RCBC]: 'RCBC',
  [LEAP_ISSUING_BANK_CODE.SecurityBank]: 'Security Bank',
  [LEAP_ISSUING_BANK_CODE.UnionBank]: 'UnionBank',
};

const billingTypeFromYear = (policyYear: number): BillingType => (policyYear === 1 ? 'First Year' : 'Renewal');

export const mapLeapDueBillingToRecord = (raw: LeapDueBilling): BillingRecord => ({
  policyNumber: raw.PolicyNo,
  payorName: `${raw.IFirstName} ${raw.ILastName}${raw.ISuffix ? ` ${raw.ISuffix}` : ''}`.trim(),
  planCode: raw.PolicyPlanCode,
  mode: MODE_BY_CODE[raw.PolicyModeOfPayment],
  premium: raw.PolicyModalPremium,
  policyYear: `${String(raw.PolicyYear).padStart(2, '0')}-${String(raw.PolicyInstallmentNo).padStart(2, '0')}`,
  billingType: billingTypeFromYear(raw.PolicyYear),
  dueDate: raw.PolicyDueDate,
  channel: CHANNEL_BY_CODE[raw.PolicyBillingChannel],
  premiumDeposit: raw.PolicyDeposit,
  underpayment: raw.PolicyUnderpay,
  courier: raw.PolicyCourierCode !== null ? COURIER_BY_CODE[raw.PolicyCourierCode] : '',
  burialRider: raw.PolicyBurialRider,
  hospitalRider: raw.PolicyHospitalRider,
  dateBill: raw.PolicyDateBilled,
  dateSent: raw.PolicyDateSent,
  remarks: raw.PolicyRemarks,
  ...(raw.CCCardTypeCode !== null
    ? {
        cardType: CARD_TYPE_BY_CODE[raw.CCCardTypeCode],
        issuingBank: raw.CCIssuingBankCode !== null ? ISSUING_BANK_BY_CODE[raw.CCIssuingBankCode] : undefined,
        cardNumber: raw.CCNumberMasked ?? undefined,
        cardHolder: raw.CCHolderName ?? undefined,
        cardExpiry: raw.CCExpiry ?? undefined,
        authNo: raw.CCAuthNo ?? undefined,
      }
    : {}),
});

// --- Mock LEAP responses ---------------------------------------------------

const PLAN_CODES = Object.keys(PD_LIFE_PLAN_LABELS);
const MODE_CODES = Object.values(LEAP_MODE_CODE);
const COURIER_CODES = Object.values(LEAP_COURIER_CODE);
const CARD_TYPE_CODES = Object.values(LEAP_CARD_TYPE_CODE);
const ISSUING_BANK_CODES = Object.values(LEAP_ISSUING_BANK_CODE);

const FIRST_NAMES = [
  'Ramon', 'Liza', 'Ferdinand', 'Corazon', 'Bienvenido', 'Estrella', 'Rogelio', 'Marilou',
  'Danilo', 'Josefina', 'Reynaldo', 'Perlita', 'Arnel', 'Teresita', 'Wilfredo', 'Gemma',
  'Rodel', 'Analiza', 'Bayani', 'Cristina', 'Eduardo', 'Fe', 'Gil', 'Herminia',
];
const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Mercado', 'Aquino', 'Villanueva',
  'Torres', 'Del Rosario', 'Manalo', 'Pascual', 'Domingo', 'Castro', 'Navarro', 'Lazaro',
  'Ramos', 'Gonzales', 'Fernandez', 'Salvador', 'Rivera', 'Marquez', 'Espino', 'Tolentino',
];

const pad = (n: number, len: number) => n.toString().padStart(len, '0');

// PLANCODE-NNNNNN-D, matching the real iPeak policy-number format noted in
// the PD Life change log (e.g. MPR-000001-1).
const buildPolicyNumber = (planCode: string, seq: number): string =>
  `${planCode}-${pad(seq, 6)}-${(seq % 9) + 1}`;

const addDays = (base: Date, days: number): string => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const TODAY = new Date('2026-09-18');

const generateLeapPool = (
  channel: LeapBillingChannelCode,
  count: number,
  seedOffset: number,
  planCodePool: string[] = PLAN_CODES
): LeapDueBilling[] => {
  const records: LeapDueBilling[] = [];
  for (let i = 0; i < count; i++) {
    const seq = seedOffset + i + 1;
    const planCode = planCodePool[seq % planCodePool.length];
    const premium = Math.round((250 + ((seq * 37) % 1800) + 0.95) * 100) / 100;
    const underpay = seq % 7 === 0 ? Math.round(premium * 0.1 * 100) / 100 : 0;
    const deposit = seq % 5 === 0 ? Math.round(premium * 0.2 * 100) / 100 : 0;

    records.push({
      PolicyNo: buildPolicyNumber(planCode, seq),
      PolicyPlanCode: planCode,
      PolicyDueDate: addDays(TODAY, (seq % 21) - 5),
      // Renewal installments always bill through Regular (business rule) -
      // E-Billing/Credit Card pools are generated as First Year only so the
      // mock data doesn't itself violate that rule.
      PolicyYear: channel === LEAP_BILLING_CHANNEL_CODE.Regular ? (seq % 9) + 1 : 1,
      PolicyInstallmentNo: (seq % 12) + 1,
      PolicyModeOfPayment: MODE_CODES[seq % MODE_CODES.length],
      PolicyModalPremium: premium,
      PolicyDeposit: deposit,
      PolicyUnderpay: underpay,
      PolicyBillingChannel: channel,

      IFirstName: FIRST_NAMES[seq % FIRST_NAMES.length],
      ILastName: LAST_NAMES[(seq * 3) % LAST_NAMES.length],
      ISuffix: seq % 4 === 0 ? 'JR' : '',

      PolicyCourierCode: channel === LEAP_BILLING_CHANNEL_CODE.Regular ? COURIER_CODES[seq % COURIER_CODES.length] : null,

      PolicyBurialRider: seq % 6 === 0 ? 50 : 0,
      PolicyHospitalRider: seq % 8 === 0 ? 100 : 0,
      PolicyDateBilled: channel === LEAP_BILLING_CHANNEL_CODE.EBilling ? addDays(TODAY, -((seq % 10) + 1)) : null,
      PolicyDateSent: channel === LEAP_BILLING_CHANNEL_CODE.EBilling && seq % 3 === 0 ? addDays(TODAY, -((seq % 5) + 1)) : null,
      PolicyRemarks: seq % 9 === 0 ? 'REMINDER' : '',

      CCCardTypeCode: channel === LEAP_BILLING_CHANNEL_CODE.CreditCard ? CARD_TYPE_CODES[seq % CARD_TYPE_CODES.length] : null,
      CCIssuingBankCode: channel === LEAP_BILLING_CHANNEL_CODE.CreditCard ? ISSUING_BANK_CODES[seq % ISSUING_BANK_CODES.length] : null,
      CCNumberMasked: channel === LEAP_BILLING_CHANNEL_CODE.CreditCard ? `**** **** **** ${pad((seq * 7919) % 10000, 4)}` : null,
      CCHolderName: channel === LEAP_BILLING_CHANNEL_CODE.CreditCard
        ? `${FIRST_NAMES[seq % FIRST_NAMES.length]} ${LAST_NAMES[(seq * 3) % LAST_NAMES.length]}`.toUpperCase()
        : null,
      CCExpiry: channel === LEAP_BILLING_CHANNEL_CODE.CreditCard ? `${pad((seq % 12) + 1, 2)}/${28 + (seq % 5)}` : null,
      CCAuthNo: channel === LEAP_BILLING_CHANNEL_CODE.CreditCard && seq % 4 === 0 ? `A${pad((seq * 13) % 100000, 6)}` : null,
    });
  }
  return records;
};

// --- Policy directory (for Create Billing) --------------------------------
// A generic pool of PD Life policies that aren't yet on any billing run -
// what Create Billing searches, so a user can look one up and put it on a
// billing run rather than only ever seeing what iPeak already scheduled.

export interface PolicyDirectoryEntry {
  policyNumber: string;
  payorName: string;
  planCode: string;
  mode: BillingMode;
  premium: number;
  policyYear: string;
  billingType: BillingType;
}

const mapLeapToDirectoryEntry = (raw: LeapDueBilling): PolicyDirectoryEntry => ({
  policyNumber: raw.PolicyNo,
  payorName: `${raw.IFirstName} ${raw.ILastName}${raw.ISuffix ? ` ${raw.ISuffix}` : ''}`.trim(),
  planCode: raw.PolicyPlanCode,
  mode: MODE_BY_CODE[raw.PolicyModeOfPayment],
  premium: raw.PolicyModalPremium,
  policyYear: `${String(raw.PolicyYear).padStart(2, '0')}-${String(raw.PolicyInstallmentNo).padStart(2, '0')}`,
  billingType: billingTypeFromYear(raw.PolicyYear),
});

// The directory keeps its own Regular-shaped generation (all plan codes,
// mixed First Year/Renewal years) since it represents any policy that could
// still be put on any billing run - eligibility gets checked at Create
// Billing send time instead (see billing.tsx).
export const INITIAL_POLICY_DIRECTORY: PolicyDirectoryEntry[] =
  generateLeapPool(LEAP_BILLING_CHANNEL_CODE.Regular, 30, 500).map(mapLeapToDirectoryEntry);

export const INITIAL_REGULAR_BILLING: BillingRecord[] =
  generateLeapPool(LEAP_BILLING_CHANNEL_CODE.Regular, 24, 0).map(mapLeapDueBillingToRecord);
export const INITIAL_E_BILLING: BillingRecord[] =
  generateLeapPool(LEAP_BILLING_CHANNEL_CODE.EBilling, 42, 100, E_BILLING_PLAN_CODES).map(mapLeapDueBillingToRecord);
export const INITIAL_CREDIT_CARD_BILLING: BillingRecord[] =
  generateLeapPool(LEAP_BILLING_CHANNEL_CODE.CreditCard, 20, 300).map(mapLeapDueBillingToRecord);

// --- Reminder schedule ------------------------------------------------
// Which due-date offsets fire a billing reminder notice, split First Year
// vs Renewal (per the FY/RB reference table) - editable in billing.tsx's
// Reminder Schedule tab. Mock/local only, same as everything else here.

export interface ReminderScheduleRow {
  label: string;
  offsetDays: number; // negative = before due date, positive = after, 0 = on due date
  firstYear: boolean;
  renewal: boolean;
}

export const INITIAL_REMINDER_SCHEDULE: ReminderScheduleRow[] = [
  { label: '30-Days before due', offsetDays: -30, firstYear: true, renewal: true },
  { label: '20-Days before due', offsetDays: -20, firstYear: true, renewal: true },
  { label: '10-Days before due', offsetDays: -10, firstYear: false, renewal: true },
  { label: 'On-Due', offsetDays: 0, firstYear: true, renewal: true },
  { label: '10-Days after due', offsetDays: 10, firstYear: false, renewal: true },
  { label: '20-Days after due', offsetDays: 20, firstYear: true, renewal: true },
  { label: '30-Days after due', offsetDays: 30, firstYear: true, renewal: true },
];

export const formatCurrency = (amount: number): string =>
  amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatDatePH = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
};
