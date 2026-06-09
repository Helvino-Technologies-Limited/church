"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const password_1 = require("../../utils/password");
const audit_1 = require("../../utils/audit");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// GET /api/superadmin/tenants
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status)
            where.status = status;
        const [tenants, total] = await Promise.all([
            database_1.default.tenant.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { members: true, users: true, employees: true } },
                },
            }),
            database_1.default.tenant.count({ where }),
        ]);
        res.json({
            success: true,
            data: tenants,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/superadmin/tenants/:id
router.get('/:id', async (req, res, next) => {
    try {
        const tenant = await database_1.default.tenant.findUnique({
            where: { id: req.params.id },
            include: {
                _count: { select: { members: true, users: true, employees: true, donations: true, assets: true } },
                users: {
                    where: { role: 'TENANT_ADMIN' },
                    select: { id: true, fullname: true, email: true, phone: true, lastLoginAt: true, status: true },
                },
            },
        });
        if (!tenant)
            throw new errorHandler_1.AppError('Tenant not found', 404);
        res.json({ success: true, data: tenant });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/superadmin/tenants/:id/status
router.patch('/:id/status', async (req, res, next) => {
    try {
        const { status, reason } = req.body;
        const validStatuses = Object.values(client_1.TenantStatus);
        if (!validStatuses.includes(status))
            throw new errorHandler_1.AppError('Invalid status', 400);
        const tenant = await database_1.default.tenant.update({
            where: { id: req.params.id },
            data: {
                status,
                suspendedAt: status === client_1.TenantStatus.SUSPENDED ? new Date() : null,
                suspendedReason: status === client_1.TenantStatus.SUSPENDED ? reason : null,
            },
        });
        await (0, audit_1.createAuditLog)({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: `TENANT_STATUS_CHANGED_TO_${status}`,
            entity: 'Tenant',
            entityId: req.params.id,
            details: { tenantName: tenant.name, reason },
            req,
        });
        res.json({ success: true, message: `Tenant ${status.toLowerCase()} successfully`, data: tenant });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/superadmin/tenants/:id/verify
router.patch('/:id/verify', async (req, res, next) => {
    try {
        const tenant = await database_1.default.tenant.update({
            where: { id: req.params.id },
            data: { isVerified: true, verifiedAt: new Date(), status: client_1.TenantStatus.ACTIVE },
        });
        await (0, audit_1.createAuditLog)({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'TENANT_VERIFIED',
            entity: 'Tenant',
            entityId: req.params.id,
            details: { tenantName: tenant.name },
            req,
        });
        res.json({ success: true, message: 'Tenant verified and activated', data: tenant });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/superadmin/tenants/:id/reset-password
router.post('/:id/reset-password', async (req, res, next) => {
    try {
        const { adminEmail, newPassword } = req.body;
        if (!adminEmail || !newPassword)
            throw new errorHandler_1.AppError('Admin email and new password required', 400);
        if (newPassword.length < 8)
            throw new errorHandler_1.AppError('Password must be at least 8 characters', 400);
        const user = await database_1.default.user.findFirst({
            where: { email: adminEmail, tenantId: req.params.id },
        });
        if (!user)
            throw new errorHandler_1.AppError('Admin user not found in this tenant', 404);
        await database_1.default.user.update({
            where: { id: user.id },
            data: { passwordHash: await (0, password_1.hashPassword)(newPassword) },
        });
        await (0, audit_1.createAuditLog)({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'TENANT_ADMIN_PASSWORD_RESET',
            entity: 'User',
            entityId: user.id,
            details: { targetEmail: adminEmail, tenantId: req.params.id },
            req,
        });
        res.json({ success: true, message: 'Password reset successfully' });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/superadmin/tenants/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const { confirm } = req.body;
        if (confirm !== 'DELETE')
            throw new errorHandler_1.AppError('Please confirm deletion by sending confirm: "DELETE"', 400);
        const tenant = await database_1.default.tenant.findUnique({ where: { id: req.params.id } });
        if (!tenant)
            throw new errorHandler_1.AppError('Tenant not found', 404);
        await (0, audit_1.createAuditLog)({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'TENANT_PERMANENTLY_DELETED',
            entity: 'Tenant',
            entityId: req.params.id,
            details: { tenantName: tenant.name, tenantEmail: tenant.email },
            req,
        });
        await database_1.default.tenant.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: `Tenant "${tenant.name}" permanently deleted` });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/superadmin/tenants/:id/subscription
router.patch('/:id/subscription', async (req, res, next) => {
    try {
        const { plan, expiresAt } = req.body;
        const tenant = await database_1.default.tenant.update({
            where: { id: req.params.id },
            data: {
                subscriptionPlan: plan,
                subscriptionEndsAt: expiresAt ? new Date(expiresAt) : undefined,
                status: client_1.TenantStatus.ACTIVE,
            },
        });
        await (0, audit_1.createAuditLog)({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'TENANT_SUBSCRIPTION_UPDATED',
            entity: 'Tenant',
            entityId: req.params.id,
            details: { plan, expiresAt },
            req,
        });
        res.json({ success: true, data: tenant });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=tenants.js.map