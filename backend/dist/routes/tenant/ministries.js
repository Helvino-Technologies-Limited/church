"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
const schema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    leaderId: zod_1.z.string().uuid().optional().or(zod_1.z.literal('')),
});
router.get('/', async (req, res, next) => {
    try {
        const ministries = await database_1.default.ministry.findMany({
            where: { tenantId: req.tenantId },
            orderBy: { name: 'asc' },
            include: { _count: { select: { members: true } } },
        });
        res.json({ success: true, data: ministries });
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const ministry = await database_1.default.ministry.findFirst({
            where: { id: req.params.id, tenantId: req.tenantId },
            include: { members: { select: { id: true, fullname: true, memberNo: true, phone: true, status: true } }, _count: { select: { members: true } } },
        });
        if (!ministry)
            throw new errorHandler_1.AppError('Ministry not found', 404);
        res.json({ success: true, data: ministry });
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const data = schema.parse(req.body);
        const ministry = await database_1.default.ministry.create({
            data: { tenantId: req.tenantId, ...data, leaderId: data.leaderId || null },
        });
        res.status(201).json({ success: true, data: ministry });
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await database_1.default.ministry.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!existing)
            throw new errorHandler_1.AppError('Ministry not found', 404);
        const data = schema.partial().parse(req.body);
        const ministry = await database_1.default.ministry.update({ where: { id: req.params.id }, data: { ...data, leaderId: data.leaderId || null } });
        res.json({ success: true, data: ministry });
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const ministry = await database_1.default.ministry.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!ministry)
            throw new errorHandler_1.AppError('Ministry not found', 404);
        await database_1.default.ministry.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Ministry deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=ministries.js.map