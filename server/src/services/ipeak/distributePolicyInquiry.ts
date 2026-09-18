// Turns a successful Policy Inquiry response into the PD Life
// LifePaymentTransaction "current snapshot" row for that policy. Ledger
// detail (PayHistory) is intentionally NOT persisted separately - callers
// needing it should read it back off the PdLifeIpeakRequest row this
// payload came from (see submitPolicyInquiry.ts).
//
// Mapping honesty note: several LifePaymentTransaction columns (gender,
// hcrStatus, hcrUnit, payType, mode, accidentalBenefits, underpay) have no
// corresponding field anywhere in the Policy Inquiry contract (see
// policyInquiryTypes.ts) - they're placeholder-defaulted here, same
// treatment as the outbound payload's unmapped fields. This whole path is
// unverified against a live server (no known endpoint/auth yet - see
// policyInquiry.ts), unlike the outbound NewBusiness/UpdateStatus flow.
import { prisma } from '../../lib/prisma';
import { PolicyStatus, Prisma } from '@prisma/client';
import type { PDPolicy } from './policyInquiryTypes';

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapPolicyStatus(status: string): PolicyStatus {
  const normalized = status.trim().toUpperCase();
  const match = (Object.keys(PolicyStatus) as PolicyStatus[]).find((s) => s.toUpperCase() === normalized);
  return match ?? PolicyStatus.Inforced;
}

function fullAddress(line1: string, line2: string, line3: string, city: string, province: string, zip: string): string {
  return [line1, line2, line3, city, province, zip].filter(Boolean).join(' ');
}

export async function distributePolicyInquiryToLedger(planCode: string, policy: PDPolicy) {
  const issueDate = parseDate(policy.ISSUEDATE) ?? new Date(0);
  const effectivityDate = parseDate(policy.EFFDATE) ?? issueDate;
  const policyDate = parseDate(policy.POLICYDATE) ?? issueDate;
  const expiryDate = parseDate(policy.MATDATE) ?? issueDate;
  const dueDate = parseDate(policy.NEXTDUEDT) ?? issueDate;
  const birthdate = parseDate(policy.PIBDATE) ?? new Date(0);

  const data = {
    title: policy.PITITLE || '',
    firstName: policy.PIFIRSTNME || '',
    middleName: policy.PIMIDDLENM || '',
    lastName: policy.PILASTNME || '',
    birthdate,
    gender: '',
    currentAge: policy.ISSUEAGE,
    issueAge: policy.ISSUEAGE,
    address: fullAddress(policy.PIADDRESS1, policy.PIADDRESS2, policy.PIADDRESS3, policy.PICITY, policy.PIPROVINCE, policy.PIZIP),
    mobileNumber: policy.PICELNO || '',
    telephoneNumber: policy.PITELNO || '',
    emailAddress: policy.PIEMAIL || '',

    policyStatus: mapPolicyStatus(policy.STATUS),
    hcrStatus: '',
    hcrUnit: '',
    premium: policy.ANNUALPREM,
    hcrPremium: 0,
    deposit: policy.TOTDEPOSIT,
    underpay: 0,
    dueDate,
    payType: '',
    cashValue: policy.TOTCSV,
    lifeBenefits: policy.SUMINSRD,
    accidentalBenefits: 0,
    mode: '',
    issueDate,
    effectivityDate,
    policyDate,
    expiryDate,

    planCode,
    planDesc: policy.PLAN || '',
  } satisfies Omit<Prisma.LifePaymentTransactionUncheckedCreateInput, 'id' | 'policyNo'>;

  return prisma.lifePaymentTransaction.upsert({
    where: { policyNo: policy.POLICYNO },
    create: { policyNo: policy.POLICYNO, ...data },
    update: data,
  });
}
