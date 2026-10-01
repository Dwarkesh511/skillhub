import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';

import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const CLIENT_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  CLIENT_URL
];

// CORS Middleware Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests, curl, or node test scripts (no origin header)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin) ||
      (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) ||
      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL);

    if (isAllowed || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`CORS error: Origin ${origin} not allowed`));
    }
  },
  credentials: true
}));

// Request Body & Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/certificates', certificateRoutes);

// 404 Not Found Middleware
app.use(notFoundHandler);

// Global Error Handler Middleware
app.use(errorHandler);

// Start Express Server conditionally if not imported for testing
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 SkillHub Backend running on http://${HOST}:${PORT}`);
    console.log(`🏥 Health Check URL: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Configured Client Origin: ${CLIENT_URL}`);
  });
}

export default app;
