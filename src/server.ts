import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectWithFallback } from './config/db.js';
import routes from './routes/index.js';
import { sendComplaint } from './controllers/complaintController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration supporting Vite and CRA development ports
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5001',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logging Middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Direct top-level route support for /api/send-complaint (matching waniah321/green-guard frontend)
app.post('/api/send-complaint', sendComplaint);

// Mount main /api router
app.use('/api', routes);

// Root & Health Check Endpoints
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    service: 'GreenGuard 2.0 Backend & ML Engine',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      reports: '/api/reports',
      analysis: '/api/reports/analyze',
      news: '/api/news',
      community: '/api/community',
      complaints: '/api/send-complaint'
    }
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

// Start Server & Sync Database
async function startServer() {
  try {
    const db = await connectWithFallback();
    await db.sync({ alter: true });
    console.log('🌲 [Database] All database models synchronized successfully.');

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 GreenGuard 2.0 Backend Server Running`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🌲 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });
  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

export default app;
