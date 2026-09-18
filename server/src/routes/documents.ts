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

// Short-lived presigned URL to view/print/download the stored PDF - the
// bucket itself is private, so this is the only way to reach the bytes.
router.get(
  '/:id/url',
  asyncHandler(async (req, res) => {
    const document = await prisma.generatedDocument.findUnique({ where: { id: req.params.id } });
    if (!document) throw new HttpError(404, 'Document not found');

    const url = await getDocumentViewUrl(document.s3Key);
    res.json({ url });
  })
);

export default router;
