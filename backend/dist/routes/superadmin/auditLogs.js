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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const action = req.query.action;
        const skip = (page - 1) * limit;
        const where = {};
        if (action)
            where.action = action;
        if (search) {
            where.OR = [
                { userEmail: { contains: search, mode: 'insensitive' } },
                { entity: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [logs, total] = await Promise.all([
            database_1.default.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, fullname: true, email: true, role: true } },
                    tenant: { select: { id: true, name: true } },
                },
            }),
            database_1.default.auditLog.count({ where }),
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
//# sourceMappingURL=auditLogs.js.map