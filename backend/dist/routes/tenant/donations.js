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
const donationSchema = zod_1.z.object({
    memberId: zod_1.z.string().uuid().optional().or(zod_1.z.literal('')),
    memberName: zod_1.z.string().optional(),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().default('KES'),
    paymentMethod: zod_1.z.enum(['CASH', 'MPESA', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER']).default('CASH'),
    category: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    receiptNo: zod_1.z.string().optional(),
    donatedAt: zod_1.z.string().optional(),
});
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const category = req.query.category;
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (search)
            where.OR = [{ memberName: { contains: search, mode: 'insensitive' } }, { receiptNo: { contains: search } }];
        if (category)
            where.category = category;
        const [donations, total, totals] = await Promise.all([
            database_1.default.donation.findMany({ where, skip, take: limit, orderBy: { donatedAt: 'desc' } }),
            database_1.default.donation.count({ where }),
            database_1.default.donation.aggregate({ where, _sum: { amount: true } }),
        ]);
        res.json({
            success: true,
            data: donations,
            summary: { totalAmount: totals._sum.amount || 0 },
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
        const data = donationSchema.parse(req.body);
        const donation = await database_1.default.donation.create({
            data: {
                tenantId,
                memberId: data.memberId || null,
                memberName: data.memberName,
                amount: data.amount,
                currency: data.currency,
                paymentMethod: data.paymentMethod,
                category: data.category,
                description: data.description,
                receiptNo: data.receiptNo || `RCP-${Date.now().toString(36).toUpperCase()}`,
                donatedAt: data.donatedAt ? new Date(data.donatedAt) : new Date(),
            },
        });
        res.status(201).json({ success: true, data: donation });
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const donation = await database_1.default.donation.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!donation)
            throw new errorHandler_1.AppError('Donation not found', 404);
        await database_1.default.donation.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Donation deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=donations.js.map