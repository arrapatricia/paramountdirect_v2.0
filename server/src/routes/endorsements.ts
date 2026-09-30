// Policy endorsements for the non-life products - CTPL (Non-Financial, Term
// Extension, Cancellation) and OFW (Cancellation only so far; GTP reuses the
// same Endorsement model once built).
//
//   Non-Financial (name/address/vehicle corrections, no premium effect) -
//     auto-approved on submit: numbered, applied and documented at once.
//   Financial (Term Extension, Flat / Pro Rata Cancellation, OFW Cancellation) -
//     Pending -> Reviewed -> Approved | Denied. The policy itself is only
//     touched on Approve; a Denied request leaves it exactly as it was.
import { Router, type Request } from 'express';
import { z } from 'zod';
import type { CtplApplication, Endorsement, EndorsementStatus, NonLifeProduct, OfwApplication, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import { nextCreditMemoNumber, nextEndorsementNumber } from '../lib/endorsementNumbering';
import { generateUniqueInvoiceNumber } from '../lib/invoiceNumbering';
import { computeCtplCancellation, computeCtplExtension, EndorsementCalcError } from '../services/ctplEndorsementCalc';
import { generateCtplEndorsementDocuments, type EndorsementChange } from '../services/ctplEndorsementDocuments';
import { computeOfwCancellation } from '../services/ofwEndorsementCalc';
import { generateOfwEndorsementDocuments } from '../services/ofwEndorsementDocuments';

const router = Router();
router.use(requireAuth);

// Who may review/approve a financial endorsement for a product. Anyone with
// access to the product line may request one.
const APPROVER_ROLES: Record<NonLifeProduct, string[]> = {
  CTPL: ['System Admin', 'Non-Life Admin', 'CTPL Admin'],
  OFW: ['System Admin', 'Non-Life Admin', 'OFW Admin'],
  GTP: ['System Admin', 'Non-Life Admin', 'GTP Admin'],
};

function assertProductAccess(req: Request, product: NonLifeProduct) {
  if (!req.user?.assignedProducts.includes(product)) throw new HttpError(403, 'Not authorized for this product line');
}

function assertApprover(req: Request, product: NonLifeProduct) {
  if (!APPROVER_ROLES[product].includes(req.user?.role ?? '')) {
    throw new HttpError(403, `Only ${APPROVER_ROLES[product].join(' / ')} can review or approve ${product} endorsements`);
  }
}

const actor = (req: Request) => req.user?.email ?? 'Unknown';

// Calculation input errors (bad dates) are the caller's mistake - surface as 400.
async function calc<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof EndorsementCalcError) throw new HttpError(400, err.message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// CTPL non-financial field catalogue - the only fields a Non-Financial
// endorsement may change, with the label printed on the endorsement form.
// ---------------------------------------------------------------------------

const CTPL_INSURED_FIELDS = {
  clientType: 'Client Type',
  ownerFirstName: 'First Name',
  ownerMiddleName: 'Middle Name',
  ownerSurname: 'Surname',
  ownerAddress: 'Address',
  ownerBarangay: 'Barangay',
  ownerCity: 'City/Municipality',
  ownerRegion: 'Region',
  applicantFirstName: 'Applicant First Name',
  applicantSurname: 'Applicant Surname',
  email: 'Email Address',
  mobileNumber: 'Mobile Number',
} as const;

const CTPL_VEHICLE_FIELDS = {
  vehicleYear: 'Year Model',
  vehicleMake: 'Vehicle Make',
  vehicleSeries: 'Vehicle Series',
  vehicleColor: 'Color',
  vehicleBodyType: 'Body Type',
  plateNumber: 'Plate Number',
  mvFileNumber: 'MV File Number',
  chassisNumber: 'Serial/Chassis Number',
  motorNumber: 'Motor Number',
} as const;

const CTPL_CLIENT_TYPE_LABEL: Record<string, string> = {
  Individual: 'Individual',
  Corporate_without_assignee: 'Corporate without assignee',
  Corporate_with_assignee: 'Corporate with assignee',
};

const ctplChangesSchema = z
  .object({
    clientType: z.enum(['Individual', 'Corporate_without_assignee', 'Corporate_with_assignee']),
    ...Object.fromEntries(Object.keys(CTPL_INSURED_FIELDS).filter((k) => k !== 'clientType').map((k) => [k, z.string().trim()])),
    ...Object.fromEntries(Object.keys(CTPL_VEHICLE_FIELDS).map((k) => [k, z.string().trim()])),
  })
  .partial()
  .strict();

const displayValue = (field: string, value: unknown) =>
  field === 'clientType' ? CTPL_CLIENT_TYPE_LABEL[String(value)] ?? String(value) : String(value ?? '');

function diffCtplChanges(app: CtplApplication, requested: Record<string, unknown>): EndorsementChange[] {
  const labels: Record<string, string> = { ...CTPL_INSURED_FIELDS, ...CTPL_VEHICLE_FIELDS };
  return Object.entries(requested)
    .filter(([field, value]) => value !== undefined && String(value) !== String(app[field as keyof CtplApplication] ?? ''))
    .map(([field, value]) => ({
      field,
      label: labels[field],
      from: displayValue(field, app[field as keyof CtplApplication]),
      to: displayValue(field, value),
    }));
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

const ctplApplicationSummary = {
  select: { id: true, referenceNo: true, policyNumber: true, ownerFirstName: true, ownerMiddleName: true, ownerSurname: true, plateNumber: true, effectiveDate: true, expiryDate: true, premium: true, status: true },
} as const;

const ofwApplicationSummary = {
  select: { id: true, referenceNo: true, policyNumber: true, firstName: true, middleName: true, lastName: true, insuranceStart: true, contractEnd: true, premium: true, status: true },
} as const;

const listInclude = {
  ctplApplication: ctplApplicationSummary,
  ofwApplication: ofwApplicationSummary,
  documents: { orderBy: { generatedAt: 'desc' } },
} satisfies Prisma.EndorsementInclude;

const listQuerySchema = z.object({
  product: z.enum(['CTPL', 'OFW', 'GTP']).optional(),
  status: z.enum(['Pending', 'Reviewed', 'Approved', 'Denied']).optional(),
  applicationId: z.string().min(1).optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { product, status, applicationId } = listQuerySchema.parse(req.query);
    const products = (product ? [product] : (['CTPL', 'OFW', 'GTP'] as NonLifeProduct[])).filter((p) => req.user?.assignedProducts.includes(p));
    const endorsements = await prisma.endorsement.findMany({
      where: {
        product: { in: products },
        ...(status ? { status } : {}),
        ...(applicationId ? { OR: [{ ctplApplicationId: applicationId }, { ofwApplicationId: applicationId }, { gtpApplicationId: applicationId }] } : {}),
      },
      include: listInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(endorsements);
  })
);

async function loadEndorsement(req: Request, id: string) {
  const endorsement = await prisma.endorsement.findUnique({ where: { id }, include: listInclude });
  if (!endorsement) throw new HttpError(404, 'Endorsement not found');
  assertProductAccess(req, endorsement.product);
  return endorsement;
}

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await loadEndorsement(req, req.params.id));
  })
);

