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
    employeeId: zod_1.z.string().uuid(),
    period: zod_1.z.string(),
    basicSalary: zod_1.z.number().positive(),
    allowances: zod_1.z.number().min(0).default(0),
    deductions: zod_1.z.number().min(0).default(0),
    paymentMethod: zod_1.z.enum(['CASH', 'MPESA', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER']).default('BANK_TRANSFER'),
    notes: zod_1.z.string().optional(),
    status: zod_1.z.enum(['PENDING', 'APPROVED', 'PAID']).default('PENDING'),
});
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const period = req.query.period;
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (period)
            where.period = { contains: period };
        const [payrolls, total, totals] = await Promise.all([
            database_1.default.payroll.findMany({
                where, skip, take: limit, orderBy: { createdAt: 'desc' },
                include: { employee: { select: { id: true, fullname: true, employeeNo: true, department: true, position: true } } },
            }),
            database_1.default.payroll.count({ where }),
            database_1.default.payroll.aggregate({ where: { tenantId }, _sum: { netPay: true, basicSalary: true, allowances: true, deductions: true } }),
        ]);
        res.json({ success: true, data: payrolls, summary: totals._sum, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const data = schema.parse(req.body);
        const netPay = data.basicSalary + data.allowances - data.deductions;
        const employee = await database_1.default.employee.findFirst({ where: { id: data.employeeId, tenantId } });
        if (!employee)
            throw new errorHandler_1.AppError('Employee not found', 404);
        const payroll = await database_1.default.payroll.create({
            data: { tenantId, employeeId: data.employeeId, period: data.period, basicSalary: data.basicSalary, allowances: data.allowances, deductions: data.deductions, netPay, paymentMethod: data.paymentMethod, notes: data.notes, status: data.status },
            include: { employee: { select: { id: true, fullname: true, employeeNo: true } } },
        });
        res.status(201).json({ success: true, data: payroll });
    }
    catch (err) {
        next(err);
    }
});
router.patch('/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;
        const existing = await database_1.default.payroll.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!existing)
            throw new errorHandler_1.AppError('Payroll record not found', 404);
        const updated = await database_1.default.payroll.update({ where: { id: req.params.id }, data: { status, paidAt: status === 'PAID' ? new Date() : null } });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await database_1.default.payroll.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!existing)
            throw new errorHandler_1.AppError('Record not found', 404);
        await database_1.default.payroll.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Payroll record deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=payroll.js.map