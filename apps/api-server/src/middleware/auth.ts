import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@vms/database';

const JWT_SECRET = process.env.JWT_SECRET || 'vms_super_secret_key_12345';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleId: string;
    roleName: string;
    branchId: string;
    permissions: string[];
  };
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Access token required' }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Fetch latest user, role, and permission codes from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User account is inactive or not found' }
      });
    }

    const permissionCodes = user.role.permissions.map((rp: any) => rp.permission.code);

    req.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      branchId: user.branchId,
      permissions: permissionCodes
    };

    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Invalid or expired access token' }
    });
  }
}

export function requirePermission(permissionCode: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    const hasAccess = req.user.permissions.includes(permissionCode) || req.user.roleName === 'Admin';
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: `Required permission '${permissionCode}' is missing` }
      });
    }

    next();
  };
}
