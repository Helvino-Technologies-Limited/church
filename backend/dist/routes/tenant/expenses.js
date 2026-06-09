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
    description: zod_1.z.string().min(2),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().default('KES'),
    category: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.enum(['CASH', 'MPESA', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER']).default('CASH'),
    paidTo: zod_1.z.string().optional(),
    approvedBy: zod_1.z.string().optional(),
    receiptNo: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    paidAt: zod_1.z.string().optional(),
});
async function nextExpenseNo(tenantId) {
    const count = await database_1.default.expense.count({ where: { tenantId } });
    return `EXP-${String(count + 1).padStart(5, '0')}`;
}
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
            where.OR = [{ description: { contains: search, mode: 'insensitive' } }, { paidTo: { contains: search, mode: 'insensitive' } }];
        if (category)
            where.category = category;
        const [expenses, total, totals] = await Promise.all([
            database_1.default.expense.findMany({ where, skip, take: limit, orderBy: { paidAt: 'desc' } }),
            database_1.default.expense.count({ where }),
            database_1.default.expense.aggregate({ where: { tenantId }, _sum: { amount: true } }),
        ]);
        res.json({
            success: true,
            data: expenses,
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
        const data = schema.parse(req.body);
        const expenseNo = await nextExpenseNo(tenantId);
        const expense = await database_1.default.expense.create({
            data: {
                tenantId, expenseNo,
                description: data.description,
                amount: data.amount, currency: data.currency,
                category: data.category, paymentMethod: data.paymentMethod,
                paidTo: data.paidTo, approvedBy: data.approvedBy,
                receiptNo: data.receiptNo || `RCP-${Date.now().toString(36).toUpperCase()}`,
                notes: data.notes,
                paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
            },
        });
        res.status(201).json({ success: true, data: expense });
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await database_1.default.expense.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!existing)
            throw new errorHandler_1.AppError('Expense not found', 404);
        const data = schema.partial().parse(req.body);
        const expense = await database_1.default.expense.update({
            where: { id: req.params.id },
            data: { ...data, paidAt: data.paidAt ? new Date(data.paidAt) : undefined },
        });
        res.json({ success: true, data: expense });
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const expense = await database_1.default.expense.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!expense)
            throw new errorHandler_1.AppError('Expense not found', 404);
        await database_1.default.expense.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Expense deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=expenses.js.map