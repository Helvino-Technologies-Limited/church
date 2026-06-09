import { Router, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';

const router = Router();

router.get('/summary', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31T23:59:59`);

    const [
      memberStats, donationStats, expenseStats, attendanceStats,
      membersByParish, membersByMinistry, donationByMonth, expenseByCategory,
      donationByCategory, memberGrowth, attendanceByMonth,
    ] = await Promise.all([
      prisma.member.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
      prisma.donation.aggregate({ where: { tenantId, donatedAt: { gte: startOfYear, lte: endOfYear } }, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where: { tenantId, paidAt: { gte: startOfYear, lte: endOfYear } }, _sum: { amount: true }, _count: true }),
      prisma.attendance.aggregate({ where: { tenantId, date: { gte: startOfYear, lte: endOfYear } }, _sum: { total: true, adults: true, children: true }, _avg: { total: true }, _count: true }),
      prisma.member.groupBy({ by: ['parishId'], where: { tenantId }, _count: true }),
      prisma.member.groupBy({ by: ['ministryId'], where: { tenantId }, _count: true }),
      // Monthly donations
      prisma.$queryRaw`
        SELECT
          EXTRACT(MONTH FROM "donatedAt") as month,
          EXTRACT(YEAR FROM "donatedAt") as year,
          SUM(amount)::float as total,
          COUNT(*) as count
        FROM "Donation"
        WHERE "tenantId" = ${tenantId}
          AND "donatedAt" >= ${startOfYear}
          AND "donatedAt" <= ${endOfYear}
        GROUP BY month, year
        ORDER BY month
      `,
      prisma.expense.groupBy({ by: ['category'], where: { tenantId, paidAt: { gte: startOfYear, lte: endOfYear } }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
      prisma.donation.groupBy({ by: ['category'], where: { tenantId, donatedAt: { gte: startOfYear, lte: endOfYear } }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
      // Monthly member growth
      prisma.$queryRaw`
        SELECT
          EXTRACT(MONTH FROM "joinedAt") as month,
          COUNT(*) as count
        FROM "Member"
        WHERE "tenantId" = ${tenantId}
          AND "joinedAt" >= ${startOfYear}
          AND "joinedAt" <= ${endOfYear}
        GROUP BY month
        ORDER BY month
      `,
      // Monthly attendance
      prisma.$queryRaw`
        SELECT
          EXTRACT(MONTH FROM "date") as month,
          AVG(total)::float as avg_total,
          SUM(total) as sum_total,
          COUNT(*) as services
        FROM "Attendance"
        WHERE "tenantId" = ${tenantId}
          AND "date" >= ${startOfYear}
          AND "date" <= ${endOfYear}
        GROUP BY month
        ORDER BY month
      `,
    ]);

    const totalIncome = Number(donationStats._sum.amount || 0);
    const totalExpenses = Number(expenseStats._sum.amount || 0);
    const netBalance = totalIncome - totalExpenses;

    res.json({
      success: true,
      data: {
        year,
        financial: { totalIncome, totalExpenses, netBalance, donationCount: donationStats._count, expenseCount: expenseStats._count },
        members: { byStatus: memberStats, byParish: membersByParish, byMinistry: membersByMinistry },
        attendance: { total: attendanceStats._sum.total || 0, avgPerService: Math.round(Number(attendanceStats._avg.total) || 0), services: attendanceStats._count, adults: attendanceStats._sum.adults || 0, children: attendanceStats._sum.children || 0 },
        charts: { donationByMonth, expenseByCategory, donationByCategory, memberGrowth, attendanceByMonth },
      },
    });
  } catch (err) { next(err); }
});

router.get('/members', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const [total, active, byGender, byMarital, byParish, recentJoiners, newThisMonth] = await Promise.all([
      prisma.member.count({ where: { tenantId } }),
      prisma.member.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.member.groupBy({ by: ['gender'], where: { tenantId }, _count: true }),
      prisma.member.groupBy({ by: ['maritalStatus'], where: { tenantId }, _count: true }),
      prisma.parish.findMany({ where: { tenantId }, include: { _count: { select: { members: true } } } }),
      prisma.member.findMany({ where: { tenantId }, orderBy: { joinedAt: 'desc' }, take: 10, select: { fullname: true, memberNo: true, joinedAt: true, status: true, gender: true } }),
      prisma.member.count({ where: { tenantId, joinedAt: { gte: new Date(new Date().setDate(1)) } } }),
    ]);
    res.json({ success: true, data: { total, active, newThisMonth, byGender, byMarital, byParish, recentJoiners } });
  } catch (err) { next(err); }
});

router.get('/finance', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31T23:59:59`);

    const [donations, expenses, donationByMethod, expenseByCategory, donationByCategory] = await Promise.all([
      prisma.donation.aggregate({ where: { tenantId, donatedAt: { gte: startOfYear, lte: endOfYear } }, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where: { tenantId, paidAt: { gte: startOfYear, lte: endOfYear } }, _sum: { amount: true }, _count: true }),
      prisma.donation.groupBy({ by: ['paymentMethod'], where: { tenantId }, _sum: { amount: true }, _count: true }),
      prisma.expense.groupBy({ by: ['category'], where: { tenantId }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
      prisma.donation.groupBy({ by: ['category'], where: { tenantId }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
    ]);

    const totalIncome = Number(donations._sum.amount || 0);
    const totalExpenses = Number(expenses._sum.amount || 0);

    res.json({
      success: true,
      data: { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses, donationByMethod, expenseByCategory, donationByCategory },
    });
  } catch (err) { next(err); }
});

export default router;
