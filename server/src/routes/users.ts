import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../utils/password';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';

const router = Router();
router.use(requireAuth);

const userInclude = {
  role: { select: { id: true, name: true, productScope: true } },
  branch: { select: { id: true, city: true } },
} as const;

function serializeUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const product = typeof req.query.product === 'string' ? req.query.product : undefined;
    const users = await prisma.user.findMany({
      where: product ? { assignedProducts: { has: product } } : undefined,
      include: userInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(users.map(serializeUser));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: userInclude });
    if (!user) throw new HttpError(404, 'User not found');
    res.json(serializeUser(user));
  })
);

const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  roleId: z.string().optional(),
  branchId: z.string().optional(),
  assignedProducts: z.array(z.enum(['PD Life', 'OFW', 'CTPL', 'GTP'])).default([]),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createUserSchema.parse(req.body);
    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        roleId: data.roleId,
        branchId: data.branchId,
        assignedProducts: data.assignedProducts,
        status: data.status,
      },
      include: userInclude,
    });

    await recordAudit(req, { action: 'CREATE', module: 'User Management', details: `Created user ${user.email}` });
    res.status(201).json(serializeUser(user));
  })
);

const updateUserSchema = createUserSchema.omit({ password: true }).partial().extend({
  password: z.string().min(8).optional(),
});

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateUserSchema.parse(req.body);
    const { password, ...rest } = data;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
      include: userInclude,
    });

    await recordAudit(req, { action: 'UPDATE', module: 'User Management', details: `Updated user ${user.email}` });
    res.json(serializeUser(user));
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.delete({ where: { id: req.params.id } });
    await recordAudit(req, { action: 'DELETE', module: 'User Management', details: `Deleted user ${user.email}` });
    res.status(204).end();
  })
);

export default router;
