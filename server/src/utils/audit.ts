import type { Request } from 'express';
import { prisma } from '../lib/prisma';

// Writes one audit-log row. Fire-and-forget by design (callers `void` this)
// so a logging hiccup never blocks the actual request.
export async function recordAudit(
  req: Request,
  params: { action: string; module: string; details: string }
) {
  const user = req.user;
  await prisma.auditLog.create({
    data: {
      userId: user?.sub,
      userLabel: user?.email ?? 'Unknown',
      role: user?.role ?? 'Unknown',
      action: params.action,
      module: params.module,
      details: params.details,
      ipAddress: req.ip ?? 'unknown',
    },
  });
}
