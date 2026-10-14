import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { connectDB } from './db.js';
import { errorHandler } from './middleware.js';
import authRoutes from './routes/auth.js';
import userRoutes, { UPLOAD_DIR } from './routes/users.js';
import mapRoutes from './routes/maps.js';

const PORT = Number(process.env.PORT || 4000);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/knowmap';
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',');

if (!process.env.JWT_SECRET) {
  console.error('[config] JWT_SECRET is missing. Copy server/.env.example to server/.env');
  process.exit(1);
}

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));
app.use(errorHandler);

connectDB(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`[server] Know map API → http://localhost:${PORT}/api`));
  })
  .catch((err) => {
    console.error('[db] Could not connect to MongoDB:', err.message);
    console.error('     Start it with:  sudo systemctl start mongod');
    process.exit(1);
  });
