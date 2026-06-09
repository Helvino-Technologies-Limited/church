"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = __importDefault(require("../config/database"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const audit_1 = require("../utils/audit");
const router = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const registerSchema = zod_1.z.object({
    churchName: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(6),
    country: zod_1.z.string().default('Kenya'),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    website: zod_1.z.string().optional(),
    churchType: zod_1.z.string().optional(),
    churchSize: zod_1.z.string().optional(),
    numberOfBranches: zod_1.z.number().int().min(1).default(1),
    registrationNumber: zod_1.z.string().optional(),
    adminFullname: zod_1.z.string().min(2),
    adminEmail: zod_1.z.string().email(),
    adminPhone: zod_1.z.string().optional(),
    adminPassword: zod_1.z.string().min(8),
    plan: zod_1.z.enum(['STARTER', 'STANDARD', 'PROFESSIONAL', 'ENTERPRISE']).default('TRIAL'),
});
// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await database_1.default.user.findUnique({
            where: { email },
            include: { tenant: true },
        });
        if (!user || !(await (0, password_1.comparePassword)(password, user.passwordHash))) {
            throw new errorHandler_1.AppError('Invalid email or password', 401);
        }
        if (user.status !== 'ACTIVE') {
            throw new errorHandler_1.AppError('Account is suspended or inactive', 403);
        }
        if (user.tenant && user.tenant.status === client_1.TenantStatus.SUSPENDED) {
            throw new errorHandler_1.AppError('Your church account has been suspended. Contact support.', 403);
        }
        if (user.tenant && user.tenant.status === client_1.TenantStatus.EXPIRED) {
            throw new errorHandler_1.AppError('Your subscription has expired. Please renew.', 403);
        }
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        };
        const accessToken = (0, jwt_1.signAccessToken)(payload);
        const refreshToken = (0, jwt_1.signRefreshToken)(payload);
        await database_1.default.refreshToken.create({
            data: {
                userId: user.id,
                tenantId: user.tenantId,
                token: refreshToken,
                expiresAt: new Date(Date.now() + (0, jwt_1.refreshExpiryMs)()),
            },
        });
        await database_1.default.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await (0, audit_1.createAuditLog)({
            tenantId: user.tenantId,
            userId: user.id,
            userEmail: user.email,
            action: 'USER_LOGIN',
            req,
        });
        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    fullname: user.fullname,
                    email: user.email,
                    role: user.role,
                    tenantId: user.tenantId,
                    tenant: user.tenant
                        ? { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug, logo: user.tenant.logo, status: user.tenant.status }
                        : null,
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/register (tenant self-registration)
router.post('/register', async (req, res, next) => {
    try {
        const data = registerSchema.parse(req.body);
        const existingUser = await database_1.default.user.findUnique({ where: { email: data.adminEmail } });
        if (existingUser)
            throw new errorHandler_1.AppError('An account with this email already exists', 409);
        const slug = data.churchName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        const existingTenant = await database_1.default.tenant.findFirst({ where: { slug } });
        if (existingTenant)
            throw new errorHandler_1.AppError('A church with this name already exists', 409);
        const tenant = await database_1.default.tenant.create({
            data: {
                name: data.churchName,
                slug: slug + '-' + Date.now().toString(36),
                email: data.email,
                phone: data.phone,
                country: data.country,
                city: data.city,
                state: data.state,
                address: data.address,
                website: data.website,
                churchType: data.churchType,
                churchSize: data.churchSize,
                numberOfBranches: data.numberOfBranches,
                registrationNumber: data.registrationNumber,
                subscriptionPlan: client_1.SubscriptionPlan.STARTER,
                status: client_1.TenantStatus.TRIAL,
                trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
        const adminUser = await database_1.default.user.create({
            data: {
                tenantId: tenant.id,
                fullname: data.adminFullname,
                email: data.adminEmail,
                phone: data.adminPhone,
                passwordHash: await (0, password_1.hashPassword)(data.adminPassword),
                role: client_1.UserRole.TENANT_ADMIN,
            },
        });
        // Default parishes
        await database_1.default.parish.create({ data: { tenantId: tenant.id, name: 'Main Campus' } });
        // Default ministries
        await database_1.default.ministry.createMany({
            data: [
                { tenantId: tenant.id, name: 'Worship Ministry' },
                { tenantId: tenant.id, name: "Children's Ministry" },
                { tenantId: tenant.id, name: 'Evangelism Ministry' },
            ],
        });
        await (0, audit_1.createAuditLog)({
            tenantId: tenant.id,
            userId: adminUser.id,
            userEmail: adminUser.email,
            action: 'TENANT_REGISTERED',
            entity: 'Tenant',
            entityId: tenant.id,
            req,
        });
        res.status(201).json({
            success: true,
            message: 'Church registered successfully! You can now log in.',
            data: { tenantId: tenant.id, adminEmail: adminUser.email },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            throw new errorHandler_1.AppError('Refresh token required', 401);
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const stored = await database_1.default.refreshToken.findUnique({ where: { token: refreshToken } });
        if (!stored || stored.expiresAt < new Date()) {
            throw new errorHandler_1.AppError('Refresh token expired or invalid', 401);
        }
        const user = await database_1.default.user.findUnique({ where: { id: payload.userId } });
        if (!user || user.status !== 'ACTIVE')
            throw new errorHandler_1.AppError('User not found or inactive', 401);
        const newPayload = { userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
        const newAccessToken = (0, jwt_1.signAccessToken)(newPayload);
        const newRefreshToken = (0, jwt_1.signRefreshToken)(newPayload);
        await database_1.default.refreshToken.delete({ where: { token: refreshToken } });
        await database_1.default.refreshToken.create({
            data: {
                userId: user.id,
                tenantId: user.tenantId,
                token: newRefreshToken,
                expiresAt: new Date(Date.now() + (0, jwt_1.refreshExpiryMs)()),
            },
        });
        res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/logout
router.post('/logout', auth_1.authenticate, async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await database_1.default.refreshToken.deleteMany({ where: { token: refreshToken } });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/auth/me
router.get('/me', auth_1.authenticate, async (req, res, next) => {
    try {
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.userId },
            include: { tenant: { select: { id: true, name: true, slug: true, logo: true, status: true, subscriptionPlan: true } } },
        });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        const { passwordHash: _ph, ...safeUser } = user;
        res.json({ success: true, data: safeUser });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/impersonate/:tenantId  (superadmin only)
router.post('/impersonate/:tenantId', auth_1.authenticate, auth_1.requireSuperAdmin, async (req, res, next) => {
    try {
        const { tenantId } = req.params;
        const tenant = await database_1.default.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant)
            throw new errorHandler_1.AppError('Tenant not found', 404);
        const tenantAdmin = await database_1.default.user.findFirst({
            where: { tenantId, role: client_1.UserRole.TENANT_ADMIN },
        });
        if (!tenantAdmin)
            throw new errorHandler_1.AppError('No admin found for this tenant', 404);
        const impersonatePayload = {
            userId: tenantAdmin.id,
            email: tenantAdmin.email,
            role: tenantAdmin.role,
            tenantId: tenantAdmin.tenantId,
            impersonating: true,
            originalUserId: req.user.userId,
        };
        const accessToken = (0, jwt_1.signAccessToken)(impersonatePayload);
        const refreshToken = (0, jwt_1.signRefreshToken)(impersonatePayload);
        await (0, audit_1.createAuditLog)({
            tenantId,
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'SUPERADMIN_IMPERSONATE',
            entity: 'Tenant',
            entityId: tenantId,
            details: { targetEmail: tenantAdmin.email },
            req,
        });
        res.json({
            success: true,
            message: `Now impersonating ${tenant.name}`,
            data: { accessToken, refreshToken, tenant: { id: tenant.id, name: tenant.name } },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map