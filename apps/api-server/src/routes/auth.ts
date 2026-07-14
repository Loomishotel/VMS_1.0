import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@vms/database';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vms_super_secret_key_12345';

interface LoginTracker {
  attempts: number;
  lockoutUntil: number;
}

// In-memory rate limiting / security state tracker
const emailTracker: Record<string, LoginTracker> = {};
const ipTracker: Record<string, LoginTracker> = {};

// Helper to get client IP
const getClientIp = (req: any): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
};

// Route: POST /auth/pre-login-check
router.post('/pre-login-check', async (req: any, res: Response) => {
  const { email, captchaAnswer } = req.body;
  const ip = getClientIp(req);

  if (!email) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Email is required' }
    });
  }

  const now = Date.now();

  // 1. IP Lockout Check (Highest priority / global)
  const ipData = ipTracker[ip];
  if (ipData && ipData.lockoutUntil > now) {
    const remaining = Math.ceil((ipData.lockoutUntil - now) / 1000);
    return res.json({
      success: false,
      error: 'IP_LOCKED',
      message: `Too many failed attempts from your network. Locked out for ${remaining} seconds.`
    });
  }

  // 2. Email Lockout Check
  const emailData = emailTracker[email];
  if (emailData && emailData.lockoutUntil > now) {
    const remaining = Math.ceil((emailData.lockoutUntil - now) / 1000);
    return res.json({
      success: false,
      error: 'EMAIL_LOCKED',
      message: `This account is temporarily locked. Please try again in ${remaining} seconds.`
    });
  }

  // 3. CAPTCHA Requirement Check
  const emailAttempts = emailData ? emailData.attempts : 0;
  const ipAttempts = ipData ? ipData.attempts : 0;

  if (emailAttempts >= 3 || ipAttempts >= 3) {
    // Math puzzle challenge: What is 4 + 7? -> '11'
    if (captchaAnswer !== '11') {
      return res.json({
        success: false,
        error: 'CAPTCHA_REQUIRED',
        message: 'Security check: Please prove you are human.'
      });
    }
  }

  return res.json({
    success: true,
    message: 'All checks passed.'
  });
});

// Route: POST /auth/log-login-failure
router.post('/log-login-failure', async (req: any, res: Response) => {
  const { email } = req.body;
  const ip = getClientIp(req);

  if (!email) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Email is required' }
    });
  }

  const now = Date.now();

  // Update email tracking
  if (!emailTracker[email]) {
    emailTracker[email] = { attempts: 0, lockoutUntil: 0 };
  }
  emailTracker[email].attempts += 1;
  if (emailTracker[email].attempts >= 5) {
    emailTracker[email].lockoutUntil = now + 15 * 60 * 1000; // 15 mins
  }

  // Update IP tracking
  if (!ipTracker[ip]) {
    ipTracker[ip] = { attempts: 0, lockoutUntil: 0 };
  }
  ipTracker[ip].attempts += 1;
  if (ipTracker[ip].attempts >= 10) {
    ipTracker[ip].lockoutUntil = now + 15 * 60 * 1000; // 15 mins
  }

  return res.json({
    success: true,
    emailAttempts: emailTracker[email].attempts,
    ipAttempts: ipTracker[ip].attempts
  });
});

// Route: POST /auth/log-login-success
router.post('/log-login-success', async (req: any, res: Response) => {
  const { email } = req.body;
  const ip = getClientIp(req);

  if (email && emailTracker[email]) {
    emailTracker[email] = { attempts: 0, lockoutUntil: 0 };
  }
  if (ipTracker[ip]) {
    ipTracker[ip] = { attempts: 0, lockoutUntil: 0 };
  }

  return res.json({
    success: true
  });
});

