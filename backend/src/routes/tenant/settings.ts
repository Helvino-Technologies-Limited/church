import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';
import { hashPassword, comparePassword } from '../../utils/password';
import { UserRole } from '@prisma/client';

const router = Router();

// GET /api/tenant/settings
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const [tenant, settings] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.tenantSettings.findUnique({ where: { tenantId } }),
    ]);
    if (!tenant) throw new AppError('Tenant not found', 404);
    res.json({ success: true, data: { tenant, settings } });
  } catch (err) { next(err); }
});

// PATCH /api/tenant/settings/church
router.patch('/church', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const allowed = ['name', 'phone', 'website', 'address', 'city', 'state', 'country', 'logo', 'churchType', 'churchSize', 'numberOfBranches', 'registrationNumber'];
    const data: Record<string, unknown> = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

    const tenant = await prisma.tenant.update({ where: { id: tenantId }, data });
    res.json({ success: true, data: tenant });
  } catch (err) { next(err); }
});

// PATCH /api/tenant/settings/preferences
router.patch('/preferences', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const { currency, fiscalYearStart, timezone, dateFormat, memberNoPrefix, employeeNoPrefix, receiptNoPrefix, primaryColor, secondaryColor } = req.body;

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: { currency, fiscalYearStart, timezone, dateFormat, memberNoPrefix, employeeNoPrefix, receiptNoPrefix, primaryColor, secondaryColor },
      create: { tenantId, currency, fiscalYearStart, timezone, dateFormat, memberNoPrefix, employeeNoPrefix, receiptNoPrefix, primaryColor, secondaryColor },
    });
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

// ── Users Management ────────────────────────────────────
// GET /api/tenant/settings/users
router.get('/users', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: { tenantId: req.tenantId! },
      select: { id: true, fullname: true, email: true, phone: true, role: true, status: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

// POST /api/tenant/settings/users
router.post('/users', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fullname, email, phone, role, password } = req.body;
    if (!fullname || !email || !password) throw new AppError('Name, email, and password are required', 400);
    if (password.length < 8) throw new AppError('Password must be at least 8 characters', 400);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('A user with this email already exists', 409);

    const user = await prisma.user.create({
      data: {
        tenantId: req.tenantId!,
        fullname, email, phone,
        role: role || UserRole.STAFF,
        passwordHash: await hashPassword(password),
      },
      select: { id: true, fullname: true, email: true, phone: true, role: true, status: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PATCH /api/tenant/settings/users/:id
router.patch('/users/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!user) throw new AppError('User not found', 404);

    const { fullname, phone, role, status } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { fullname, phone, role, status },
      select: { id: true, fullname: true, email: true, phone: true, role: true, status: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// DELETE /api/tenant/settings/users/:id
router.delete('/users/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.params.id === req.user!.userId) throw new AppError('Cannot delete your own account', 400);
    const user = await prisma.user.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!user) throw new AppError('User not found', 404);
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'User removed' });
  } catch (err) { next(err); }
});

// POST /api/tenant/settings/change-password
router.post('/change-password', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw new AppError('Current and new passwords are required', 400);
    if (newPassword.length < 8) throw new AppError('New password must be at least 8 characters', 400);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError('User not found', 404);
    if (!(await comparePassword(currentPassword, user.passwordHash))) throw new AppError('Current password is incorrect', 400);

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
});

// GET /api/tenant/settings/audit-logs
router.get('/audit-logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where: { tenantId: req.tenantId! }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.count({ where: { tenantId: req.tenantId! } }),
    ]);
    res.json({ success: true, data: logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

export default router;
