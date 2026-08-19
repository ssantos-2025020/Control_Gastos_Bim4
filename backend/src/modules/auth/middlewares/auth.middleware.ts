import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayloadDTO } from '../models/auth.model';
import { JWT_SECRET } from '../../../config/jwt';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayloadDTO;
}

/**
 * Middleware que valida el token Bearer y adjunta el payload
 * al request en `req.user`. Traduce fallos a HTTP 401.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token no proporcionado.' });
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayloadDTO;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
  }
}
