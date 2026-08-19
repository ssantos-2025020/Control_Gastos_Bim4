import type { SignOptions } from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET ?? 'control-gastos-secret-dev';

export const JWT_SIGN_OPTIONS: SignOptions = {
  expiresIn: '20s',
};