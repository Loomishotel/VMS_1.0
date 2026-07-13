import { Router, Response } from 'express';
import { prisma } from '@vms/database';
import { authenticateToken, requirePermission, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /visitors - Search and retrieve visitor profiles
router.get('/', authenticateToken as any, requirePermission('visitor.view') as any, async (req: any, res: Response) => {
  const { search } = req.query;

  try {
    const visitors = await prisma.visitor.findMany({
      where: search ? {
        OR: [
          { fullName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { company: { contains: search as string, mode: 'insensitive' } }
        ]
      } : undefined,
      orderBy: { fullName: 'asc' }
    });

    return res.json({
      success: true,
      data: visitors
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// GET /visitors/blacklist - View list of all blacklisted people
router.get('/blacklist', authenticateToken as any, requirePermission('blacklist.manage') as any, async (req: any, res: Response) => {
  try {
    const list = await prisma.blacklist.findMany({
      include: {
        addedByUser: { select: { fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({
      success: true,
      data: list
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// POST /visitors/blacklist - Add a person to the blacklist
router.post('/blacklist', authenticateToken as any, requirePermission('blacklist.manage') as any, async (req: AuthenticatedRequest, res: Response) => {
  const { fullName, idDocumentNumber, reason, severity, visitorId } = req.body;

  if (!fullName || !reason) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Name and reason are required for blacklisting' }
    });
  }

  try {
    const blacklistRecord = await prisma.$transaction(async (tx) => {
      // 1. Create blacklist row
      const record = await tx.blacklist.create({
        data: {
          fullName,
          idDocumentNumber,
          reason,
          severity: severity || 'Medium',
          addedByUserId: req.user!.id,
          visitorId: visitorId || undefined
        }
      });

      // 2. If it's a known visitor, flag their visitor record
      if (visitorId) {
        await tx.visitor.update({
          where: { id: visitorId },
          data: { isBlacklisted: true }
        });
      } else {
        // Search by exact name match and flag them
        await tx.visitor.updateMany({
          where: { fullName: { equals: fullName, mode: 'insensitive' } },
          data: { isBlacklisted: true }
        });
      }

      return record;
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'BLACKLIST_ADD',
        entityType: 'Blacklist',
        entityId: blacklistRecord.id,
        afterState: JSON.parse(JSON.stringify(blacklistRecord))
      }
    });

    return res.status(201).json({
      success: true,
      data: blacklistRecord
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// DELETE /visitors/blacklist/:id - Remove a person from blacklist
router.delete('/blacklist/:id', authenticateToken as any, requirePermission('blacklist.manage') as any, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const record = await prisma.blacklist.findUnique({ where: { id } });
    if (!record) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Blacklist record not found' } });
    }

    await prisma.$transaction(async (tx) => {
      await tx.blacklist.delete({ where: { id } });

      // Unflag the visitor if linked
      if (record.visitorId) {
        await tx.visitor.update({
          where: { id: record.visitorId },
          data: { isBlacklisted: false }
        });
      } else {
        await tx.visitor.updateMany({
          where: { fullName: { equals: record.fullName, mode: 'insensitive' } },
          data: { isBlacklisted: false }
        });
      }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'BLACKLIST_REMOVE',
        entityType: 'Blacklist',
        entityId: id,
        beforeState: JSON.parse(JSON.stringify(record))
      }
    });

    return res.json({ success: true, message: 'Person removed from blacklist successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// GET /visitors/:id - Detailed profile + history
router.get('/:id', authenticateToken as any, requirePermission('visitor.view') as any, async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: {
        visits: {
          include: {
            host: true
          },
          orderBy: { createdAt: 'desc' }
        },
        documents: true
      }
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Visitor profile not found' }
      });
    }

    return res.json({
      success: true,
      data: visitor
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// POST /visitors - Create manual visitor profile
router.post('/', authenticateToken as any, requirePermission('visitor.create') as any, async (req: AuthenticatedRequest, res: Response) => {
  const { fullName, email, phone, company, visitorType, location } = req.body;

  if (!fullName) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Full name is required' }
    });
  }

  try {
    // Check if name is blacklisted
    const blacklisted = await prisma.blacklist.findFirst({
      where: { fullName: { equals: fullName, mode: 'insensitive' } }
    });

    const visitor = await prisma.visitor.create({
      data: {
        fullName,
        email,
        phone,
        company,
        visitorType: visitorType || 'Guest',
        isBlacklisted: !!blacklisted,
        location
      }
    });

    return res.status(201).json({
      success: true,
      data: visitor
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

export default router;
