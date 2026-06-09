import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../utils/audit';

const router = Router();

const memberSchema = z.object({
  fullname: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  parishId: z.string().uuid().optional().or(z.literal('')),
  ministryId: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional(),
});

async function nextMemberNo(tenantId: string): Promise<string> {
  const last = await prisma.member.findFirst({
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
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const parishId = req.query.parishId as string;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: 'insensitive' } },
        { memberNo: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (parishId) where.parishId = parishId;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          parish: { select: { id: true, name: true } },
          ministry: { select: { id: true, name: true } },
        },
      }),
      prisma.member.count({ where }),
    ]);

    res.json({ success: true, data: members, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

// GET /api/tenant/members/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const member = await prisma.member.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
      include: {
        parish: true,
        ministry: true,
        donations: { orderBy: { donatedAt: 'desc' }, take: 10 },
      },
    });
    if (!member) throw new AppError('Member not found', 404);
    res.json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
});

// POST /api/tenant/members
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const data = memberSchema.parse(req.body);
    const memberNo = await nextMemberNo(tenantId);

    const member = await prisma.member.create({
      data: {
        tenantId,
        memberNo,
        fullname: data.fullname,
        email: data.email || null,
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        maritalStatus: data.maritalStatus,
        address: data.address,
        city: data.city,
        occupation: data.occupation,
        employer: data.employer,
        parishId: data.parishId || null,
        ministryId: data.ministryId || null,
        notes: data.notes,
      },
    });

    await createAuditLog({
      tenantId,
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'MEMBER_CREATED',
      entity: 'Member',
      entityId: member.id,
      details: { fullname: member.fullname, memberNo },
      req,
    });

    res.status(201).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tenant/members/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const existing = await prisma.member.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new AppError('Member not found', 404);

    const data = memberSchema.partial().parse(req.body);

    const member = await prisma.member.update({
      where: { id: req.params.id },
      data: {
        ...data,
        email: data.email || null,
        parishId: data.parishId || null,
        ministryId: data.ministryId || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });

    await createAuditLog({
      tenantId,
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'MEMBER_UPDATED',
      entity: 'Member',
      entityId: member.id,
      req,
    });

    res.json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tenant/members/:id/status
router.patch('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const member = await prisma.member.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!member) throw new AppError('Member not found', 404);

    const updated = await prisma.member.update({ where: { id: req.params.id }, data: { status } });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tenant/members/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const member = await prisma.member.findFirst({ where: { id: req.params.id, tenantId } });
    if (!member) throw new AppError('Member not found', 404);

    await prisma.member.delete({ where: { id: req.params.id } });

    await createAuditLog({
      tenantId,
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'MEMBER_DELETED',
      entity: 'Member',
      entityId: req.params.id,
      details: { fullname: member.fullname },
      req,
    });

    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
