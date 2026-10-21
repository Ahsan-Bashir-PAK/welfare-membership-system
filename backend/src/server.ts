import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { config } from './config/env.js';
import { testDbConnection } from './config/db.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible API proxying
  })
);

// CORS configuration
app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Membership, Payments, Welfare & Transfer Management System',
  });
});

// Main API Router
app.use('/api', apiRouter);

// Centralized error handler
app.use(errorHandler);

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = config.port;
  app.listen(PORT, async () => {
    console.log(`=======================================================`);
    console.log(` Institutional Management Backend Service Running`);
    console.log(` Port: ${PORT} | Mode: ${config.nodeEnv}`);
    console.log(` Database: ${config.db.name}@${config.db.host}:${config.db.port}`);
    console.log(`=======================================================`);

    const isConnected = await testDbConnection();
    if (isConnected) {
      console.log(' [DB] Connected to MySQL successfully.');
    } else {
      console.error(' [DB] WARNING: Could not establish MySQL connection.');
    }
  });
}
