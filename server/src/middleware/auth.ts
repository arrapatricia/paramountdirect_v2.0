import type { NextFunction, Request, Response } from 'express';
import { verifyAuthToken, type AuthTokenPayload } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = header.slice('Bearer '.length);
  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// For server-to-server ingestion (a public product website pushing a
// submitted application here) rather than a logged-in admin user - a static
// shared key instead of a JWT, since there's no user session on the other
// end to issue one to. Populates req.user with a synthetic identity so
// recordAudit() still shows something meaningful instead of "Unknown".
//
// One key per product+site, not one key shared across all of them: these
// are four separate external codebases/teams (paramountdirect.com,
// ofwinsurance.ph, ctpl.ph, yourtravelinsurance.ph), so a leak or rotation
// on one must never affect the others.
export function requireServiceApiKey(envVarName: string, sourceLabel: string, product: string) {
  return function (req: Request, res: Response, next: NextFunction) {
    const expected = process.env[envVarName];
    if (!expected) {
      return res.status(503).json({ error: `Website ingest is not configured (${envVarName} unset)` });
    }
    if (req.headers['x-api-key'] !== expected) {
      return res.status(401).json({ error: 'Invalid or missing API key' });
    }
    // No `sub` - there's no real User row for this identity, and
    // AuditLog.userId is a nullable FK precisely so this resolves to NULL
    // there instead of violating the constraint.
    req.user = { email: `${sourceLabel} (website)`, role: 'System', assignedProducts: [product] };
    next();
  };
}

// Restricts a route to users whose role's productScope is one of `products`.
// Relies on requireAuth having already populated req.user.
export function requireProduct(...products: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const allowed = req.user.assignedProducts.some((p) => products.includes(p));
    if (!allowed) return res.status(403).json({ error: 'Not authorized for this product line' });
    next();
  };
}
