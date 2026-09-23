import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import type { CtplApplication, CtplStatus } from '@prisma/client';
import { generateUniqueCtplPolicyNumber, generateUniqueCtplReferenceNo } from '../lib/ctplNumbering';
import { fillCtplCoc, fillCtplServiceInvoice } from '../services/ctplDocumentFill';
import { storeGeneratedDocument } from '../services/documentStorage';

const CTPL_TERM_YEARS: Record<string, number> = { One_Year: 1, Three_Years: 3 };

async function generateAndStoreCtplDocuments(application: CtplApplication, generatedBy?: string) {
  try {
    const [coc, invoice] = await Promise.all([fillCtplCoc(application), fillCtplServiceInvoice(application)]);
    await storeGeneratedDocument({
      applicationType: 'CTPL',
      applicationId: application.id,
      docKey: 'ctpl-coc',
      contentType: 'application/pdf',
      body: coc,
      generatedBy,
    });
    await storeGeneratedDocument({
      applicationType: 'CTPL',
      applicationId: application.id,
      docKey: 'ctpl-service-invoice',
      contentType: 'application/pdf',
      body: invoice.buffer,
      generatedBy,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (err) {
    // Payment/issuance already succeeded before this runs - don't fail the
    // request over document generation; surface it in the logs for follow-up.
    console.error(`Failed to generate CTPL documents for ${application.id}:`, err);
  }
}

function defaultCtplTerm(renewalType: string) {
  const effective = new Date();
  const years = CTPL_TERM_YEARS[renewalType] ?? 1;
  const expiry = new Date(effective);
  expiry.setFullYear(expiry.getFullYear() + years);
  return { effective, expiry };
}

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
  renewalType: z.enum(['One_Year', 'Three_Years']),

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

  vehicleYear: z.string().optional(),
  vehicleMake: z.string().optional(),
  vehicleSeries: z.string().optional(),
  vehicleColor: z.string().optional(),
  vehicleBodyType: z.string().optional(),
  motorNumber: z.string().optional(),
  authorizedCapacity: z.string().optional(),
  unladenWeight: z.string().optional(),

  requiresCOV: z.boolean().default(false),
  forPublicUse: z.boolean().default(false),

  premium: z.string().min(1),
  dateReceived: z.coerce.date(),
  effectiveDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
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

    // Reference No. identifies the application from the moment it exists,
    // paid or not. Policy Number is only assigned once the policy is
    // actually issued (isPaid) - which, for CTPL's straight-through website
    // flow, is usually right here at creation (see ctpl_create_application.tsx).
    if (!data.referenceNo) data.referenceNo = await generateUniqueCtplReferenceNo();
    const isIssuedOnCreate = Boolean(data.isPaid && !data.policyNumber);
    if (isIssuedOnCreate) {
      data.policyNumber = await generateUniqueCtplPolicyNumber(data.policyType, data.forPublicUse);
      if (!data.effectiveDate) {
        const { effective, expiry } = defaultCtplTerm(data.renewalType);
        data.effectiveDate = effective;
        data.expiryDate = expiry;
      }
    }

    const application = await prisma.ctplApplication.create({ data });

    await recordAudit(req, { action: 'CREATE', module: 'CTPL Applications', details: `Created CTPL application ${application.id} (${application.plateNumber})` });

    if (isIssuedOnCreate) await generateAndStoreCtplDocuments(application, req.user?.email);

    res.status(201).json(application);
  })
);

const updateApplicationSchema = createApplicationSchema.partial();

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateApplicationSchema.parse(req.body);
    const current = await prisma.ctplApplication.findUnique({ where: { id: req.params.id } });
    if (!current) throw new HttpError(404, 'Application not found');

    // Backfills a Reference No. for any pre-existing row that predates this
    // always-assigned rule (see POST above).
    if (!current.referenceNo && !data.referenceNo) {
      data.referenceNo = await generateUniqueCtplReferenceNo();
    }
    // This PUT is issuing the policy for the first time - assign its policy
    // number and, unless the caller already supplied a term, default the
    // effective/expiry dates from today + renewalType so the generated
    // documents below have real dates to print.
    const isNewlyIssued = Boolean(data.isPaid && !current.policyNumber && !data.policyNumber);
    if (isNewlyIssued) {
      data.policyNumber = await generateUniqueCtplPolicyNumber(
        data.policyType ?? current.policyType,
        data.forPublicUse ?? current.forPublicUse
      );
      if (!data.effectiveDate && !current.effectiveDate) {
        const { effective, expiry } = defaultCtplTerm(data.renewalType ?? current.renewalType);
        data.effectiveDate = effective;
        data.expiryDate = expiry;
      }
    }

    const application = await prisma.ctplApplication.update({ where: { id: req.params.id }, data });

    await recordAudit(req, { action: 'UPDATE', module: 'CTPL Applications', details: `Updated CTPL application ${application.id} (${application.plateNumber})` });

    if (isNewlyIssued) await generateAndStoreCtplDocuments(application, req.user?.email);

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
