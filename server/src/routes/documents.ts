import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import { getDocumentViewUrl, storeGeneratedDocument } from '../services/documentStorage';
import type { DocumentApplicationType } from '@prisma/client';

const router = Router();
router.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const listQuerySchema = z.object({
  applicationType: z.enum(['PdLife', 'OFW', 'CTPL', 'GTP']),
  applicationId: z.string().min(1),
});

// Lists what's already been generated for an application, e.g. to grey out
// "View" buttons in PolicyDocumentsSection for docKeys not yet generated.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { applicationType, applicationId } = listQuerySchema.parse(req.query);
    const documents = await prisma.generatedDocument.findMany({
      where: { applicationType, applicationId },
      orderBy: { generatedAt: 'desc' },
    });
    res.json(documents);
  })
);

const uploadFieldsSchema = z.object({
  applicationType: z.enum(['PdLife', 'OFW', 'CTPL', 'GTP']),
  applicationId: z.string().min(1),
  docKey: z.string().min(1),
});

// Accepts a pre-rendered PDF (generated client-side or by another service)
// and stores it as an immutable GeneratedDocument - this is the write path
// that should run once, when a transaction's isPaid first flips true.
router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Missing file');
    const { applicationType, applicationId, docKey } = uploadFieldsSchema.parse(req.body);

    const document = await storeGeneratedDocument({
      applicationType: applicationType as DocumentApplicationType,
      applicationId,
      docKey,
      contentType: req.file.mimetype || 'application/pdf',
      body: req.file.buffer,
      generatedBy: req.user?.email,
    });

    await recordAudit(req, { action: 'CREATE', module: 'Generated Documents', details: `Generated ${docKey} for ${applicationType} application ${applicationId}` });
    res.status(201).json(document);
  })
);

// docKey -> the short label the download/print filename uses, e.g.
// "service_invoice-XYZ5678.pdf" - matches the plate-number naming convention
// already agreed for CTPL; docKeys not listed here fall back to the raw key.
const DOC_KEY_FILENAME_LABEL: Record<string, string> = {
  'ctpl-coc': 'coc',
  'ctpl-service-invoice': 'service_invoice',
  'ctpl-policy-jacket': 'policy_jacket',
  'ctpl-policy-schedule': 'policy_schedule',
  'ctpl-endorsement': 'endorsement',
  'ctpl-endorsement-service-invoice': 'service_invoice',
  'ctpl-credit-memo': 'credit_memo',
};

// The plate number (CTPL) or policy number (OFW/GTP, which have no plate
// number) is on the parent application row, not on GeneratedDocument itself -
// looked up per applicationType so the download filename reads as e.g.
// "coc-XYZ5678.pdf" instead of the raw S3 key's docKey-timestamp name.
async function findFilenameSuffix(applicationType: DocumentApplicationType, applicationId: string): Promise<string | null> {
  switch (applicationType) {
    case 'CTPL':
      return (await prisma.ctplApplication.findUnique({ where: { id: applicationId }, select: { plateNumber: true } }))?.plateNumber ?? null;
    case 'OFW':
      return (await prisma.ofwApplication.findUnique({ where: { id: applicationId }, select: { policyNumber: true } }))?.policyNumber ?? null;
    default:
      return null;
  }
}

// Short-lived presigned URL to view/print/download the stored PDF - the
// bucket itself is private, so this is the only way to reach the bytes.
router.get(
  '/:id/url',
  asyncHandler(async (req, res) => {
    const document = await prisma.generatedDocument.findUnique({ where: { id: req.params.id } });
    if (!document) throw new HttpError(404, 'Document not found');

    const suffix = await findFilenameSuffix(document.applicationType, document.applicationId);
    const label = DOC_KEY_FILENAME_LABEL[document.docKey] ?? document.docKey;
    const filename = `${label}-${suffix ?? document.applicationId}.pdf`;

    const url = await getDocumentViewUrl(document.s3Key, filename);
    res.json({ url });
  })
);

export default router;
