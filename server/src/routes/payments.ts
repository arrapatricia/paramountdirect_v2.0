import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import type { PolicyStatus } from '@prisma/client';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? (req.query.status as PolicyStatus) : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const payments = await prisma.lifePaymentTransaction.findMany({
      where: {
        ...(status ? { policyStatus: status } : {}),
        ...(search
          ? {
              OR: [
                { policyNo: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
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
    const payment = await prisma.lifePaymentTransaction.findUnique({
      where: { id: req.params.id },
    });
    if (!payment) throw new HttpError(404, 'Payment transaction not found');
    res.json(payment);
  })
);

const createPaymentSchema = z.object({
  policyNo: z.string().min(1),
  title: z.string().min(1),
  firstName: z.string().min(1),
  middleName: z.string().min(1),
  lastName: z.string().min(1),
  birthdate: z.coerce.date(),
  gender: z.string().min(1),
  currentAge: z.number().int(),
  issueAge: z.number().int(),
  address: z.string().min(1),
  mobileNumber: z.string().min(1),
  telephoneNumber: z.string().min(1),
  emailAddress: z.string().email(),

  policyStatus: z.enum(['Inforced', 'Lapsed', 'Terminated', 'Matured', 'Involuntary', 'Voluntary', 'Surrender']),
  hcrStatus: z.string().min(1),
  hcrUnit: z.string().min(1),
  premium: z.number(),
  hcrPremium: z.number(),
  deposit: z.number(),
  underpay: z.number(),
  dueDate: z.coerce.date(),
  payType: z.string().min(1),
  cashValue: z.number(),
  lifeBenefits: z.number(),
  accidentalBenefits: z.number(),
  mode: z.string().min(1),
  issueDate: z.coerce.date(),
  effectivityDate: z.coerce.date(),
  policyDate: z.coerce.date(),
  expiryDate: z.coerce.date(),

  planCode: z.string().min(1),
  planDesc: z.string().min(1),
  orDate: z.coerce.date().optional(),
  orNumber: z.string().optional(),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createPaymentSchema.parse(req.body);

    const payment = await prisma.lifePaymentTransaction.create({ data });

    await recordAudit(req, { action: 'CREATE', module: 'Payment Transactions', details: `Created payment transaction ${payment.policyNo}` });
    res.status(201).json(payment);
  })
);

const updatePaymentSchema = createPaymentSchema.partial();

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updatePaymentSchema.parse(req.body);

    const payment = await prisma.lifePaymentTransaction.update({
      where: { id: req.params.id },
      data,
    });

    await recordAudit(req, { action: 'UPDATE', module: 'Payment Transactions', details: `Updated payment transaction ${payment.policyNo}` });
    res.json(payment);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const payment = await prisma.lifePaymentTransaction.delete({ where: { id: req.params.id } });
    await recordAudit(req, { action: 'DELETE', module: 'Payment Transactions', details: `Deleted payment transaction ${payment.policyNo}` });
    res.status(204).end();
  })
);

export default router;
