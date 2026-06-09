import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import { UserRole } from '@prisma/client';
import { AppError } from './errorHandler';
import prisma from '../config/database';

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

export const checkTenantActive = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.tenantId) return next();
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { status: true, trialEndsAt: true },
    });
    if (!tenant) return next(new AppError('Tenant not found', 404));

    if (tenant.status === 'TRIAL' && tenant.trialEndsAt && tenant.trialEndsAt < new Date()) {
      return next(new AppError('Trial expired. Pay KES 50,000 via Paybill 522533, Account 8071524 to activate.', 403));
    }
    if (tenant.status === 'SUSPENDED') {
      return next(new AppError('Account suspended. Contact support.', 403));
    }
    if (tenant.status === 'EXPIRED') {
      return next(new AppError('Subscription expired. Contact support to renew.', 403));
    }
    next();
  } catch (err) {
    next(err);
  }
};
