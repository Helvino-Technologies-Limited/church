import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export const signAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY } as jwt.SignOptions);

export const signRefreshToken = (payload: JwtPayload): string =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY } as jwt.SignOptions);

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, ACCESS_SECRET) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, REFRESH_SECRET) as JwtPayload;

export const refreshExpiryMs = (): number =>
  7 * 24 * 60 * 60 * 1000;
