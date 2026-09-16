// Types for Paramount's "LEAP Services" API (what the business calls iPeak),
// transcribed from the LEAP Services System Documentation (2022-07-06),
// section II.I.A (Insert New Business Application) and II.II.A (Update
// Status of New Business Application).

export interface LifeNBPolicyCoverage {
  ApplicationID: string;
  ApplicationDate: string; // yyyy-MM-dd
  CoverageType: string;
  CoveragePlan: string;
  CoverageAmount: number;
  CoveragePeriod: number;
  CoverageDuration: number;
  CoverageModal: number;
}

export interface LifeNBPolicyBeneficiary {
  ApplicationID: string;
  ApplicationDate: string;
  BName: string;
  BAge: number;
  BRelation: string;
  BPShare: number;
  BDesignation: string;
  BTrustee: string;
}

export interface LifeNBPolicy {
  ApplicationID: string;
  ApplicationDate: string;

  IFirstName: string;
  IMiddleName: string;
  ILastName: string;
  IOtherName: string;
  IBirthDate: string;
  IAge: number;
  IBirthPlace: string;
  IGender: string;
  ICivilStatus: string;
  INationality: string;
  IBillingAddress: string;
  IResidingAddress: string;
  ICompany: string;
  ICompanyType: string;
  ICompanyAddress: string;
  IOccupaction: string;
  INatureOfWork: string;
  ISourceOfFunds: string;
  ITelephone: string;
  ICompanyTelephone: string;
  IMobileNo: string;
  IEmail: string;
  IFaxNo: string;
  ITIN: string;
  ISSS: string;
  IRelationToInsured: string;
  ISubOwner: string;
  IBankName: string;
  IBankBranch: string;
  IBankAccountName: string;
  IBankAccountNo: string;
  IBankAccountType: string;

  OFirstName: string;
  OMiddleName: string;
  OLastName: string;
  OOtherName: string;
  OBirthDate: string;
  OAge: number;
  OBirthPlace: string;
  OGender: string;
  OCivilStatus: string;
  ONationality: string;
  OBillingAddress: string;
  OResidingAddress: string;
  OCompany: string;
  OCompanyType: string;
  OCompanyAddress: string;
  OOccupaction: string;
  ONatureOfWork: string;
  OSourceOfFunds: string;
  OTelephone: string;
  OCompanyTelephone: string;
  OMobileNo: string;
  OEmail: string;
  OFaxNo: string;
  OTIN: string;
  OSSS: string;
  ORelationToInsured: string;
  OSubOwner: string;
  OBankName: string;
  OBankBranch: string;
  OBankAccountName: string;
  OBankAccountNo: string;
  OBankAccountType: string;

  PolicyTotalPremium: number;
  PolicyDepositTo: string;
  PolicyPRNo: number;
  PolicyPRDate: string;
  PolicyAmountPaid: number;
  PolicyModeOfPayment: number;
  PolicyPaymentMethod: number;

  IAFirstName: string;
  IAMiddleName: string;
  IALastName: string;
  IAgentCode: number;
  IASignDate: string;
  BMFirstName: string;
  BMMiddleName: string;
  BMLastName: string;
  BManagerCode: number;
  BMSignDate: string;

  IHeightFoot: number;
  IHeightInch: number;
  IWeightPound: number;
  OHeightFoot: number;
  OHeightInch: number;
  OWeightPound: number;

  CreatedBy: string;
  SignDate: string;
  NFOOption: string;
  DivOption: string;
  ULDOption: string;

  PCoverages: LifeNBPolicyCoverage[];
  PBeneficiaries: LifeNBPolicyBeneficiary[];

  IsSmoker: string;
  PAddressTag: string;
  OAddressTag: string;
}

// StatusCode for the update-status method: APR = Approved, DEC = Declined,
// POS = Postponed.
export type LifeLeapStatusCode = 'APR' | 'DEC' | 'POS';

export interface LifeLeap {
  PolicyNo: string;
  StatusCode: LifeLeapStatusCode;
  ProcessorEmail: string;
}

export interface ServiceException {
  ExceptionType: string;
  Message: string;
  StackTrace: string;
  InnerException: ServiceException | null;
}

export interface ServiceResponse<T> {
  StatusCode: number;
  StatusDescription: string;
  ResponseData: T | null;
  Exception: ServiceException | null;
}
