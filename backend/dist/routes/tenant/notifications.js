"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../../config/database"));
const router = (0, express_1.Router)();
// GET /api/tenant/notifications — last 15 audit log entries for the tenant
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const logs = await database_1.default.auditLog.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 15,
            select: {
                id: true,
                action: true,
                entity: true,
                details: true,
                userEmail: true,
                createdAt: true,
            },
        });
        res.json({ success: true, data: logs });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map