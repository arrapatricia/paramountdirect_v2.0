// Transmits a PD Life application to iPeak (LEAP Services) as a new
// business application, the moment it leaves the "Received" screening
// status. Never throws - a transmission failure is recorded on
// PdLifeIpeakRequest and logged, but must never block the screener's status
// update.
import { prisma } from '../../lib/prisma';
import { callIpeak, ipeakConfigured } from './client';
import { buildLifeNbPolicyPayload } from './payloadBuilder';
import { generatePolicyNumber } from './policyNumber';
import { Prisma, type PdLifeApplication, type PdLifeBeneficiary } from '@prisma/client';

type ApplicationWithBeneficiaries = PdLifeApplication & { beneficiaries: PdLifeBeneficiary[] };

export async function submitNewBusinessToIpeak(application: ApplicationWithBeneficiaries, createdByEmail: string) {
  const policyNumber = application.policyNumber ?? (await generatePolicyNumber(application.planCode));
  if (!application.policyNumber) {
    await prisma.pdLifeApplication.update({ where: { id: application.id }, data: { policyNumber } });
    application = { ...application, policyNumber };
  }

  const alreadySubmitted = await prisma.pdLifeIpeakRequest.findFirst({
    where: { applicationId: application.id, method: 'NewBusiness' },
  });
  if (alreadySubmitted) return alreadySubmitted;

  const payload = buildLifeNbPolicyPayload(application, createdByEmail);

  if (!ipeakConfigured()) {
    return prisma.pdLifeIpeakRequest.create({
      data: {
        applicationId: application.id,
        policyNumber,
        method: 'NewBusiness',
        requestPayload: payload as unknown as Prisma.InputJsonValue,
        success: false,
        errorMessage: 'iPeak integration is not configured (IPEAK_SERVICE_URL / IPEAK_PRIVATE_KEY missing)',
      },
    });
  }

  const result = await callIpeak<number>('/lifemb/newbusiness', payload);

  return prisma.pdLifeIpeakRequest.create({
    data: {
      applicationId: application.id,
      policyNumber,
      method: 'NewBusiness',
      requestPayload: payload as unknown as Prisma.InputJsonValue,
      responseBody: (result.response ?? (result.rawBody ? { raw: result.rawBody } : undefined)) as Prisma.InputJsonValue | undefined,
      statusCode: result.response?.StatusCode ?? result.httpStatus,
      success: result.ok,
      errorMessage: result.ok ? null : result.error ?? result.response?.StatusDescription ?? 'Unknown iPeak error',
    },
  });
}
