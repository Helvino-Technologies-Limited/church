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
        const tenantId = req.tenantId;
        const [totalMembers, activeMembers, totalEmployees, totalAssets, totalDonations, recentMembers, recentDonations, membersByGender, donationsByCategory,] = await Promise.all([
            database_1.default.member.count({ where: { tenantId } }),
            database_1.default.member.count({ where: { tenantId, status: 'ACTIVE' } }),
            database_1.default.employee.count({ where: { tenantId } }),
            database_1.default.asset.count({ where: { tenantId } }),
            database_1.default.donation.aggregate({ where: { tenantId }, _sum: { amount: true }, _count: true }),
            database_1.default.member.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, fullname: true, memberNo: true, phone: true, createdAt: true, status: true },
            }),
            database_1.default.donation.findMany({
                where: { tenantId },
                orderBy: { donatedAt: 'desc' },
                take: 5,
                select: { id: true, memberName: true, amount: true, category: true, paymentMethod: true, donatedAt: true },
            }),
            database_1.default.member.groupBy({ by: ['gender'], where: { tenantId }, _count: { gender: true } }),
            database_1.default.donation.groupBy({ by: ['category'], where: { tenantId }, _sum: { amount: true }, _count: true }),
        ]);
        const tenant = await database_1.default.tenant.findUnique({
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
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map