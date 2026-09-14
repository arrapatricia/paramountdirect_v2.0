import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import type { BranchStatus } from '@prisma/client';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? (req.query.status as BranchStatus) : undefined;
    const branches = await prisma.branch.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(branches);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const branch = await prisma.branch.findUnique({ where: { id: req.params.id } });
    if (!branch) throw new HttpError(404, 'Branch not found');
    res.json(branch);
  })
);

const createBranchSchema = z.object({
  division: z.enum(['LIFE', 'NON_LIFE']),
  region: z.string().min(1),
  province: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  barangay: z.string().optional(),
  zipcode: z.string().min(1),
  mobile: z.string().min(1),
  telephone: z.string().min(1),
  fax: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().min(1),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createBranchSchema.parse(req.body);

    const branch = await prisma.branch.create({ data });

    await recordAudit(req, { action: 'CREATE', module: 'Branch Directory', details: `Created branch ${branch.city}` });
    res.status(201).json(branch);
  })
);

const updateBranchSchema = createBranchSchema.partial();

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateBranchSchema.parse(req.body);

    const branch = await prisma.branch.update({ where: { id: req.params.id }, data });

    await recordAudit(req, { action: 'UPDATE', module: 'Branch Directory', details: `Updated branch ${branch.city}` });
    res.json(branch);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const branch = await prisma.branch.delete({ where: { id: req.params.id } });
    await recordAudit(req, { action: 'DELETE', module: 'Branch Directory', details: `Deleted branch ${branch.city}` });
    res.status(204).end();
  })
);

export default router;
