import jwt, { type SignOptions } from 'jsonwebtoken';

export interface AuthTokenPayload {
  // Real User.id for a logged-in admin (requireAuth). Absent for a
  // service-to-service identity (requireServiceApiKey) - there's no User
  // row for those, and AuditLog.userId is a nullable FK precisely so
  // recordAudit() can store NULL instead of a value that would violate it.
  sub?: string;
  email: string;
  role: string | null;
  assignedProducts: string[];
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '8h') as SignOptions['expiresIn'];
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, getSecret()) as AuthTokenPayload;
}
