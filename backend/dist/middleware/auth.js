"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.requireTenantAdmin = exports.requireSuperAdmin = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("./errorHandler");
const authenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
        throw new errorHandler_1.AppError('No token provided', 401);
    const token = authHeader.split(' ')[1];
    const payload = (0, jwt_1.verifyAccessToken)(token);
    req.user = payload;
    req.tenantId = payload.tenantId || undefined;
    next();
};
exports.authenticate = authenticate;
const requireSuperAdmin = (req, _res, next) => {
    if (req.user?.role !== client_1.UserRole.SUPERADMIN) {
        throw new errorHandler_1.AppError('Superadmin access required', 403);
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
const requireTenantAdmin = (req, _res, next) => {
    const allowed = [client_1.UserRole.TENANT_ADMIN, client_1.UserRole.ADMIN];
    if (!req.user || !allowed.includes(req.user.role)) {
        throw new errorHandler_1.AppError('Admin access required', 403);
    }
    next();
};
exports.requireTenantAdmin = requireTenantAdmin;
const requireAuth = (roles) => (req, res, next) => {
    (0, exports.authenticate)(req, res, (err) => {
        if (err)
            return next(err);
        if (roles && req.user && !roles.includes(req.user.role)) {
            return next(new errorHandler_1.AppError('Insufficient permissions', 403));
        }
        next();
    });
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=auth.js.map