// Receiving end of the ofwinsurance.ph -> admin system integration, mirroring
// ingest.pdlife.ts's paramountdirect.com contract: that site's own backend
// calls this right after an OFW application is saved on its end, so it shows
// up in OFW Applications here without anyone re-keying it. Authenticated by
// the same shared API key as every other product's ingest route
// (requireServiceApiKey) - there's no logged-in user on the other end.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { requireServiceApiKey } from '../middleware/auth';
import { recordAudit } from '../utils/audit';

const router = Router();
router.use(requireServiceApiKey);

const ingestSchema = z.object({
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

  // Plain numeric string (no currency sign), same convention as every other
  // application's premium field in this system.
  premium: z.string().min(1),
  dateReceived: z.coerce.date(),

  // At least one required, up to three.
  beneficiaries: z
    .array(z.object({ fullName: z.string().min(1), relationship: z.string().min(1), birthdate: z.coerce.date() }))
    .default([]),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { beneficiaries, ...data } = ingestSchema.parse(req.body);

    const application = await prisma.ofwApplication.create({
      data: { ...data, status: 'Received', beneficiaries: { create: beneficiaries } },
    });

    try {
      await recordAudit(req, {
        action: 'CREATE',
        module: 'OFW Applications',
        details: `Received OFW application ${application.id} (${application.lastName}, ${application.firstName}) from ofwinsurance.ph`,
      });
    } catch (err) {
      // The application above is already saved and is the real result the
      // website cares about - a logging hiccup here must never turn a
      // successful ingest into a failure response back to it.
      console.error('Failed to record audit log for ingested OFW application', application.id, err);
    }

    res.status(201).json({ id: application.id });
  })
);

export default router;
