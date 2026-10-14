import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { User, toPublicUser } from '../models/User.js';
import {
  ah, validate, signToken, setAuthCookie, requireAuth, HttpError, COOKIE_NAME,
  type AuthedRequest,
} from '../middleware.js';
import { seedMapsForUser } from '../seed/seedUser.js';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  password: z.string().min(6).max(200),
  language: z.enum(['mn', 'en']).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  ah(async (req, res) => {
    const { name, email, password, language } = req.body as z.infer<typeof registerSchema>;
    const exists = await User.exists({ email: email.toLowerCase() });
    if (exists) throw new HttpError(409, 'EMAIL_TAKEN');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      preferences: { theme: 'light', language: language ?? 'mn' },
    });

    await seedMapsForUser(user._id);

    setAuthCookie(res, signToken(user._id.toString()));
    res.status(201).json({ user: toPublicUser(user) });
  })
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  ah(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, 'INVALID_CREDENTIALS');
    }
    setAuthCookie(res, signToken(user._id.toString()));
    res.json({ user: toPublicUser(user) });
  })
);

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get(
  '/me',
  requireAuth,
  ah(async (req: AuthedRequest, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, 'UNAUTHENTICATED');
    res.json({ user: toPublicUser(user) });
  })
);

export default router;
