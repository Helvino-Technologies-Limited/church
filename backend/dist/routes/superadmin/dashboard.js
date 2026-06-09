"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../../config/database"));
const router = (0, express_1.Router)();
// GET /api/superadmin/dashboard
router.get('/', async (_req, res, next) => {
    try {
        const [totalTenants, activeTenants, trialTenants, suspendedTenants, totalMembers, totalUsers, recentTenants, recentAuditLogs, tenantsByPlan,] = await Promise.all([
            database_1.default.tenant.count(),
            database_1.default.tenant.count({ where: { status: 'ACTIVE' } }),
            database_1.default.tenant.count({ where: { status: 'TRIAL' } }),
            database_1.default.tenant.count({ where: { status: 'SUSPENDED' } }),
            database_1.default.member.count(),
            database_1.default.user.count({ where: { role: { not: 'SUPERADMIN' } } }),
            database_1.default.tenant.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true, name: true, email: true, status: true,
                    subscriptionPlan: true, createdAt: true, country: true,
                    _count: { select: { members: true } },
                },
            }),
            database_1.default.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: { id: true, action: true, userEmail: true, createdAt: true, entity: true },
            }),
            database_1.default.tenant.groupBy({
                by: ['subscriptionPlan'],
                _count: { subscriptionPlan: true },
            }),
        ]);
        const tenantStatusCounts = [
            { status: 'ACTIVE', count: activeTenants },
            { status: 'TRIAL', count: trialTenants },
            { status: 'SUSPENDED', count: suspendedTenants },
            { status: 'EXPIRED', count: await database_1.default.tenant.count({ where: { status: 'EXPIRED' } }) },
            { status: 'PENDING_VERIFICATION', count: await database_1.default.tenant.count({ where: { status: 'PENDING_VERIFICATION' } }) },
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
    }
    catch (err) {
        next(err);
    }
});
// GET /api/superadmin/audit-logs
router.get('/audit-logs', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            database_1.default.auditLog.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    tenant: { select: { id: true, name: true } },
                },
            }),
            database_1.default.auditLog.count(),
        ]);
        res.json({
            success: true,
            data: logs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map