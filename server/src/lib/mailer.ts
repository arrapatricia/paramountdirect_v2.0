import nodemailer, { type Transporter } from 'nodemailer';
import type { Attachment } from 'nodemailer/lib/mailer';

// ZeptoMail SMTP wrapper. Mirrors the legacy Rails mailers' behaviour:
// - "[TEST ENV] " subject prefix outside production
// - MAIL_REDIRECT_TO reroutes everything to a dev inbox (legacy StagingEmailInterceptor)
// - attachments over 15 MB are dropped (legacy VVIP guard) - mail servers reject larger.

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

export type MailAddress = string | string[];

export interface SendMailInput {
  to: MailAddress;
  cc?: MailAddress;
  bcc?: MailAddress;
  from?: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error('Email is not configured: set SMTP_HOST, SMTP_USER and SMTP_PASS');
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

const list = (a?: MailAddress): string[] => (a === undefined ? [] : Array.isArray(a) ? a : a.split(','))
  .map((s) => s.trim())
  .filter(Boolean);

const isProd = () => process.env.NODE_ENV === 'production';

export async function sendMail(input: SendMailInput): Promise<{ messageId: string }> {
  let to = list(input.to);
  let cc = list(input.cc);
  let bcc = list(input.bcc);
  let subject = input.subject;

  if (!isProd()) subject = `[TEST ENV] ${subject}`;

  const redirect = list(process.env.MAIL_REDIRECT_TO);
  if (redirect.length) {
    subject = `${subject} [to: ${to.join(', ')} | cc: ${cc.join(', ')} | bcc: ${bcc.join(', ')}]`;
    to = redirect;
    cc = [];
    bcc = [];
  }
  if (!to.length) throw new Error('sendMail: no recipients');

  const attachments = (input.attachments ?? []).filter((a) => {
    const size = Buffer.isBuffer(a.content) ? a.content.length : 0;
    if (size > MAX_ATTACHMENT_BYTES) {
      console.error(`[mailer] dropping attachment ${a.filename} (${size} bytes > 15 MB)`);
      return false;
    }
    return true;
  });

  const info = await getTransporter().sendMail({
    from: input.from ?? process.env.MAIL_DEFAULT_FROM,
    to,
    cc: cc.length ? cc : undefined,
    bcc: bcc.length ? bcc : undefined,
    subject,
    html: input.html,
    attachments,
  });
  return { messageId: info.messageId };
}

/** Fire-and-forget: log failures instead of breaking the API request that triggered the email. */
export function sendMailSafe(input: SendMailInput): void {
  sendMail(input).catch((err) => console.error('[mailer] send failed:', err instanceof Error ? err.message : err));
}
