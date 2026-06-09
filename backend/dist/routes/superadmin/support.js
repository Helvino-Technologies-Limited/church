"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
// GET /superadmin/support — list all tickets
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        const [tickets, total] = await Promise.all([
            database_1.default.supportTicket.findMany({
                where, skip, take: limit, orderBy: { createdAt: 'desc' },
                include: { tenant: { select: { id: true, name: true, email: true } } },
            }),
            database_1.default.supportTicket.count({ where }),
        ]);
        res.json({ success: true, data: tickets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }
    catch (err) {
        next(err);
    }
});
// POST /superadmin/support/:id/reply
router.post('/:id/reply', async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message)
            throw new errorHandler_1.AppError('Message is required', 400);
        const ticket = await database_1.default.supportTicket.findFirst({ where: { id: req.params.id } });
        if (!ticket)
            throw new errorHandler_1.AppError('Ticket not found', 404);
        const updated = await database_1.default.supportTicket.update({
            where: { id: req.params.id },
            data: { response: message, status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status },
        });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /superadmin/support/:id/status
router.patch('/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;
        const updated = await database_1.default.supportTicket.update({
            where: { id: req.params.id },
            data: { status, resolvedAt: status === 'RESOLVED' ? new Date() : undefined },
        });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        next(err);
    }
});
// Tenant-facing: POST to submit a support ticket
router.post('/', async (req, res, next) => {
    try {
        const { subject, message, category, priority } = req.body;
        if (!subject || !message)
            throw new errorHandler_1.AppError('Subject and message are required', 400);
        const ticket = await database_1.default.supportTicket.create({
            data: { tenantId: req.tenantId || null, subject, message, category, priority: priority || 'MEDIUM' },
        });
        res.status(201).json({ success: true, data: ticket });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=support.js.map