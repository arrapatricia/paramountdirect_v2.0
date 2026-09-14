import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import { Prisma, type PdLifeStatus } from '@prisma/client';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? (req.query.status as PdLifeStatus) : undefined;
    const applications = await prisma.pdLifeApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(applications);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const application = await prisma.pdLifeApplication.findUnique({ where: { id: req.params.id } });
    if (!application) throw new HttpError(404, 'Application not found');
    res.json(application);
  })
);

const createApplicationSchema = z.object({
  payor: z.string().min(1),
  planCategory: z.enum(['Health', 'LifeAccident', 'Comprehensive']),
  planCode: z.string().min(1),
  planDesc: z.string().min(1),
  premium: z.string().min(1),
  source: z.string().min(1),
  dateReceived: z.coerce.date(),
  dateScreened: z.coerce.date().optional(),
  screenedBy: z.string().optional(),
  status: z.enum(['Received', 'For_Verification', 'For_Evaluation', 'Paid', 'Issued']).default('Received'),
  details: z.record(z.string(), z.unknown()).default({}),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createApplicationSchema.parse(req.body);

    const application = await prisma.pdLifeApplication.create({
      data: { ...data, details: data.details as Prisma.InputJsonValue },
    });

    await recordAudit(req, { action: 'CREATE', module: 'Application Screening', details: `Created PD Life application ${application.id} (${application.payor})` });
    res.status(201).json(application);
  })
);

const updateApplicationSchema = createApplicationSchema.partial();

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateApplicationSchema.parse(req.body);

    const application = await prisma.pdLifeApplication.update({
      where: { id: req.params.id },
      data: { ...data, details: data.details as Prisma.InputJsonValue | undefined },
    });

    await recordAudit(req, { action: 'UPDATE', module: 'Application Screening', details: `Updated PD Life application ${application.id} (${application.payor})` });
    res.json(application);
  })
);

const statusUpdateSchema = z.object({
  status: z.enum(['Received', 'For_Verification', 'For_Evaluation', 'Paid', 'Issued']),
});

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = statusUpdateSchema.parse(req.body);

    const existing = await prisma.pdLifeApplication.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Application not found');

    const application = await prisma.pdLifeApplication.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(existing.dateScreened ? {} : { dateScreened: new Date() }),
      },
    });

    await recordAudit(req, { action: 'UPDATE', module: 'Application Screening', details: `Updated status of PD Life application ${application.id} to ${status}` });
    res.json(application);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const application = await prisma.pdLifeApplication.delete({ where: { id: req.params.id } });
    await recordAudit(req, { action: 'DELETE', module: 'Application Screening', details: `Deleted PD Life application ${application.id} (${application.payor})` });
    res.status(204).end();
  })
);

export default router;
