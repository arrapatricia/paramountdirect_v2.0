import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Bucket, s3Client } from '../lib/s3';
import { prisma } from '../lib/prisma';
import type { DocumentApplicationType } from '@prisma/client';

const PRESIGNED_URL_TTL_SECONDS = 5 * 60;

export async function storeGeneratedDocument(params: {
  applicationType: DocumentApplicationType;
  applicationId: string;
  docKey: string;
  contentType: string;
  body: Buffer;
  generatedBy?: string;
  invoiceNumber?: string;
  endorsementId?: string;
}) {
  const s3Key = `documents/${params.applicationType}/${params.applicationId}/${params.docKey}-${Date.now()}.pdf`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );

  return prisma.generatedDocument.create({
    data: {
      applicationType: params.applicationType,
      applicationId: params.applicationId,
      docKey: params.docKey,
      s3Key,
      contentType: params.contentType,
      generatedBy: params.generatedBy,
      invoiceNumber: params.invoiceNumber,
      endorsementId: params.endorsementId,
    },
  });
}

export async function getDocumentViewUrl(s3Key: string, downloadFilename?: string) {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
      // The S3 key itself is an internal path (documents/OFW/<id>/...-<timestamp>.pdf) -
      // this overrides just the filename the browser shows/saves, without renaming the object.
      ...(downloadFilename ? { ResponseContentDisposition: `inline; filename="${downloadFilename}"` } : {}),
    }),
    { expiresIn: PRESIGNED_URL_TTL_SECONDS }
  );
}
