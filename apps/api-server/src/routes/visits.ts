import { Router, Response } from 'express';
import { prisma } from '@vms/database';
import { authenticateToken, requirePermission, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /visits/queue - Fetch today's visit queue
router.get('/queue', authenticateToken as any, async (req: AuthenticatedRequest, res: Response) => {
  const { date } = req.query;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const visits = await prisma.visit.findMany({
      where: {
        branchId: req.user!.branchId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        visitor: true,
        host: {
          include: { department: true }
        },
        badge: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format DTO
    const data = visits.map((v: any) => ({
      id: v.id,
      visitorId: v.visitorId,
      visitorName: v.visitor.fullName,
      visitorEmail: v.visitor.email || '',
      visitorPhone: v.visitor.phone || '',
      visitorCompany: v.visitor.company || '',
      visitorType: v.visitor.visitorType,
      hostId: v.hostEmployeeId,
      hostName: v.host.fullName,
      hostEmail: v.host.email,
      hostPhone: v.host.phone,
      purpose: v.purpose,
      status: v.status,
      scheduledAt: v.scheduledAt?.toISOString(),
      checkedInAt: v.checkedInAt?.toISOString(),
      checkedOutAt: v.checkedOutAt?.toISOString(),
      deniedReason: v.deniedReason || '',
      zoneAccess: v.zoneAccess || '',
      photoUrl: v.visitor.photoUrl || ''
    }));

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// POST /visits/pre-register - Host schedules an invitation
router.post('/pre-register', authenticateToken as any, async (req: AuthenticatedRequest, res: Response) => {
  const { fullName, email, phone, company, visitorType, hostEmployeeId, purpose, scheduledAt } = req.body;

  if (!fullName || !hostEmployeeId || !purpose || !scheduledAt) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Name, host, purpose, and scheduled time are required' }
    });
  }

  try {
    const invitation = await prisma.$transaction(async (tx: any) => {
      // 1. Check/Create Visitor
      let visitor = await tx.visitor.findFirst({
        where: email ? { email } : { fullName: { equals: fullName, mode: 'insensitive' } }
      });

      if (!visitor) {
        const blacklisted = await tx.blacklist.findFirst({
          where: {
            fullName: { equals: fullName, mode: 'insensitive' },
            addedByUser: { branchId: req.user!.branchId }
          }
        });

        visitor = await tx.visitor.create({
          data: {
            fullName,
            email,
            phone,
            company,
            visitorType: visitorType || 'Guest',
            isBlacklisted: !!blacklisted
          }
        });
      }

      // 1b. Check if visitor is blacklisted at this branch
      const isBl = await tx.blacklist.findFirst({
        where: {
          OR: [
            { visitorId: visitor.id },
            { fullName: { equals: visitor.fullName, mode: 'insensitive' } }
          ],
          addedByUser: { branchId: req.user!.branchId }
        }
      });
      if (isBl) {
        throw new Error('Visitor is blacklisted at this branch and cannot be pre-registered');
      }

      // 2. Generate unique QR token
      const qrToken = `QR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // 3. Create Invitation
      const invite = await tx.invitation.create({
        data: {
          visitorId: visitor.id,
          hostEmployeeId,
          qrToken,
          scheduledAt: new Date(scheduledAt),
          expiresAt: new Date(new Date(scheduledAt).getTime() + 86400000) // Expiry +24 hours
        },
        include: { visitor: true, host: true }
      });

      // 4. Pre-create Visit shell in Expected status
      await tx.visit.create({
        data: {
          visitorId: visitor.id,
          hostEmployeeId,
          invitationId: invite.id,
          branchId: req.user!.branchId,
          purpose,
          status: 'Expected',
          scheduledAt: new Date(scheduledAt)
        }
      });

      // 5. Queue Notification
      await tx.notification.create({
        data: {
          recipientVisitorId: visitor.id,
          channel: 'Email',
          message: `Hello ${visitor.fullName}, you have been invited to visit by ${invite.host.fullName}. Please scan your QR code ${qrToken} at the kiosk upon arrival on ${new Date(scheduledAt).toLocaleString()}.`,
          status: 'Queued'
        }
      });

      return invite;
    });

    return res.status(201).json({
      success: true,
      data: {
        id: invitation.id,
        qrToken: invitation.qrToken,
        scheduledAt: invitation.scheduledAt.toISOString(),
        visitor: invitation.visitor.fullName
      }
    });
  } catch (error: any) {
    if (error.message && error.message.includes('Visitor is blacklisted')) {
      return res.status(403).json({
        success: false,
        error: { code: 'VISITOR_BLACKLISTED', message: error.message }
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// POST /visits/checkin - Process Check-in (can be QR-based or Walk-in)
router.post('/checkin', async (req: any, res: Response) => {
  const { qrToken, walkIn, branchId } = req.body;
  const targetBranchId = branchId || 'default-branch-uuid';

  try {
    // SCENARIO A: QR Check-in
    if (qrToken) {
      const invitation = await prisma.invitation.findUnique({
        where: { qrToken },
        include: { visitor: true, host: true }
      });

      if (!invitation || invitation.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invitation QR code is invalid or has expired' }
        });
      }

      const isBlacklistedAtBranch = await prisma.blacklist.findFirst({
        where: {
          visitorId: invitation.visitorId,
          addedByUser: { branchId: targetBranchId }
        }
      });

      if (isBlacklistedAtBranch) {
        return res.status(403).json({
          success: false,
          error: { code: 'VISITOR_BLACKLISTED', message: 'Visitor is currently flagged on the blacklist. Entry Denied.' }
        });
      }

      const activeVisit = await prisma.visit.findFirst({
        where: { invitationId: invitation.id }
      });

      if (!activeVisit) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'No visit record linked to this invitation' }
        });
      }

      if (activeVisit.status !== 'Expected') {
        return res.status(400).json({
          success: false,
          error: { code: 'ALREADY_CHECKED_IN', message: 'Visitor has already checked in' }
        });
      }

      // Transition Visit to CheckedIn
      const updatedVisit = await prisma.$transaction(async (tx: any) => {
        const visit = await tx.visit.update({
          where: { id: activeVisit.id },
          data: {
            status: 'CheckedIn',
            checkedInAt: new Date(),
            zoneAccess: 'Floor 1, Lobby'
          },
          include: { visitor: true, host: true }
        });

        // Generate print badge record
        const badgeNumber = `BDG-${Math.floor(100000 + Math.random() * 900000)}`;
        await tx.badge.create({
          data: {
            visitId: visit.id,
            badgeNumber,
            printedAt: new Date(),
            printCount: 1
          }
        });

        // Queue notifications for Host
        await tx.notification.create({
          data: {
            recipientUserId: undefined, // Send to host employee user if registered
            channel: 'Email',
            message: `Hello ${visit.host.fullName}, your guest ${visit.visitor.fullName} has checked in and is waiting in the lobby.`,
            status: 'Queued',
            visitId: visit.id
          }
        });

        return visit;
      });

      return res.json({
        success: true,
        data: {
          visitId: updatedVisit.id,
          visitorName: updatedVisit.visitor.fullName,
          hostName: updatedVisit.host.fullName,
          status: updatedVisit.status,
          checkedInAt: updatedVisit.checkedInAt?.toISOString()
        }
      });
    }

    // SCENARIO B: Walk-in registration
    if (walkIn) {
      const { fullName, email, phone, company, visitorType, hostEmployeeId, purpose, photoBase64 } = walkIn;

      if (!fullName || !hostEmployeeId || !purpose) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Name, host, and purpose are required for walk-in registration' }
        });
      }

      // 1. Blacklist check
      const blacklisted = await prisma.blacklist.findFirst({
        where: {
          fullName: { equals: fullName, mode: 'insensitive' },
          addedByUser: { branchId: targetBranchId }
        }
      });

      if (blacklisted) {
        return res.status(403).json({
          success: false,
          error: { code: 'VISITOR_BLACKLISTED', message: 'Safety check failed: This visitor is currently flagged on the blacklist.' }
        });
      }

      const checkInResult = await prisma.$transaction(async (tx: any) => {
        // 2. Fetch/Create Visitor
        let visitor = await tx.visitor.findFirst({
          where: email ? { email } : { fullName: { equals: fullName, mode: 'insensitive' } }
        });

        if (!visitor) {
          visitor = await tx.visitor.create({
            data: {
              fullName,
              email,
              phone,
              company,
              visitorType: visitorType || 'Guest',
              photoUrl: photoBase64 ? 'photo_mock_stored_url' : null
            }
          });
        }

        // 3. Create Visit in Waiting state (walk-ins await host greeting)
        const visit = await tx.visit.create({
          data: {
            visitorId: visitor.id,
            hostEmployeeId,
            branchId: targetBranchId,
            purpose,
            status: 'Waiting',
            checkedInAt: new Date(),
            zoneAccess: 'Lobby'
          },
          include: { visitor: true, host: true }
        });

        // 4. Notify Host
        await tx.notification.create({
          data: {
            channel: 'Email',
            message: `Hello ${visit.host.fullName}, walk-in visitor ${visit.visitor.fullName} from ${visit.visitor.company || 'N/A'} is waiting for your approval in the lobby.`,
            status: 'Queued',
            visitId: visit.id
          }
        });

        return visit;
      });

      return res.status(201).json({
        success: true,
        data: {
          visitId: checkInResult.id,
          visitorName: checkInResult.visitor.fullName,
          hostName: checkInResult.host.fullName,
          status: checkInResult.status,
          checkedInAt: checkInResult.checkedInAt?.toISOString()
        }
      });
    }

    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Provide either qrToken or walkIn details' }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// POST /visits/checkout - Check-out a visitor
router.post('/checkout', async (req: any, res: Response) => {
  const { visitId } = req.body;

  if (!visitId) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'visitId is required for check-out' }
    });
  }

  try {
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { visitor: true, host: true }
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Visit record not found' }
      });
    }

    if (visit.status === 'CheckedOut') {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_CHECKED_OUT', message: 'Visitor is already checked out' }
      });
    }

    const updated = await prisma.visit.update({
      where: { id: visitId },
      data: {
        status: 'CheckedOut',
        checkedOutAt: new Date()
      }
    });

    // Queue feedback survey email notification
    await prisma.notification.create({
      data: {
        recipientVisitorId: visit.visitorId,
        channel: 'Email',
        message: `Thank you for visiting ${visit.host.fullName} at our HQ. Please rate your checkout experience!`,
        status: 'Queued'
      }
    });

    return res.json({
      success: true,
      data: {
        visitId: updated.id,
        status: updated.status,
        checkedOutAt: updated.checkedOutAt?.toISOString()
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// PUT /visits/:id/status - Security/Staff updates visit status manually (e.g. approve/deny walk-in)
router.put('/:id/status', authenticateToken as any, requirePermission('visit.checkin') as any, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, deniedReason, zoneAccess } = req.body;

  try {
    const visit = await prisma.visit.findUnique({ where: { id }, include: { visitor: true } });
    if (!visit) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Visit not found' } });
    }

    if (visit.status === 'Denied' && status === 'CheckedIn') {
      return res.status(400).json({ success: false, error: { code: 'VISIT_DENIED', message: 'This visit has been denied entry and cannot be checked in' } });
    }

    const isBlacklistedAtBranch = await prisma.blacklist.findFirst({
      where: {
        OR: [
          { visitorId: visit.visitorId },
          { fullName: { equals: visit.visitor.fullName, mode: 'insensitive' } }
        ],
        addedByUser: { branchId: visit.branchId }
      }
    });

    if (isBlacklistedAtBranch && (status === 'CheckedIn' || status === 'Waiting')) {
      return res.status(403).json({ success: false, error: { code: 'VISITOR_BLACKLISTED', message: 'Safety check failed: This visitor is currently flagged on the blacklist.' } });
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const dbVisit = await tx.visit.update({
        where: { id },
        data: {
          status: status as any,
          deniedReason: status === 'Denied' ? deniedReason : null,
          zoneAccess: zoneAccess || undefined,
          checkedInAt: (status === 'CheckedIn' && !visit.checkedInAt) ? new Date() : undefined
        },
        include: { visitor: true, host: true }
      });

      // If approved checkin, print badge
      if (status === 'CheckedIn') {
        const badgeNumber = `BDG-${Math.floor(100000 + Math.random() * 900000)}`;
        await tx.badge.upsert({
          where: { visitId: id },
          update: { printCount: { increment: 1 } },
          create: {
            visitId: id,
            badgeNumber,
            printedAt: new Date(),
            printCount: 1
          }
        });
      }

      return dbVisit;
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: `VISIT_STATUS_${status.toUpperCase()}`,
        entityType: 'Visit',
        entityId: id,
        afterState: JSON.parse(JSON.stringify(updated))
      }
    });

    return res.json({
      success: true,
      data: updated
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

export default router;
