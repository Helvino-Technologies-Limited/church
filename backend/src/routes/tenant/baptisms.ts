import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../utils/audit';

const router = Router();

const baptismSchema = z.object({
  memberId: z.string().uuid(),
  baptismDate: z.string(),
  baptismType: z.enum(['WATER', 'HOLY_SPIRIT', 'BOTH']).default('WATER'),
  officiantName: z.string().optional(),
  venue: z.string().optional(),
  witnesses: z.string().optional(),
  photo: z.string().optional(),
  notes: z.string().optional(),
});

async function nextCertNo(tenantId: string): Promise<string> {
  const count = await prisma.baptism.count({ where: { tenantId } });
  return `BAPT-${String(count + 1).padStart(4, '0')}`;
}

// GET /api/tenant/baptisms
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (search) {
      where.OR = [
        { member: { fullname: { contains: search, mode: 'insensitive' } } },
        { certificateNo: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [baptisms, total] = await Promise.all([
      prisma.baptism.findMany({
        where,
        skip,
        take: limit,
        orderBy: { baptismDate: 'desc' },
        include: { member: { select: { id: true, fullname: true, memberNo: true, phone: true, email: true } } },
      }),
      prisma.baptism.count({ where }),
    ]);

    res.json({ success: true, data: baptisms, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// POST /api/tenant/baptisms
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const data = baptismSchema.parse(req.body);
    const certNo = await nextCertNo(tenantId);

    // Verify member belongs to tenant
    const member = await prisma.member.findFirst({ where: { id: data.memberId, tenantId } });
    if (!member) throw new AppError('Member not found', 404);

    const baptism = await prisma.baptism.create({
      data: {
        tenantId,
        memberId: data.memberId,
        certificateNo: certNo,
        baptismDate: new Date(data.baptismDate),
        baptismType: data.baptismType,
        officiantName: data.officiantName,
        venue: data.venue,
        witnesses: data.witnesses,
        photo: data.photo,
        notes: data.notes,
      },
      include: { member: { select: { id: true, fullname: true, memberNo: true } } },
    });

    await createAuditLog({ tenantId, userId: req.user!.userId, userEmail: req.user!.email, action: 'BAPTISM_RECORDED', entity: 'Baptism', entityId: baptism.id, details: { member: member.fullname, certNo }, req });
    res.status(201).json({ success: true, data: baptism });
  } catch (err) { next(err); }
});

// PUT /api/tenant/baptisms/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const existing = await prisma.baptism.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new AppError('Baptism record not found', 404);
    if (existing.status === 'APPROVED') throw new AppError('Cannot edit an approved baptism record', 400);

    const data = baptismSchema.partial().parse(req.body);
    const baptism = await prisma.baptism.update({
      where: { id: req.params.id },
      data: {
        ...data,
        baptismDate: data.baptismDate ? new Date(data.baptismDate) : undefined,
      },
      include: { member: { select: { id: true, fullname: true, memberNo: true } } },
    });
    res.json({ success: true, data: baptism });
  } catch (err) { next(err); }
});

// PATCH /api/tenant/baptisms/:id/photo  — update just the photo (base64)
router.patch('/:id/photo', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const existing = await prisma.baptism.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new AppError('Baptism record not found', 404);
    const { photo } = req.body;
    const baptism = await prisma.baptism.update({ where: { id: req.params.id }, data: { photo } });
    res.json({ success: true, data: baptism });
  } catch (err) { next(err); }
});

// PATCH /api/tenant/baptisms/:id/approve
router.patch('/:id/approve', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const existing = await prisma.baptism.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new AppError('Baptism record not found', 404);

    const baptism = await prisma.baptism.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', approvedById: req.user!.userId, approvedAt: new Date() },
      include: { member: { select: { id: true, fullname: true, memberNo: true } } },
    });

    // Update member's baptisedAt date if not already set
    await prisma.member.updateMany({
      where: { id: existing.memberId, baptisedAt: null },
      data: { baptisedAt: existing.baptismDate },
    });

    await createAuditLog({ tenantId, userId: req.user!.userId, userEmail: req.user!.email, action: 'BAPTISM_APPROVED', entity: 'Baptism', entityId: baptism.id, details: { certNo: baptism.certificateNo }, req });
    res.json({ success: true, data: baptism });
  } catch (err) { next(err); }
});

// PATCH /api/tenant/baptisms/:id/reject
router.patch('/:id/reject', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const existing = await prisma.baptism.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new AppError('Baptism record not found', 404);
    const { reason } = req.body;
    const baptism = await prisma.baptism.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', rejectedReason: reason },
      include: { member: { select: { id: true, fullname: true, memberNo: true } } },
    });
    res.json({ success: true, data: baptism });
  } catch (err) { next(err); }
});

// DELETE /api/tenant/baptisms/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const existing = await prisma.baptism.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new AppError('Baptism record not found', 404);
    if (existing.status === 'APPROVED') throw new AppError('Cannot delete an approved baptism record', 400);
    await prisma.baptism.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Baptism record deleted' });
  } catch (err) { next(err); }
});

export default router;
