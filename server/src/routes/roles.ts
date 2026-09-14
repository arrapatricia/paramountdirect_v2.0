import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const productScope = typeof req.query.productScope === 'string' ? req.query.productScope : undefined;
    const roles = await prisma.role.findMany({
      where: productScope ? { productScope } : undefined,
      include: { permissions: true },
      orderBy: { name: 'asc' },
    });
    res.json(roles);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const role = await prisma.role.findUnique({ where: { id: req.params.id }, include: { permissions: true } });
    if (!role) throw new HttpError(404, 'Role not found');
    res.json(role);
  })
);

const permissionSchema = z.object({
  moduleName: z.string().min(1),
  canRead: z.boolean().default(false),
  canWrite: z.boolean().default(false),
  canDelete: z.boolean().default(false),
});

const createRoleSchema = z.object({
  name: z.string().min(1),
  productScope: z.enum(['PD Life', 'OFW', 'CTPL', 'GTP']),
  isDirectMarketing: z.boolean().default(false),
  permissions: z.array(permissionSchema).default([]),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createRoleSchema.parse(req.body);

    const role = await prisma.role.create({
      data: {
        name: data.name,
        productScope: data.productScope,
        isDirectMarketing: data.isDirectMarketing,
        permissions: { create: data.permissions },
      },
      include: { permissions: true },
    });

    await recordAudit(req, { action: 'CREATE', module: 'Role Access Maintenance', details: `Created role ${role.name} (${role.productScope})` });
    res.status(201).json(role);
  })
);

const updateRoleSchema = createRoleSchema.partial();

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateRoleSchema.parse(req.body);

    const role = await prisma.$transaction(async (tx) => {
      if (data.permissions) {
        await tx.rolePermission.deleteMany({ where: { roleId: req.params.id } });
      }
      return tx.role.update({
        where: { id: req.params.id },
        data: {
          name: data.name,
          productScope: data.productScope,
          isDirectMarketing: data.isDirectMarketing,
          ...(data.permissions ? { permissions: { create: data.permissions } } : {}),
        },
        include: { permissions: true },
      });
    });

    await recordAudit(req, { action: 'UPDATE', module: 'Role Access Maintenance', details: `Updated role ${role.name} (${role.productScope})` });
    res.json(role);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const role = await prisma.role.delete({ where: { id: req.params.id } });
    await recordAudit(req, { action: 'DELETE', module: 'Role Access Maintenance', details: `Deleted role ${role.name} (${role.productScope})` });
    res.status(204).end();
  })
);

export default router;
