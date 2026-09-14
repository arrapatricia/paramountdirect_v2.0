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

    const payments = await prisma.paymentTransaction.findMany({
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
      include: { ledgerHistory: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const payment = await prisma.paymentTransaction.findUnique({
      where: { id: req.params.id },
      include: { ledgerHistory: true },
    });
    if (!payment) throw new HttpError(404, 'Payment transaction not found');
    res.json(payment);
  })
);

const ledgerItemSchema = z.object({
  yrInstal: z.string().min(1),
  dueDate: z.coerce.date(),
  uploaded: z.number(),
  amountPaid: z.number(),
  underpay: z.number(),
  orNumber: z.string().min(1),
  orDate: z.coerce.date().optional(),
  status: z.string().min(1),
});

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

  ledgerHistory: z.array(ledgerItemSchema).default([]),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { ledgerHistory, ...data } = createPaymentSchema.parse(req.body);

    const payment = await prisma.paymentTransaction.create({
      data: {
        ...data,
        ledgerHistory: { create: ledgerHistory },
      },
      include: { ledgerHistory: true },
    });

    await recordAudit(req, { action: 'CREATE', module: 'Payment Transactions', details: `Created payment transaction ${payment.policyNo}` });
    res.status(201).json(payment);
  })
);

const updatePaymentSchema = createPaymentSchema.partial();

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { ledgerHistory, ...data } = updatePaymentSchema.parse(req.body);

    const payment = await prisma.$transaction(async (tx) => {
      if (ledgerHistory) {
        await tx.paymentLedgerItem.deleteMany({ where: { paymentId: req.params.id } });
      }
      return tx.paymentTransaction.update({
        where: { id: req.params.id },
        data: {
          ...data,
          ...(ledgerHistory ? { ledgerHistory: { create: ledgerHistory } } : {}),
        },
        include: { ledgerHistory: true },
      });
    });

    await recordAudit(req, { action: 'UPDATE', module: 'Payment Transactions', details: `Updated payment transaction ${payment.policyNo}` });
    res.json(payment);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const payment = await prisma.paymentTransaction.delete({ where: { id: req.params.id } });
    await recordAudit(req, { action: 'DELETE', module: 'Payment Transactions', details: `Deleted payment transaction ${payment.policyNo}` });
    res.status(204).end();
  })
);

export default router;
