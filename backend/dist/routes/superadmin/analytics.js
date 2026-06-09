"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../../config/database"));
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const startOfYear = new Date(`${year}-01-01`);
        const endOfYear = new Date(`${year}-12-31T23:59:59`);
        const [tenantGrowth, planDistribution, countryDistribution, statusBreakdown, totalStats, recentActivity,] = await Promise.all([
            database_1.default.$queryRaw `
        SELECT
          EXTRACT(MONTH FROM "createdAt") as month,
          COUNT(*) as count
        FROM "Tenant"
        WHERE "createdAt" >= ${startOfYear} AND "createdAt" <= ${endOfYear}
        GROUP BY month ORDER BY month
      `,
            database_1.default.tenant.groupBy({ by: ['subscriptionPlan'], _count: true }),
            database_1.default.tenant.groupBy({ by: ['country'], _count: true, orderBy: { _count: { country: 'desc' } }, take: 10 }),
            database_1.default.tenant.groupBy({ by: ['status'], _count: true }),
            Promise.all([
                database_1.default.tenant.count(),
                database_1.default.member.count(),
                database_1.default.user.count({ where: { role: { not: 'SUPERADMIN' } } }),
                database_1.default.donation.aggregate({ _sum: { amount: true } }),
            ]),
            database_1.default.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50, select: { action: true, userEmail: true, createdAt: true, tenantId: true } }),
        ]);
        const [totalTenants, totalMembers, totalUsers, totalDonations] = totalStats;
        const toNum = (v) => typeof v === 'bigint' ? Number(v) : v;
        const serializeGrowth = (arr) => arr.map((r) => ({ month: toNum(r.month), count: toNum(r.count) }));
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const newThisMonth = await database_1.default.tenant.count({ where: { createdAt: { gte: startOfMonth } } });
        res.json({
            success: true,
            data: {
                year,
                kpis: { totalTenants, totalMembers, totalUsers, totalDonations: Number(totalDonations._sum.amount || 0) },
                charts: {
                    tenantGrowth: serializeGrowth(tenantGrowth),
                    planDistribution,
                    countryDistribution,
                    statusBreakdown,
                },
                newThisMonth,
                recentActivity,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map