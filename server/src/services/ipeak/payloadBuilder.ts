// Builds the LifeNBPolicy payload for iPeak's "Insert New Business
// Application - Life Mobile App" method from a PdLifeApplication.
//
// Only the Insured (I*)/policy/coverage/beneficiary fields this system
// actually collects are populated. Owner (O*), Agent (IA*), Branch Manager
// (BM*), Bank (I/OBank*) and Policy payment/PR fields have no source of
// data anywhere in this app yet (this "Life Mobile App" line never captures
// a separate owner, agent, or bank details - confirmed against the legacy
// PD system's own implementation of this same integration), so they're sent
// as the typed placeholder value iPeak expects until a later task adds real
// collection for them.
import type { PdLifeApplication, PdLifeBeneficiary } from '@prisma/client';
import type { LifeNBPolicy, LifeNBPolicyBeneficiary, LifeNBPolicyCoverage } from './types';

type ApplicationWithBeneficiaries = PdLifeApplication & { beneficiaries: PdLifeBeneficiary[] };

// Loose shape of the frontend's `details` JSON blob (see
// paramountdirect_v2/src/components/pdlife_types.ts) - used as a fallback
// for fields the dedicated scalar columns don't have populated yet.
interface DetailsShape {
  policyOwner?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    gender?: string;
    birthdate?: string;
    placeOfBirth?: string;
    nationality?: string;
  };
  contact?: {
    email?: string;
    mobileNumber?: string;
    telephoneNumber?: string;
    houseNumber?: string;
    street?: string;
    building?: string;
    barangay?: string;
    city?: string;
    region?: string;
    zipcode?: string;
  };
  category?: {
    occupation?: string;
    officeAddress?: string;
    sourceOfFunds?: string;
    tin?: string;
    gsisOrSss?: string;
    weightKg?: number;
    heightCm?: number;
    beneficiaries?: { fullName?: string; relationship?: string; birthdate?: string; revocable?: boolean }[];
  };
}

function asDetails(details: unknown): DetailsShape {
  return details && typeof details === 'object' ? (details as DetailsShape) : {};
}

function fullAddress(contact: DetailsShape['contact']): string {
  if (!contact) return '';
  return [contact.houseNumber, contact.street, contact.building, contact.barangay, contact.city, contact.region, contact.zipcode]
    .filter(Boolean)
    .join(' ');
}

