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
    title: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string().optional(),
    allDay: zod_1.z.boolean().default(false),
    category: zod_1.z.string().optional(),
    status: zod_1.z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).default('UPCOMING'),
});
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (status)
            where.status = status;
        const [events, total] = await Promise.all([
            database_1.default.event.findMany({ where, skip, take: limit, orderBy: { startDate: 'desc' } }),
            database_1.default.event.count({ where }),
        ]);
        res.json({ success: true, data: events, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const data = schema.parse(req.body);
        const event = await database_1.default.event.create({
            data: {
                tenantId: req.tenantId,
                title: data.title, description: data.description, location: data.location,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : null,
                allDay: data.allDay, category: data.category, status: data.status,
            },
        });
        res.status(201).json({ success: true, data: event });
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await database_1.default.event.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!existing)
            throw new errorHandler_1.AppError('Event not found', 404);
        const data = schema.partial().parse(req.body);
        const event = await database_1.default.event.update({
            where: { id: req.params.id },
            data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined, endDate: data.endDate ? new Date(data.endDate) : null },
        });
        res.json({ success: true, data: event });
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const event = await database_1.default.event.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!event)
            throw new errorHandler_1.AppError('Event not found', 404);
        await database_1.default.event.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Event deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=events.js.map