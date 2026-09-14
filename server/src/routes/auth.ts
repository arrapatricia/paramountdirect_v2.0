import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { verifyPassword } from '../utils/password';
import { signAuthToken } from '../utils/jwt';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../utils/audit';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function serializeUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  assignedProducts: string[];
  lastLoginAt: Date | null;
  role: { id: string; name: string; productScope: string } | null;
  branch: { id: string; city: string } | null;
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    status: user.status,
    assignedProducts: user.assignedProducts,
    lastLoginAt: user.lastLoginAt,
    role: user.role,
    branch: user.branch,
  };
}

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: { select: { id: true, name: true, productScope: true } }, branch: { select: { id: true, city: true } } },
    });

    if (!user) throw new HttpError(401, 'Invalid email or password');
    if (user.status === 'Inactive') throw new HttpError(403, 'This account is inactive');

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) throw new HttpError(401, 'Invalid email or password');

    const token = signAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role?.name ?? null,
      assignedProducts: user.assignedProducts,
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    res.json({ token, user: serializeUser(user) });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: { role: { select: { id: true, name: true, productScope: true } }, branch: { select: { id: true, city: true } } },
    });
    if (!user) throw new HttpError(404, 'User not found');
    res.json(serializeUser(user));
  })
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    // JWTs are stateless here, so "logout" is just an audit trail entry -
    // the frontend is responsible for discarding the token.
    await recordAudit(req, { action: 'LOGOUT', module: 'Auth', details: 'User logged out' });
    res.status(204).end();
  })
);

export default router;
