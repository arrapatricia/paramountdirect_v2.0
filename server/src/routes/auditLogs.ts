import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// Read-only: audit log rows are only ever written internally via
// recordAudit(), never directly by API clients.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const module = typeof req.query.module === 'string' ? req.query.module : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(module ? { module } : {}),
        ...(search
          ? {
              OR: [
                { userLabel: { contains: search, mode: 'insensitive' } },
                { action: { contains: search, mode: 'insensitive' } },
                { details: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { timestamp: 'desc' },
    });
    res.json(logs);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const log = await prisma.auditLog.findUnique({ where: { id: req.params.id } });
    if (!log) throw new HttpError(404, 'Audit log not found');
    res.json(log);
  })
);

export default router;
