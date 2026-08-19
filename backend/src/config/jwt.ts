import type { SignOptions } from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET ?? 'control-gastos-secret-dev';

export const JWT_SIGN_OPTIONS: SignOptions = {
  expiresIn: (process.env.JWT_EXPIRES_IN ?? '3h') as SignOptions['expiresIn'],
};