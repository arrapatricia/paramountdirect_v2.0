import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import type { CtplStatus } from '@prisma/client';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? (req.query.status as CtplStatus) : undefined;
    const applications = await prisma.ctplApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(applications);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const application = await prisma.ctplApplication.findUnique({ where: { id: req.params.id } });
    if (!application) throw new HttpError(404, 'Application not found');
    res.json(application);
  })
);

const createApplicationSchema = z.object({
  policyType: z.enum(['Private_Car', 'Commercial_Vehicle', 'Motorcycle']),
  mvType: z.string().min(1),
  renewalType: z.enum(['New_1_Year', 'Renewal']),

  clientType: z.enum(['Individual', 'Corporate_without_assignee', 'Corporate_with_assignee']),
  ownerFirstName: z.string().min(1),
  ownerMiddleName: z.string().min(1),
  ownerSurname: z.string().min(1),
  ownerAddress: z.string().min(1),
  ownerRegion: z.string().min(1),
  ownerCity: z.string().min(1),
  ownerBarangay: z.string().min(1),
  sameAsOwner: z.boolean().default(true),
  applicantFirstName: z.string().min(1),
  applicantSurname: z.string().min(1),
  email: z.string().email(),
  mobileNumber: z.string().min(1),

  plateNumber: z.string().min(1),
  mvFileNumber: z.string().min(1),
  chassisNumber: z.string().min(1),

  requiresCOV: z.boolean().default(false),

  premium: z.string().min(1),
  dateReceived: z.coerce.date(),
  status: z.enum(['Completed', 'Spoiled', 'Duplicate', 'Reversed', 'Cancelled']).default('Completed'),
  screenedBy: z.string().optional(),
  isPaid: z.boolean().default(false),

  policyNumber: z.string().optional(),
  referenceNo: z.string().optional(),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createApplicationSchema.parse(req.body);

    const application = await prisma.ctplApplication.create({ data });

    await recordAudit(req, { action: 'CREATE', module: 'CTPL Applications', details: `Created CTPL application ${application.id} (${application.plateNumber})` });
    res.status(201).json(application);
  })
);

const updateApplicationSchema = createApplicationSchema.partial();

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateApplicationSchema.parse(req.body);

    const application = await prisma.ctplApplication.update({ where: { id: req.params.id }, data });

    await recordAudit(req, { action: 'UPDATE', module: 'CTPL Applications', details: `Updated CTPL application ${application.id} (${application.plateNumber})` });
    res.json(application);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const application = await prisma.ctplApplication.delete({ where: { id: req.params.id } });
    await recordAudit(req, { action: 'DELETE', module: 'CTPL Applications', details: `Deleted CTPL application ${application.id} (${application.plateNumber})` });
    res.status(204).end();
  })
);

export default router;
