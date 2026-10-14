import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ZodError, type ZodSchema } from 'zod';

export const COOKIE_NAME = 'km_token';

export interface AuthedRequest extends Request {
  userId?: string;
}

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = req.cookies?.[COOKIE_NAME] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return res.status(401).json({ error: 'UNAUTHENTICATED' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };

export class HttpError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

// Wrap async handlers so thrown errors reach the error middleware
export const ah =
  <T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: T, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: err.issues });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.code });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ error: `${field.toUpperCase()}_TAKEN` });
  }
  if (err?.name === 'CastError') {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'INTERNAL_ERROR' });
}
