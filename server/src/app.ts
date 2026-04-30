import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { initDB } from './config/database';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import plansRoutes from './routes/plans';
import tasksRoutes from './routes/tasks';
import progressRoutes from './routes/progress';
import analyticsRoutes from './routes/analytics';

// Start SQLite
initDB();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000'
  ],
  credentials: true,
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));

app.use(express.json());
app.use(cookieParser());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/analytics', analyticsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
