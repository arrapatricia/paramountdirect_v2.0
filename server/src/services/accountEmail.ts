import { randomInt } from 'crypto';
import { sendMail } from '../lib/mailer';

// "Paramount Direct System - Login Credentials": sent when an admin creates a
// user account. Layout copied from the legacy Rails CtplMailer email (red
// banner top and bottom, the two Paramount logos, department address,
// contact block). The system generates the temporary password and pastes it
// into the email; the user must replace it at first login (User.mustChangePassword).

const RED = '#d0112b';
const LOGO_PLGIC = 'https://plgic-production.s3.ap-southeast-1.amazonaws.com/PD+-+CTPL/PDnewsletterLogo-01.png';
const LOGO_PD = 'https://plgic-production.s3.ap-southeast-1.amazonaws.com/PD+-+CTPL/PDnewsletterLogo-02.png';
const ADDRESS = '11th Floor Sage House, 110 V.A. Rufino Street, Legaspi Village, Makati City 1229, Philippines';
const DEPARTMENT_EMAIL = 'direct@paramount.com.ph';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Where "Log in at ..." points. APP_URL overrides it per environment.
const DEFAULT_APP_URL = 'https://pd2-dev.paramount.com.ph';

function appUrl(): string {
  return `${(process.env.APP_URL?.trim() || DEFAULT_APP_URL).replace(/\/+$/, '')}/`;
}

// No 0/O, 1/l/I - the password is read off an email and typed in by hand.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';

/** 12 random characters (letters + digits, no symbols so a double-click selects all of it), at least one of each class. */
export function generateTemporaryPassword(length = 12): string {
  const pick = (set: string) => set[randomInt(set.length)];
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS)];
  const all = UPPER + LOWER + DIGITS;
  while (chars.length < length) chars.push(pick(all));
  // Fisher-Yates so the guaranteed characters aren't always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

const labelCell = 'background:#e6e6e6;border:1px solid #d6d6d6;padding:6px 4px;font-weight:bold;width:160px;';
const valueCell = 'border:1px solid #d6d6d6;padding:6px 4px;';

export function buildAccountEmailHtml(opts: { firstName: string; email: string; temporaryPassword: string; loginUrl: string; resend?: boolean }): string {
  const intro = opts.resend
    ? 'Here are your login details for the Paramount Direct System. Any password you were sent before no longer works.'
    : 'An account has been created for you on the Paramount Direct System. Your login details are shown below.';
  const redBanner = `<tr><td style="background:${RED};height:28px;line-height:28px;font-size:1px;">&nbsp;</td></tr>`;
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
${redBanner}
<tr><td align="center" style="padding:0 12px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:640px;max-width:100%;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;line-height:1.4;">
  <tr>
    <td valign="top" width="50%" style="padding:20px 0 0 0;"><img src="${LOGO_PLGIC}" alt="Paramount Life &amp; General Insurance" width="234" style="display:block;max-width:100%;height:auto;border:0;"></td>
    <td valign="top" width="50%" style="padding:20px 0 0 0;">
      <img src="${LOGO_PD}" alt="Paramount Direct" width="234" style="display:block;max-width:100%;height:auto;border:0;">
      <div style="font-size:12px;line-height:20px;padding-top:30px;">${esc(ADDRESS)}</div>
    </td>
  </tr>
  <tr><td colspan="2" style="padding:30px 0 0 0;">
    <p style="margin:0 0 20px 0;"><strong>Hi <span style="color:#ff0000;">${esc(opts.firstName)},</span></strong></p>
    <p style="margin:0 0 16px 0;">${intro}</p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 16px 0;font-size:14px;">
      <tr><td style="${labelCell}">Email Address</td><td style="${valueCell}">${esc(opts.email)}</td></tr>
      <tr><td style="${labelCell}">Password</td><td style="${valueCell}"><span style="font-family:Consolas,'Courier New',monospace;font-weight:bold;letter-spacing:0.5px;">${esc(opts.temporaryPassword)}</span></td></tr>
    </table>
    <p style="margin:0 0 16px 0;">This is a temporary password. You will be asked to replace it with a permanent password the first time you log in.</p>
    <p style="margin:0 0 16px 0;">Log in at <a href="${esc(opts.loginUrl)}" style="color:${RED};">${esc(opts.loginUrl)}</a>.</p>
    <p style="margin:0 0 30px 0;">Should you have any questions or need additional assistance, please feel free to contact us.</p>
    <p style="margin:0 0 6px 0;">Best Regards,</p>
    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-size:14px;margin:0 0 20px 0;">
      <tr><td colspan="2" style="padding:8px 0 4px 0;"><strong>Paramount Direct Team</strong></td></tr>
      <tr><td style="padding:1px 0;">Landline</td><td style="padding:1px 0 1px 6px;">: (02) 8539 5200</td></tr>
      <tr><td style="padding:1px 0;">Globe</td><td style="padding:1px 0 1px 6px;">: (0917) 558 3969</td></tr>
      <tr><td style="padding:1px 0;">Smart</td><td style="padding:1px 0 1px 6px;">: (0998) 842 1957</td></tr>
      <tr><td style="padding:1px 0;">Email:</td><td style="padding:1px 0 1px 6px;">: <a href="mailto:${DEPARTMENT_EMAIL}" style="color:#0b6e99;">${DEPARTMENT_EMAIL}</a></td></tr>
    </table>
    <p style="margin:0 0 24px 0;font-size:10px;color:#444;">This is a system-generated email. Please do not reply.</p>
  </td></tr>
</table>
</td></tr>
${redBanner}
</table>
</body></html>`;
}

export async function emailNewAccount(user: { firstName: string; email: string }, temporaryPassword: string, opts: { resend?: boolean } = {}): Promise<void> {
  await sendMail({
    from: `"Paramount Direct" <${DEPARTMENT_EMAIL}>`,
    to: user.email,
    subject: 'Paramount Direct System - Login Credentials',
    html: buildAccountEmailHtml({ firstName: user.firstName, email: user.email, temporaryPassword, loginUrl: appUrl(), resend: opts.resend }),
  });
}

/** Best-effort: the account already exists, so a mail failure is logged and reported to the caller, never thrown. */
export async function emailNewAccountSafe(user: { firstName: string; email: string }, temporaryPassword: string): Promise<boolean> {
  try {
    await emailNewAccount(user, temporaryPassword);
    return true;
  } catch (err) {
    console.error(`[mailer] new-account email failed for ${user.email}:`, err instanceof Error ? err.message : err);
    return false;
  }
}
