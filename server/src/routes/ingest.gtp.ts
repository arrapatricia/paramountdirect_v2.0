// Receiving end of the yourtravelinsurance.ph -> admin system integration,
// mirroring ingest.pdlife.ts's paramountdirect.com contract: that site's own
// backend calls this right after a GTP application is saved on its end, so
// it shows up in GTP Applications here without anyone re-keying it.
// Authenticated by the same shared API key as every other product's ingest
// route (requireServiceApiKey) - there's no logged-in user on the other end.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { requireServiceApiKey } from '../middleware/auth';
import { recordAudit } from '../utils/audit';

const router = Router();
router.use(requireServiceApiKey('WEBSITE_INGEST_API_KEY_GTP', 'yourtravelinsurance.ph', 'GTP'));

const ingestSchema = z.object({
  travelType: z.enum(['International', 'Domestic']),
  destinations: z.array(z.string()).default([]),
  departureDate: z.coerce.date(),
  returnDate: z.coerce.date(),
  daysOfTravel: z.number().int(),
  applicationType: z.enum(['Individual', 'Family']),

  travelerFirstName: z.string().min(1),
  travelerSurname: z.string().min(1),
  birthdate: z.coerce.date(),
  email: z.string().email(),
  mobileNumber: z.string().min(1),

  planVariant: z.enum(['Single_Trip', 'Multi_Trip_90', 'Multi_Trip_180']),
  cruiseCoverage: z.boolean().default(false),
  hazardousSportsCoverage: z.boolean().default(false),
  isSchengenDestination: z.boolean().default(false),

  // Plain numeric string (no currency sign), same convention as every other
  // application's premium field in this system.
  premium: z.string().min(1),
  dateReceived: z.coerce.date(),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = ingestSchema.parse(req.body);

    const application = await prisma.gtpApplication.create({
      data: { ...data, status: 'Received' },
    });

    try {
      await recordAudit(req, {
        action: 'CREATE',
        module: 'GTP Applications',
        details: `Received GTP application ${application.id} (${application.travelerSurname}) from yourtravelinsurance.ph`,
      });
    } catch (err) {
      // The application above is already saved and is the real result the
      // website cares about - a logging hiccup here must never turn a
      // successful ingest into a failure response back to it.
      console.error('Failed to record audit log for ingested GTP application', application.id, err);
    }

    res.status(201).json({ id: application.id });
  })
);

export default router;
