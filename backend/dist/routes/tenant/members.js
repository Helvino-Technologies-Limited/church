"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const audit_1 = require("../../utils/audit");
const router = (0, express_1.Router)();
const memberSchema = zod_1.z.object({
    fullname: zod_1.z.string().min(2),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional().or(zod_1.z.literal('')),
    dateOfBirth: zod_1.z.string().optional(),
    maritalStatus: zod_1.z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional().or(zod_1.z.literal('')),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    occupation: zod_1.z.string().optional(),
    employer: zod_1.z.string().optional(),
    parishId: zod_1.z.string().uuid().optional().or(zod_1.z.literal('')),
    ministryId: zod_1.z.string().uuid().optional().or(zod_1.z.literal('')),
    notes: zod_1.z.string().optional(),
});
async function nextMemberNo(tenantId) {
    const last = await database_1.default.member.findFirst({
        where: { tenantId },
        orderBy: { memberNo: 'desc' },
        select: { memberNo: true },
    });
    const prefix = 'MBR';
    const num = last
        ? parseInt(last.memberNo.replace(/\D/g, '')) + 1
        : 1;
    return `${prefix}-${String(num).padStart(4, '0')}`;
}
// GET /api/tenant/members
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const status = req.query.status;
        const parishId = req.query.parishId;
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (search) {
            where.OR = [
                { fullname: { contains: search, mode: 'insensitive' } },
                { memberNo: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status)
            where.status = status;
        if (parishId)
            where.parishId = parishId;
        const [members, total] = await Promise.all([
            database_1.default.member.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    parish: { select: { id: true, name: true } },
                    ministry: { select: { id: true, name: true } },
                },
            }),
            database_1.default.member.count({ where }),
        ]);
        res.json({ success: true, data: members, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/tenant/members/:id
router.get('/:id', async (req, res, next) => {
    try {
        const member = await database_1.default.member.findFirst({
            where: { id: req.params.id, tenantId: req.tenantId },
            include: {
                parish: true,
                ministry: true,
                donations: { orderBy: { donatedAt: 'desc' }, take: 10 },
            },
        });
        if (!member)
            throw new errorHandler_1.AppError('Member not found', 404);
        res.json({ success: true, data: member });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/tenant/members
router.post('/', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const data = memberSchema.parse(req.body);
        const memberNo = await nextMemberNo(tenantId);
        const member = await database_1.default.member.create({
            data: {
                tenantId,
                memberNo,
                fullname: data.fullname,
                email: data.email || null,
                phone: data.phone,
                gender: data.gender ? data.gender : undefined,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                maritalStatus: data.maritalStatus ? data.maritalStatus : undefined,
                address: data.address,
                city: data.city,
                occupation: data.occupation,
                employer: data.employer,
                parishId: data.parishId || null,
                ministryId: data.ministryId || null,
                notes: data.notes,
            },
        });
        await (0, audit_1.createAuditLog)({
            tenantId,
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'MEMBER_CREATED',
            entity: 'Member',
            entityId: member.id,
            details: { fullname: member.fullname, memberNo },
            req,
        });
        res.status(201).json({ success: true, data: member });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/tenant/members/:id
router.put('/:id', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const existing = await database_1.default.member.findFirst({ where: { id: req.params.id, tenantId } });
        if (!existing)
            throw new errorHandler_1.AppError('Member not found', 404);
        const data = memberSchema.partial().parse(req.body);
        const member = await database_1.default.member.update({
            where: { id: req.params.id },
            data: {
                ...data,
                email: data.email || null,
                gender: data.gender ? data.gender : undefined,
                maritalStatus: data.maritalStatus ? data.maritalStatus : undefined,
                parishId: data.parishId || null,
                ministryId: data.ministryId || null,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            },
        });
        await (0, audit_1.createAuditLog)({
            tenantId,
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'MEMBER_UPDATED',
            entity: 'Member',
            entityId: member.id,
            req,
        });
        res.json({ success: true, data: member });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/tenant/members/:id/status
router.patch('/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;
        const member = await database_1.default.member.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
        if (!member)
            throw new errorHandler_1.AppError('Member not found', 404);
        const updated = await database_1.default.member.update({ where: { id: req.params.id }, data: { status } });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/tenant/members/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const member = await database_1.default.member.findFirst({ where: { id: req.params.id, tenantId } });
        if (!member)
            throw new errorHandler_1.AppError('Member not found', 404);
        await database_1.default.member.delete({ where: { id: req.params.id } });
        await (0, audit_1.createAuditLog)({
            tenantId,
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'MEMBER_DELETED',
            entity: 'Member',
            entityId: req.params.id,
            details: { fullname: member.fullname },
            req,
        });
        res.json({ success: true, message: 'Member deleted successfully' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=members.js.map