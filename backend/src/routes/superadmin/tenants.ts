import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';
import { hashPassword } from '../../utils/password';
import { createAuditLog } from '../../utils/audit';
import { TenantStatus } from '@prisma/client';

const router = Router();

// GET /api/superadmin/tenants
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { members: true, users: true, employees: true } },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({
      success: true,
      data: tenants,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/superadmin/tenants/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { members: true, users: true, employees: true, donations: true, assets: true } },
        users: {
          where: { role: 'TENANT_ADMIN' },
          select: { id: true, fullname: true, email: true, phone: true, lastLoginAt: true, status: true },
        },
      },
    });
    if (!tenant) throw new AppError('Tenant not found', 404);
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/superadmin/tenants/:id/status
router.patch('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = Object.values(TenantStatus);
    if (!validStatuses.includes(status)) throw new AppError('Invalid status', 400);

    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: {
        status,
        suspendedAt: status === TenantStatus.SUSPENDED ? new Date() : null,
        suspendedReason: status === TenantStatus.SUSPENDED ? reason : null,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: `TENANT_STATUS_CHANGED_TO_${status}`,
      entity: 'Tenant',
      entityId: req.params.id,
      details: { tenantName: tenant.name, reason },
      req,
    });

    res.json({ success: true, message: `Tenant ${status.toLowerCase()} successfully`, data: tenant });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/superadmin/tenants/:id/verify
router.patch('/:id/verify', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { isVerified: true, verifiedAt: new Date(), status: TenantStatus.ACTIVE },
    });

    await createAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'TENANT_VERIFIED',
      entity: 'Tenant',
      entityId: req.params.id,
      details: { tenantName: tenant.name },
      req,
    });

    res.json({ success: true, message: 'Tenant verified and activated', data: tenant });
  } catch (err) {
    next(err);
  }
});

// POST /api/superadmin/tenants/:id/reset-password
router.post('/:id/reset-password', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { adminEmail, newPassword } = req.body;
    if (!adminEmail || !newPassword) throw new AppError('Admin email and new password required', 400);
    if (newPassword.length < 8) throw new AppError('Password must be at least 8 characters', 400);

    const user = await prisma.user.findFirst({
      where: { email: adminEmail, tenantId: req.params.id },
    });
    if (!user) throw new AppError('Admin user not found in this tenant', 404);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    await createAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'TENANT_ADMIN_PASSWORD_RESET',
      entity: 'User',
      entityId: user.id,
      details: { targetEmail: adminEmail, tenantId: req.params.id },
      req,
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/superadmin/tenants/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { confirm } = req.body;
    if (confirm !== 'DELETE') throw new AppError('Please confirm deletion by sending confirm: "DELETE"', 400);

    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
    if (!tenant) throw new AppError('Tenant not found', 404);

    await createAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'TENANT_PERMANENTLY_DELETED',
      entity: 'Tenant',
      entityId: req.params.id,
      details: { tenantName: tenant.name, tenantEmail: tenant.email },
      req,
    });

    await prisma.tenant.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: `Tenant "${tenant.name}" permanently deleted` });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/superadmin/tenants/:id/subscription
router.patch('/:id/subscription', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { plan, expiresAt } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: {
        subscriptionPlan: plan,
        subscriptionEndsAt: expiresAt ? new Date(expiresAt) : undefined,
        status: TenantStatus.ACTIVE,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'TENANT_SUBSCRIPTION_UPDATED',
      entity: 'Tenant',
      entityId: req.params.id,
      details: { plan, expiresAt },
      req,
    });

    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
});

export default router;
