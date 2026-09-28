import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';

const router = Router();
router.use(requireAuth);

// Backs Premium Maintenance (premium_maintenance.tsx) and every product's
// create-application form (via lib/api.ts's premiumRatesApi.list()) - this
// table is now the single source of truth for premium amounts; nothing
// should read a hardcoded rate constant again.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const product = typeof req.query.product === 'string' ? req.query.product : undefined;
    const rates = await prisma.premiumRate.findMany({
      where: product ? { product } : undefined,
      orderBy: [{ product: 'asc' }, { key: 'asc' }],
    });
    res.json(rates);
  })
);

const updateSchema = z.object({ amount: z.number() });

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { amount } = updateSchema.parse(req.body);
    const existing = await prisma.premiumRate.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Premium rate not found');

    const rate = await prisma.premiumRate.update({
      where: { id: req.params.id },
      data: { amount, updatedBy: req.user?.email },
    });

    await recordAudit(req, {
      action: 'UPDATE',
      module: 'Premium Maintenance',
      details: `Updated ${rate.product} rate "${rate.label}" from ${existing.amount} to ${amount}`,
    });

    res.json(rate);
  })
);

export default router;
