import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import type { NonLifeProduct } from '@prisma/client';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const product = typeof req.query.product === 'string' ? (req.query.product as NonLifeProduct) : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const payments = await prisma.nonLifePaymentTransaction.findMany({
      where: {
        ...(product ? { product } : {}),
        ...(search
          ? {
              OR: [
                { policyNumber: { contains: search, mode: 'insensitive' } },
                { referenceNo: { contains: search, mode: 'insensitive' } },
                { payorName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const payment = await prisma.nonLifePaymentTransaction.findUnique({ where: { id: req.params.id } });
    if (!payment) throw new HttpError(404, 'Non-life payment transaction not found');
    res.json(payment);
  })
);

const paymentFieldsSchema = z.object({
  product: z.enum(['CTPL', 'OFW', 'GTP']),
  policyNumber: z.string().min(1),
  referenceNo: z.string().min(1),
  payorName: z.string().min(1),
  planLabel: z.string().min(1),
  premium: z.string().min(1),
  dateReceived: z.coerce.date(),
  ctplApplicationId: z.string().optional(),
  ofwApplicationId: z.string().optional(),
  gtpApplicationId: z.string().optional(),
});

// Exactly one of the three application FKs should be set, matching
// `product` - enforced here since Prisma has no polymorphic relation to
// enforce it at the DB level (see schema.prisma's NonLifePaymentTransaction).
function assertLinkedToMatchingProduct(data: z.infer<typeof paymentFieldsSchema>, ctx: z.RefinementCtx) {
  const linked = [data.ctplApplicationId, data.ofwApplicationId, data.gtpApplicationId].filter(Boolean);
  if (linked.length > 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Only one of ctplApplicationId/ofwApplicationId/gtpApplicationId may be set' });
  }
  const expectedKey = `${data.product.toLowerCase()}ApplicationId` as 'ctplApplicationId' | 'ofwApplicationId' | 'gtpApplicationId';
  if (linked.length === 1 && !data[expectedKey]) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `product ${data.product} must link via ${expectedKey}, not a different product's application id` });
  }
}

const createPaymentSchema = paymentFieldsSchema.superRefine(assertLinkedToMatchingProduct);
const updatePaymentSchema = paymentFieldsSchema.partial().superRefine((data, ctx) => {
  if (data.product) assertLinkedToMatchingProduct(data as z.infer<typeof paymentFieldsSchema>, ctx);
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createPaymentSchema.parse(req.body);

    const payment = await prisma.nonLifePaymentTransaction.create({ data });

    await recordAudit(req, { action: 'CREATE', module: 'Non-Life Payment Transactions', details: `Created ${payment.product} payment transaction (Policy ${payment.policyNumber} / Ref ${payment.referenceNo})` });
    res.status(201).json(payment);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updatePaymentSchema.parse(req.body);

    const payment = await prisma.nonLifePaymentTransaction.update({ where: { id: req.params.id }, data });

    await recordAudit(req, { action: 'UPDATE', module: 'Non-Life Payment Transactions', details: `Updated ${payment.product} payment transaction (Policy ${payment.policyNumber} / Ref ${payment.referenceNo})` });
    res.json(payment);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const payment = await prisma.nonLifePaymentTransaction.delete({ where: { id: req.params.id } });
    await recordAudit(req, { action: 'DELETE', module: 'Non-Life Payment Transactions', details: `Deleted ${payment.product} payment transaction (Policy ${payment.policyNumber} / Ref ${payment.referenceNo})` });
    res.status(204).end();
  })
);

export default router;
