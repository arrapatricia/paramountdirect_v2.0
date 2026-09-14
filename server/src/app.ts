import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import roleRoutes from './routes/roles';
import branchRoutes from './routes/branches';
import pdLifeApplicationRoutes from './routes/applications.pdlife';
import ofwApplicationRoutes from './routes/applications.ofw';
import ctplApplicationRoutes from './routes/applications.ctpl';
import gtpApplicationRoutes from './routes/applications.gtp';
import paymentRoutes from './routes/payments';
import auditLogRoutes from './routes/auditLogs';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim());
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/roles', roleRoutes);
  app.use('/api/branches', branchRoutes);
  app.use('/api/applications/pd-life', pdLifeApplicationRoutes);
  app.use('/api/applications/ofw', ofwApplicationRoutes);
  app.use('/api/applications/ctpl', ctplApplicationRoutes);
  app.use('/api/applications/gtp', gtpApplicationRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/audit-logs', auditLogRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(errorHandler);

  return app;
}
