// Types for iPeak's "Policy Inquiry" API (PD Policy No. -> full policy
// snapshot), transcribed from the "API FOR IPEAK TO PD" spec sheet shared
// by Paramount (tab: API). Field lengths/types are AS400 PF definitions
// (e.g. "15,2" = packed decimal, "L" = date), not directly meaningful here -
// only the field names and grouping matter for this client.
//
// NOTE: this is the data CONTRACT only. The sheet doesn't give the actual
// web method URL or auth scheme for this call (it's under a different
// "GAService" than the WorkflowService/LEAP endpoint used for
// NewBusiness/UpdateStatus) - see policyInquiry.ts.

export interface PDPolicyCoverage {
  APPID: string;
  POLICYNO: string;
  STATUS: string;
  ISSUEAGE: number;
  PLAN: string;
  ISSUEDATE: string;
  EFFDATE: string;
  POLICYDATE: string;
  MATDATE: string;
  FACEAMT: number;
  MODALPREM: number;
  INSURED: string;
}

export interface PDPolicyBeneficiary {
  APPID: string;
  POLICYNO: string;
  BENEFNME: string;
  BENEFSHR: number;
  REVOCTAG: string;
  RELATNSHP: string;
}

// This is the "payment transactions" entity - one row per collection/voucher
// against the policy.
export interface PDPayHistory {
  APPID: string;
  POLICYNO: string;
  OPENITEMNO: number;
  OPENITEMSQ: number;
  VOUCHTP: string;
  VOUCHNO: number;
  PAYDESC: string;
  PAYAMOUNT: number;
  BOOKPD: number;
  YEARINS: number;
}

export interface PDLoan {
  APPID: string;
  POLICYNO: string;
  LOANNO: number;
  LOANDATE: string;
  LOANTYPE: string;
  LOANAMT: number;
  LASTINTDT: string;
  OPENITEMNO: number;
  OPENITEMSQ: number;
}

export interface PDPolicy {
  APPID: string;
  POLICYNO: string;
  STATUS: string;
  ISSUEAGE: number;
  PLAN: string;
  ISSUEDATE: string;
  EFFDATE: string;
  POLICYDATE: string;
  SUMINSRD: number;
  ANNUALPREM: number;
  MODALPREM: number;
  LASTBILLDT: string;
  BILLTYPE: string;
  PREMREMTP: string;
  PREMREMNO: string;
  MATDATE: string;
  BILLMODE: string;
  NEXTBILLDT: string;
  NFOPDO: string;
  NEXTDUEDT: string;

  PICLIENTCD: string;
  PIFIRSTNME: string;
  PIMIDDLENM: string;
  PILASTNME: string;
  PICORPNME: string;
  PIBDATE: string;
  PITITLE: string;
  PIEMAIL: string;
  PITELNO: string;
  PICELNO: string;
  PICIVILST: string;
  PICITIZEN: string;
  PITAXNO: string;
  PIADDRESS1: string;
  PIADDRESS2: string;
  PIADDRESS3: string;
  PICITY: string;
  PIPROVINCE: string;
  PIZIP: string;

  OWCLIENTCD: string;
  OWFIRSTNME: string;
  OWMIDDLENM: string;
  OWLASTNME: string;
  OWCORPNME: string;
  OWBDATE: string;
  OWTITLE: string;
  OWEMAIL: string;
  OWTELNO: string;
  OWCELNO: string;
  OWCIVILST: string;
  OWCITIZEN: string;
  OWTAXNO: string;
  OWADDRESS1: string;
  OWADDRESS2: string;
  OWADDRESS3: string;
  OWCITY: string;
  OWPROVINCE: string;
  OWZIP: string;

  TOTDEPOSIT: number;
  TOTCSV: number;
  TOTCLAIM: number;

  PolCoverages: PDPolicyCoverage[];
  PolBeneficiaries: PDPolicyBeneficiary[];
  PayHistory: PDPayHistory[];
  Loans: PDLoan[];
}
