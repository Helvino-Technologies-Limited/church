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
    date: zod_1.z.string(),
    serviceType: zod_1.z.string().optional(),
    adults: zod_1.z.number().int().min(0).default(0),
    children: zod_1.z.number().int().min(0).default(0),
    visitors: zod_1.z.number().int().min(0).default(0),
    notes: zod_1.z.string().optional(),
    parishId: zod_1.z.string().uuid().optional().or(zod_1.z.literal('')),
});
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [records, total, totals] = await Promise.all([
            database_1.default.attendance.findMany({
                where: { tenantId },
                skip, take: limit,
                orderBy: { date: 'desc' },
                include: { parish: { select: { id: true, name: true } } },
            }),
            database_1.default.attendance.count({ where: { tenantId } }),
            database_1.default.attendance.aggregate({ where: { tenantId }, _sum: { adults: true, children: true, visitors: true, total: true }, _avg: { total: true } }),
        ]);
        res.json({ success: true, data: records, summary: totals._sum, avgAttendance: Math.round(totals._avg.total || 0), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const data = schema.parse(req.body);
        const total = data.adults + data.children + data.visitors;
        const record = await database_1.default.attendance.create({
            data: {
                tenantId,
                date: new Date(data.date),
                serviceType: data.serviceType,
                adults: data.adults, children: data.children,
                visitors: data.visitors, total,
                notes: data.notes,
                parishId: data.parishId || null,
            },
        });
        res.status(201).json({ success: true, data: record });
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await database_1.default.attendance.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!existing)
            throw new errorHandler_1.AppError('Record not found', 404);
        const data = schema.partial().parse(req.body);
        const total = (data.adults ?? existing.adults) + (data.children ?? existing.children) + (data.visitors ?? existing.visitors);
        const record = await database_1.default.attendance.update({
            where: { id: req.params.id },
            data: { ...data, total, date: data.date ? new Date(data.date) : undefined, parishId: data.parishId || null },
        });
        res.json({ success: true, data: record });
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await database_1.default.attendance.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!existing)
            throw new errorHandler_1.AppError('Record not found', 404);
        await database_1.default.attendance.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Record deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=attendance.js.map