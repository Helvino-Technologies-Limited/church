"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const password_1 = require("../../utils/password");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// GET /api/tenant/settings
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const [tenant, settings] = await Promise.all([
            database_1.default.tenant.findUnique({ where: { id: tenantId } }),
            database_1.default.tenantSettings.findUnique({ where: { tenantId } }),
        ]);
        if (!tenant)
            throw new errorHandler_1.AppError('Tenant not found', 404);
        res.json({ success: true, data: { tenant, settings } });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/tenant/settings/church
router.patch('/church', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const allowed = ['name', 'phone', 'website', 'address', 'city', 'state', 'country', 'logo', 'churchType', 'churchSize', 'numberOfBranches', 'registrationNumber'];
        const data = {};
        allowed.forEach((k) => { if (req.body[k] !== undefined)
            data[k] = req.body[k]; });
        const tenant = await database_1.default.tenant.update({ where: { id: tenantId }, data });
        res.json({ success: true, data: tenant });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/tenant/settings/preferences
router.patch('/preferences', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const { currency, fiscalYearStart, timezone, dateFormat, memberNoPrefix, employeeNoPrefix, receiptNoPrefix, primaryColor, secondaryColor } = req.body;
        const settings = await database_1.default.tenantSettings.upsert({
            where: { tenantId },
            update: { currency, fiscalYearStart, timezone, dateFormat, memberNoPrefix, employeeNoPrefix, receiptNoPrefix, primaryColor, secondaryColor },
            create: { tenantId, currency, fiscalYearStart, timezone, dateFormat, memberNoPrefix, employeeNoPrefix, receiptNoPrefix, primaryColor, secondaryColor },
        });
        res.json({ success: true, data: settings });
    }
    catch (err) {
        next(err);
    }
});
// ── Users Management ────────────────────────────────────
// GET /api/tenant/settings/users
router.get('/users', async (req, res, next) => {
    try {
        const users = await database_1.default.user.findMany({
            where: { tenantId: req.tenantId },
            select: { id: true, fullname: true, email: true, phone: true, role: true, status: true, lastLoginAt: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
        res.json({ success: true, data: users });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/tenant/settings/users
router.post('/users', async (req, res, next) => {
    try {
        const { fullname, email, phone, role, password } = req.body;
        if (!fullname || !email || !password)
            throw new errorHandler_1.AppError('Name, email, and password are required', 400);
        if (password.length < 8)
            throw new errorHandler_1.AppError('Password must be at least 8 characters', 400);
        const existing = await database_1.default.user.findUnique({ where: { email } });
        if (existing)
            throw new errorHandler_1.AppError('A user with this email already exists', 409);
        const user = await database_1.default.user.create({
            data: {
                tenantId: req.tenantId,
                fullname, email, phone,
                role: role || client_1.UserRole.STAFF,
                passwordHash: await (0, password_1.hashPassword)(password),
            },
            select: { id: true, fullname: true, email: true, phone: true, role: true, status: true, createdAt: true },
        });
        res.status(201).json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/tenant/settings/users/:id
router.patch('/users/:id', async (req, res, next) => {
    try {
        const user = await database_1.default.user.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        const { fullname, phone, role, status } = req.body;
        const updated = await database_1.default.user.update({
            where: { id: req.params.id },
            data: { fullname, phone, role, status },
            select: { id: true, fullname: true, email: true, phone: true, role: true, status: true },
        });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/tenant/settings/users/:id
router.delete('/users/:id', async (req, res, next) => {
    try {
        if (req.params.id === req.user.userId)
            throw new errorHandler_1.AppError('Cannot delete your own account', 400);
        const user = await database_1.default.user.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        await database_1.default.user.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'User removed' });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/tenant/settings/change-password
router.post('/change-password', async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword)
            throw new errorHandler_1.AppError('Current and new passwords are required', 400);
        if (newPassword.length < 8)
            throw new errorHandler_1.AppError('New password must be at least 8 characters', 400);
        const user = await database_1.default.user.findUnique({ where: { id: req.user.userId } });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        if (!(await (0, password_1.comparePassword)(currentPassword, user.passwordHash)))
            throw new errorHandler_1.AppError('Current password is incorrect', 400);
        await database_1.default.user.update({ where: { id: user.id }, data: { passwordHash: await (0, password_1.hashPassword)(newPassword) } });
        res.json({ success: true, message: 'Password changed successfully' });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/tenant/settings/audit-logs
router.get('/audit-logs', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            database_1.default.auditLog.findMany({ where: { tenantId: req.tenantId }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
            database_1.default.auditLog.count({ where: { tenantId: req.tenantId } }),
        ]);
        res.json({ success: true, data: logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=settings.js.map