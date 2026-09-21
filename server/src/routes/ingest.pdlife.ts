// Receiving end of the paramountdirect.com -> PD Revamp integration: the
// legacy Rails site's ApplicationsController#create calls this right after
// a PD Life application (Health/Life & Accident/Comprehensive - CTPL/OFW/GTP
// are out of scope here) is saved, so it shows up in Application Screening
// without anyone re-keying it. Authenticated by a shared API key
// (requireServiceApiKey), not a logged-in user - see that middleware for why.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { requireServiceApiKey } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import { Prisma } from '@prisma/client';

const router = Router();
router.use(requireServiceApiKey);

const ingestSchema = z.object({
  payor: z.string().min(1),
  planCategory: z.enum(['Health', 'LifeAccident', 'Comprehensive']),
  planCode: z.string().min(1),
  planDesc: z.string().min(1),
  // Plain numeric string, e.g. "1364.95" - no currency sign (matches how
  // PdLifeApplication.premium is stored everywhere else in this system).
  premium: z.string().min(1),
  dateReceived: z.coerce.date(),
  // Freeform context from the website submission (contact info, plan
  // options, etc.) - shape intentionally loose since it varies per plan
  // category, same as every other PdLifeApplication.details value.
  details: z.record(z.string(), z.unknown()).default({}),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = ingestSchema.parse(req.body);

    const application = await prisma.pdLifeApplication.create({
      data: {
        ...data,
        source: 'Paramount Website',
        status: 'Received',
        details: data.details as Prisma.InputJsonValue,
      },
    });

    try {
      await recordAudit(req, {
        action: 'CREATE',
        module: 'Application Screening',
        details: `Received PD Life application ${application.id} (${application.payor}) from paramountdirect.com`,
      });
    } catch (err) {
      // The application above is already saved and is the real result the
      // website cares about - a logging hiccup here must never turn a
      // successful ingest into a failure response back to it.
      console.error('Failed to record audit log for ingested PD Life application', application.id, err);
    }

    res.status(201).json({ id: application.id });
  })
);

export default router;
