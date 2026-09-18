import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import type { OfwStatus } from '@prisma/client';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? (req.query.status as OfwStatus) : undefined;
    const applications = await prisma.ofwApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(applications);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const application = await prisma.ofwApplication.findUnique({ where: { id: req.params.id } });
    if (!application) throw new HttpError(404, 'Application not found');
    res.json(application);
  })
);

const createApplicationSchema = z.object({
  lastName: z.string().min(1),
  firstName: z.string().min(1),
  middleName: z.string().min(1),
  gender: z.enum(['Male', 'Female']),
  civilStatus: z.enum(['Single', 'Married', 'Widower', 'Separated']),
  birthdate: z.coerce.date(),
  placeOfBirth: z.string().min(1),
  phAddress: z.string().min(1),
  phCity: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  referralSource: z.string().min(1),

  natureOfEmployment: z.enum(['Direct_hired', 'Balik_Manggagawa']),
  coverageType: z.enum(['Land_based', 'Sea_based']),
  occupation: z.string().min(1),
  passportNumber: z.string().min(1),
  salaryAmount: z.number(),
  salaryCurrency: z.enum(['PHP', 'USD', 'HKD', 'Others']),
  employerName: z.string().min(1),
  employerCountry: z.string().min(1),
  contractStart: z.coerce.date(),
  contractEnd: z.coerce.date(),
  insuranceStart: z.coerce.date(),
  isConflictZone: z.boolean().default(false),

  passportDoc: z.enum(['Uploaded', 'Missing']).default('Missing'),
  visaDoc: z.enum(['Uploaded', 'Missing']).default('Missing'),
  employmentContractDoc: z.enum(['Uploaded', 'Missing']).default('Missing'),
  medicalCertificateDoc: z.enum(['Uploaded', 'Missing']).default('Missing'),

  premium: z.string().min(1),
  dateReceived: z.coerce.date(),
  status: z.enum(['Received', 'Cancelled', 'Duplicate', 'Reversed']).default('Received'),
  screenedBy: z.string().optional(),

  policyNumber: z.string().optional(),
  referenceNo: z.string().optional(),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createApplicationSchema.parse(req.body);

    const application = await prisma.ofwApplication.create({ data });

    await recordAudit(req, { action: 'CREATE', module: 'OFW Applications', details: `Created OFW application ${application.id} (${application.lastName}, ${application.firstName})` });
    res.status(201).json(application);
  })
);

const updateApplicationSchema = createApplicationSchema.partial();

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateApplicationSchema.parse(req.body);

    const application = await prisma.ofwApplication.update({ where: { id: req.params.id }, data });

    await recordAudit(req, { action: 'UPDATE', module: 'OFW Applications', details: `Updated OFW application ${application.id} (${application.lastName}, ${application.firstName})` });
    res.json(application);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const application = await prisma.ofwApplication.delete({ where: { id: req.params.id } });
    await recordAudit(req, { action: 'DELETE', module: 'OFW Applications', details: `Deleted OFW application ${application.id} (${application.lastName}, ${application.firstName})` });
    res.status(204).end();
  })
);

export default router;
