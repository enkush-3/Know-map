import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';
import { User, toPublicUser } from '../models/User.js';
import { MapModel } from '../models/index.js';
import { ah, validate, requireAuth, HttpError, COOKIE_NAME, type AuthedRequest } from '../middleware.js';
import { deleteMapCascade } from '../services/mapService.js';

const router = Router();
router.use(requireAuth);

export const UPLOAD_DIR = path.resolve('uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      cb(null, `avatar-${(req as AuthedRequest).userId}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)),
});

const profileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,40}$/)
    .or(z.literal(''))
    .optional(),
  bio: z.string().max(500).optional(),
  email: z.string().trim().email().optional(),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      language: z.enum(['mn', 'en']).optional(),
    })
    .optional(),
});

router.patch(
  '/me',
  validate(profileSchema),
  ah(async (req: AuthedRequest, res) => {
    const body = req.body as z.infer<typeof profileSchema>;
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, 'NOT_FOUND');

    if (body.name !== undefined) user.name = body.name;
    if (body.bio !== undefined) user.bio = body.bio;
    if (body.email !== undefined) user.email = body.email;
    if (body.avatarColor !== undefined) user.avatarColor = body.avatarColor;
    if (body.username !== undefined) user.username = body.username === '' ? undefined : body.username;
    if (body.preferences?.theme) user.preferences!.theme = body.preferences.theme;
    if (body.preferences?.language) user.preferences!.language = body.preferences.language;

    await user.save();
    res.json({ user: toPublicUser(user) });
  })
);

router.post(
  '/me/avatar',
  upload.single('avatar'),
  ah(async (req: AuthedRequest, res) => {
    if (!req.file) throw new HttpError(400, 'INVALID_FILE');
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, 'NOT_FOUND');

    // remove previous file
    if (user.avatarUrl?.startsWith('/uploads/')) {
      fs.rm(path.join(UPLOAD_DIR, path.basename(user.avatarUrl)), { force: true }, () => {});
    }
    user.avatarUrl = `/uploads/${req.file.filename}`;
    await user.save();
    res.json({ user: toPublicUser(user) });
  })
);

router.delete(
  '/me/avatar',
  ah(async (req: AuthedRequest, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, 'NOT_FOUND');
    if (user.avatarUrl?.startsWith('/uploads/')) {
      fs.rm(path.join(UPLOAD_DIR, path.basename(user.avatarUrl)), { force: true }, () => {});
    }
    user.avatarUrl = '';
    await user.save();
    res.json({ user: toPublicUser(user) });
  })
);

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(200),
});

router.patch(
  '/me/password',
  validate(passwordSchema),
  ah(async (req: AuthedRequest, res) => {
    const { currentPassword, newPassword } = req.body as z.infer<typeof passwordSchema>;
    const user = await User.findById(req.userId).select('+passwordHash');
    if (!user) throw new HttpError(404, 'NOT_FOUND');
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new HttpError(400, 'WRONG_PASSWORD');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ ok: true });
  })
);

const deleteSchema = z.object({ password: z.string().min(1) });

router.delete(
  '/me',
  validate(deleteSchema),
  ah(async (req: AuthedRequest, res) => {
    const user = await User.findById(req.userId).select('+passwordHash');
    if (!user) throw new HttpError(404, 'NOT_FOUND');
    if (!(await bcrypt.compare(req.body.password, user.passwordHash))) {
      throw new HttpError(400, 'WRONG_PASSWORD');
    }
    const maps = await MapModel.find({ ownerId: user._id }).select('_id').lean();
    for (const m of maps) await deleteMapCascade(m._id);
    if (user.avatarUrl?.startsWith('/uploads/')) {
      fs.rm(path.join(UPLOAD_DIR, path.basename(user.avatarUrl)), { force: true }, () => {});
    }
    await user.deleteOne();
    res.clearCookie(COOKIE_NAME);
    res.json({ ok: true });
  })
);

export default router;
