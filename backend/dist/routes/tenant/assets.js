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
const assetSchema = zod_1.z.object({
    assetName: zod_1.z.string().min(2),
    assetCode: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    assetValue: zod_1.z.number().optional(),
    location: zod_1.z.string().optional(),
    status: zod_1.z.string().default('ACTIVE'),
    condition: zod_1.z.string().optional(),
    purchasedAt: zod_1.z.string().optional(),
});
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (search)
            where.OR = [{ assetName: { contains: search, mode: 'insensitive' } }, { category: { contains: search, mode: 'insensitive' } }];
        const [assets, total, totalValue] = await Promise.all([
            database_1.default.asset.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
            database_1.default.asset.count({ where }),
            database_1.default.asset.aggregate({ where, _sum: { assetValue: true } }),
        ]);
        res.json({
            success: true,
            data: assets,
            summary: { totalValue: totalValue._sum.assetValue || 0 },
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const data = assetSchema.parse(req.body);
        const count = await database_1.default.asset.count({ where: { tenantId } });
        const assetCode = data.assetCode || `AST-${String(count + 1).padStart(4, '0')}`;
        const asset = await database_1.default.asset.create({
            data: { tenantId, ...data, assetCode, purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : null },
        });
        res.status(201).json({ success: true, data: asset });
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await database_1.default.asset.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!existing)
            throw new errorHandler_1.AppError('Asset not found', 404);
        const data = assetSchema.partial().parse(req.body);
        const asset = await database_1.default.asset.update({
            where: { id: req.params.id },
            data: { ...data, purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : undefined },
        });
        res.json({ success: true, data: asset });
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const asset = await database_1.default.asset.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!asset)
            throw new errorHandler_1.AppError('Asset not found', 404);
        await database_1.default.asset.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Asset deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=assets.js.map