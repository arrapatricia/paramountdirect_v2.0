import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import type { GtpStatus } from '@prisma/client';

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

  policyNumber: z.string().optional(),
  referenceNo: z.string().optional(),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createApplicationSchema.parse(req.body);

    const application = await prisma.gtpApplication.create({ data });

    await recordAudit(req, { action: 'CREATE', module: 'GTP Applications', details: `Created GTP application ${application.id} (${application.travelerSurname})` });
    res.status(201).json(application);
  })
);

const updateApplicationSchema = createApplicationSchema.partial();

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateApplicationSchema.parse(req.body);

    const application = await prisma.gtpApplication.update({ where: { id: req.params.id }, data });

    await recordAudit(req, { action: 'UPDATE', module: 'GTP Applications', details: `Updated GTP application ${application.id} (${application.travelerSurname})` });
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
