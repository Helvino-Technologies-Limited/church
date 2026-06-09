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
const employeeSchema = zod_1.z.object({
    fullname: zod_1.z.string().min(2),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    position: zod_1.z.string().optional(),
    salary: zod_1.z.number().optional(),
    startDate: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
async function nextEmployeeNo(tenantId) {
    const last = await database_1.default.employee.findFirst({ where: { tenantId }, orderBy: { employeeNo: 'desc' }, select: { employeeNo: true } });
    const num = last ? parseInt(last.employeeNo.replace(/\D/g, '')) + 1 : 1;
    return `EMP-${String(num).padStart(4, '0')}`;
}
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (search)
            where.OR = [
                { fullname: { contains: search, mode: 'insensitive' } },
                { department: { contains: search, mode: 'insensitive' } },
            ];
        const [employees, total] = await Promise.all([
            database_1.default.employee.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
            database_1.default.employee.count({ where }),
        ]);
        res.json({ success: true, data: employees, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const data = employeeSchema.parse(req.body);
        const employeeNo = await nextEmployeeNo(tenantId);
        const employee = await database_1.default.employee.create({
            data: {
                tenantId,
                employeeNo,
                fullname: data.fullname,
                email: data.email || null,
                phone: data.phone,
                department: data.department,
                position: data.position,
                salary: data.salary,
                startDate: data.startDate ? new Date(data.startDate) : null,
                notes: data.notes,
            },
        });
        res.status(201).json({ success: true, data: employee });
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const existing = await database_1.default.employee.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!existing)
            throw new errorHandler_1.AppError('Employee not found', 404);
        const data = employeeSchema.partial().parse(req.body);
        const employee = await database_1.default.employee.update({
            where: { id: req.params.id },
            data: { ...data, email: data.email || null, startDate: data.startDate ? new Date(data.startDate) : undefined },
        });
        res.json({ success: true, data: employee });
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const employee = await database_1.default.employee.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!employee)
            throw new errorHandler_1.AppError('Employee not found', 404);
        await database_1.default.employee.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Employee deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=employees.js.map