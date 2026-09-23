import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import type { GtpApplication, GtpStatus } from '@prisma/client';
import { fillGtpServiceInvoice } from '../services/gtpDocumentFill';
import { storeGeneratedDocument } from '../services/documentStorage';

async function generateAndStoreGtpDocuments(application: GtpApplication, generatedBy?: string) {
  try {
    const invoice = await fillGtpServiceInvoice(application);
    await storeGeneratedDocument({
      applicationType: 'GTP',
      applicationId: application.id,
      docKey: 'gtp-service-invoice',
      contentType: 'application/pdf',
      body: invoice.buffer,
      generatedBy,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (err) {
    // Payment/issuance already succeeded before this runs - don't fail the
    // request over document generation; surface it in the logs for follow-up.
    console.error(`Failed to generate GTP documents for ${application.id}:`, err);
  }
}

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? (req.query.status as GtpStatus) : undefined;
    const applications = await prisma.gtpApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(applications);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const application = await prisma.gtpApplication.findUnique({ where: { id: req.params.id } });
    if (!application) throw new HttpError(404, 'Application not found');
    res.json(application);
  })
);

const createApplicationSchema = z.object({
  travelType: z.enum(['International', 'Domestic']),
  destinations: z.array(z.string()).default([]),
  departureDate: z.coerce.date(),
  returnDate: z.coerce.date(),
  daysOfTravel: z.number().int(),
  applicationType: z.enum(['Individual', 'Family']),

  travelerFirstName: z.string().min(1),
  travelerSurname: z.string().min(1),
  birthdate: z.coerce.date(),
  email: z.string().email(),
  mobileNumber: z.string().min(1),

  planVariant: z.enum(['Single_Trip', 'Multi_Trip_90', 'Multi_Trip_180']),
  cruiseCoverage: z.boolean().default(false),
  hazardousSportsCoverage: z.boolean().default(false),
  isSchengenDestination: z.boolean().default(false),

  premium: z.string().min(1),
  dateReceived: z.coerce.date(),
  status: z.enum(['Received', 'Cancelled', 'Duplicate']).default('Received'),
  screenedBy: z.string().optional(),
  isPaid: z.boolean().default(false),

  policyNumber: z.string().optional(),
  referenceNo: z.string().optional(),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createApplicationSchema.parse(req.body);
    const isIssuedOnCreate = Boolean(data.isPaid);

    const application = await prisma.gtpApplication.create({ data });

    await recordAudit(req, { action: 'CREATE', module: 'GTP Applications', details: `Created GTP application ${application.id} (${application.travelerSurname})` });

    if (isIssuedOnCreate) await generateAndStoreGtpDocuments(application, req.user?.email);

    res.status(201).json(application);
  })
);

const updateApplicationSchema = createApplicationSchema.partial();

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateApplicationSchema.parse(req.body);
    const current = await prisma.gtpApplication.findUnique({ where: { id: req.params.id } });
    if (!current) throw new HttpError(404, 'Application not found');
    const isNewlyIssued = Boolean(data.isPaid && !current.isPaid);

    const application = await prisma.gtpApplication.update({ where: { id: req.params.id }, data });

    await recordAudit(req, { action: 'UPDATE', module: 'GTP Applications', details: `Updated GTP application ${application.id} (${application.travelerSurname})` });

    if (isNewlyIssued) await generateAndStoreGtpDocuments(application, req.user?.email);

    res.json(application);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const application = await prisma.gtpApplication.delete({ where: { id: req.params.id } });
    await recordAudit(req, { action: 'DELETE', module: 'GTP Applications', details: `Deleted GTP application ${application.id} (${application.travelerSurname})` });
    res.status(204).end();
  })
);

export default router;
