import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Bucket, s3Client } from '../lib/s3';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { sendMail } from '../lib/mailer';
import type { GeneratedDocument } from '@prisma/client';

// "Send to Client" for the non-life products (OFW / CTPL / GTP). Sender
// addresses and subjects follow the legacy Rails mailers (CtplMailer,
// OfwMailer, GtpMailer) so clients see the same emails they always have.

const SENDER: Record<string, string> = {
  OFW: 'Paramount OFW <ofwinsurance@paramount.com.ph>',
  CTPL: '"Paramount Direct" <direct@paramount.com.ph>',
  GTP: 'Paramount GTPP <globaltravelprotectpremium@paramount.com.ph>',
};

// GTP/CTPL also copy the desk mailbox, as in the legacy mailers.
const DEFAULT_CC: Record<string, string[]> = { GTP: ['gtp@paramount.com.ph'] };

interface DocEmailSpec {
  subject: string;
  /** e.g. "your Certificate of Insurance" - slots into the body copy. */
  noun: string;
  filename: string;
}

const DOC_SPECS: Record<string, DocEmailSpec> = {
  'ofw-coi': { subject: 'Your OFW Certificate of Insurance', noun: 'Certificate of Insurance', filename: 'certificate_of_insurance.pdf' },
  'ofw-service-invoice': { subject: 'Thank You For Choosing PLGIC!', noun: 'Service Invoice', filename: 'service_invoice.pdf' },
  'ctpl-coc': { subject: 'Your Paramount CTPL Insurance Policy', noun: 'Certificate of Cover', filename: 'certificate_of_cover.pdf' },
  'ctpl-policy-jacket': { subject: 'Your Paramount CTPL Insurance Policy', noun: 'Policy Jacket', filename: 'policy_jacket.pdf' },
  'ctpl-policy-schedule': { subject: 'Your Paramount CTPL Insurance Policy', noun: 'Policy Schedule', filename: 'policy_schedule.pdf' },
  'ctpl-service-invoice': { subject: 'Your Paramount CTPL Service Invoice', noun: 'Service Invoice', filename: 'service_invoice.pdf' },
  'ctpl-endorsement': { subject: 'Your CTPL Endorsement', noun: 'Endorsement', filename: 'endorsement.pdf' },
  'ctpl-endorsement-service-invoice': { subject: 'Your CTPL Endorsement Service Invoice', noun: 'Service Invoice', filename: 'service_invoice.pdf' },
  'ctpl-credit-memo': { subject: 'Your CTPL Credit Memo', noun: 'Credit Memo', filename: 'credit_memo.pdf' },
  'gtp-service-invoice': { subject: 'Your Global Travel Protect Premium Insurance Service Invoice', noun: 'Service Invoice', filename: 'service_invoice.pdf' },
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

async function findRecipient(doc: GeneratedDocument): Promise<{ email: string; name: string }> {
  switch (doc.applicationType) {
    case 'OFW': {
      const a = await prisma.ofwApplication.findUnique({ where: { id: doc.applicationId }, select: { email: true, firstName: true } });
      if (a) return { email: a.email, name: a.firstName };
      break;
    }
    case 'CTPL': {
      const a = await prisma.ctplApplication.findUnique({ where: { id: doc.applicationId }, select: { email: true, ownerFirstName: true } });
      if (a) return { email: a.email, name: a.ownerFirstName };
      break;
    }
    case 'GTP': {
      const a = await prisma.gtpApplication.findUnique({ where: { id: doc.applicationId }, select: { email: true, travelerFirstName: true } });
      if (a) return { email: a.email, name: a.travelerFirstName };
      break;
    }
  }
  throw new HttpError(404, 'Application not found for this document');
}

async function readStoredPdf(s3Key: string): Promise<Buffer> {
  const res = await s3Client.send(new GetObjectCommand({ Bucket: s3Bucket, Key: s3Key }));
  if (!res.Body) throw new HttpError(502, 'Stored document is empty');
  return Buffer.from(await res.Body.transformToByteArray());
}

export async function emailGeneratedDocument(doc: GeneratedDocument): Promise<{ to: string; messageId: string }> {
  const spec = DOC_SPECS[doc.docKey];
  if (!spec) throw new HttpError(400, `Emailing "${doc.docKey}" is not supported`);
  const { email, name } = await findRecipient(doc);
  if (!email) throw new HttpError(400, 'The application has no client email address');

  const pdf = await readStoredPdf(doc.s3Key);
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222">
<p>Dear ${esc(name)},</p>
<p>Thank you for choosing Paramount. Please find your ${esc(spec.noun)} attached to this email.</p>
<p>If you have any questions, just reply to this email and our team will be glad to help.</p>
<p>Best regards,<br>Paramount Life &amp; General Insurance Corporation</p>
</div>`;

  const { messageId } = await sendMail({
    from: SENDER[doc.applicationType],
    to: email,
    cc: DEFAULT_CC[doc.applicationType],
    subject: spec.subject,
    html,
    attachments: [{ filename: spec.filename, content: pdf, contentType: doc.contentType }],
  });
  return { to: email, messageId };
}