// ---------------------------------------------------------------------------
// CTPL: preview + submit
// ---------------------------------------------------------------------------

async function loadEndorsableCtplPolicy(req: Request, applicationId: string) {
  assertProductAccess(req, 'CTPL');
  const app = await prisma.ctplApplication.findUnique({ where: { id: applicationId } });
  if (!app) throw new HttpError(404, 'Application not found');
  if (!app.isPaid || !app.policyNumber) throw new HttpError(400, 'Only issued (paid) policies can be endorsed');
  if (app.status === 'Reversed') throw new HttpError(400, 'This policy has already been cancelled');
  return app;
}

async function assertNoOpenFinancialEndorsement(fk: 'ctplApplicationId' | 'ofwApplicationId', applicationId: string) {
  const open = await prisma.endorsement.findFirst({
    where: { [fk]: applicationId, status: { in: ['Pending', 'Reviewed'] } },
  });
  if (open) throw new HttpError(409, 'This policy already has a financial endorsement awaiting approval');
}

const previewSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('Term_Extension'), newExpiryDate: z.coerce.date() }),
  z.object({ kind: z.literal('Cancellation'), effectiveDate: z.coerce.date() }),
]);

router.post(
  '/ctpl/:applicationId/preview',
  asyncHandler(async (req, res) => {
    const input = previewSchema.parse(req.body);
    const app = await loadEndorsableCtplPolicy(req, req.params.applicationId);
    if (input.kind === 'Term_Extension') {
      const r = await calc(() => computeCtplExtension(app, input.newExpiryDate));
      return res.json({ type: 'Term_Extension', ...r });
    }
    const r = await calc(() => computeCtplCancellation(app, input.effectiveDate));
    res.json(r);
  })
);

const submitSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('Non_Financial'),
    effectiveDate: z.coerce.date(),
    reason: z.string().trim().min(1),
    withDeedOfSale: z.boolean().default(false),
    changes: ctplChangesSchema,
  }),
  z.object({
    kind: z.literal('Term_Extension'),
    effectiveDate: z.coerce.date(),
    reason: z.string().trim().min(1),
    newExpiryDate: z.coerce.date(),
  }),
  z.object({
    kind: z.literal('Cancellation'),
    effectiveDate: z.coerce.date(),
    reason: z.string().trim().min(1),
  }),
]);

router.post(
  '/ctpl/:applicationId',
  asyncHandler(async (req, res) => {
    const input = submitSchema.parse(req.body);
    const app = await loadEndorsableCtplPolicy(req, req.params.applicationId);
    const base = {
      product: 'CTPL' as const,
      ctplApplicationId: app.id,
      policyNumber: app.policyNumber!,
      effectiveDate: input.effectiveDate,
      reason: input.reason,
      requestedBy: actor(req),
    };

    if (input.kind === 'Non_Financial') {
      const changes = diffCtplChanges(app, input.changes);
      if (changes.length === 0) throw new HttpError(400, 'No changes to endorse');
      if (input.withDeedOfSale && changes.some((c) => c.field in CTPL_VEHICLE_FIELDS)) {
        throw new HttpError(400, 'A transfer of ownership (with Deed of Sale) can only change the insured, not the vehicle');
      }

      const { endorsement, updated } = await prisma.$transaction(async (tx) => {
        const endorsementNumber = await nextEndorsementNumber(tx, 'CTPL');
        const updated = await tx.ctplApplication.update({
          where: { id: app.id },
          data: Object.fromEntries(changes.map((c) => [c.field, input.changes[c.field as keyof typeof input.changes]])),
        });
        const endorsement = await tx.endorsement.create({
          data: {
            ...base,
            type: 'Non_Financial',
            status: 'Approved',
            endorsementNumber,
            withDeedOfSale: input.withDeedOfSale,
            changes: changes as unknown as Prisma.InputJsonValue,
            decidedBy: actor(req),
            decidedAt: new Date(),
            decisionRemarks: 'Auto-approved (non-financial)',
          },
        });
        return { endorsement, updated };
      });

      await recordAudit(req, {
        action: 'CREATE',
        module: 'CTPL Endorsements',
        details: `Endorsed ${app.policyNumber} (${endorsement.endorsementNumber}): ${changes.map((c) => `${c.label} "${c.from}" -> "${c.to}"`).join('; ')}`,
      });
      await generateDocumentsSafely(() => generateCtplEndorsementDocuments(updated, endorsement, actor(req)), endorsement);
      return res.status(201).json(await loadEndorsement(req, endorsement.id));
    }

    await assertNoOpenFinancialEndorsement('ctplApplicationId', app.id);

    let data: Prisma.EndorsementUncheckedCreateInput;
    if (input.kind === 'Term_Extension') {
      const { amounts } = await calc(() => computeCtplExtension(app, input.newExpiryDate));
      data = { ...base, type: 'Term_Extension', previousExpiryDate: app.expiryDate, newExpiryDate: input.newExpiryDate, ...amounts };
    } else {
      const { type, amounts } = await calc(() => computeCtplCancellation(app, input.effectiveDate));
      data = { ...base, type, ...amounts };
    }

    const endorsement = await prisma.endorsement.create({ data });
    await recordAudit(req, {
      action: 'CREATE',
      module: 'CTPL Endorsements',
      details: `Requested ${endorsement.type.replace(/_/g, ' ')} for ${app.policyNumber} (total ${endorsement.total})`,
    });
    res.status(201).json(await loadEndorsement(req, endorsement.id));
  })
);

// ---------------------------------------------------------------------------
// OFW: preview + submit (Cancellation only, so far)
// ---------------------------------------------------------------------------

