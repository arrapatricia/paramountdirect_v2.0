import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../utils/password';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import { emailNewAccount, emailNewAccountSafe, generateTemporaryPassword } from '../services/accountEmail';

const router = Router();
router.use(requireAuth);

const userInclude = {
  role: { select: { id: true, name: true, productScope: true } },
  branch: { select: { id: true, city: true } },
} as const;

function serializeUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

// One account per mailbox. The DB's unique index is case-sensitive, so
// Juan@x.com and juan@x.com would both get through it - check without case.
async function assertEmailAvailable(email: string, exceptUserId?: string) {
  const clash = await prisma.user.findFirst({
    where: {
      email: { equals: email.trim(), mode: 'insensitive' },
      ...(exceptUserId ? { NOT: { id: exceptUserId } } : {}),
    },
    select: { id: true },
  });
  if (clash) throw new HttpError(409, 'A user with this email address already exists');
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const product = typeof req.query.product === 'string' ? req.query.product : undefined;
    const users = await prisma.user.findMany({
      where: product ? { assignedProducts: { has: product } } : undefined,
      include: userInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(users.map(serializeUser));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: userInclude });
    if (!user) throw new HttpError(404, 'User not found');
    res.json(serializeUser(user));
  })
);

const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  // Optional on create: omitted -> the server generates a temporary password
  // and emails it ("Login Credentials"). Still required-by-length when given.
  password: z.string().min(8).optional(),
  roleId: z.string().optional(),
  branchId: z.string().optional(),
  assignedProducts: z.array(z.enum(['PD Life', 'OFW', 'CTPL', 'GTP'])).default([]),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createUserSchema.parse(req.body);
    await assertEmailAvailable(data.email);
    const temporaryPassword = data.password ?? generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        mustChangePassword: true,
        roleId: data.roleId,
        branchId: data.branchId,
        assignedProducts: data.assignedProducts,
        status: data.status,
      },
      include: userInclude,
    });

    await recordAudit(req, { action: 'CREATE', module: 'User Management', details: `Created user ${user.email}` });
    // "Login Credentials" email; the account exists either way, so a mail
    // failure is reported back (the UI warns the admin) instead of failing the create.
    const welcomeEmailSent = await emailNewAccountSafe(user, temporaryPassword);
    res.status(201).json({ ...serializeUser(user), welcomeEmailSent });
  })
);

const updateUserSchema = createUserSchema.omit({ password: true }).partial().extend({
  password: z.string().min(8).optional(),
});

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateUserSchema.parse(req.body);
    const { password, ...rest } = data;
    if (data.email) await assertEmailAvailable(data.email, req.params.id);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        // An admin-set password is a temporary one - force a change at next
        // login, unless someone is resetting their own.
        ...(password
          ? { passwordHash: await hashPassword(password), mustChangePassword: req.user?.sub !== req.params.id }
          : {}),
      },
      include: userInclude,
    });

    await recordAudit(req, { action: 'UPDATE', module: 'User Management', details: `Updated user ${user.email}` });
    res.json(serializeUser(user));
  })
);

// Emails a fresh temporary password to an existing user - e.g. after their
// email address was corrected, or when the first message never arrived. Only
// the hash is stored, so the original password can't be re-sent: a new one
// replaces it, and the user must change it at first login.
router.post(
  '/:id/resend-credentials',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: userInclude });
    if (!user) throw new HttpError(404, 'User not found');
    if (user.id === req.user?.sub) throw new HttpError(400, 'You cannot resend credentials to your own account');
    if (user.status === 'Inactive') throw new HttpError(400, 'This account is inactive. Activate it before sending credentials.');

    const temporaryPassword = generateTemporaryPassword();
    // Email first, save second: if the mail fails, their current password keeps working.
    try {
      await emailNewAccount(user, temporaryPassword, { resend: true });
    } catch (err) {
      console.error(`[mailer] resend credentials failed for ${user.email}:`, err instanceof Error ? err.message : err);
      throw new HttpError(502, 'The credentials email could not be sent. Please try again.');
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true },
    });
    await recordAudit(req, { action: 'UPDATE', module: 'User Management', details: `Resent login credentials to ${user.email}` });
    res.json({ sent: true, email: user.email });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.delete({ where: { id: req.params.id } });
    await recordAudit(req, { action: 'DELETE', module: 'User Management', details: `Deleted user ${user.email}` });
    res.status(204).end();
  })
);

export default router;
