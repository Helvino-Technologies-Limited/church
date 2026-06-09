"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../../config/database"));
const router = (0, express_1.Router)();
const toNum = (v) => (typeof v === 'bigint' ? Number(v) : Number(v || 0));
const serializeRaw = (arr, fields) => arr.map((r) => {
    const out = {};
    fields.forEach((f) => { out[f] = toNum(r[f]); });
    return out;
});
router.get('/summary', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const startOfYear = new Date(`${year}-01-01`);
        const endOfYear = new Date(`${year}-12-31T23:59:59`);
        const [memberStats, donationStats, expenseStats, attendanceStats, donationByMonth, expenseByMonth, expenseByCategory, donationByCategory, memberGrowth, attendanceByMonth,] = await Promise.all([
            database_1.default.member.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
            database_1.default.donation.aggregate({ where: { tenantId, donatedAt: { gte: startOfYear, lte: endOfYear } }, _sum: { amount: true }, _count: true }),
            database_1.default.expense.aggregate({ where: { tenantId, paidAt: { gte: startOfYear, lte: endOfYear } }, _sum: { amount: true }, _count: true }),
            database_1.default.attendance.aggregate({ where: { tenantId, date: { gte: startOfYear, lte: endOfYear } }, _sum: { total: true, adults: true, children: true }, _avg: { total: true }, _count: true }),
            database_1.default.$queryRaw `
        SELECT EXTRACT(MONTH FROM "donatedAt") as month, SUM(amount)::float as total, COUNT(*) as count
        FROM "Donation"
        WHERE "tenantId" = ${tenantId} AND "donatedAt" >= ${startOfYear} AND "donatedAt" <= ${endOfYear}
        GROUP BY month ORDER BY month
      `,
            database_1.default.$queryRaw `
        SELECT EXTRACT(MONTH FROM "paidAt") as month, SUM(amount)::float as total, COUNT(*)::int as count
        FROM "Expense"
        WHERE "tenantId" = ${tenantId} AND "paidAt" >= ${startOfYear} AND "paidAt" <= ${endOfYear}
        GROUP BY month ORDER BY month
      `,
            database_1.default.expense.groupBy({ by: ['category'], where: { tenantId, paidAt: { gte: startOfYear, lte: endOfYear } }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
            database_1.default.donation.groupBy({ by: ['category'], where: { tenantId, donatedAt: { gte: startOfYear, lte: endOfYear } }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
            database_1.default.$queryRaw `
        SELECT EXTRACT(MONTH FROM "joinedAt") as month, COUNT(*) as count
        FROM "Member"
        WHERE "tenantId" = ${tenantId} AND "joinedAt" >= ${startOfYear} AND "joinedAt" <= ${endOfYear}
        GROUP BY month ORDER BY month
      `,
            database_1.default.$queryRaw `
        SELECT EXTRACT(MONTH FROM "date") as month, SUM("total") as total, AVG("total")::float as avg_total, COUNT(*)::int as services
        FROM "Attendance"
        WHERE "tenantId" = ${tenantId} AND "date" >= ${startOfYear} AND "date" <= ${endOfYear}
        GROUP BY month ORDER BY month
      `,
        ]);
        const totalIncome = Number(donationStats._sum.amount || 0);
        const totalExpenses = Number(expenseStats._sum.amount || 0);
        res.json({
            success: true,
            data: {
                year,
                financial: { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses, donationCount: donationStats._count, expenseCount: expenseStats._count },
                members: { byStatus: memberStats },
                attendance: {
                    total: toNum(attendanceStats._sum.total),
                    avgPerService: Math.round(toNum(attendanceStats._avg.total)),
                    services: attendanceStats._count,
                },
                monthlyDonations: serializeRaw(donationByMonth, ['month', 'total', 'count']),
                monthlyExpenses: serializeRaw(expenseByMonth, ['month', 'total', 'count']),
                expenseByCategory,
                donationByCategory,
                memberGrowth: serializeRaw(memberGrowth, ['month', 'count']),
                attendanceByMonth: serializeRaw(attendanceByMonth, ['month', 'total', 'avg_total', 'services']),
            },
        });
    }
    catch (err) {
        next(err);
    }
});
router.get('/members', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const [total, active, byStatus, byGender, byMarital, byParish, recentJoiners, newThisMonth] = await Promise.all([
            database_1.default.member.count({ where: { tenantId } }),
            database_1.default.member.count({ where: { tenantId, status: 'ACTIVE' } }),
            database_1.default.member.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
            database_1.default.member.groupBy({ by: ['gender'], where: { tenantId }, _count: { _all: true } }),
            database_1.default.member.groupBy({ by: ['maritalStatus'], where: { tenantId }, _count: { _all: true } }),
            database_1.default.parish.findMany({ where: { tenantId }, include: { _count: { select: { members: true } } } }),
            database_1.default.member.findMany({ where: { tenantId }, orderBy: { joinedAt: 'desc' }, take: 10, select: { fullname: true, memberNo: true, joinedAt: true, status: true, gender: true } }),
            database_1.default.member.count({ where: { tenantId, joinedAt: { gte: new Date(new Date().setDate(1)) } } }),
        ]);
        res.json({ success: true, data: { total, active, newThisMonth, byStatus, byGender, byMarital, byParish, recentJoiners } });
    }
    catch (err) {
        next(err);
    }
});
router.get('/finance', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const startOfYear = new Date(`${year}-01-01`);
        const endOfYear = new Date(`${year}-12-31T23:59:59`);
        const [donations, expenses, donationByMethod, expenseByCategory, donationByCategory] = await Promise.all([
            database_1.default.donation.aggregate({ where: { tenantId, donatedAt: { gte: startOfYear, lte: endOfYear } }, _sum: { amount: true }, _count: true }),
            database_1.default.expense.aggregate({ where: { tenantId, paidAt: { gte: startOfYear, lte: endOfYear } }, _sum: { amount: true }, _count: true }),
            database_1.default.donation.groupBy({ by: ['paymentMethod'], where: { tenantId }, _sum: { amount: true }, _count: true }),
            database_1.default.expense.groupBy({ by: ['category'], where: { tenantId }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
            database_1.default.donation.groupBy({ by: ['category'], where: { tenantId }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
        ]);
        const totalIncome = Number(donations._sum.amount || 0);
        const totalExpenses = Number(expenses._sum.amount || 0);
        res.json({
            success: true,
            data: { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses, donationByMethod, expenseByCategory, donationByCategory },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map