async function loadEndorsableOfwPolicy(req: Request, applicationId: string) {
  assertProductAccess(req, 'OFW');
  const app = await prisma.ofwApplication.findUnique({ where: { id: applicationId } });
  if (!app) throw new HttpError(404, 'Application not found');
  if (!app.isPaid || !app.policyNumber) throw new HttpError(400, 'Only issued (paid) policies can be endorsed');
  if (app.status === 'Reversed') throw new HttpError(400, 'This policy has already been cancelled');
  return app;
}

const ofwPreviewSchema = z.object({ kind: z.literal('Cancellation'), effectiveDate: z.coerce.date() });

router.post(
  '/ofw/:applicationId/preview',
  asyncHandler(async (req, res) => {
    const input = ofwPreviewSchema.parse(req.body);
    const app = await loadEndorsableOfwPolicy(req, req.params.applicationId);
    const r = await calc(() => computeOfwCancellation(app, input.effectiveDate));
    res.json(r);
  })
);

const ofwSubmitSchema = z.object({
  kind: z.literal('Cancellation'),
  effectiveDate: z.coerce.date(),
  reason: z.string().trim().min(1),
});

router.post(
  '/ofw/:applicationId',
  asyncHandler(async (req, res) => {
    const input = ofwSubmitSchema.parse(req.body);
    const app = await loadEndorsableOfwPolicy(req, req.params.applicationId);
    await assertNoOpenFinancialEndorsement('ofwApplicationId', app.id);

    const { type, amounts } = await calc(() => computeOfwCancellation(app, input.effectiveDate));
    const data: Prisma.EndorsementUncheckedCreateInput = {
      product: 'OFW',
      ofwApplicationId: app.id,
      policyNumber: app.policyNumber!,
      effectiveDate: input.effectiveDate,
      reason: input.reason,
      requestedBy: actor(req),
      type,
      ...amounts,
    };

    const endorsement = await prisma.endorsement.create({ data });
    await recordAudit(req, {
      action: 'CREATE',
      module: 'OFW Endorsements',
      details: `Requested Cancellation for ${endorsement.policyNumber} (total ${endorsement.total})`,
    });
    res.status(201).json(await loadEndorsement(req, endorsement.id));
  })
);

// ---------------------------------------------------------------------------
// Review / approve / deny (financial only)
// ---------------------------------------------------------------------------

const remarksSchema = z.object({ remarks: z.string().trim().optional() });

async function loadForDecision(req: Request, allowed: EndorsementStatus[]) {
  const endorsement = await loadEndorsement(req, req.params.id);
  assertApprover(req, endorsement.product);
  if (endorsement.type === 'Non_Financial') throw new HttpError(400, 'Non-financial endorsements are approved automatically');
  if (!allowed.includes(endorsement.status)) {
    throw new HttpError(409, `Endorsement is ${endorsement.status}, expected ${allowed.join(' or ')}`);
  }
  return endorsement;
}

router.post(
  '/:id/review',
  asyncHandler(async (req, res) => {
    const { remarks } = remarksSchema.parse(req.body);
    const e = await loadForDecision(req, ['Pending']);
    await prisma.endorsement.update({
      where: { id: e.id },
      data: { status: 'Reviewed', reviewedBy: actor(req), reviewedAt: new Date(), reviewRemarks: remarks || null },
    });
    await recordAudit(req, { action: 'UPDATE', module: `${e.product} Endorsements`, details: `Reviewed ${e.type.replace(/_/g, ' ')} for ${e.policyNumber}` });
    res.json(await loadEndorsement(req, e.id));
  })
);

router.post(
  '/:id/deny',
  asyncHandler(async (req, res) => {
    const { remarks } = z.object({ remarks: z.string().trim().min(1, 'A reason is required to deny') }).parse(req.body);
    const e = await loadForDecision(req, ['Pending', 'Reviewed']);
    await prisma.endorsement.update({
      where: { id: e.id },
      data: { status: 'Denied', decidedBy: actor(req), decidedAt: new Date(), decisionRemarks: remarks },
    });
    await recordAudit(req, { action: 'UPDATE', module: `${e.product} Endorsements`, details: `Denied ${e.type.replace(/_/g, ' ')} for ${e.policyNumber}: ${remarks}` });
    res.json(await loadEndorsement(req, e.id));
  })
);