// POST /auth/login
router.post('/login', async (req: any, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Email and password are required' }
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, branch: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid credentials or inactive user' }
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role.name,
          branchId: user.branchId,
          branchName: user.branch.name
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// GET /auth/me
router.get('/me', authenticateToken as any, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true, branch: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role.name,
        branchId: user.branchId,
        branchName: user.branch.name,
        permissions: req.user.permissions
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// POST /auth/seed
// Pre-populates the database with roles, branches, departments, employees, and default users
router.post('/seed', async (req: any, res: Response) => {
  try {
    // 1. Seed Roles & Permissions
    const permissions = [
      { code: 'visitor.view', description: 'View visitor records' },
      { code: 'visitor.create', description: 'Create visitor records' },
      { code: 'visitor.delete', description: 'Archive/Delete visitor records' },
      { code: 'visit.checkin', description: 'Perform check-in action' },
      { code: 'visit.checkout', description: 'Perform checkout action' },
      { code: 'blacklist.manage', description: 'Manage visitor blacklist' },
      { code: 'report.export', description: 'Generate and export visitor logs' },
      { code: 'settings.manage', description: 'Manage organization & branch configurations' }
    ];

    const seededPermissions = [];
    for (const p of permissions) {
      const seeded = await prisma.permission.upsert({
        where: { code: p.code },
        update: { description: p.description },
        create: p
      });
      seededPermissions.push(seeded);
    }

    const roles = [
      { name: 'Admin', description: 'Full System Administrator', codes: permissions.map(p => p.code) },
      { name: 'Security', description: 'Building Safety & Evacuation Guard', codes: ['visitor.view', 'visit.checkin', 'visit.checkout', 'blacklist.manage'] },
      { name: 'Employee', description: 'Standard Corporate Staff (Host)', codes: ['visitor.view'] }
    ];

    const seededRoles: any = {};
    for (const r of roles) {
      const role = await prisma.role.upsert({
        where: { name: r.name },
        update: { description: r.description, isSystemRole: true },
        create: { name: r.name, description: r.description, isSystemRole: true }
      });
      seededRoles[r.name] = role;

      // Link Permissions to Role
      for (const pCode of r.codes) {
        const perm = seededPermissions.find(p => p.code === pCode);
        if (perm) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: perm.id
              }
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: perm.id
            }
          });
        }
      }
    }

    // 2. Seed Default Branch
    const branch = await prisma.branch.upsert({
      where: { id: 'default-branch-uuid' },
      update: {},
      create: {
        id: 'default-branch-uuid',
        name: 'Silicon Valley HQ',
        address: '1600 Amphitheatre Pkwy, Mountain View, CA 94043',
        timezone: 'America/Los_Angeles',
        isActive: true
      }
    });

    // 3. Seed Departments
    const depts = ['Engineering', 'Sales', 'Human Resources', 'Security Operations'];
    const seededDepts: any = {};
    for (const dName of depts) {
      const d = await prisma.department.create({
        data: {
          name: dName,
          branchId: branch.id
        }
      });
      seededDepts[dName] = d;
    }

    // 4. Seed Employees (Hosts)
    const employeesData = [
      { fullName: 'Ananth Rao', email: 'a.rao@company.local', phone: '+1-555-0101', floor: '3rd Floor', dept: 'Engineering' },
      { fullName: 'Tanya Verma', email: 't.verma@company.local', phone: '+1-555-0102', floor: '1st Floor', dept: 'Sales' },
      { fullName: 'Jane Doe', email: 'jane.doe@company.local', phone: '+1-555-0103', floor: '4th Floor', dept: 'Human Resources' },
      { fullName: 'Marcus Vance', email: 'marcus.v@company.local', phone: '+1-555-0104', floor: 'Lobby Security', dept: 'Security Operations' }
    ];

    const seededEmployees: any = {};
    for (const emp of employeesData) {
      const dbEmp = await prisma.employee.upsert({
        where: { email: emp.email },
        update: {},
        create: {
          fullName: emp.fullName,
          email: emp.email,
          phone: emp.phone,
          floor: emp.floor,
          departmentId: seededDepts[emp.dept].id,
          branchId: branch.id
        }
      });
      seededEmployees[emp.fullName] = dbEmp;
    }

    // 5. Seed Users (Staff logins)
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const securityPasswordHash = await bcrypt.hash('Security@123', 10);
    const employeePasswordHash = await bcrypt.hash('Employee@123', 10);

    const usersData = [
      { email: 'admin@vms.local', fullName: 'System Administrator', password: adminPasswordHash, role: 'Admin' },
      { email: 'security@vms.local', fullName: 'Marcus Vance', password: securityPasswordHash, role: 'Security', empProfile: 'Marcus Vance' },
      { email: 'jane.doe@company.local', fullName: 'Jane Doe', password: employeePasswordHash, role: 'Employee', empProfile: 'Jane Doe' }
    ];

    for (const u of usersData) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          fullName: u.fullName,
          passwordHash: u.password,
          roleId: seededRoles[u.role].id,
          branchId: branch.id,
          employeeId: u.empProfile ? seededEmployees[u.empProfile].id : undefined
        }
      });
    }

    // 6. Seed some default Visitors & Visits for initial queue visualization
    const visitors = [
      { fullName: 'John Smith', email: 'john.smith@gmail.com', phone: '+1-555-0201', company: 'Global Tech Corp', type: 'Guest' },
      { fullName: 'Alice Johnson', email: 'alice.j@contractors.local', phone: '+1-555-0202', company: 'Delta Construction', type: 'Contractor' },
      { fullName: 'Bob Miller', email: 'bob.m@google.com', phone: '+1-555-0203', company: 'Google Inc.', type: 'VIP' }
    ];

    const seededVisitors = [];
    for (const vis of visitors) {
      const dbVis = await prisma.visitor.create({
        data: {
          fullName: vis.fullName,
          email: vis.email,
          phone: vis.phone,
          company: vis.company,
          visitorType: vis.type as any
        }
      });
      seededVisitors.push(dbVis);
    }

    // Add expected, waiting, and checked-in visits
    // Visit 1: Pre-registered, checked in, meeting in progress with Ananth Rao
    const visit1 = await prisma.visit.create({
      data: {
        visitorId: seededVisitors[0].id,
        hostEmployeeId: seededEmployees['Ananth Rao'].id,
        branchId: branch.id,
        purpose: 'Architecture Review Meeting',
        status: 'CheckedIn',
        scheduledAt: new Date(Date.now() - 3600000), // 1 hour ago
        checkedInAt: new Date(Date.now() - 3000000), // 50 mins ago
        zoneAccess: 'Floor 3, Conf Room B'
      }
    });

    // Generate badge for Visit 1
    await prisma.badge.create({
      data: {
        visitId: visit1.id,
        badgeNumber: 'BDG-000001',
        printedAt: new Date(Date.now() - 3000000),
        printCount: 1
      }
    });

    // Visit 2: Walk-in, waiting lobby, host Tanya Verma notified
    await prisma.visit.create({
      data: {
        visitorId: seededVisitors[1].id,
        hostEmployeeId: seededEmployees['Tanya Verma'].id,
        branchId: branch.id,
        purpose: 'HVAC Facility Checkup',
        status: 'Waiting',
        checkedInAt: new Date(Date.now() - 600000), // 10 mins ago
        zoneAccess: 'Lobby, Roof Deck'
      }
    });

    // Visit 3: Pre-registered, scheduled for later today
    await prisma.visit.create({
      data: {
        visitorId: seededVisitors[2].id,
        hostEmployeeId: seededEmployees['Jane Doe'].id,
        branchId: branch.id,
        purpose: 'Executive Interview Board',
        status: 'Expected',
        scheduledAt: new Date(Date.now() + 7200000) // 2 hours from now
      }
    });

    // 7. Seed Settings
    await prisma.setting.create({
      data: {
        branchId: branch.id,
        key: 'badge_expiry_minutes',
        value: 480 // 8 hours
      }
    });

    return res.json({
      success: true,
      message: 'Database seeded successfully with branches, departments, employees, default roles, default user logins, and demo visits!'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

export default router;
