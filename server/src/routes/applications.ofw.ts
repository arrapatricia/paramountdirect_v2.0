import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import type { OfwApplication, OfwStatus } from '@prisma/client';
import { generateUniqueOfwCoiNumber, generateUniqueOfwReferenceNo } from '../lib/ofwNumbering';
import { formatPhp, getUsdToPhpRate, parseUsdPremium } from '../lib/forex';
import { fillOfwServiceInvoice } from '../services/ofwDocumentFill';
import { storeGeneratedDocument } from '../services/documentStorage';

async function generateAndStoreOfwDocuments(application: OfwApplication, generatedBy?: string) {
  try {
    const invoice = await fillOfwServiceInvoice(application);
    await storeGeneratedDocument({
      applicationType: 'OFW',
      applicationId: application.id,
      docKey: 'ofw-service-invoice',
      contentType: 'application/pdf',
      body: invoice.buffer,
      generatedBy,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (err) {
    // Payment/issuance already succeeded before this runs - don't fail the
    // request over document generation; surface it in the logs for follow-up.
    console.error(`Failed to generate OFW documents for ${application.id}:`, err);
  }
}

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? (req.query.status as OfwStatus) : undefined;
    const applications = await prisma.ofwApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { beneficiaries: true },
    });
    res.json(applications);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const application = await prisma.ofwApplication.findUnique({
      where: { id: req.params.id },
      include: { beneficiaries: true },
    });
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
  phRegion: z.string().min(1),
  phCity: z.string().min(1),
  phBarangay: z.string().min(1),
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
  status: z.enum(['Received', 'Spoiled', 'Duplicate', 'Reversed', 'Cancelled']).default('Received'),
  screenedBy: z.string().optional(),

  // OFW-only caveat: unlike CTPL/GTP's straight-through website payment, an
  // issuer must first verify the employment contract before the client is
  // even sent instructions to pay. Documents only unlock once isPaid is
  // true, which itself can't happen until a payment instruction was sent.
  employmentVerified: z.enum(['Pending', 'Yes', 'No']).default('Pending'),
  paymentInstructionSent: z.boolean().default(false),
  isPaid: z.boolean().default(false),

  // At least one required, up to three.
  beneficiaries: z
    .array(z.object({ fullName: z.string().min(1), relationship: z.string().min(1), birthdate: z.coerce.date() }))
    .default([]),

  policyNumber: z.string().optional(),
  referenceNo: z.string().optional(),
  dateVerified: z.coerce.date().optional(),
  dateProcessed: z.coerce.date().optional(),
  dateIssued: z.coerce.date().optional(),
  fxRate: z.number().optional(),
  premiumPhp: z.string().optional(),
});

// Display name of the logged-in account, same format PD Life's claim uses
// for screenedBy. Falls back to undefined (field left null) for API-key
// callers with no user.
async function currentUserName(userId: string | undefined): Promise<string | undefined> {
  if (!userId) return undefined;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? `${user.firstName} ${user.lastName}`.trim() : undefined;
}

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { beneficiaries, ...data } = createApplicationSchema.parse(req.body);

    // Reference No. identifies the application from the moment it exists,
    // paid or not. COI Number is only assigned once the policy is actually
    // issued (isPaid).
    if (!data.referenceNo) data.referenceNo = await generateUniqueOfwReferenceNo();
    const isIssuedOnCreate = Boolean(data.isPaid && !data.policyNumber);
    if (isIssuedOnCreate) data.policyNumber = await generateUniqueOfwCoiNumber();
    // Date Verified is stamped when employment gets verified 'Yes'; Date
    // Processed when the payment instruction is sent to the client; Date
    // Issued when the policy gets paid.
    if (data.employmentVerified === 'Yes' && !data.dateVerified) data.dateVerified = new Date();
    let paymentInstructionSentBy: string | undefined;
    if (data.paymentInstructionSent && !data.dateProcessed) data.dateProcessed = new Date();
    if (data.paymentInstructionSent) paymentInstructionSentBy = await currentUserName(req.user?.sub);
    if (data.isPaid && !data.dateIssued) data.dateIssued = new Date();
    // Premium/PHP conversion is always fresh on create - it only freezes
    // once the payment instruction is sent (see PUT below).
    if (!data.fxRate || !data.premiumPhp) {
      data.fxRate = await getUsdToPhpRate();
      data.premiumPhp = formatPhp(parseUsdPremium(data.premium) * data.fxRate);
    }

    const application = await prisma.ofwApplication.create({
      data: { ...data, paymentInstructionSentBy, beneficiaries: { create: beneficiaries } },
      include: { beneficiaries: true },
    });

    await recordAudit(req, { action: 'CREATE', module: 'OFW Applications', details: `Created OFW application ${application.id} (${application.lastName}, ${application.firstName})` });

    if (isIssuedOnCreate) await generateAndStoreOfwDocuments(application, req.user?.email);

    res.status(201).json(application);
  })
);

const updateApplicationSchema = createApplicationSchema.partial();

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { beneficiaries, ...data } = updateApplicationSchema.parse(req.body);
    const current = await prisma.ofwApplication.findUnique({ where: { id: req.params.id } });
    if (!current) throw new HttpError(404, 'Application not found');

    // Backfills a Reference No. for any pre-existing row that predates this
    // always-assigned rule (see POST above).
    if (!current.referenceNo && !data.referenceNo) {
      data.referenceNo = await generateUniqueOfwReferenceNo();
    }
    const isNewlyIssued = Boolean(data.isPaid && !current.policyNumber && !data.policyNumber);
    if (isNewlyIssued) {
      data.policyNumber = await generateUniqueOfwCoiNumber();
    }
    if (data.employmentVerified === 'Yes' && !current.dateVerified && !data.dateVerified) {
      data.dateVerified = new Date();
    }
    if (data.paymentInstructionSent && !current.dateProcessed && !data.dateProcessed) {
      data.dateProcessed = new Date();
    }
    // Stamped once, the first time the instruction goes out - later edits
    // by other users don't overwrite who actually sent it.
    let paymentInstructionSentBy: string | undefined;
    if (data.paymentInstructionSent && !current.paymentInstructionSent) {
      paymentInstructionSentBy = await currentUserName(req.user?.sub);
    }
    if (data.isPaid && !current.dateIssued && !data.dateIssued) {
      data.dateIssued = new Date();
    }
    // Premium/PHP conversion keeps refreshing on every edit up through the
    // moment the payment instruction is sent - after that it's locked, so a
    // forex swing later can't change what the client already owes.
    if (!current.paymentInstructionSent) {
      data.fxRate = await getUsdToPhpRate();
      data.premiumPhp = formatPhp(parseUsdPremium(data.premium ?? current.premium) * data.fxRate);
    }

    // Beneficiaries are a small, wholesale-replaced child collection (at
    // most three) - simplest to delete and recreate rather than diff, same
    // as how the create-application form always submits the full set.
    const application = await prisma.ofwApplication.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(paymentInstructionSentBy ? { paymentInstructionSentBy } : {}),
        ...(beneficiaries ? { beneficiaries: { deleteMany: {}, create: beneficiaries } } : {}),
      },
      include: { beneficiaries: true },
    });

    await recordAudit(req, { action: 'UPDATE', module: 'OFW Applications', details: `Updated OFW application ${application.id} (${application.lastName}, ${application.firstName})` });

    if (isNewlyIssued) await generateAndStoreOfwDocuments(application, req.user?.email);

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
