import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { prisma } from '@vms/database';

// Import routers
import authRouter from './routes/auth';
import visitorsRouter from './routes/visitors';
import visitsRouter from './routes/visits';
import employeesRouter from './routes/employees';
import analyticsRouter from './routes/analytics';

// Load environment variables
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend applications
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Register api v1 routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/visitors', visitorsRouter);
app.use('/api/v1/visits', visitsRouter);
app.use('/api/v1/employees', employeesRouter);
app.use('/api/v1/analytics', analyticsRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred on the server'
    }
  });
});

// Start Background Notification Dispatcher Simulation
// Polling the database every 10 seconds to dispatch queued messages
let dbConnectionWarningShown = false;

async function startNotificationDispatcher() {
  setInterval(async () => {
    try {
      const queued = await prisma.notification.findMany({
        where: { status: 'Queued' },
        take: 10
      });

      if (queued.length > 0) {
        console.log(`[Notification Engine] Found ${queued.length} queued alerts. Sending...`);
        for (const note of queued) {
          // Simulate email/SMS transmission delay
          console.log(`\n--- DISPATCHING NOTIFICATION (${note.channel}) ---`);
          console.log(`To Recipient: ${note.recipientVisitorId || note.recipientUserId || 'System Broadcast'}`);
          console.log(`Message: "${note.message}"`);
          console.log(`-----------------------------------------------\n`);

          // Update DB record to Sent
          await prisma.notification.update({
            where: { id: note.id },
            data: {
              status: 'Sent',
              sentAt: new Date()
            }
          });
        }
      }
    } catch (error: any) {
      if (error.message && (error.message.includes('DATABASE_URL') || error.message.includes('Environment variable not found') || error.message.includes('PrismaClientInitializationError'))) {
        if (!dbConnectionWarningShown) {
          console.warn('\n⚠️  [Notification Engine]: DATABASE_URL is not set or is incorrect in .env. Notification dispatching is suspended.\n');
          dbConnectionWarningShown = true;
        }
      } else {
        console.error('[Notification Engine Error]:', error);
      }
    }
  }, 10000);
}

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  VMS API Server running on http://localhost:${PORT}`);
  console.log(`  Mode: Development`);
  console.log(`==================================================`);
  startNotificationDispatcher();
});