function calcAge(birthdate: Date | string | null | undefined): number {
  if (!birthdate) return 0;
  const bd = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
  if (Number.isNaN(bd.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - bd.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '0001-01-01';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '0001-01-01';
  return date.toISOString().slice(0, 10);
}

function cmToFeetInches(cm: number | null | undefined): { feet: number; inches: number } {
  if (!cm) return { feet: 0, inches: 0 };
  const totalInches = cm / 2.54;
  return { feet: Math.floor(totalInches / 12), inches: Math.round(totalInches % 12) };
}

function kgToPounds(kg: number | null | undefined): number {
  if (!kg) return 0;
  return Math.round(kg * 2.20462);
}

// iPeak enforces per-field max lengths (see the LEAP Services doc's
// validation table, plus ApplicationID's undocumented 15-char cap found by
// testing against the live UAT server) - truncate defensively so a long
// real-world value 403s gracefully truncated rather than rejecting the
// whole submission.
function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

export function buildLifeNbPolicyPayload(application: ApplicationWithBeneficiaries, createdByEmail: string): LifeNBPolicy {
  const details = asDetails(application.details);
  const applicationId = truncate(application.policyNumber ?? application.id, 15);
  const applicationDate = formatDate(application.dateReceived ?? application.createdAt);

  const firstName = application.firstName ?? details.policyOwner?.firstName ?? '';
  const middleName = application.middleName ?? details.policyOwner?.middleName ?? '';
  const lastName = application.lastName ?? details.policyOwner?.lastName ?? '';
  const birthdate = application.birthdate ?? details.policyOwner?.birthdate ?? null;
  const placeOfBirth = application.placeOfBirth ?? details.policyOwner?.placeOfBirth ?? '';
  const gender = (application.gender ?? details.policyOwner?.gender ?? '').toString().toUpperCase();
  const nationality = application.nationality ?? details.policyOwner?.nationality ?? '';
  const civilStatus = (application.civilStatus ?? '').toString().toUpperCase();

  const billingAddress = application.billingAddress ?? fullAddress(details.contact);
  const residingAddress = application.residingAddress ?? billingAddress;
  const email = application.email ?? details.contact?.email ?? '';
  const mobileNumber = application.mobileNumber ?? details.contact?.mobileNumber ?? '';
  const telephoneNumber = application.telephoneNumber ?? details.contact?.telephoneNumber ?? '';

  const occupation = application.occupation ?? details.category?.occupation ?? '';
  const companyAddress = application.companyAddress ?? details.category?.officeAddress ?? '';
  const sourceOfFunds = application.sourceOfFunds ?? details.category?.sourceOfFunds ?? '';
  const tin = application.tin ?? details.category?.tin ?? '';
  const sssNo = application.sssNo ?? details.category?.gsisOrSss ?? '';

  const heightCm = application.heightCm ?? details.category?.heightCm ?? null;
  const weightKg = application.weightKg ?? details.category?.weightKg ?? null;
  const { feet: heightFoot, inches: heightInch } = cmToFeetInches(heightCm);

  const coverage: LifeNBPolicyCoverage = {
    ApplicationID: applicationId,
    ApplicationDate: applicationDate,
    // CoverageType is limited to 10 characters server-side (confirmed
    // against the live UAT endpoint) - the plan code (e.g. "MPR") fits;
    // the category name ("Comprehensive") does not.
    CoverageType: truncate(application.planCode, 10),
    CoveragePlan: truncate(application.planDesc, 50),
    CoverageAmount: Number(String(application.premium).replace(/[^0-9.]/g, '')) || 0,
    CoveragePeriod: 0,
    CoverageDuration: 0,
    CoverageModal: 0,
  };

  const beneficiaries: LifeNBPolicyBeneficiary[] =
    application.beneficiaries.length > 0
      ? application.beneficiaries.map((b) => ({
          ApplicationID: applicationId,
          ApplicationDate: applicationDate,
          BName: b.fullName,
          BAge: calcAge(b.birthdate),
          BRelation: b.relationship,
          BPShare: b.sharePercent ?? 0,
          BDesignation: b.designation ?? '',
          BTrustee: b.trusteeName ?? '',
        }))
      : (details.category?.beneficiaries ?? []).map((b) => ({
          ApplicationID: applicationId,
          ApplicationDate: applicationDate,
          BName: b.fullName ?? '',
          BAge: calcAge(b.birthdate),
          BRelation: b.relationship ?? '',
          BPShare: 0,
          BDesignation: b.revocable ? 'REVOCABLE' : 'IRREVOCABLE',
          BTrustee: '',
        }));

  return {
    ApplicationID: applicationId,
    ApplicationDate: applicationDate,

    IFirstName: truncate(firstName, 35),
    IMiddleName: truncate(middleName, 35),
    ILastName: truncate(lastName, 35),
    IOtherName: '',
    IBirthDate: formatDate(birthdate),
    IAge: calcAge(birthdate),
    IBirthPlace: truncate(placeOfBirth, 30),
    IGender: truncate(gender, 15),
    ICivilStatus: truncate(civilStatus, 15),
    INationality: truncate(nationality, 20),
    IBillingAddress: truncate(billingAddress, 100),
    IResidingAddress: truncate(residingAddress, 100),
    ICompany: '',
    ICompanyType: '',
    ICompanyAddress: truncate(companyAddress, 50),
    IOccupaction: truncate(occupation, 50),
    INatureOfWork: '',
    ISourceOfFunds: truncate(sourceOfFunds, 50),
    ITelephone: truncate(telephoneNumber, 30),
    ICompanyTelephone: '',
    IMobileNo: truncate(mobileNumber, 30),
    IEmail: truncate(email, 50),
    IFaxNo: '',
    ITIN: truncate(tin, 20),
    ISSS: truncate(sssNo, 20),
    IRelationToInsured: 'INSURED',
    ISubOwner: 'N/A',
    IBankName: 'N/A',
    IBankBranch: 'N/A',
    IBankAccountName: 'N/A',
    IBankAccountNo: 'N/A',
    IBankAccountType: 'N/A',

    // Owner is always the insured in this product line - no separate owner
    // is ever collected, matching the legacy PD system's own integration.
    OFirstName: 'N/A',
    OMiddleName: 'N/A',
    OLastName: 'N/A',
    OOtherName: 'N/A',
    OBirthDate: '0001-01-01',
    OAge: 0,
    OBirthPlace: 'N/A',
    OGender: 'N/A',
    OCivilStatus: 'N/A',
    ONationality: 'N/A',
    OBillingAddress: 'N/A',
    OResidingAddress: 'N/A',
    OCompany: 'N/A',
    OCompanyType: 'N/A',
    OCompanyAddress: 'N/A',
    OOccupaction: 'N/A',
    ONatureOfWork: 'N/A',
    OSourceOfFunds: 'N/A',
    OTelephone: 'N/A',
    OCompanyTelephone: 'N/A',
    OMobileNo: 'N/A',
    OEmail: 'N/A',
    OFaxNo: 'N/A',
    OTIN: 'N/A',
    OSSS: 'N/A',
    ORelationToInsured: 'N/A',
    OSubOwner: 'N/A',
    OBankName: 'N/A',
    OBankBranch: 'N/A',
    OBankAccountName: 'N/A',
    OBankAccountNo: 'N/A',
    OBankAccountType: 'N/A',

    // Payment/PR data lives entirely on iPeak's side going forward - not
    // collected here.
    PolicyTotalPremium: 0,
    PolicyDepositTo: '',
    PolicyPRNo: 0,
    PolicyPRDate: '0001-01-01',
    PolicyAmountPaid: 0,
    PolicyModeOfPayment: 0,
    PolicyPaymentMethod: 0,

    // Agent / Branch Manager assignment isn't modeled in this app yet, and
    // a blank/zero agent is NOT accepted by the live server ("Agent details
    // are not valid or do not match our records", confirmed against UAT) -
    // iPeak requires a real, registered agent for every submission. This is
    // the same fixed "house"/direct-channel agent + branch manager the
    // legacy PD system always sent for its own online applications, and it
    // was verified live against UAT (200 OK) while wiring this integration.
    // Replace with PD Direct's actual assigned agent code once known.
    IAFirstName: 'GRACE',
    IAMiddleName: 'R',
    IALastName: 'ARTIZA',
    IAgentCode: 30831,
    IASignDate: '2025-11-01',
    BMFirstName: 'LOLITA',
    BMMiddleName: 'V',
    BMLastName: 'RUFO',
    BManagerCode: 23135,
    BMSignDate: '2025-11-01',

    IHeightFoot: heightFoot,
    IHeightInch: heightInch,
    IWeightPound: kgToPounds(weightKg),
    OHeightFoot: 0,
    OHeightInch: 0,
    OWeightPound: 0,

    CreatedBy: createdByEmail,
    SignDate: applicationDate,
    NFOOption: '',
    DivOption: '',
    ULDOption: '',

    PCoverages: [coverage],
    PBeneficiaries: beneficiaries,

    IsSmoker: 'N',
    PAddressTag: 'R',
    OAddressTag: 'R',
  };
}
