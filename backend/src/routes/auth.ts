import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken, refreshExpiryMs } from '../utils/jwt';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { UserRole, TenantStatus, SubscriptionPlan } from '@prisma/client';
import { createAuditLog } from '../utils/audit';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  churchName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  country: z.string().default('Kenya'),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  churchType: z.string().optional(),
  churchSize: z.string().optional(),
  numberOfBranches: z.number().int().min(1).default(1),
  registrationNumber: z.string().optional(),
  adminFullname: z.string().min(2),
  adminEmail: z.string().email(),
  adminPhone: z.string().optional(),
  adminPassword: z.string().min(8),
  plan: z.enum(['STARTER', 'STANDARD', 'PROFESSIONAL', 'ENTERPRISE']).default('TRIAL' as any),
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new AppError('Invalid email or password', 401);
    }
    if (user.status !== 'ACTIVE') {
      throw new AppError('Account is suspended or inactive', 403);
    }
    if (user.tenant && user.tenant.status === TenantStatus.SUSPENDED) {
      throw new AppError('Your church account has been suspended. Contact support.', 403);
    }
    if (user.tenant && user.tenant.status === TenantStatus.EXPIRED) {
      throw new AppError('Your subscription has expired. Please renew.', 403);
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + refreshExpiryMs()),
      },
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      req,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenant: user.tenant
            ? { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug, logo: user.tenant.logo, status: user.tenant.status }
            : null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register (tenant self-registration)
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: data.adminEmail } });
    if (existingUser) throw new AppError('An account with this email already exists', 409);

    const slug = data.churchName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const existingTenant = await prisma.tenant.findFirst({ where: { slug } });
    if (existingTenant) throw new AppError('A church with this name already exists', 409);

    const tenant = await prisma.tenant.create({
      data: {
        name: data.churchName,
        slug: slug + '-' + Date.now().toString(36),
        email: data.email,
        phone: data.phone,
        country: data.country,
        city: data.city,
        state: data.state,
        address: data.address,
        website: data.website,
        churchType: data.churchType,
        churchSize: data.churchSize,
        numberOfBranches: data.numberOfBranches,
        registrationNumber: data.registrationNumber,
        subscriptionPlan: SubscriptionPlan.STARTER,
        status: TenantStatus.TRIAL,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const adminUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        fullname: data.adminFullname,
        email: data.adminEmail,
        phone: data.adminPhone,
        passwordHash: await hashPassword(data.adminPassword),
        role: UserRole.TENANT_ADMIN,
      },
    });

    // Default parishes
    await prisma.parish.create({ data: { tenantId: tenant.id, name: 'Main Campus' } });

    // Default ministries
    await prisma.ministry.createMany({
      data: [
        { tenantId: tenant.id, name: 'Worship Ministry' },
        { tenantId: tenant.id, name: "Children's Ministry" },
        { tenantId: tenant.id, name: 'Evangelism Ministry' },
      ],
    });

    await createAuditLog({
      tenantId: tenant.id,
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: 'TENANT_REGISTERED',
      entity: 'Tenant',
      entityId: tenant.id,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Church registered successfully! You can now log in.',
      data: { tenantId: tenant.id, adminEmail: adminUser.email },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token required', 401);

    const payload = verifyRefreshToken(refreshToken);

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('Refresh token expired or invalid', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.status !== 'ACTIVE') throw new AppError('User not found or inactive', 401);

    const newPayload = { userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + refreshExpiryMs()),
      },
    });

    res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { tenant: { select: { id: true, name: true, slug: true, logo: true, status: true, subscriptionPlan: true } } },
    });
    if (!user) throw new AppError('User not found', 404);
    const { passwordHash: _ph, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/impersonate/:tenantId  (superadmin only)
router.post('/impersonate/:tenantId', authenticate, requireSuperAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new AppError('Tenant not found', 404);

    const tenantAdmin = await prisma.user.findFirst({
      where: { tenantId, role: UserRole.TENANT_ADMIN },
    });
    if (!tenantAdmin) throw new AppError('No admin found for this tenant', 404);

    const impersonatePayload = {
      userId: tenantAdmin.id,
      email: tenantAdmin.email,
      role: tenantAdmin.role,
      tenantId: tenantAdmin.tenantId,
      impersonating: true,
      originalUserId: req.user!.userId,
    };

    const accessToken = signAccessToken(impersonatePayload);
    const refreshToken = signRefreshToken(impersonatePayload);

    await createAuditLog({
      tenantId,
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'SUPERADMIN_IMPERSONATE',
      entity: 'Tenant',
      entityId: tenantId,
      details: { targetEmail: tenantAdmin.email },
      req,
    });

    res.json({
      success: true,
      message: `Now impersonating ${tenant.name}`,
      data: { accessToken, refreshToken, tenant: { id: tenant.id, name: tenant.name } },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