router.post(
  '/:id/approve',
  asyncHandler(async (req, res) => {
    const { remarks } = remarksSchema.parse(req.body);
    const e = await loadForDecision(req, ['Reviewed']);

    if (e.product === 'CTPL' && e.ctplApplicationId) {
      const isExtension = e.type === 'Term_Extension';
      // Drawn from the shared non-life invoice series (see invoiceNumbering.ts).
      const invoiceNumber = isExtension ? await generateUniqueInvoiceNumber() : null;

      const { endorsement, app } = await prisma.$transaction(async (tx) => {
        const endorsementNumber = await nextEndorsementNumber(tx, 'CTPL');
        const creditMemoNumber = isExtension ? null : await nextCreditMemoNumber(tx);
        const app = await tx.ctplApplication.update({
          where: { id: e.ctplApplicationId! },
          // A cancelled policy is "Reversed" - paid, then refunded (see
          // getCtplPolicyStatus in ctpl_types.ts).
          data: isExtension ? { expiryDate: e.newExpiryDate } : { status: 'Reversed' },
        });
        const endorsement = await tx.endorsement.update({
          where: { id: e.id },
          data: {
            status: 'Approved',
            endorsementNumber,
            invoiceNumber,
            creditMemoNumber,
            decidedBy: actor(req),
            decidedAt: new Date(),
            decisionRemarks: remarks || null,
          },
        });
        return { endorsement, app };
      });

      await recordAudit(req, {
        action: 'UPDATE',
        module: 'CTPL Endorsements',
        details: `Approved ${e.type.replace(/_/g, ' ')} for ${e.policyNumber} (${endorsement.endorsementNumber})`,
      });
      await generateDocumentsSafely(() => generateCtplEndorsementDocuments(app, endorsement, actor(req)), endorsement);
      return res.json(await loadEndorsement(req, e.id));
    }

    if (e.product === 'OFW' && e.ofwApplicationId) {
      const { endorsement, app } = await prisma.$transaction(async (tx) => {
        const endorsementNumber = await nextEndorsementNumber(tx, 'OFW');
        const creditMemoNumber = await nextCreditMemoNumber(tx);
        // A cancelled policy is "Reversed" - paid, then refunded (see
        // getOfwPolicyStatus in ofw_types.ts).
        const app = await tx.ofwApplication.update({ where: { id: e.ofwApplicationId! }, data: { status: 'Reversed' } });
        const endorsement = await tx.endorsement.update({
          where: { id: e.id },
          data: {
            status: 'Approved',
            endorsementNumber,
            creditMemoNumber,
            decidedBy: actor(req),
            decidedAt: new Date(),
            decisionRemarks: remarks || null,
          },
        });
        return { endorsement, app };
      });

      await recordAudit(req, {
        action: 'UPDATE',
        module: 'OFW Endorsements',
        details: `Approved Cancellation for ${e.policyNumber} (${endorsement.endorsementNumber})`,
      });
      await generateDocumentsSafely(() => generateOfwEndorsementDocuments(app, endorsement, actor(req)), endorsement);
      return res.json(await loadEndorsement(req, e.id));
    }

    throw new HttpError(501, `${e.product} endorsements aren't supported yet`);
  })
);

// Re-runs document generation for an approved endorsement - for when the
// automatic run right after approval failed (S3 hiccup, etc.).
router.post(
  '/:id/documents',
  asyncHandler(async (req, res) => {
    const e = await loadEndorsement(req, req.params.id);
    if (e.status !== 'Approved') throw new HttpError(400, 'Only approved endorsements have documents');

    if (e.ctplApplicationId) {
      const app = await prisma.ctplApplication.findUniqueOrThrow({ where: { id: e.ctplApplicationId } });
      await generateCtplEndorsementDocuments(app, e, actor(req));
      return res.json(await loadEndorsement(req, e.id));
    }
    if (e.ofwApplicationId) {
      const app = await prisma.ofwApplication.findUniqueOrThrow({ where: { id: e.ofwApplicationId } });
      await generateOfwEndorsementDocuments(app, e, actor(req));
      return res.json(await loadEndorsement(req, e.id));
    }
    throw new HttpError(501, `${e.product} endorsements aren't supported yet`);
  })
);

async function generateDocumentsSafely(generate: () => Promise<void>, e: Endorsement) {
  try {
    await generate();
  } catch (err) {
    console.error(`Failed to generate documents for endorsement ${e.id}:`, err);
  }
}

export default router;
