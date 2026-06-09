import { Router, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31T23:59:59`);

    const [
      tenantGrowth, planDistribution, countryDistribution, statusBreakdown,
      totalStats, recentActivity,
    ] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          EXTRACT(MONTH FROM "createdAt") as month,
          COUNT(*) as count
        FROM "Tenant"
        WHERE "createdAt" >= ${startOfYear} AND "createdAt" <= ${endOfYear}
        GROUP BY month ORDER BY month
      `,
      prisma.tenant.groupBy({ by: ['subscriptionPlan'], _count: true }),
      prisma.tenant.groupBy({ by: ['country'], _count: true, orderBy: { _count: { country: 'desc' } }, take: 10 }),
      prisma.tenant.groupBy({ by: ['status'], _count: true }),
      Promise.all([
        prisma.tenant.count(),
        prisma.member.count(),
        prisma.user.count({ where: { role: { not: 'SUPERADMIN' } } }),
        prisma.donation.aggregate({ _sum: { amount: true } }),
      ]),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50, select: { action: true, userEmail: true, createdAt: true, tenantId: true } }),
    ]);

    const [totalTenants, totalMembers, totalUsers, totalDonations] = totalStats;

    res.json({
      success: true,
      data: {
        year,
        kpis: { totalTenants, totalMembers, totalUsers, totalDonations: Number(totalDonations._sum.amount || 0) },
        charts: { tenantGrowth, planDistribution, countryDistribution, statusBreakdown },
        recentActivity,
      },
    });
  } catch (err) { next(err); }
});

export default router;
