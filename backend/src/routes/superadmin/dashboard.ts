import { Router, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';

const router = Router();

// GET /api/superadmin/dashboard
router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      totalMembers,
      totalUsers,
      recentTenants,
      recentAuditLogs,
      tenantsByPlan,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.tenant.count({ where: { status: 'TRIAL' } }),
      prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      prisma.member.count(),
      prisma.user.count({ where: { role: { not: 'SUPERADMIN' } } }),
      prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, name: true, email: true, status: true,
          subscriptionPlan: true, createdAt: true, country: true,
          _count: { select: { members: true } },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, action: true, userEmail: true, createdAt: true, entity: true },
      }),
      prisma.tenant.groupBy({
        by: ['subscriptionPlan'],
        _count: { subscriptionPlan: true },
      }),
    ]);

    const tenantStatusCounts = [
      { status: 'ACTIVE', count: activeTenants },
      { status: 'TRIAL', count: trialTenants },
      { status: 'SUSPENDED', count: suspendedTenants },
      { status: 'EXPIRED', count: await prisma.tenant.count({ where: { status: 'EXPIRED' } }) },
      { status: 'PENDING_VERIFICATION', count: await prisma.tenant.count({ where: { status: 'PENDING_VERIFICATION' } }) },
    ];

    res.json({
      success: true,
      data: {
        stats: { totalTenants, activeTenants, trialTenants, suspendedTenants, totalMembers, totalUsers },
        recentTenants,
        recentAuditLogs,
        tenantsByPlan,
        tenantStatusCounts,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/superadmin/audit-logs
router.get('/audit-logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { id: true, name: true } },
        },
      }),
      prisma.auditLog.count(),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
