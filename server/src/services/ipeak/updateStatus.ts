// Pushes a status change for an already-submitted PD Life application to
// iPeak (LEAP Services). Never throws - see submitNewBusiness.ts.
import { prisma } from '../../lib/prisma';
import { callIpeak, ipeakConfigured } from './client';
import { Prisma, type PdLifeApplication } from '@prisma/client';
import type { LifeLeap, LifeLeapStatusCode } from './types';

export async function updateIpeakStatus(
  application: PdLifeApplication,
  statusCode: LifeLeapStatusCode,
  processorEmail: string
) {
  const policyNumber = application.policyNumber ?? application.id;
  const payload: LifeLeap = { PolicyNo: policyNumber, StatusCode: statusCode, ProcessorEmail: processorEmail };

  if (!ipeakConfigured()) {
    return prisma.pdLifeIpeakRequest.create({
      data: {
        applicationId: application.id,
        policyNumber,
        method: 'UpdateStatus',
        requestPayload: payload as unknown as Prisma.InputJsonValue,
        success: false,
        errorMessage: 'iPeak integration is not configured (IPEAK_SERVICE_URL / IPEAK_PRIVATE_KEY missing)',
      },
    });
  }

  const result = await callIpeak<string>('/lifemb/update', payload);

  return prisma.pdLifeIpeakRequest.create({
    data: {
      applicationId: application.id,
      policyNumber,
      method: 'UpdateStatus',
      requestPayload: payload as unknown as Prisma.InputJsonValue,
      responseBody: (result.response ?? (result.rawBody ? { raw: result.rawBody } : undefined)) as Prisma.InputJsonValue | undefined,
      statusCode: result.response?.StatusCode ?? result.httpStatus,
      success: result.ok,
      errorMessage: result.ok ? null : result.error ?? result.response?.StatusDescription ?? 'Unknown iPeak error',
    },
  });
}
