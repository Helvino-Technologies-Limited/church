import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../utils/audit';

const router = Router();

const visitorSchema = z.object({
  fullname: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().or(z.literal('')),
  ageGroup: z.string().optional(),
  visitDate: z.string().optional(),
  invitedBy: z.string().optional(),
  howHeard: z.string().optional(),
  purposeOfVisit: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/tenant/visitors
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const followedUp = req.query.followedUp as string;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (dateFrom || dateTo) {
      where.visitDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
      };
    }
    if (followedUp === 'true') where.followedUp = true;
    if (followedUp === 'false') where.followedUp = false;

    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({ where, skip, take: limit, orderBy: { visitDate: 'desc' } }),
      prisma.visitor.count({ where }),
    ]);

    res.json({ success: true, data: visitors, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// POST /api/tenant/visitors
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const data = visitorSchema.parse(req.body);
    const visitor = await prisma.visitor.create({
      data: {
        tenantId,
        fullname: data.fullname,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
        gender: (data.gender as any) || null,
        ageGroup: data.ageGroup,
        visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
        invitedBy: data.invitedBy,
        howHeard: data.howHeard,
        purposeOfVisit: data.purposeOfVisit,
        notes: data.notes,
      },
    });
    await createAuditLog({ tenantId, userId: req.user!.userId, userEmail: req.user!.email, action: 'VISITOR_REGISTERED', entity: 'Visitor', entityId: visitor.id, details: { fullname: visitor.fullname }, req });
    res.status(201).json({ success: true, data: visitor });
  } catch (err) { next(err); }
});

// PUT /api/tenant/visitors/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const existing = await prisma.visitor.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new AppError('Visitor not found', 404);
    const data = visitorSchema.partial().parse(req.body);
    const visitor = await prisma.visitor.update({
      where: { id: req.params.id },
      data: {
        ...data,
        email: data.email || null,
        gender: (data.gender as any) || undefined,
        visitDate: data.visitDate ? new Date(data.visitDate) : undefined,
      },
    });
    res.json({ success: true, data: visitor });
  } catch (err) { next(err); }
});

// PATCH /api/tenant/visitors/:id/follow-up
router.patch('/:id/follow-up', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const existing = await prisma.visitor.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new AppError('Visitor not found', 404);
    const { followedUp, followUpNote, followUpDate } = req.body;
    const visitor = await prisma.visitor.update({
      where: { id: req.params.id },
      data: { followedUp, followUpNote, followUpDate: followUpDate ? new Date(followUpDate) : null },
    });
    res.json({ success: true, data: visitor });
  } catch (err) { next(err); }
});

// DELETE /api/tenant/visitors/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const existing = await prisma.visitor.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new AppError('Visitor not found', 404);
    await prisma.visitor.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Visitor deleted' });
  } catch (err) { next(err); }
});

export default router;
