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
const parishSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
});
router.get('/', async (req, res, next) => {
    try {
        const parishes = await database_1.default.parish.findMany({
            where: { tenantId: req.tenantId },
            orderBy: { name: 'asc' },
            include: { _count: { select: { members: true } } },
        });
        res.json({ success: true, data: parishes });
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const data = parishSchema.parse(req.body);
        const parish = await database_1.default.parish.create({ data: { tenantId: req.tenantId, ...data, email: data.email || null } });
        res.status(201).json({ success: true, data: parish });
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await database_1.default.parish.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!existing)
            throw new errorHandler_1.AppError('Parish not found', 404);
        const data = parishSchema.partial().parse(req.body);
        const parish = await database_1.default.parish.update({ where: { id: req.params.id }, data: { ...data, email: data.email || null } });
        res.json({ success: true, data: parish });
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const parish = await database_1.default.parish.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!parish)
            throw new errorHandler_1.AppError('Parish not found', 404);
        await database_1.default.parish.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Parish deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=parishes.js.map