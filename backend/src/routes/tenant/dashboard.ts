import { Router, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;

    const [
      totalMembers,
      activeMembers,
      totalEmployees,
      totalAssets,
      totalDonations,
      recentMembers,
      recentDonations,
      membersByGender,
      donationsByCategory,
    ] = await Promise.all([
      prisma.member.count({ where: { tenantId } }),
      prisma.member.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.employee.count({ where: { tenantId } }),
      prisma.asset.count({ where: { tenantId } }),
      prisma.donation.aggregate({ where: { tenantId }, _sum: { amount: true }, _count: true }),
      prisma.member.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, fullname: true, memberNo: true, phone: true, createdAt: true, status: true },
      }),
      prisma.donation.findMany({
        where: { tenantId },
        orderBy: { donatedAt: 'desc' },
        take: 5,
        select: { id: true, memberName: true, amount: true, category: true, paymentMethod: true, donatedAt: true },
      }),
      prisma.member.groupBy({ by: ['gender'], where: { tenantId }, _count: { gender: true } }),
      prisma.donation.groupBy({ by: ['category'], where: { tenantId }, _sum: { amount: true }, _count: true }),
    ]);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, subscriptionPlan: true, status: true, trialEndsAt: true, subscriptionEndsAt: true },
    });

    res.json({
      success: true,
      data: {
        tenant,
        stats: {
          totalMembers,
          activeMembers,
          totalEmployees,
          totalAssets,
          totalDonations: totalDonations._sum.amount || 0,
          donationCount: totalDonations._count,
        },
        recentMembers,
        recentDonations,
        membersByGender,
        donationsByCategory,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
