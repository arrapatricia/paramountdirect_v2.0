// Gate for the New Business transmission: an application with no data, or
// missing the fields iPeak needs to register a policy, must not be sent.
// Checks the built payload (not the raw columns) so it sees exactly what
// would go out, including values resolved from the `details` JSON fallback.
import type { PdLifeApplication, PdLifeBeneficiary } from '@prisma/client';
import { buildLifeNbPolicyPayload, isCoverageResolvable } from './payloadBuilder';

type ApplicationWithBeneficiaries = PdLifeApplication & { beneficiaries: PdLifeBeneficiary[] };

const blank = (v: string | undefined) => !v || !v.trim();

export function getMissingNewBusinessFields(application: ApplicationWithBeneficiaries): string[] {
  const p = buildLifeNbPolicyPayload(application, '');
  const coverage = p.PCoverages[0];
  const missing: string[] = [];

  if (blank(p.IFirstName)) missing.push('First name');
  if (blank(p.ILastName)) missing.push('Last name');
  if (p.IBirthDate === '0001-01-01') missing.push('Birthdate');
  if (blank(p.IGender)) missing.push('Gender');
  if (blank(p.IBillingAddress)) missing.push('Address');
  if (blank(p.IMobileNo) && blank(p.IEmail)) missing.push('Mobile number or email');
  if (blank(application.planCode)) missing.push('Plan code');
  else if (!isCoverageResolvable(application)) missing.push('Plan selection (plan, years to pay or units, and age)');
  if (!coverage || !(coverage.CoverageModal > 0)) missing.push('Premium');
  if (!(p.PolicyModeOfPayment > 0)) missing.push('Mode of payment');

  return missing;
}
