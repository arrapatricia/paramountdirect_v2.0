// Receiving end of the ctpl.ph -> admin system integration, mirroring
// ingest.pdlife.ts's paramountdirect.com contract: that site's own backend
// calls this right after a CTPL application is saved on its end, so it shows
// up in CTPL Applications here without anyone re-keying it. Authenticated by
// the same shared API key as every other product's ingest route
// (requireServiceApiKey) - there's no logged-in user on the other end.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { requireServiceApiKey } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import { generateUniqueCtplReferenceNo } from '../lib/ctplNumbering';

const router = Router();
router.use(requireServiceApiKey);

const ingestSchema = z.object({
  policyType: z.enum(['Private_Car', 'Commercial_Vehicle', 'Motorcycle']),
  mvType: z.string().min(1),
  renewalType: z.enum(['New_1_Year', 'Renewal']),

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

  requiresCOV: z.boolean().default(false),
  forPublicUse: z.boolean().default(false),

  // Plain numeric string (no currency sign), same convention as every other
  // application's premium field in this system.
  premium: z.string().min(1),
  dateReceived: z.coerce.date(),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = ingestSchema.parse(req.body);

    // Reference No. is assigned to every CTPL application as soon as it
    // exists, paid or not - matches applications.ctpl.ts's own POST route.
    const referenceNo = await generateUniqueCtplReferenceNo();

    const application = await prisma.ctplApplication.create({
      data: { ...data, status: 'Completed', referenceNo },
    });

    try {
      await recordAudit(req, {
        action: 'CREATE',
        module: 'CTPL Applications',
        details: `Received CTPL application ${application.id} (${application.plateNumber}) from ctpl.ph`,
      });
    } catch (err) {
      // The application above is already saved and is the real result the
      // website cares about - a logging hiccup here must never turn a
      // successful ingest into a failure response back to it.
      console.error('Failed to record audit log for ingested CTPL application', application.id, err);
    }

    res.status(201).json({ id: application.id });
  })
);

export default router;
