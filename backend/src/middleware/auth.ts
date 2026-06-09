import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import { UserRole } from '@prisma/client';
import { AppError } from './errorHandler';

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new AppError('No token provided', 401);

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  req.user = payload;
  req.tenantId = payload.tenantId || undefined;
  next();
};

export const requireSuperAdmin = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.SUPERADMIN) {
    throw new AppError('Superadmin access required', 403);
  }
  next();
};

export const requireTenantAdmin = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const allowed: UserRole[] = [UserRole.TENANT_ADMIN, UserRole.ADMIN];
  if (!req.user || !allowed.includes(req.user.role)) {
    throw new AppError('Admin access required', 403);
  }
  next();
};

export const requireAuth = (roles?: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    authenticate(req, res, (err) => {
      if (err) return next(err);
      if (roles && req.user && !roles.includes(req.user.role)) {
        return next(new AppError('Insufficient permissions', 403));
      }
      next();
    });
  };
