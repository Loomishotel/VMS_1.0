import React, { useState, useEffect, useRef } from 'react';
import { 
  Building, 
  Users, 
  Bell,
  BarChart2, 
  ShieldAlert, 
  Clock, 
  UserCheck, 
  Search,
  Plus,
  LogOut,
  AlertOctagon,
  CheckCircle,
  X,
  History,
  User,
  Loader2,
  Calendar,
  MessageSquare,
  FileText,
  Edit2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { supabase } from './supabaseClient';

type View = 'queue' | 'employees' | 'blacklist' | 'analytics' | 'security_arrivals' | 'check_invite' | 'employee_scheduled' | 'employee_past' | 'employee_invite' | 'blacklist_review' | 'security_history' | 'employee_future';

const getPhoneLimit = (prefix: string): number => {
  const limits: Record<string, number> = {
    '+1': 10,
    '+91': 10,
    '+44': 10,
    '+61': 9,
    '+65': 8,
    '+971': 9,
    '+49': 11,
    '+33': 9,
    '+81': 10,
    '+82': 10,
    '+27': 9,
    '+55': 11
  };
  return limits[prefix] || 15;
};

// ────────────────────────────────────────────────────────────────────────
// UI Primitives to replicate VMS Avatar & Icon UI Patterns
// ────────────────────────────────────────────────────────────────────────

const getInitials = (name: string) => {
  if (!name) return '';
  return name.split(' ').filter(Boolean).slice(0, 2)
    .map((n) => n[0]?.toUpperCase()).join('');
};

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
  ring?: boolean;
  online?: boolean;
}

const avatarSizesMap = {
  xs: { width: '24px', height: '24px', fontSize: '10px' },
  sm: { width: '32px', height: '32px', fontSize: '12px' },
  md: { width: '40px', height: '40px', fontSize: '14px' },
  lg: { width: '48px', height: '48px', fontSize: '16px' },
  xl: { width: '64px', height: '64px', fontSize: '18px' },
};

export function Avatar({ src, name, size = 'md', className, style, ring, online }: AvatarProps) {
  const sizeStyle = avatarSizesMap[size] || avatarSizesMap.md;
  const initialsText = getInitials(name);
  
  const ringStyle = ring ? {
    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.5), 0 0 0 4px var(--bg-dark)',
  } : {};

  return (
    <span className={className} style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: '50%',
      ...sizeStyle,
      ...ringStyle,
      ...style
    }}>
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <span
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            fontWeight: 600,
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {initialsText}
        </span>
      )}
      {online !== undefined && (
        <span
          style={{
            position: 'absolute',
            right: '-1px',
            bottom: '-1px',
            height: '10px',
            width: '10px',
            borderRadius: '50%',
            border: '2px solid #09090b',
            background: online ? '#10b981' : '#94a3b8',
          }}
        />
      )}
    </span>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  tone?: 'slate' | 'primary' | 'success' | 'warning' | 'danger' | 'indigo' | 'purple';
  dot?: boolean;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

const toneMap = {
  slate: { bg: 'var(--status-checkedout)', text: 'var(--status-checkedout-text)', border: 'var(--status-checkedout-text)', dotColor: 'var(--status-checkedout-text)' },
  primary: { bg: 'var(--status-expected)', text: 'var(--status-expected-text)', border: 'var(--status-expected-text)', dotColor: 'var(--status-expected-text)' },
  success: { bg: 'var(--status-checkedin)', text: 'var(--status-checkedin-text)', border: 'var(--status-checkedin-text)', dotColor: 'var(--status-checkedin-text)' },
  warning: { bg: 'var(--status-waiting)', text: 'var(--status-waiting-text)', border: 'var(--status-waiting-text)', dotColor: 'var(--status-waiting-text)' },
  danger: { bg: 'var(--status-denied)', text: 'var(--status-denied-text)', border: 'var(--status-denied-text)', dotColor: 'var(--status-denied-text)' },
  indigo: { bg: 'rgba(99, 102, 241, 0.1)', text: 'var(--color-indigo-accent)', border: 'var(--color-indigo-accent)', dotColor: 'var(--color-indigo-accent)' },
  purple: { bg: 'rgba(168, 85, 247, 0.1)', text: 'var(--color-purple-accent)', border: 'var(--color-purple-accent)', dotColor: 'var(--color-purple-accent)' },
};

export function Badge({ children, tone = 'slate', dot, icon, style }: BadgeProps) {
  const colors = toneMap[tone] || toneMap.slate;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      ...style
    }}>
      {dot && (
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: colors.dotColor
        }} />
      )}
      {icon && (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

interface EmptyStateProps {
  icon: React.ComponentType<any>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '16px',
      border: '1px dashed rgba(255, 255, 255, 0.1)',
      background: 'rgba(255, 255, 255, 0.01)',
      padding: '56px 24px',
      textAlign: 'center',
      width: '100%'
    }}>
      <div style={{
        marginBottom: '16px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))',
        padding: '16px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(59, 130, 246, 0.15)'
      }}>
        <Icon size={24} style={{ color: 'var(--color-indigo-accent)' }} />
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>{title}</h3>
      {description && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '320px', marginBottom: action ? '20px' : '0' }}>{description}</p>}
      {action}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  variant = 'secondary',
  isLoading,
  leftIcon,
  rightIcon,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
        };
      case 'danger':
        return {
          background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
        };
      case 'secondary':
      default:
        return {
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--color-text-primary)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        };
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer',
        opacity: (disabled || isLoading) ? 0.6 : 1,
        transition: 'all 0.15s',
        ...getVariantStyles(),
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'flex', animation: 'spin 1s linear infinite' }}>
          <Loader2 size={14} />
        </span>
      ) : (
        leftIcon && <span style={{ display: 'flex' }}>{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span style={{ display: 'flex' }}>{rightIcon}</span>}
    </button>
  );
}

const getStatusTone = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'expected' || s === 'preregistered') return 'indigo';
  if (s === 'checkedin' || s === 'inmeeting' || s === 'active') return 'success';
  if (s === 'waiting') return 'warning';
  if (s === 'checkedout' || s === 'departed') return 'slate';
  if (s === 'denied' || s === 'cancelled' || s === 'cancellation_pending_reception') return 'danger';
  return 'slate';
};

const getStatusLabel = (status: string) => {
  if (!status) return '';
  const s = status.toLowerCase();
  if (s === 'denied') return 'Denied Entry';
  if (s === 'checkedout' || s === 'departed') return 'Checked Out';
  if (s === 'cancellation_pending_reception') return 'Cancel Requested';
  return status;
};

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('vms_token'));
  const [user, setUser] = useState<any | null>(null);
  const [currentView, setCurrentView] = useState<View>('queue');

  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [realtimeNotification, setRealtimeNotification] = useState<{
    type: 'arrived' | 'delay';
    visitorName: string;
    hostName?: string;
    delayMinutes?: number;
    newTime?: string;
  } | null>(null);

  const queueRef = useRef<any[]>([]);
  const employeeVisitsRef = useRef<any[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // RBAC States
  const [employeeVisits, setEmployeeVisits] = useState<any[]>([]);
  
  const [showFlagBlacklistModal, setShowFlagBlacklistModal] = useState<string | null>(null);
  const [flagReasonStr, setFlagReasonStr] = useState('');

  // Admin Flagged Queue
  const [flaggedVisitors, setFlaggedVisitors] = useState<any[]>([]);
  const [preRegDeptFilter, setPreRegDeptFilter] = useState('');

  // Authentication Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Login failure limits and Lockout States
  const [loginAttempts, setLoginAttempts] = useState<number>(() => {
    return Number(localStorage.getItem('vms_login_attempts') || '0');
  });
  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    return Number(localStorage.getItem('vms_login_lockout_until') || '0');
  });
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Session Timeout Inactivity States
  const [showSessionWarning, setShowSessionWarning] = useState<boolean>(false);
  const [warningCountdown, setWarningCountdown] = useState<number>(300);
  const lastActivityRef = useRef<number>(Date.now());

  // Global Page States
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Queue Data States
  const [queue, setQueue] = useState<any[]>([]);
  const [queueSearch, setQueueSearch] = useState('');
  const [showPreRegModal, setShowPreRegModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState<string | null>(null); // holds visitId
  const [denyReason, setDeniedReason] = useState('');
  const [showPassModal, setShowPassModal] = useState<any | null>(null); // holds printed pass data

  // Future invitations for Check Invitation
  const [futureInvitations, setFutureInvitations] = useState<any[]>([]);
  const [inviteSearch, setInviteSearch] = useState('');

  // Remark states
  const [showRemarkModal, setShowRemarkModal] = useState<any | null>(null); // holds Visit record
  const [remarkText, setRemarkText] = useState('');

  // Visitor visit details modal/panel for Security
  const [selectedInviteDetails, setSelectedInviteDetails] = useState<any | null>(null); // holds invitation/visit record
  const [detailPanelTab, setDetailPanelTab] = useState<'general' | 'host' | 'remarks'>('general');

  // Past records states
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  const [pastSearch, setPastSearch] = useState('');

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    employeeVisitsRef.current = employeeVisits;
  }, [employeeVisits]);

  // Pre-Registration form states
  const [preName, setPreName] = useState('');
  const [preEmail, setPreEmail] = useState('');
  const [prePhone, setPrePhone] = useState('');
  const [prePhoneCountryCode, setPrePhoneCountryCode] = useState('+1');
  const [preCompany, setPreCompany] = useState('');
  const [preLocation, setPreLocation] = useState('');
  const [preType, setPreType] = useState<'Guest' | 'Vendor' | 'Contractor' | 'Candidate' | 'VIP'>('Guest');
  const [preHostId, setPreHostId] = useState('');
  const [prePurpose, setPrePurpose] = useState('');
  const [preScheduled, setPreScheduled] = useState('');
  const [preGuestCount, setPreGuestCount] = useState<number>(0);

  // Directory Data States
  const [employees, setEmployees] = useState<any[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  // Add Employee Form States
  const [addEmpName, setAddEmpName] = useState('');
  const [addEmpEmail, setAddEmpEmail] = useState('');
  const [addEmpPhone, setAddEmpPhone] = useState('');
  const [addEmpFloor, setAddEmpFloor] = useState('');
  const [addEmpDeptId, setAddEmpDeptId] = useState('');
  const [depts, setDepts] = useState<any[]>([]);

  // Blacklist States

  const [showAddBlModal, setShowAddBlModal] = useState(false);
  // Add Blacklist Form States
  const [addBlName, setAddBlName] = useState('');
  const [addBlReason, setAddBlReason] = useState('');
  const [addBlSeverity, setAddBlSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Analytics States
  const [analytics, setAnalytics] = useState<any | null>(null);

  

  // Fetch current user details on load if token exists
  const fetchCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        handleLogout();
        return;
      }
      
      const { data: publicProfile, error } = await supabase
        .from('User')
        .select(`
          id,
          email,
          fullName,
          roleId,
          branchId,
          phone,
          Role (
            name
          ),
          Branch (
            name
          )
        `)
        .eq('id', session.user.id)
        .single();
      
      if (error || !publicProfile) {
        handleLogout();
        return;
      }

      const roleObj: any = publicProfile.Role;
      const branchObj: any = publicProfile.Branch;
      const roleName = roleObj?.name || 'Staff';

      setUser({
        id: publicProfile.id,
        email: publicProfile.email,
        fullName: publicProfile.fullName,
        roleId: publicProfile.roleId,
        branchId: publicProfile.branchId,
        phone: publicProfile.phone,
        role: roleName,
        branchName: branchObj?.name || 'Bangalore HQ'
      });
      setToken(session.access_token);

      // Route default view based on role
      if (roleName === 'Security') {
        setCurrentView('security_arrivals');
      } else if (roleName === 'Employee') {
        setCurrentView('employee_scheduled');
      } else {
        setCurrentView('queue');
      }
    } catch (err) {
      handleLogout();
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  useEffect(() => {
    if (user && user.role === 'Employee') {
      supabase
        .from('Employee')
        .select('id')
        .eq('email', user.email)
        .single()
        .then(({ data }) => {
          if (data) {
            setPreHostId(data.id);
            setEmployeeId(data.id);
          }
        });
    } else {
      setEmployeeId(null);
    }
  }, [user]);

  // Set default pre-registered host for Employee users
  useEffect(() => {
    if (showPreRegModal && user?.role === 'Employee' && employees.length > 0) {
      const currentEmployee = employees.find(emp => emp.email === user.email);
      if (currentEmployee) {
        setPreHostId(currentEmployee.id);
      }
    }
  }, [showPreRegModal, user, employees]);

  // Handle data fetching according to the active tab
  useEffect(() => {
    if (!token || !user) return;

    // Always ensure employees and departments are fetched for modals/dropdowns
    fetchEmployees();
    fetchDepartments();

    if (currentView === 'queue') {
      fetchQueue();
    } else if (currentView === 'security_arrivals') {
      fetchQueue();
    } else if (currentView === 'employee_scheduled' || currentView === 'employee_past' || currentView === 'employee_future') {
      fetchEmployeeVisits();
    } else if (currentView === 'blacklist_review') {
      fetchBlacklistReview();
    } else if (currentView === 'employees') {
      // Already fetched above

    } else if (currentView === 'analytics') {
      fetchAnalytics();
            } else if (currentView === 'check_invite') {
      fetchFutureInvitations();
    } else if (currentView === 'security_history') {
      fetchPastRecords();
    }
  }, [currentView, token, user]);

  // Subscribe to real-time database changes on the Visit table
  useEffect(() => {
    if (!token || !user) return;

    const channel = supabase
      .channel('vms_realtime_visits')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Visit' },
        async (payload: any) => {
          console.log('Realtime update detected on Visits table:', payload);
          
          // Trigger refresh of lists if currently viewing them
          if (currentView === 'queue' || currentView === 'security_arrivals') {
            fetchQueue(true);
          } else if (currentView === 'employee_scheduled' || currentView === 'employee_past' || currentView === 'employee_future') {
            fetchEmployeeVisits();
          } else if (currentView === 'check_invite') {
            fetchFutureInvitations();
          } else if (currentView === 'security_history') {
            fetchPastRecords();
          }

          // Real-time Notification logic
          if (payload.eventType === 'UPDATE') {
            const newRecord = payload.new;

            // --- CONDITION 1: Visitor Arrived Notification for Employee ---
            if (user.role === 'Employee' && employeeId) {
              const existing = employeeVisitsRef.current.find(v => v.id === newRecord.id);
              const oldStatus = existing ? existing.status : null;
              
              const becameArrived = 
                (newRecord.status === 'Waiting' || newRecord.status === 'CheckedIn') &&
                oldStatus !== 'Waiting' && oldStatus !== 'CheckedIn';
              
              const isMyVisitor = newRecord.hostEmployeeId === employeeId;

              if (becameArrived && isMyVisitor) {
                try {
                  const { data: visData } = await supabase
                    .from('Visitor')
                    .select('fullName')
                    .eq('id', newRecord.visitorId)
                    .single();
                  
                  if (visData) {
                    setRealtimeNotification({
                      type: 'arrived',
                      visitorName: visData.fullName
                    });
                  }
                } catch (err) {
                  console.error('Error fetching visitor name for notification:', err);
                }
              }
            }

            // --- CONDITION 2: Visit Delay Notification for Security/Admin ---
            if (['Security', 'Admin'].includes(user.role)) {
              const existing = queueRef.current.find(v => v.id === newRecord.id);
              const oldSched = existing ? existing.scheduledAt : null;
              const newSched = newRecord.scheduledAt;

              if (oldSched && newSched && oldSched !== newSched) {
                const diffMs = new Date(newSched).getTime() - new Date(oldSched).getTime();
                const diffMinutes = Math.round(diffMs / (60 * 1000));

                // Only trigger if it is a delay (positive difference) and scheduled for today
                const isToday = new Date(newSched).toDateString() === new Date().toDateString();

                if (diffMinutes > 0 && isToday) {
                  try {
                    // Fetch host employee and visitor names
                    const [hostRes, visRes] = await Promise.all([
                      supabase.from('Employee').select('fullName, departmentId').eq('id', newRecord.hostEmployeeId).single(),
                      supabase.from('Visitor').select('fullName').eq('id', newRecord.visitorId).single()
                    ]);

                    let deptName = 'General';
                    if (hostRes.data?.departmentId) {
                      const { data: deptData } = await supabase
                        .from('Department')
                        .select('name')
                        .eq('id', hostRes.data.departmentId)
                        .single();
                      if (deptData) deptName = deptData.name;
                    }

                    if (hostRes.data && visRes.data) {
                      setRealtimeNotification({
                        type: 'delay',
                        visitorName: visRes.data.fullName,
                        hostName: `${hostRes.data.fullName} (${deptName})`,
                        delayMinutes: diffMinutes,
                        newTime: new Date(newSched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      });
                    }
                  } catch (err) {
                    console.error('Error fetching details for delay notification:', err);
                  }
                }
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentView, token, user, employeeId]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const getLocalISOString = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // Prevent submission if currently locked out
    if (lockoutUntil > Date.now()) {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLoginError(`Too many login attempts. Locked out for another ${formatTime(remaining)}.`);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });

      if (error) throw error;

      if (data?.session) {
        // Reset attempts and lockout on success
        localStorage.removeItem('vms_login_attempts');
        localStorage.removeItem('vms_login_lockout_until');
        setLoginAttempts(0);
        setLockoutUntil(0);

        localStorage.setItem('vms_token', data.session.access_token);
        setToken(data.session.access_token);
        setAlertMessage({ type: 'success', text: `Welcome back!` });
      }
    } catch (err: any) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('vms_login_attempts', String(newAttempts));

      if (newAttempts >= 10) {
        const lockTime = Date.now() + 15 * 60 * 1000;
        setLockoutUntil(lockTime);
        localStorage.setItem('vms_login_lockout_until', String(lockTime));
        setLoginError('Too many unsuccessful login attempts. You are locked out for 15 minutes.');
      } else {
        setLoginError(err.message || 'Login failed. Verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('vms_token');
    setToken(null);
    setUser(null);
    handleResetState();
  };

  // Lockout Timer Effect
  useEffect(() => {
    if (lockoutUntil <= Date.now()) return;

    const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
    setSecondsRemaining(remaining);
    
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setSecondsRemaining(rem);
      if (rem <= 0) {
        clearInterval(interval);
        setLoginAttempts(0);
        setLockoutUntil(0);
        localStorage.removeItem('vms_login_attempts');
        localStorage.removeItem('vms_login_lockout_until');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Session Timeout activity listeners
  useEffect(() => {
    if (!token || !user) return;

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [token, user]);

  // Session Timeout timer check
  useEffect(() => {
    if (!token || !user) {
      setShowSessionWarning(false);
      return;
    }

    lastActivityRef.current = Date.now();

    const checkInactivity = setInterval(() => {
      const inactiveMs = Date.now() - lastActivityRef.current;
      const inactiveSecs = Math.floor(inactiveMs / 1000);

      if (inactiveSecs >= 1800) { // 30 minutes
        clearInterval(checkInactivity);
        setShowSessionWarning(false);
        handleLogout();
        setAlertMessage({ type: 'error', text: 'You have been logged out due to inactivity.' });
      } else if (inactiveSecs >= 1500) { // 25 minutes
        setShowSessionWarning(true);
        setWarningCountdown(1800 - inactiveSecs);
      } else {
        setShowSessionWarning(false);
      }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [token, user]);

  const handleExtendSession = () => {
    lastActivityRef.current = Date.now();
    setShowSessionWarning(false);
  };

  const handleResetState = () => {
    setQueue([]);
    setEmployees([]);
    setAnalytics(null);
  };



  const fetchEmployeeVisits = async () => {
    setLoading(true);
    try {
      // Find this user's Employee record by matching email
      const { data: employeeData } = await supabase
        .from('Employee')
        .select('id')
        .eq('email', user?.email)
        .single();

      const employeeId = employeeData?.id;

      if (!employeeId) {
        // No matching employee record — show empty state
        setEmployeeVisits([]);
        return;
      }

      // Primary query: fetch all visits where this employee is the host
      // This covers both walk-in kiosk requests and pre-registered visits
      let response: any = await supabase
        .from('Visit')
        .select(`
          id,
          visitorId,
          purpose,
          status,
          scheduledAt,
          checkedInAt,
          checkedOutAt,
          deniedReason,
          zoneAccess,
          remarks,
          Visitor (
            id,
            fullName,
            email,
            phone,
            company,
            visitorType,
            location
          ),
          Employee (
            id,
            fullName,
            email,
            phone
          )
        `)
        .eq('hostEmployeeId', employeeId)
        .order('scheduledAt', { ascending: false });

      if (response.error && response.error.message.includes('remarks')) {
        // Fallback without remarks column
        response = await supabase
          .from('Visit')
          .select(`
            id,
            visitorId,
            purpose,
            status,
            scheduledAt,
            checkedInAt,
            checkedOutAt,
            deniedReason,
            zoneAccess,
            Visitor (
              id,
              fullName,
              email,
              phone,
              company,
              visitorType,
              location
            ),
            Employee (
              id,
              fullName,
              email,
              phone
            )
          `)
          .eq('hostEmployeeId', employeeId)
          .order('scheduledAt', { ascending: false });
      }

      const { data, error } = response;

      if (error) throw error;

      if (data) {
        const mapped = data.map((v: any) => ({
          id: v.id,
          visitorId: v.visitorId,
          visitorName: v.Visitor?.fullName || 'Visitor',
          visitorEmail: v.Visitor?.email || '',
          visitorPhone: v.Visitor?.phone || '',
          visitorCompany: v.Visitor?.company || '',
          visitorType: v.Visitor?.visitorType || 'Guest',
          visitorLocation: v.Visitor?.location || '',
          hostId: v.Employee?.id || '',
          hostName: v.Employee?.fullName || 'Host',
          hostEmail: v.Employee?.email || '',
          hostPhone: v.Employee?.phone || '',
          purpose: v.purpose,
          status: v.status,
          scheduledAt: v.scheduledAt,
          checkedInAt: v.checkedInAt,
          checkedOutAt: v.checkedOutAt,
          deniedReason: v.deniedReason || '',
          zoneAccess: v.zoneAccess || '',
          remarks: v.remarks || ''
        }));
        setEmployeeVisits(mapped);
      }
    } catch (err: any) {
      console.error('Error fetching employee visits:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlacklistReview = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Visitor')
        .select(`
          id,
          fullName,
          email,
          phone,
          company,
          visitorType,
          isBlacklisted,
          blacklistFlag,
          flaggedAt,
          flagReason,
          flaggedByUserId
        `)
        .eq('blacklistFlag', 'pending_review');

      if (error) throw error;

      if (data) {
        const { data: usersData } = await supabase
          .from('User')
          .select('id, fullName');
        
        const userMap = new Map((usersData || []).map((u: any) => [u.id, u.fullName]));

        const parsed = await Promise.all(data.map(async (visitor: any) => {
          const { data: visitsData } = await supabase
            .from('Visit')
            .select(`
              id,
              purpose,
              status,
              scheduledAt,
              Employee (
                fullName
              )
            `)
            .eq('visitorId', visitor.id)
            .eq('branchId', user.branchId); // Filter visitor history to current branch

          return {
            ...visitor,
            flaggedByName: userMap.get(visitor.flaggedByUserId) || 'Security Staff',
            visitHistory: visitsData || []
          };
        }));
        setFlaggedVisitors(parsed);
      }
    } catch (err: any) {
      console.error('Error loading blacklist review queue:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // RBAC Action Handlers
  const handleConfirmBlacklist = async (visitorId: string, visitorName: string, reason: string) => {
    try {
      const { error: visitorErr } = await supabase
        .from('Visitor')
        .update({
          isBlacklisted: true,
          blacklistFlag: 'none'
        })
        .eq('id', visitorId);

      if (visitorErr) throw visitorErr;

      const { error: blErr } = await supabase
        .from('Blacklist')
        .insert({
          visitorId,
          fullName: visitorName,
          reason: reason || 'Confirmed from security flag review.',
          severity: 'High',
          addedByUserId: user.id
        });

      if (blErr) throw blErr;

      await supabase.from('AuditLog').insert({
        actorUserId: user.id,
        action: 'CONFIRM_BLACKLIST',
        entityType: 'Visitor',
        entityId: visitorId
      });

      setAlertMessage({ type: 'success', text: `Visitor ${visitorName} confirmed on blacklist!` });
      fetchBlacklistReview();
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Confirmation failed' });
    }
  };

  const handleDismissBlacklist = async (visitorId: string) => {
    try {
      const { error } = await supabase
        .from('Visitor')
        .update({
          blacklistFlag: 'none'
        })
        .eq('id', visitorId);

      if (error) throw error;

      await supabase.from('AuditLog').insert({
        actorUserId: user.id,
        action: 'DISMISS_BLACKLIST_FLAG',
        entityType: 'Visitor',
        entityId: visitorId
      });

      setAlertMessage({ type: 'success', text: 'Blacklist review flag dismissed.' });
      fetchBlacklistReview();
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Dismissal failed' });
    }
  };

  const handleFlagBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showFlagBlacklistModal || !flagReasonStr) return;

    try {
      const { error } = await supabase
        .from('Visitor')
        .update({
          blacklistFlag: 'pending_review',
          flaggedByUserId: user.id,
          flaggedAt: new Date().toISOString(),
          flagReason: flagReasonStr
        })
        .eq('id', showFlagBlacklistModal);

      if (error) throw error;

      setAlertMessage({ type: 'success', text: 'Visitor flagged for blacklist review.' });
      setShowFlagBlacklistModal(null);
      setFlagReasonStr('');
      
      if (currentView === 'security_arrivals') fetchQueue();
      if (currentView === 'check_invite') fetchFutureInvitations();
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Failed to flag visitor' });
    }
  };

  const handleEmployeeCancelVisit = async (visitId: string) => {
    try {
      const { error } = await supabase
        .from('Visit')
        .update({
          status: 'cancellation_pending_reception'
        })
        .eq('id', visitId);

      if (error) throw error;

      setAlertMessage({ 
        type: 'success', 
        text: 'Visit cancellation requested. Reception has been notified to handle the visitor if they arrive.' 
      });
      fetchEmployeeVisits();
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Failed to cancel visit' });
    }
  };

  const handleDelayVisit = async (visitId: string, currentScheduledAt: string, minutes: number) => {
    try {
      const newScheduledTime = new Date(new Date(currentScheduledAt).getTime() + minutes * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('Visit')
        .update({ scheduledAt: newScheduledTime })
        .eq('id', visitId);

      if (error) throw error;

      // Queue an email notification in database
      await supabase.from('Notification').insert({
        recipientVisitorId: null, // Global or visit-linked notification
        channel: 'Email',
        message: `⏳ Host has requested a schedule delay of ${minutes} minutes. New expected arrival: ${new Date(newScheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        status: 'Queued'
      });

      setAlertMessage({ 
        type: 'success', 
        text: `⏳ Visit delayed by ${minutes} minutes! New scheduled time: ${new Date(newScheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
      });
      fetchEmployeeVisits();
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Failed to delay visit' });
    }
  };

  const handleSecurityMarkArrived = async (visitId: string) => {
    try {
      // Safety check: ensure visit is scheduled for today
      const { data: visit, error: fetchErr } = await supabase
        .from('Visit')
        .select('scheduledAt')
        .eq('id', visitId)
        .single();
      
      if (fetchErr) throw fetchErr;

      if (visit && visit.scheduledAt) {
        const isToday = new Date(visit.scheduledAt).toDateString() === new Date().toDateString();
        if (!isToday) {
          throw new Error('Cannot mark visitor arrived beforehand. Action restricted to current day bookings.');
        }
      }

      const { error } = await supabase
        .from('Visit')
        .update({
          status: 'Waiting'
        })
        .eq('id', visitId);

      if (error) throw error;

      setAlertMessage({ type: 'success', text: 'Visitor marked as arrived. Reception has been notified!' });
      
      if (currentView === 'security_arrivals') fetchQueue();
      if (currentView === 'check_invite') fetchFutureInvitations();
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Failed to update status' });
    }
  };

  const handleUpdateRemark = async () => {
    if (!showRemarkModal) return;
    try {
      const { error } = await supabase
        .from('Visit')
        .update({ remarks: remarkText })
        .eq('id', showRemarkModal.id);

      if (error) {
        if (error.message.includes('remarks')) {
          throw new Error('Remarks feature requires a database migration. Please run add_remarks_column.sql in your Supabase SQL Editor.');
        }
        throw error;
      }

      setAlertMessage({ type: 'success', text: 'Remark saved successfully! Security will see it in the visit details.' });
      setShowRemarkModal(null);
      setRemarkText('');
      fetchEmployeeVisits();
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Failed to save remark' });
    }
  };







  const fetchQueue = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('Visit')
        .select(`
          id,
          visitorId,
          purpose,
          status,
          scheduledAt,
          createdAt,
          checkedInAt,
          checkedOutAt,
          deniedReason,
          zoneAccess,
          additionalGuests,
          Visitor (
            id,
            fullName,
            email,
            phone,
            company,
            visitorType,
            photoUrl
          ),
          Employee (
            id,
            fullName,
            email,
            phone
          )
        `)
        .eq('branchId', user.branchId) // Isolating by active branch
        .or(`createdAt.gte.${startOfDay.toISOString()},scheduledAt.gte.${startOfDay.toISOString()}`)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped = data
          .map((v: any) => ({
            id: v.id,
            visitorId: v.visitorId,
            visitorName: v.Visitor?.fullName || 'Visitor',
            visitorEmail: v.Visitor?.email || '',
            visitorPhone: v.Visitor?.phone || '',
            visitorCompany: v.Visitor?.company || '',
            visitorType: v.Visitor?.visitorType || 'Guest',
            hostId: v.Employee?.id || '',
            hostName: v.Employee?.fullName || 'Host',
            hostEmail: v.Employee?.email || '',
            hostPhone: v.Employee?.phone || '',
            purpose: v.purpose,
            status: v.status,
            scheduledAt: v.scheduledAt,
            createdAt: v.createdAt,
            checkedInAt: v.checkedInAt,
            checkedOutAt: v.checkedOutAt,
            deniedReason: v.deniedReason || '',
            zoneAccess: v.zoneAccess || '',
            photoUrl: v.Visitor?.photoUrl || '',
            additionalGuests: v.additionalGuests || 0
          }))
          .filter((v: any) => {
            const time = new Date(v.scheduledAt || v.createdAt).getTime();
            return time >= startOfDay.getTime() && time <= endOfDay.getTime();
          });
        setQueue(mapped);
      }
    } catch (err: any) {
      console.error('Error loading queue:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFutureInvitations = async () => {
    setLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      let response = await supabase
        .from('Visit')
        .select(`
          id,
          purpose,
          status,
          scheduledAt,
          remarks,
          Visitor (
            id,
            fullName,
            email,
            phone,
            company,
            visitorType,
            isBlacklisted,
            blacklistFlag
          ),
          Employee (
            id,
            fullName,
            phone,
            Department (
              name
            )
          )
        `)
        .eq('branchId', user.branchId)
        .eq('status', 'Expected')
        .gte('scheduledAt', todayStart.toISOString())
        .order('scheduledAt', { ascending: true });

      if (response.error && response.error.message.includes('remarks')) {
        // Fallback without remarks column
        response = (await supabase
          .from('Visit')
          .select(`
            id,
            purpose,
            status,
            scheduledAt,
            Visitor (
              id,
              fullName,
              email,
              phone,
              company,
              visitorType,
              isBlacklisted,
              blacklistFlag
            ),
            Employee (
              id,
              fullName,
              phone,
              Department (
                name
              )
            )
          `)
          .eq('branchId', user.branchId)
          .eq('status', 'Expected')
          .gte('scheduledAt', todayStart.toISOString())
          .order('scheduledAt', { ascending: true })) as any;
      }

      const { data, error } = response;

      if (error) throw error;

      if (data) {
        const mapped = data.filter((v: any) => v.Visitor !== null).map((v: any) => ({
          id: v.id,
          visitorId: v.Visitor?.id || '',
          visitorName: v.Visitor?.fullName || 'Visitor',
          visitorEmail: v.Visitor?.email || '',
          visitorPhone: v.Visitor?.phone || '',
          visitorCompany: v.Visitor?.company || '',
          visitorType: v.Visitor?.visitorType || 'Guest',
          hostName: v.Employee?.fullName || 'Host',
          hostPhone: v.Employee?.phone || '',
          hostDept: v.Employee?.Department?.name || '',
          purpose: v.purpose,
          status: v.status,
          scheduledAt: v.scheduledAt,
          isBlacklisted: v.Visitor?.isBlacklisted || false,
          blacklistFlag: v.Visitor?.blacklistFlag || '',
          remarks: v.remarks || ''
        }));
        setFutureInvitations(mapped);
      }
    } catch (err: any) {
      console.error('Error fetching future invitations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPastRecords = async () => {
    setLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('Visit')
        .select(`
          id,
          purpose,
          status,
          scheduledAt,
          checkedInAt,
          checkedOutAt,
          deniedReason,
          zoneAccess,
          additionalGuests,
          Visitor (
            id,
            fullName,
            email,
            phone,
            company,
            visitorType,
            location
          ),
          Employee (
            id,
            fullName,
            phone,
            floor,
            Department (
              name
            )
          ),
          Badge (
            badgeNumber
          )
        `)
        .eq('branchId', user.branchId)
        .or(`status.in.("CheckedOut","Denied","Cancelled"),and(status.eq.Expected,scheduledAt.lt.${todayStart.toISOString()})`)
        .order('scheduledAt', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped = data.filter((v: any) => v.Visitor !== null).map((v: any) => ({
          id: v.id,
          visitorId: v.Visitor?.id || '',
          visitorName: v.Visitor?.fullName || 'Visitor',
          visitorEmail: v.Visitor?.email || '',
          visitorPhone: v.Visitor?.phone || '',
          visitorCompany: v.Visitor?.company || '',
          visitorType: v.Visitor?.visitorType || 'Guest',
          visitorLocation: v.Visitor?.location || '',
          hostName: v.Employee?.fullName || 'Host',
          hostPhone: v.Employee?.phone || '',
          hostFloor: v.Employee?.floor || '',
          department: v.Employee?.Department?.name || (Array.isArray(v.Employee?.Department) ? v.Employee?.Department[0]?.name : '') || 'N/A',
          purpose: v.purpose,
          status: v.status,
          scheduledAt: v.scheduledAt,
          checkedInAt: v.checkedInAt,
          checkedOutAt: v.checkedOutAt,
          deniedReason: v.deniedReason || '',
          zoneAccess: v.zoneAccess || 'Floor 1, Lobby',
          badgeNumber: v.Badge?.badgeNumber || (Array.isArray(v.Badge) ? v.Badge[0]?.badgeNumber : '') || 'N/A',
          additionalGuests: v.additionalGuests || 0
        }));
        setPastRecords(mapped);
      }
    } catch (err: any) {
      console.error('Error fetching past records:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Employee')
        .select(`
          id,
          fullName,
          email,
          phone,
          floor,
          isActive,
          departmentId,
          Department (
            name
          )
        `)
        .eq('branchId', user.branchId); // Isolating by active branch

      if (error) throw error;

      if (data) {
        const mapped = data.map((e: any) => ({
          id: e.id,
          fullName: e.fullName,
          email: e.email,
          phone: e.phone,
          floor: e.floor,
          isActive: e.isActive,
          departmentId: e.departmentId,
          departmentName: e.Department?.name || 'General'
        }));
        setEmployees(mapped);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('Department')
        .select('id, name')
        .eq('branchId', user.branchId); // Filter departments by active branch
      if (error) throw error;
      if (data) setDepts(data);
    } catch (err) {
      console.error(err);
    }
  };



  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Query last 30 days of visits to compute analytical data client-side
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: visits, error } = await supabase
        .from('Visit')
        .select(`
          id,
          visitorId,
          purpose,
          status,
          createdAt,
          checkedInAt,
          checkedOutAt,
          Visitor (
            visitorType
          ),
          Employee (
            Department (
              name
            )
          )
        `)
        .eq('branchId', user.branchId) // Isolating by active branch
        .gte('createdAt', thirtyDaysAgo.toISOString());

      if (error) throw error;

      if (visits) {
        const todayStr = new Date().toDateString();
        
        const todaysVisitors = visits.filter(v => new Date(v.createdAt).toDateString() === todayStr).length;
        const deniedEntries = visits.filter(v => v.status === 'Denied').length; // 30d total denied entries
        const deniedEntriesToday = visits.filter(v => v.status === 'Denied' && new Date(v.createdAt).toDateString() === todayStr).length;

        // Dwell time calculation (avg checkedout session duration)
        const checkouts = visits.filter(v => v.status === 'CheckedOut' && v.checkedInAt && v.checkedOutAt && new Date(v.checkedOutAt).getTime() >= new Date(v.checkedInAt).getTime());
        const avgVisitMinutes = checkouts.length > 0 
          ? Math.round(checkouts.reduce((acc, curr) => acc + (new Date(curr.checkedOutAt!).getTime() - new Date(curr.checkedInAt!).getTime()), 0) / (checkouts.length * 60000))
          : 45; // default fallback metric

        // Group by Department
        const deptMap: Record<string, number> = {};
        // Group by Purpose
        const purposeMap: Record<string, number> = {};
        // Real repeat guests calculation
        const visitorVisitsCount: Record<string, number> = {};

        visits.forEach((v: any) => {
          const dept = v.Employee?.Department?.name || 'General';
          deptMap[dept] = (deptMap[dept] || 0) + 1;

          const purp = v.purpose || 'Other';
          purposeMap[purp] = (purposeMap[purp] || 0) + 1;

          if (v.visitorId) {
            visitorVisitsCount[v.visitorId] = (visitorVisitsCount[v.visitorId] || 0) + 1;
          }
        });

        const visitorsByDept = Object.entries(deptMap).map(([name, value]) => ({
          department: name,
          count: value
        }));

        const visitorsByPurpose = Object.entries(purposeMap).map(([name, value]) => ({
          purpose: name,
          count: value
        })).sort((a, b) => b.count - a.count).slice(0, 5);

        // Render 7-day trend line counts
        const weeklyTrend = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
          const count = visits.filter(v => new Date(v.createdAt).toDateString() === d.toDateString()).length;
          weeklyTrend.push({ date: label, count });
        }

        // Real repeat guests calculation
        const repeatCount = Object.values(visitorVisitsCount).filter(count => count > 1).length;
        const totalUniqueVisitors = Object.keys(visitorVisitsCount).length;
        const repeatRate = totalUniqueVisitors > 0 ? Math.round((repeatCount / totalUniqueVisitors) * 100) : 0;

        // Hourly check-ins mapping over last 30 days
        const hourMap: Record<string, number> = {};
        for (let h = 8; h <= 18; h++) {
          const hourLabel = `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? 'PM' : 'AM'}`;
          hourMap[hourLabel] = 0;
        }
        visits.forEach((v: any) => {
          if (v.checkedInAt) {
            const hr = new Date(v.checkedInAt).getHours();
            if (hr >= 8 && hr <= 18) {
              const hourLabel = `${hr % 12 === 0 ? 12 : hr % 12} ${hr >= 12 ? 'PM' : 'AM'}`;
              hourMap[hourLabel] = (hourMap[hourLabel] || 0) + 1;
            }
          }
        });
        const hourlyData = Object.entries(hourMap).map(([hour, count]) => ({
          hour,
          count
        }));

        setAnalytics({
          avgVisitMinutes,
          todaysVisitors,
          total30d: visits.length,
          repeatRate,
          repeatVisitors: repeatCount,
          deniedEntries,
          deniedEntriesToday,
          weeklyTrend,
          visitorsByDept,
          visitorsByPurpose,
          hourlyData
        });
      }
    } catch (err: any) {
      console.error('Error generating analytics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  ;

  // Pre-Register Guest Handler
  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preName || !preHostId || !prePurpose || !preScheduled) return;

    // Validate that scheduled date and time is not in the past
    if (new Date(preScheduled).getTime() < Date.now() - 60000) {
      setAlertMessage({ type: 'error', text: 'Scheduled date and time cannot be in the past.' });
      return;
    }

    // Validate guest count limits (Max 10 for non-VIP)
    if (preType !== 'VIP' && preGuestCount > 10) {
      setAlertMessage({ type: 'error', text: 'Number of guests cannot exceed 10 for non-VIP visitors.' });
      return;
    }

    // Validate Email if entered
    if (preEmail.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(preEmail.trim())) {
        setAlertMessage({ type: 'error', text: 'Please enter a valid email address (e.g. name@domain.com).' });
        return;
      }
    }

    // Combine Selected Country Code prefix with Phone number value
    let finalPhone = '';
    if (prePhone.trim()) {
      const cleanPhone = prePhone.trim();
      if (cleanPhone.startsWith('+')) {
        finalPhone = cleanPhone;
      } else {
        finalPhone = `${prePhoneCountryCode} ${cleanPhone}`;
      }

      const phoneRegex = /^\+[1-9][0-9\s\-()]{6,19}$/;
      if (!phoneRegex.test(finalPhone)) {
        setAlertMessage({ type: 'error', text: 'Please enter a valid phone number. If entering a country code prefix manually, start it with "+".' });
        return;
      }

      // Enforce country-specific phone digit limits
      let activePrefix = prePhoneCountryCode;
      let checkDigits = cleanPhone.replace(/\D/g, '');
      if (cleanPhone.startsWith('+')) {
        // Try to identify prefix
        const matchedPrefix = ['+971', '+353', '+880', '+977', '+234', '+254', '+233', '+852', '+886', '+358', '+966']
          .find(p => cleanPhone.startsWith(p)) || cleanPhone.substring(0, 3);
        activePrefix = matchedPrefix;
        checkDigits = cleanPhone.replace(activePrefix, '').replace(/\D/g, '');
      }
      const limit = getPhoneLimit(activePrefix);
      if (checkDigits.length !== limit) {
        setAlertMessage({ 
          type: 'error', 
          text: `Phone number must be exactly ${limit} digits for ${activePrefix}. Currently it has ${checkDigits.length} digits.` 
        });
        return;
      }
    }

    try {
      // 1. Check or Create Visitor
      let visitorId = '';
      if (preEmail) {
        const { data: existing } = await supabase
          .from('Visitor')
          .select('id')
          .eq('email', preEmail)
          .maybeSingle();
        if (existing) visitorId = existing.id;
      }

      if (!visitorId) {
        const { data: existing } = await supabase
          .from('Visitor')
          .select('id')
          .ilike('fullName', preName)
          .maybeSingle();
        if (existing) visitorId = existing.id;
      }

      if (!visitorId) {
        const { data: created, error: crErr } = await supabase
          .from('Visitor')
          .insert({
            fullName: preName,
            email: preEmail || null,
            phone: finalPhone || null,
            company: preCompany || null,
            visitorType: preType,
            location: preLocation || null
          })
          .select('id')
          .single();

        if (crErr) throw crErr;
        if (created) visitorId = created.id;
      }

      // 2. Generate unique QR Token and Check-In Code (cryptographically secure)
      const qrToken = `QR-${self.crypto.randomUUID()}`;
      const checkInCode = `VMS-${self.crypto.randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase()}`;

      // 3. Create Invitation
      const { data: invite, error: inviteErr } = await supabase
        .from('Invitation')
        .insert({
          visitorId,
          hostEmployeeId: preHostId,
          qrToken,
          scheduledAt: new Date(preScheduled).toISOString(),
          expiresAt: new Date(new Date(preScheduled).getTime() + 86400000).toISOString()
        })
        .select('id')
        .single();

      if (inviteErr) throw inviteErr;

      // 4. Create expected Visit shell
      const { error: visitErr } = await supabase
        .from('Visit')
        .insert({
          visitorId,
          hostEmployeeId: preHostId,
          invitationId: invite.id,
          branchId: user.branchId,
          purpose: prePurpose,
          status: 'Expected',
          scheduledAt: new Date(preScheduled).toISOString(),
          checkInCode,
          additionalGuests: preGuestCount,
          createdByUserId: user ? user.id : null
        });

      if (visitErr) throw visitErr;

      // 5. Queue notification
      await supabase.from('Notification').insert({
        recipientVisitorId: visitorId,
        channel: 'Email',
        message: `Hello ${preName}, you have been invited to visit ${user.branchName} by our staff. Please scan your QR code ${qrToken} at the lobby kiosk on arrival on ${new Date(preScheduled).toLocaleString()}.`,
        status: 'Queued'
      });

      setAlertMessage({ type: 'success', text: `✅ Pre-registered ${preName}! Check-in code: ${checkInCode} — share this with the visitor for lobby entry.` });
      setShowPreRegModal(false);
      
      if (currentView === 'queue' || currentView === 'security_arrivals') fetchQueue();
      if (currentView === 'check_invite') fetchFutureInvitations();
      if (currentView === 'employee_scheduled' || currentView === 'employee_past' || currentView === 'employee_invite') fetchEmployeeVisits();

      // Reset pre-reg inputs
      setPreName('');
      setPreEmail('');
      setPrePhone('');
      setPrePhoneCountryCode('+1');
      setPreCompany('');
      setPreLocation('');
      setPrePurpose('');
      setPreScheduled('');
      setPreGuestCount(0);
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Server error occurred' });
    }
  };

  // Check In visitor and generate printable pass
  const handleApproveCheckIn = async (visitId: string) => {
    try {
      // Fetch full visit details for the pass before updating
      const { data: visitData, error: fetchErr } = await supabase
        .from('Visit')
        .select(`
          id, purpose, scheduledAt, additionalGuests, status,
          Visitor ( fullName, company, visitorType, email, phone ),
          Employee ( fullName, phone, Department ( name ) )
        `)
        .eq('id', visitId)
        .single();

      if (fetchErr) throw fetchErr;

      if (visitData?.status === 'Denied') {
        setAlertMessage({ type: 'error', text: 'This visit has already been denied entry by the host/employee.' });
        return;
      }

      const checkedInAt = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from('Visit')
        .update({ status: 'CheckedIn', checkedInAt, zoneAccess: 'Floor 1, Lobby' })
        .eq('id', visitId);

      if (updateErr) throw updateErr;

      const badgeNumber = `BDG-${self.crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()}`;
      await supabase.from('Badge').upsert(
        { visitId, badgeNumber, printedAt: checkedInAt, printCount: 1 },
        { onConflict: 'visitId' }
      );

      await supabase.from('AuditLog').insert({
        actorUserId: user.id,
        action: 'VISIT_STATUS_CHECKEDIN',
        entityType: 'Visit',
        entityId: visitId
      });

      // Show printable pass
      if (visitData && user?.role !== 'Employee') {
        const v = visitData.Visitor as any;
        const e = visitData.Employee as any;
        const dept = Array.isArray(e?.Department) ? e.Department[0] : e?.Department;
        setShowPassModal({
          badgeNumber,
          checkedInAt,
          visitorName: v?.fullName || '',
          visitorCompany: v?.company || '',
          visitorType: v?.visitorType || 'Guest',
          visitorEmail: v?.email || '',
          visitorPhone: v?.phone || '',
          hostName: e?.fullName || '',
          hostPhone: e?.phone || '',
          department: dept?.name || '',
          purpose: visitData.purpose,
          additionalGuests: visitData.additionalGuests || 0,
          branchName: user.branchName || 'Headquarters',
          zoneAccess: 'Floor 1, Lobby'
        });
      }

      setAlertMessage({ type: 'success', text: `Visitor checked in! Badge ${badgeNumber} generated.` });
      fetchQueue();
      fetchEmployeeVisits();
      if (currentView === 'check_invite') fetchFutureInvitations();
      if (currentView === 'security_history') fetchPastRecords();
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Check-in failed' });
    }
  };

  // Deny Check-In
  const handleDenyCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDenyModal) return;

    try {
      const { error: updateErr } = await supabase
        .from('Visit')
        .update({
          status: 'Denied',
          deniedReason: denyReason
        })
        .eq('id', showDenyModal);

      if (updateErr) throw updateErr;

      // Add Audit Log
      await supabase.from('AuditLog').insert({
        actorUserId: user.id,
        action: 'VISIT_STATUS_DENIED',
        entityType: 'Visit',
        entityId: showDenyModal
      });

      setAlertMessage({ type: 'success', text: 'Visit entry request denied.' });
      setShowDenyModal(null);
      setDeniedReason('');
      fetchQueue();
      fetchEmployeeVisits();
      if (currentView === 'check_invite') fetchFutureInvitations();
      if (currentView === 'security_history') fetchPastRecords();
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Failure to deny visit' });
    }
  };

  // Execute manual Check-Out
  const handleCheckOut = async (visitId: string) => {
    try {
      const { data: visit, error: fetchErr } = await supabase
        .from('Visit')
        .select('visitorId, Employee(fullName)')
        .eq('id', visitId)
        .single();

      if (fetchErr) throw fetchErr;

      const { error: checkoutErr } = await supabase
        .from('Visit')
        .update({
          status: 'CheckedOut',
          checkedOutAt: new Date().toISOString()
        })
        .eq('id', visitId);

      if (checkoutErr) throw checkoutErr;

      // Queue feedback survey email notification
      const hostObj: any = visit.Employee;
      await supabase.from('Notification').insert({
        recipientVisitorId: visit.visitorId,
        channel: 'Email',
        message: `Thank you for visiting ${hostObj?.fullName || 'us'} at ${user.branchName}. Please rate your experience!`,
        status: 'Queued'
      });

      setAlertMessage({ type: 'success', text: 'Visitor checked out successfully.' });
      fetchQueue();
      if (currentView === 'security_history') fetchPastRecords();
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Checkout failed' });
    }
  };

  // Add Employee Host
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmpName || !addEmpEmail || !addEmpPhone || !addEmpDeptId) return;

    try {
      const { error } = await supabase
        .from('Employee')
        .insert({
          fullName: addEmpName,
          email: addEmpEmail,
          phone: addEmpPhone,
          floor: addEmpFloor || null,
          departmentId: addEmpDeptId,
          branchId: user.branchId,
          isActive: true
        });

      if (error) throw error;

      setAlertMessage({ type: 'success', text: `Host ${addEmpName} added to the company directory!` });
      setShowAddEmpModal(false);
      fetchEmployees();

      // Reset inputs
      setAddEmpName('');
      setAddEmpEmail('');
      setAddEmpPhone('');
      setAddEmpFloor('');
      setAddEmpDeptId('');
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Failed to add employee' });
    }
  };

  // Add Blacklist
  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBlName || !addBlReason) return;

    try {
      // Find matching visitor if registered before
      let visitorId = null;
      const { data: matchedVisitor } = await supabase
        .from('Visitor')
        .select('id')
        .ilike('fullName', addBlName)
        .maybeSingle();

      if (matchedVisitor) {
        visitorId = matchedVisitor.id;
        // flag existing visitor
        await supabase
          .from('Visitor')
          .update({ isBlacklisted: true })
          .eq('id', visitorId);
      }

      const { error } = await supabase
        .from('Blacklist')
        .insert({
          visitorId,
          fullName: addBlName,
          reason: addBlReason,
          severity: addBlSeverity,
          addedByUserId: user.id
        });
      if (error) throw error;

      setAlertMessage({ type: 'success', text: `${addBlName} added to the security watch blacklist.` });
      setShowAddBlModal(false);

      // Reset inputs
      setAddBlName('');
      setAddBlReason('');
      setAddBlSeverity('Medium');
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Failed to blacklist' });
    }
  };

  ;

  // Active visitor entries for today
  const todayStr = new Date().toDateString();
  const todaysQueue = queue.filter(item => {
    const isToday = (item.scheduledAt && new Date(item.scheduledAt).toDateString() === todayStr) ||
                    (item.createdAt && new Date(item.createdAt).toDateString() === todayStr);
    const isActive = ['CheckedIn', 'Waiting', 'Expected'].includes(item.status);
    return isToday || (isActive && item.status !== 'Expected');
  });

  const activeArrivalsToday = todaysQueue.filter(item => 
    ['Expected', 'Waiting', 'CheckedIn'].includes(item.status)
  );

  const filteredArrivals = activeArrivalsToday.filter(item => 
    item.visitorName.toLowerCase().includes(queueSearch.toLowerCase()) ||
    item.hostName.toLowerCase().includes(queueSearch.toLowerCase())
  );

  // Filter queues
  const filteredQueue = todaysQueue.filter(item => 
    item.visitorName.toLowerCase().includes(queueSearch.toLowerCase()) ||
    item.hostName.toLowerCase().includes(queueSearch.toLowerCase()) ||
    item.purpose.toLowerCase().includes(queueSearch.toLowerCase())
  );

  const filteredEmployees = employees.filter(e => 
    e.fullName.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.departmentName.toLowerCase().includes(empSearch.toLowerCase())
  );



  // Status metrics counts for Queue tab
  const queueStats = {
    expected: todaysQueue.filter(v => v.status === 'Expected').length,
    checkedin: todaysQueue.filter(v => ['CheckedIn', 'InMeeting'].includes(v.status)).length,
    waiting: todaysQueue.filter(v => v.status === 'Waiting').length,
    checkedout: todaysQueue.filter(v => v.status === 'CheckedOut').length
  };

  // PIE Chart cells mapping colors
  const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#a855f7'];

  // Auth Guard
  if (!token || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-gradient)' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '24px', padding: '40px', width: '90%', maxWidth: '440px', backdropFilter: 'var(--backdrop-blur)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#10b981', fontWeight: 700, fontSize: '1.5rem', marginBottom: '24px', justifyContent: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #059669, #10b981)',
              borderRadius: '12px',
              padding: '8px',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <Building size={20} />
            </div>
            <span>VMS STAFF PORTAL</span>
          </div>

          <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '1.4rem' }}>Lobby Staff Sign In</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '32px' }}>Enter your staff credentials to access the portal</p>

          {loginError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '12px', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <AlertOctagon size={16} />
              <div>{loginError}</div>
            </div>
          )}

          {loginAttempts >= 5 && loginAttempts < 10 && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '12px', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <AlertOctagon size={16} />
              <div>{loginAttempts} tries used and {10 - loginAttempts} remain.</div>
            </div>
          )}

          {lockoutUntil > Date.now() && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '12px', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <AlertOctagon size={16} />
              <div>Locked out due to too many failed attempts. Try again in {formatTime(secondsRemaining || Math.ceil((lockoutUntil - Date.now()) / 1000))}.</div>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="security@vms.local"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                disabled={lockoutUntil > Date.now()}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                disabled={lockoutUntil > Date.now()}
              />
            </div>

            <Button type="submit" variant="primary" style={{ width: '100%', padding: '12px' }} isLoading={loading} disabled={lockoutUntil > Date.now()}>
              Sign In
            </Button>
          </form>


        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid var(--card-border)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            borderRadius: '12px',
            padding: '8px',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}>
            <Building size={20} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.5px' }}>VMS GATEWAY</span>
        </div>

        <ul className="sidebar-menu">
          {/* SECURITY TABS */}
          {user.role === 'Security' && (
            <>
              <li>
                <div 
                  className={`menu-item ${currentView === 'security_arrivals' ? 'active' : ''}`}
                  onClick={() => setCurrentView('security_arrivals')}
                >
                  <Clock size={18} strokeWidth={currentView === 'security_arrivals' ? 2.4 : 2} />
                  <span>Today's Arrivals</span>
                </div>
              </li>
              <li>
                <div 
                  className={`menu-item ${currentView === 'check_invite' ? 'active' : ''}`}
                  onClick={() => setCurrentView('check_invite')}
                >
                  <Search size={18} strokeWidth={currentView === 'check_invite' ? 2.4 : 2} />
                  <span>Check Invitation</span>
                </div>
              </li>
              <li>
                <div 
                  className={`menu-item ${currentView === 'security_history' ? 'active' : ''}`}
                  onClick={() => setCurrentView('security_history')}
                >
                  <History size={18} strokeWidth={currentView === 'security_history' ? 2.4 : 2} />
                  <span>Past Records</span>
                </div>
              </li>
              <li>
                <div 
                  className={`menu-item`}
                  onClick={() => setShowPreRegModal(true)}
                >
                  <Plus size={18} strokeWidth={2} />
                  <span>Register Walk-in</span>
                </div>
              </li>
            </>
          )}

          {/* EMPLOYEE TABS */}
          {user.role === 'Employee' && (
            <>
              <li>
                <div 
                  className={`menu-item ${currentView === 'employee_scheduled' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('employee_scheduled');
                    fetchEmployeeVisits();
                  }}
                >
                  <Clock size={18} strokeWidth={currentView === 'employee_scheduled' ? 2.4 : 2} />
                  <span>Today's Scheduled</span>
                </div>
              </li>
              <li>
                <div 
                  className={`menu-item ${currentView === 'employee_past' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('employee_past');
                    fetchEmployeeVisits();
                  }}
                >
                  <History size={18} strokeWidth={currentView === 'employee_past' ? 2.4 : 2} />
                  <span>Past Hosted Visits</span>
                </div>
              </li>
              <li>
                <div 
                  className={`menu-item ${currentView === 'employee_future' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('employee_future');
                    fetchEmployeeVisits();
                  }}
                >
                  <Calendar size={18} strokeWidth={currentView === 'employee_future' ? 2.4 : 2} />
                  <span>My Future Visits</span>
                </div>
              </li>
              <li>
                <div 
                  className={`menu-item ${currentView === 'employee_invite' ? 'active' : ''}`}
                  onClick={() => setCurrentView('employee_invite')}
                >
                  <Plus size={18} strokeWidth={currentView === 'employee_invite' ? 2.4 : 2} />
                  <span>Invite Future Guest</span>
                </div>
              </li>
            </>
          )}

          {/* ADMIN TABS */}
          {user.role === 'Admin' && (
            <>
              <li>
                <div 
                  className={`menu-item ${currentView === 'queue' ? 'active' : ''}`}
                  onClick={() => setCurrentView('queue')}
                >
                  <Clock size={18} strokeWidth={currentView === 'queue' ? 2.4 : 2} />
                  <span>Lobby Queue</span>
                </div>
              </li>
              <li>
                <div 
                  className={`menu-item ${currentView === 'employees' ? 'active' : ''}`}
                  onClick={() => setCurrentView('employees')}
                >
                  <Users size={18} strokeWidth={currentView === 'employees' ? 2.4 : 2} />
                  <span>Company Directory</span>
                </div>
              </li>

              <li>
                <div 
                  className={`menu-item ${currentView === 'blacklist_review' ? 'active' : ''}`}
                  onClick={() => setCurrentView('blacklist_review')}
                >
                  <ShieldAlert size={18} strokeWidth={currentView === 'blacklist_review' ? 2.4 : 2} />
                  <span>Blacklist Review Queue</span>
                </div>
              </li>
              <li>
                <div 
                  className={`menu-item ${currentView === 'analytics' ? 'active' : ''}`}
                  onClick={() => setCurrentView('analytics')}
                >
                  <BarChart2 size={18} strokeWidth={currentView === 'analytics' ? 2.4 : 2} />
                  <span>Analytics</span>
                </div>
              </li>

            </>
          )}
        </ul>



        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingLeft: '8px' }}>
            <Avatar name={user.fullName} size="md" online={true} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.fullName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{user.role}</div>
            </div>
          </div>
          <Button variant="danger" style={{ width: '100%' }} onClick={handleLogout} leftIcon={<LogOut size={14} />}>
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Panel Viewport */}
      <main className="main-viewport">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {currentView === 'queue' && "Lobby Visitor Queue"}
            {currentView === 'employees' && "Company Directory"}

            {currentView === 'analytics' && "Visitor Trend Analytics"}
            {currentView === 'security_arrivals' && "Today's Arrivals (Security Gate)"}
            {currentView === 'check_invite' && "Check Pre-Registration / Invitation"}
            {currentView === 'security_history' && "Visitor History Log (Security)"}

            {currentView === 'employee_scheduled' && "Today's Scheduled Visitors"}
            {currentView === 'employee_past' && "Past Hosted Visits"}
            {currentView === 'employee_future' && "My Future Visits"}
            {currentView === 'employee_invite' && "Invite Future Visitors"}
            {currentView === 'blacklist_review' && "Blacklist Flag Review Queue"}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <>
                  <span style={{ display: 'flex' }}>☀️</span>
                  <span style={{ fontSize: '0.8rem' }}>Light Mode</span>
                </>
              ) : (
                <>
                  <span style={{ display: 'flex' }}>🌙</span>
                  <span style={{ fontSize: '0.8rem' }}>Dark Mode</span>
                </>
              )}
            </button>
            <span style={{ fontSize: '0.85rem', background: 'var(--card-bg-subtle)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', color: 'var(--color-indigo-accent)' }}>
              Active Branch: <strong>{user.branchName}</strong>
            </span>
          </div>
        </header>

        {/* Dynamic Inner Container */}
        <div className="page-container">
          
          {alertMessage && (
            <div style={{ 
              background: alertMessage.type === 'success' ? 'var(--status-checkedin)' : 'var(--status-denied)', 
              border: `1px solid ${alertMessage.type === 'success' ? 'var(--status-checkedin-text)' : 'var(--status-denied-text)'}`, 
              borderRadius: '12px', 
              padding: '16px', 
              color: alertMessage.type === 'success' ? 'var(--status-checkedin-text)' : 'var(--status-denied-text)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px',
              fontWeight: 600
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {alertMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertOctagon size={20} />}
                <span>{alertMessage.text}</span>
              </div>
              <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setAlertMessage(null)}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* VIEW: Security Arrivals */}
          {currentView === 'security_arrivals' && (
            <div>
              <div className="table-card">
                <div className="table-header">
                  <div style={{ position: 'relative', width: '50%' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Search today's arrivals..." 
                      value={queueSearch}
                      onChange={e => setQueueSearch(e.target.value)}
                      style={{ paddingLeft: '36px' }}
                    />
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
                  </div>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Visitor Details</th>
                        <th>Classification</th>
                        <th>Host Employee</th>
                        <th>Purpose of Visit</th>
                        <th>Scheduled Time</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeArrivalsToday.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '32px' }}>
                            <EmptyState icon={Users} title="No Visitors Scheduled" description="There are no visits scheduled at the gate for today." />
                          </td>
                        </tr>
                      ) : filteredArrivals.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '32px' }}>
                            <EmptyState icon={Search} title="No Matches Found" description="No matching arrivals found for today." />
                          </td>
                        </tr>
                      ) : (
                        filteredArrivals.map((item) => (
                          <tr key={item.id}>
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Avatar name={item.visitorName} size="md" />
                                <div>
                                  <div style={{ fontWeight: 600 }}>{item.visitorName}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{item.visitorCompany || 'Independent'}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <Badge tone="slate">
                                  {item.visitorType}
                                </Badge>
                                {item.additionalGuests > 0 && (
                                  <Badge tone="warning">
                                    +{item.additionalGuests} Guests
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{item.hostName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{item.hostPhone}</div>
                            </td>
                            <td>{item.purpose}</td>
                            <td>
                              {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Today'}
                            </td>
                            <td>
                              <Badge tone={getStatusTone(item.status)} dot={true}>
                                {getStatusLabel(item.status)}
                              </Badge>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                                {item.status === 'Expected' && (
                                  <>
                                    <Button variant="primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleSecurityMarkArrived(item.id)}>
                                      Mark Arrived
                                    </Button>
                                    <Button variant="danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowDenyModal(item.id)}>
                                      Deny Entry
                                    </Button>
                                  </>
                                )}
                                {item.status === 'Waiting' && (
                                  <>
                                    <Button variant="primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => handleApproveCheckIn(item.id)} leftIcon={<CheckCircle size={12} />}>
                                      Check In
                                    </Button>
                                    <Button variant="danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowDenyModal(item.id)}>
                                      Deny Entry
                                    </Button>
                                  </>
                                )}
                                {item.status === 'CheckedIn' && (
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Badge tone="success">✓ Checked In</Badge>
                                    <Button variant="danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleCheckOut(item.id)}>
                                      Check Out
                                    </Button>
                                  </div>
                                )}
                                <Button variant="secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: '#ef4444', color: 'var(--color-danger)' }} onClick={() => setShowFlagBlacklistModal(item.visitorId)}>
                                  Flag
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Check Invitation */}
          {currentView === 'check_invite' && (
            <div>
              <div style={{ background: 'var(--card-bg-subtle)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Verify Visitor Invitation</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Verify future invitations made by host/employees.
                </p>

                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search future invitations by visitor or host name..." 
                    value={inviteSearch} 
                    onChange={e => setInviteSearch(e.target.value)} 
                    style={{ paddingLeft: '36px' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
                </div>
              </div>

              <div className="table-card">
                <div className="table-header">
                  <div style={{ fontWeight: 600 }}>Future Scheduled Invitations</div>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Visitor Name</th>
                        <th>Company / Classification</th>
                        <th>Host Employee</th>
                        <th>Scheduled Time</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {futureInvitations.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '32px' }}>
                            <EmptyState icon={Users} title="No Future Invitations" description="No future invitations scheduled." />
                          </td>
                        </tr>
                      ) : (
                        (() => {
                          const filtered = futureInvitations.filter((item: any) => 
                            item.visitorName.toLowerCase().includes(inviteSearch.toLowerCase()) ||
                            item.hostName.toLowerCase().includes(inviteSearch.toLowerCase())
                          );
                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} style={{ padding: '32px' }}>
                                  <EmptyState icon={Search} title="No Matches Found" description="No matching invitations found." />
                                </td>
                              </tr>
                            );
                          }
                          return filtered.map((item: any) => {
                            const isBl = item.isBlacklisted;
                            const isFlagged = item.blacklistFlag === 'pending_review';
                            return (
                              <tr key={item.id} style={{ background: isBl ? 'rgba(239, 68, 68, 0.05)' : '' }}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Avatar name={item.visitorName} size="md" />
                                    <div>
                                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{item.visitorName}</span>
                                        {isBl && <Badge tone="danger">⚠️ BLACKLISTED</Badge>}
                                        {isFlagged && <Badge tone="warning">⚠️ PENDING REVIEW</Badge>}
                                      </div>
                                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{item.visitorEmail || 'No email provided'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <Badge tone="slate">
                                    {item.visitorCompany || 'Independent'}
                                  </Badge>
                                </td>
                                <td>{item.hostName || 'N/A'}</td>
                                <td>
                                  <div>{new Date(item.scheduledAt).toLocaleString()}</div>
                                  {new Date(item.scheduledAt).toDateString() === new Date().toDateString() ? (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 600 }}>• Today's Booking</span>
                                  ) : (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 600 }}>• Future Booking</span>
                                  )}
                                </td>
                                <td>
                                  <Badge tone={getStatusTone(item.status)} dot={true}>
                                    {getStatusLabel(item.status)}
                                  </Badge>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    {!isBl && ['Expected', 'Waiting'].includes(item.status) && (
                                      (() => {
                                        const isToday = new Date(item.scheduledAt).toDateString() === new Date().toDateString();
                                        if (isToday) {
                                          return (
                                            <Button variant="primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleSecurityMarkArrived(item.id)}>
                                              Mark Arrived
                                            </Button>
                                          );
                                        } else {
                                          return (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', background: 'var(--card-bg-subtle)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                                              Actions Locked (Future Visit)
                                            </span>
                                          );
                                        }
                                      })()
                                    )}
                                    <Button
                                      variant="secondary"
                                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                                      onClick={() => {
                                        setDetailPanelTab('general');
                                        setSelectedInviteDetails({ ...item, hostDept: item.hostDept || '' });
                                      }}
                                    >
                                      <FileText size={13} /> Details
                                    </Button>
                                    <Button variant="secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: '#ef4444', color: 'var(--color-danger)' }} onClick={() => setShowFlagBlacklistModal(item.visitorId)}>
                                      Flag Blacklist
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Past Records (Security History) */}
          {currentView === 'security_history' && (
            <div>
              <div style={{ background: 'var(--card-bg-subtle)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Visitor History Log</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Search and review past visitor entries, completions, and check-out logs.
                </p>

                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search past logs by visitor or host name..." 
                    value={pastSearch} 
                    onChange={e => setPastSearch(e.target.value)} 
                    style={{ paddingLeft: '36px' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
                </div>
              </div>

              <div className="table-card">
                <div className="table-header">
                  <div style={{ fontWeight: 600 }}>Completed &amp; Past Visits</div>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Visitor Details</th>
                        <th>Host Employee</th>
                        <th>Visit Purpose / Badge</th>
                        <th>Visit Schedule &amp; Timings</th>
                        <th>Final Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastRecords.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '32px' }}>
                            <EmptyState icon={History} title="No Past Records" description="No past visitor logs or historical records found." />
                          </td>
                        </tr>
                      ) : (
                        (() => {
                          const filtered = pastRecords.filter((item: any) => 
                            item.visitorName.toLowerCase().includes(pastSearch.toLowerCase()) ||
                            item.hostName.toLowerCase().includes(pastSearch.toLowerCase()) ||
                            item.visitorCompany.toLowerCase().includes(pastSearch.toLowerCase())
                          );
                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} style={{ padding: '32px' }}>
                                  <EmptyState icon={Search} title="No Matches Found" description="No matching past records found." />
                                </td>
                              </tr>
                            );
                          }
                          return filtered.map((item: any) => (
                            <tr key={item.id} style={{ 
                              borderBottom: '1px solid var(--card-border)',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={{ padding: '20px 16px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                  <Avatar name={item.visitorName} size="md" />
                                  
                                  {/* Details */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{item.visitorName}</span>
                                      <Badge tone="indigo">
                                        {item.visitorType}
                                      </Badge>
                                      
                                      {item.additionalGuests > 0 && (
                                        <Badge tone="warning">
                                          +{item.additionalGuests} Guests
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {/* Company Info */}
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                                      🏢 {item.visitorCompany || 'Independent'}
                                    </div>
                                    
                                    {/* Location Info */}
                                    {item.visitorLocation && (
                                      <div style={{ fontSize: '0.8rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>📍 Origin:</span>
                                        <span style={{ color: 'var(--color-warning)', fontWeight: 500 }}>{item.visitorLocation}</span>
                                      </div>
                                    )}
                                    
                                    {/* Contact Details */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                      {item.visitorEmail && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <span style={{ color: 'var(--color-text-secondary)' }}>✉️</span> {item.visitorEmail}
                                        </span>
                                      )}
                                      {item.visitorPhone && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <span style={{ color: 'var(--color-text-secondary)' }}>📞</span> {item.visitorPhone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '20px 16px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{item.hostName}</span>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      🏢 {item.department || 'General'}
                                    </span>
                                    {item.hostFloor && (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        📍 Floor {item.hostFloor}
                                      </span>
                                    )}
                                    {item.hostPhone && (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                        📞 {item.hostPhone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '20px 16px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ 
                                    fontSize: '0.8rem', 
                                    color: 'var(--color-text-primary)', 
                                    fontStyle: 'italic', 
                                    lineHeight: '1.4',
                                    background: 'var(--card-bg-subtle)',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    borderLeft: '3px solid #6366f1'
                                  }}>
                                    "{item.purpose}"
                                  </div>
                                  {item.badgeNumber && item.badgeNumber !== 'N/A' && (
                                    <Badge tone="indigo" style={{ alignSelf: 'flex-start' }}>
                                      💳 Badge: {item.badgeNumber}
                                    </Badge>
                                  )}
                                </div>
                              </td>

                              <td style={{ padding: '20px 16px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)' }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>📅</span>
                                    <span style={{ fontWeight: 500 }}>
                                      {new Date(item.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                  
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '1px dashed var(--card-border)', paddingLeft: '8px', marginLeft: '4px', marginTop: '4px' }}>
                                    <div style={{ color: 'var(--color-text-secondary)' }}>
                                      Scheduled: <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    
                                    {item.checkedInAt && (
                                      <div style={{ color: 'var(--color-success)' }}>
                                        🟢 Checked In: <span style={{ fontWeight: 500 }}>{new Date(item.checkedInAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                    )}

                                    {item.checkedOutAt && (
                                      <div style={{ color: 'var(--color-danger)' }}>
                                        🔴 Checked Out: <span style={{ fontWeight: 500 }}>{new Date(item.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                    )}

                                    {item.deniedReason && (
                                      <div style={{ 
                                        color: 'var(--color-danger)', 
                                        background: 'rgba(239, 68, 68, 0.1)', 
                                        padding: '4px 8px', 
                                        borderRadius: '4px', 
                                        marginTop: '4px', 
                                        border: '1px solid rgba(239, 68, 68, 0.15)',
                                        fontSize: '0.7rem' 
                                      }}>
                                        ⚠️ Deny Reason: {item.deniedReason}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '20px 16px', verticalAlign: 'middle' }}>
                                <Badge tone={getStatusTone(item.status)} dot={true}>
                                  {getStatusLabel(item.status)}
                                </Badge>
                              </td>
                            </tr>
                          ));
                        })()
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}



          {/* VIEW: Employee - Today's Scheduled Visitors */}
          {currentView === 'employee_scheduled' && (() => {
            const todayStr = new Date().toDateString();
            const todayScheduledVisits = employeeVisits.filter((item: any) => {
              const schedDateStr = new Date(item.scheduledAt).toDateString();
              const isActive = ['Expected', 'Waiting', 'CheckedIn'].includes(item.status);
              return schedDateStr === todayStr && isActive;
            });

            return (
              <div>
                <div className="table-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                  <div className="table-header" style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>Today's Scheduled Visitors</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Active visitor schedules for the current date</div>
                    </div>
                  </div>

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Visitor</th>
                          <th>Purpose</th>
                          <th>Expected Arrival</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayScheduledVisits.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '32px' }}>
                              <EmptyState icon={Clock} title="No Scheduled Visitors Today" description="No visitors scheduled for today. Need to host someone? Pre-register them in the Invite Future Guest tab." />
                            </td>
                          </tr>
                        ) : (
                          todayScheduledVisits.map((item: any) => (
                            <tr key={item.id} style={{ 
                              borderBottom: '1px solid var(--card-border)',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={{ padding: '20px 16px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                  <Avatar name={item.visitorName} size="md" />
                                  
                                  {/* Details */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{item.visitorName}</span>
                                      <Badge tone="indigo">
                                        {item.visitorType}
                                      </Badge>
                                      
                                      {item.additionalGuests > 0 && (
                                        <Badge tone="warning">
                                          +{item.additionalGuests} Guests
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {/* Company Info */}
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                                      🏢 {item.visitorCompany || 'Independent'}
                                    </div>
 
                                    {/* Location Info */}
                                    {item.visitorLocation && (
                                      <div style={{ fontSize: '0.8rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>📍 Origin:</span>
                                        <span style={{ color: 'var(--color-warning)', fontWeight: 500 }}>{item.visitorLocation}</span>
                                      </div>
                                    )}
                                    
                                    {/* Contact Details */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                      {item.visitorEmail && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <span style={{ color: 'var(--color-text-secondary)' }}>✉️</span> {item.visitorEmail}
                                        </span>
                                      )}
                                      {item.visitorPhone && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <span style={{ color: 'var(--color-text-secondary)' }}>📞</span> {item.visitorPhone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '20px 16px', verticalAlign: 'top' }}>
                                <div style={{ 
                                  fontSize: '0.8rem', 
                                  color: 'var(--color-text-primary)', 
                                  fontStyle: 'italic', 
                                  lineHeight: '1.4',
                                  background: 'var(--card-bg-subtle)',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  borderLeft: '3px solid #6366f1'
                                }}>
                                  "{item.purpose}"
                                </div>
                              </td>

                              <td style={{ padding: '20px 16px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>⏰</span>
                                    <span>{new Date(item.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{new Date(item.scheduledAt).toLocaleDateString(undefined, { weekday: 'long' })}</div>
                                </div>
                              </td>

                              <td style={{ padding: '20px 16px', verticalAlign: 'middle' }}>
                                <Badge tone={getStatusTone(item.status)} dot={true}>
                                  {getStatusLabel(item.status)}
                                </Badge>
                              </td>

                              <td style={{ padding: '20px 16px', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                  {item.status === 'Waiting' && (
                                    <>
                                      <Button variant="danger" style={{ 
                                        padding: '8px 16px', 
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                                      }} onClick={() => setShowDenyModal(item.id)}>
                                        Deny
                                      </Button>
                                    </>
                                  )}
                                  {item.status === 'Expected' && (
                                    <>
                                      <select 
                                        className="form-input" 
                                        defaultValue=""
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val) {
                                            handleDelayVisit(item.id, item.scheduledAt, parseInt(val));
                                            e.target.value = ""; 
                                          }
                                        }}
                                        style={{ 
                                          padding: '6px 12px', 
                                          fontSize: '0.8rem', 
                                          height: '36px', 
                                          background: 'var(--menu-item-bg)', 
                                          border: '1px solid var(--card-border)', 
                                          borderRadius: '8px', 
                                          color: 'var(--color-text-primary)', 
                                          cursor: 'pointer',
                                          fontWeight: 500
                                        }}
                                      >
                                        <option value="" disabled>⏳ Delay Visit...</option>
                                        <option value="15">Delay 15 Min</option>
                                        <option value="30">Delay 30 Min</option>
                                        <option value="45">Delay 45 Min</option>
                                        <option value="60">Delay 1 Hour</option>
                                      </select>
                                      <Button variant="danger" style={{ 
                                        padding: '6px 14px', 
                                        fontSize: '0.8rem', 
                                        height: '36px',
                                        fontWeight: 600,
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                      }} onClick={() => handleEmployeeCancelVisit(item.id)}>
                                        Cancel Visit
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* VIEW: Employee - Past Hosted Visitors */}
          {currentView === 'employee_past' && (() => {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            const pastHostedVisits = employeeVisits.filter((item: any) => {
              if (!item.scheduledAt) return false;
              const schedDate = new Date(item.scheduledAt);
              const isPast = schedDate < todayStart;
              const isFinalized = ['CheckedOut', 'Denied', 'Cancelled', 'cancellation_pending_reception'].includes(item.status);
              return isPast || isFinalized;
            });

            return (
              <div>
                <div className="table-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                  <div className="table-header" style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>Past Hosted Visits Log</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Historical visitor entries hosted by you</div>
                    </div>
                  </div>

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Visitor</th>
                          <th>Purpose</th>
                          <th>Schedule &amp; Timing Details</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pastHostedVisits.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ padding: '32px' }}>
                              <EmptyState icon={History} title="No Historical Visits" description="No historical visit logs found." />
                            </td>
                          </tr>
                        ) : (
                          pastHostedVisits.map((item: any) => (
                            <tr key={item.id} style={{ 
                              borderBottom: '1px solid var(--card-border)',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={{ padding: '20px 16px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                  <Avatar name={item.visitorName} size="md" />
                                  
                                  {/* Details */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{item.visitorName}</span>
                                      <Badge tone="indigo">
                                        {item.visitorType}
                                      </Badge>
                                      
                                      {item.additionalGuests > 0 && (
                                        <Badge tone="warning">
                                          +{item.additionalGuests} Guests
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {/* Company Info */}
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                                      🏢 {item.visitorCompany || 'Independent'}
                                    </div>

                                    {/* Location Info */}
                                    {item.visitorLocation && (
                                      <div style={{ fontSize: '0.8rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>📍 Origin:</span>
                                        <span style={{ color: 'var(--color-warning)', fontWeight: 500 }}>{item.visitorLocation}</span>
                                      </div>
                                    )}
                                    
                                    {/* Contact Details */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                      {item.visitorEmail && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <span style={{ color: 'var(--color-text-secondary)' }}>✉️</span> {item.visitorEmail}
                                        </span>
                                      )}
                                      {item.visitorPhone && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <span style={{ color: 'var(--color-text-secondary)' }}>📞</span> {item.visitorPhone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '20px 16px', verticalAlign: 'top' }}>
                                <div style={{ 
                                  fontSize: '0.8rem', 
                                  color: 'var(--color-text-primary)', 
                                  fontStyle: 'italic', 
                                  lineHeight: '1.4',
                                  background: 'var(--card-bg-subtle)',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  borderLeft: '3px solid #6366f1'
                                }}>
                                  "{item.purpose}"
                                </div>
                              </td>

                              <td style={{ padding: '20px 16px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)' }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>📅</span>
                                    <span style={{ fontWeight: 500 }}>
                                      {new Date(item.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                  
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '1px dashed var(--card-border)', paddingLeft: '8px', marginLeft: '4px', marginTop: '4px' }}>
                                    <div style={{ color: 'var(--color-text-secondary)' }}>
                                      Scheduled: <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    
                                    {item.checkedInAt && (
                                      <div style={{ color: 'var(--color-success)' }}>
                                        🟢 Checked In: <span style={{ fontWeight: 500 }}>{new Date(item.checkedInAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                    )}

                                    {item.checkedOutAt && (
                                      <div style={{ color: 'var(--color-danger)' }}>
                                        🔴 Checked Out: <span style={{ fontWeight: 500 }}>{new Date(item.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                    )}

                                    {item.deniedReason && (
                                      <div style={{ 
                                        color: 'var(--color-danger)', 
                                        background: 'rgba(239, 68, 68, 0.1)', 
                                        padding: '4px 8px', 
                                        borderRadius: '4px', 
                                        marginTop: '4px', 
                                        border: '1px solid rgba(239, 68, 68, 0.15)',
                                        fontSize: '0.7rem' 
                                      }}>
                                        ⚠️ Deny Reason: {item.deniedReason}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '20px 16px', verticalAlign: 'middle' }}>
                                <Badge tone={getStatusTone(item.status)} dot={true}>
                                  {getStatusLabel(item.status)}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* VIEW: Employee - My Future Visits */}
          {currentView === 'employee_future' && (() => {

            const now = new Date();
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            const futureVisits = employeeVisits.filter((item: any) => {
              if (!item.scheduledAt) return false;
              const schedDate = new Date(item.scheduledAt);
              const isFuture = schedDate > todayEnd;
              const isNotFinalized = !['CheckedOut', 'Denied', 'Cancelled', 'cancellation_pending_reception'].includes(item.status);
              return isFuture && isNotFinalized;
            }).sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

            return (
              <div>
                <div className="table-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                  <div className="table-header" style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={20} style={{ color: '#10b981' }} />
                        Upcoming Scheduled Visitors
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Future visits where you are the host. Read-only — add a remark to help security prepare.</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, background: 'rgba(99,102,241,0.08)', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
                      {futureVisits.length} Upcoming Visit{futureVisits.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="table-container">
                    {loading ? (
                      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                        <div>Loading future visits…</div>
                      </div>
                    ) : futureVisits.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)' }}>
                        <Calendar size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <div style={{ fontSize: '1rem', fontWeight: 500 }}>No upcoming visits scheduled</div>
                        <div style={{ fontSize: '0.8rem', marginTop: '6px', color: 'var(--color-text-secondary)' }}>Use <strong style={{ color: 'var(--color-text-secondary)' }}>Invite Future Guest</strong> to pre-register visitors</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
                        {futureVisits.map((item: any) => {
                          const schedDate = new Date(item.scheduledAt);
                          const daysFromNow = Math.ceil((schedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          const isThisWeek = daysFromNow <= 7;
                          return (
                            <div key={item.id} style={{
                              background: darkMode ? 'rgba(255,255,255,0.025)' : 'var(--card-bg-subtle)',
                              border: '1px solid var(--card-border)',
                              borderRadius: '12px',
                              padding: '20px 24px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '20px',
                              transition: 'border-color 0.2s',
                            }}
                              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--indigo-primary)')}
                              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--card-border)')}
                            >
                              {/* LEFT: Visitor Info */}
                              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1 }}>
                                <Avatar name={item.visitorName} size="lg" />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                                    {item.visitorName}
                                    <Badge tone="primary" style={{ marginLeft: '8px' }}>{item.visitorType}</Badge>
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                                    🏢 {item.visitorCompany || 'Independent'}
                                    {item.visitorEmail && <span style={{ marginLeft: '12px' }}>✉ {item.visitorEmail}</span>}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    <span>📋 Purpose: <strong style={{ color: darkMode ? 'var(--color-purple-accent)' : '#1e1b4b' }}>{item.purpose}</strong></span>
                                  </div>

                                  {/* Remark Preview */}
                                  {item.remarks && (
                                    <div style={{
                                      marginTop: '10px',
                                      background: darkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)',
                                      border: darkMode ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(99,102,241,0.3)',
                                      borderRadius: '8px',
                                      padding: '8px 12px',
                                      display: 'flex',
                                      gap: '8px',
                                      alignItems: 'flex-start',
                                      fontSize: '0.8rem'
                                    }}>
                                      <MessageSquare size={14} style={{ color: darkMode ? 'var(--color-indigo-accent)' : '#4338ca', flexShrink: 0, marginTop: '2px' }} />
                                      <div>
                                        <div style={{ color: darkMode ? 'var(--color-indigo-accent)' : '#4338ca', fontWeight: 600, fontSize: '0.7rem', marginBottom: '2px' }}>YOUR REMARK FOR SECURITY</div>
                                        <div style={{ color: darkMode ? 'var(--color-purple-accent)' : '#1e1b4b', fontWeight: 500 }}>{item.remarks}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* RIGHT: Date + Actions */}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
                                {/* Date/time block */}
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isThisWeek ? (darkMode ? '#fbbf24' : '#b45309') : 'var(--color-text-primary)' }}>
                                    {schedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                                    {schedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', marginTop: '2px', color: daysFromNow === 1 ? (darkMode ? '#f87171' : '#dc2626') : isThisWeek ? (darkMode ? '#fbbf24' : '#b45309') : (darkMode ? '#818cf8' : '#4f46e5'), fontWeight: 600 }}>
                                    {daysFromNow === 1 ? '• Tomorrow' : `• In ${daysFromNow} days`}
                                  </div>
                                </div>

                                {/* Status badge */}
                                <Badge tone={getStatusTone(item.status)} dot={true}>{getStatusLabel(item.status)}</Badge>

                                {/* Remark button */}
                                <button
                                  onClick={() => {
                                    setShowRemarkModal(item);
                                    setRemarkText(item.remarks || '');
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: item.remarks 
                                      ? (darkMode ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)') 
                                      : (darkMode ? 'rgba(255,255,255,0.05)' : 'var(--menu-item-bg)'),
                                    border: item.remarks 
                                      ? (darkMode ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(99,102,241,0.3)') 
                                      : (darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--card-border)'),
                                    borderRadius: '8px',
                                    padding: '7px 14px',
                                    color: item.remarks 
                                      ? (darkMode ? '#a5b4fc' : '#4f46e5') 
                                      : (darkMode ? '#a1a1aa' : 'var(--color-text-primary)'),
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <Edit2 size={13} />
                                  {item.remarks ? 'Edit Remark' : 'Add Remark'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* VIEW: Employee - Invite Future Visitors */}
          {currentView === 'employee_invite' && (
            <div style={{ maxWidth: '850px', margin: '0 auto' }}>
              <div className="table-card" style={{ padding: '36px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)' }}>
                <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--card-border)', paddingBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Invite Expected Guest (Pre-Registration)
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                    Register visitor credentials for a future schedule. You will be set automatically as the host.
                  </p>
                </div>

                <form onSubmit={handlePreRegister}>
                  {/* SECTION 1: VISITOR INFO */}
                  <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#10b981', display: 'flex' }}><User size={18} /></span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Visitor Credentials</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Visitor Full Name *</label>
                      <input type="text" className="form-input" required value={preName} onChange={e => setPreName(e.target.value)} placeholder="Jane Doe" style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Company / Organization</label>
                      <input type="text" className="form-input" value={preCompany} onChange={e => setPreCompany(e.target.value)} placeholder="Acme Corp" style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Email Address</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        value={preEmail} 
                        onChange={e => setPreEmail(e.target.value)} 
                        placeholder="jane@doe.com" 
                        style={{ width: '100%', height: '42px', fontSize: '0.9rem' }}
                      />
                      {preEmail.trim().length > 0 && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(preEmail.trim()) ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px', fontWeight: 500 }}>
                          ⚠️ Please enter a valid email address (e.g. name@domain.com)
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Example: name@domain.com</div>
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Phone Number</label>
                        {prePhone.trim() && (() => {
                          const clean = prePhone.trim();
                          let activePrefix = prePhoneCountryCode;
                          let checkDigits = clean.replace(/\D/g, '');
                          if (clean.startsWith('+')) {
                            const matchedPrefix = ['+971', '+353', '+880', '+977', '+234', '+254', '+233', '+852', '+886', '+358', '+966'].find(p => clean.startsWith(p));
                            activePrefix = matchedPrefix || clean.substring(0, 3);
                            checkDigits = clean.replace(activePrefix, '').replace(/\D/g, '');
                          }
                          const limit = getPhoneLimit(activePrefix);
                          const isWrongLength = checkDigits.length !== limit;
                          return (
                            <span style={{ fontSize: '0.75rem', color: isWrongLength ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                              {checkDigits.length} / {limit} digits {isWrongLength && '(Incorrect length)'}
                            </span>
                          );
                        })()}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select 
                          className="form-input" 
                          value={prePhoneCountryCode} 
                          onChange={e => setPrePhoneCountryCode(e.target.value)} 
                          style={{ width: '110px', background: 'var(--menu-item-bg)', padding: '10px 8px', height: '42px', fontSize: '0.9rem' }}
                        >
                          <option value="+1">+1 (US)</option>
                          <option value="+91">+91 (IN)</option>
                          <option value="+44">+44 (UK)</option>
                          <option value="+61">+61 (AU)</option>
                          <option value="+65">+65 (SG)</option>
                          <option value="+971">+971 (AE)</option>
                          <option value="+49">+49 (DE)</option>
                          <option value="+33">+33 (FR)</option>
                          <option value="+81">+81 (JP)</option>
                          <option value="+82">+82 (KR)</option>
                          <option value="+27">+27 (ZA)</option>
                          <option value="+55">+55 (BR)</option>
                        </select>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={prePhone} 
                          onChange={e => setPrePhone(e.target.value)} 
                          placeholder="(555) 0199" 
                          style={{ flex: 1, height: '42px', fontSize: '0.9rem' }}
                        />
                      </div>
                      {(() => {
                        const clean = prePhone.trim();
                        if (!clean) return <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Select country code &amp; enter local number</div>;
                        
                        let activePrefix = prePhoneCountryCode;
                        let checkDigits = clean.replace(/\D/g, '');
                        let finalPhoneVal = '';
                        if (clean.startsWith('+')) {
                          const matchedPrefix = ['+971', '+353', '+880', '+977', '+234', '+254', '+233', '+852', '+886', '+358', '+966'].find(p => clean.startsWith(p));
                          activePrefix = matchedPrefix || clean.substring(0, 3);
                          checkDigits = clean.replace(activePrefix, '').replace(/\D/g, '');
                          finalPhoneVal = clean;
                        } else {
                          finalPhoneVal = `${prePhoneCountryCode}${clean}`;
                        }

                        const limit = getPhoneLimit(activePrefix);
                        const isOver = checkDigits.length > limit;
                        const isUnder = checkDigits.length > 0 && checkDigits.length < limit;
                        const phoneRegex = /^\+[1-9][0-9\s\-()]{6,19}$/;
                        const isFormatInvalid = !phoneRegex.test(finalPhoneVal);

                        if (isOver || isUnder || isFormatInvalid) {
                          return (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px', fontWeight: 500 }}>
                              {isOver 
                                ? `⚠️ Max digits exceeded for ${activePrefix} (Limit is ${limit} digits)` 
                                : isUnder
                                ? `⚠️ Too few digits for ${activePrefix} (Must be exactly ${limit} digits)`
                                : `⚠️ Invalid phone format (Must start with country code prefix)`}
                            </div>
                          );
                        }
                        return <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Select country code &amp; enter local number</div>;
                      })()}
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Visitor's Office Location (Address / City)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={preLocation} 
                      onChange={e => setPreLocation(e.target.value)} 
                      placeholder="e.g. 123 Main St, New York or Bangalore HQ" 
                      style={{ width: '100%', height: '42px', fontSize: '0.9rem' }}
                    />
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Simple location/address to trace back origin if needed</div>
                  </div>

                  {/* SECTION 2: VISIT DETAILS */}
                  <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '8px', marginBottom: '20px', marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#10b981', display: 'flex' }}><History size={18} /></span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Visit Details</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Visitor Classification</label>
                      <select className="form-input" value={preType} onChange={(e: any) => { const newType = e.target.value; setPreType(newType); if (newType !== 'VIP' && preGuestCount > 10) setPreGuestCount(10); }} style={{ background: 'var(--menu-item-bg)', width: '100%', height: '42px', fontSize: '0.9rem' }}>
                        <option value="Guest">Guest</option>
                        <option value="Vendor">Vendor</option>
                        <option value="Contractor">Contractor</option>
                        <option value="Candidate">Candidate</option>
                        <option value="VIP">VIP</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Scheduled Date &amp; Time *</label>
                      <input type="datetime-local" className="form-input" required value={preScheduled} onChange={e => setPreScheduled(e.target.value)} min={getLocalISOString()} style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Number of Guests</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        min="0"
                        max={preType === 'VIP' ? undefined : 10}
                        value={preGuestCount} 
                        onChange={e => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setPreGuestCount(preType === 'VIP' ? val : Math.min(10, val));
                        }} 
                        style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} 
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Purpose of Visit *</label>
                    <input type="text" className="form-input" required value={prePurpose} onChange={e => setPrePurpose(e.target.value)} placeholder="Quarterly sync" style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--card-border)', paddingTop: '24px' }}>
                    <Button type="submit" variant="primary" style={{ padding: '12px 36px', fontSize: '0.9rem' }}>
                      Send Invitation &amp; Register
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: Blacklist Review Queue */}
          {currentView === 'blacklist_review' && (
            <div>
              {/* Header summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldAlert size={22} style={{ color: 'var(--color-danger)' }} />
                    Security Flag Review Queue
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    {flaggedVisitors.length > 0
                      ? `${flaggedVisitors.length} visitor${flaggedVisitors.length > 1 ? 's' : ''} flagged by security — review and decide action`
                      : 'No pending flags — all clear'}
                  </p>
                </div>
                {flaggedVisitors.length > 0 && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '8px 18px', color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.88rem' }}>
                    ⚠️ {flaggedVisitors.length} Pending Review{flaggedVisitors.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {flaggedVisitors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 24px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '16px' }}>
                  <ShieldAlert size={48} style={{ margin: '0 auto 20px', color: 'var(--color-success)', opacity: 0.6 }} />
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-success)' }}>All Clear — No Pending Reviews</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>Security guards have not flagged any new visitors for blacklist review.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {flaggedVisitors.map((v: any) => (
                    <div key={v.id} style={{
                      background: 'var(--card-bg)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 24px rgba(239,68,68,0.08)'
                    }}>
                      {/* Card Header */}
                      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-danger)', flexShrink: 0 }}>
                          {v.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-danger)' }}>{v.fullName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            {v.email && <span>{v.email}</span>}
                            {v.email && v.phone && <span style={{ margin: '0 8px', color: 'var(--color-text-secondary)' }}>|</span>}
                            {v.phone && <span>{v.phone}</span>}
                            {v.company && <span style={{ marginLeft: '8px', color: 'var(--color-text-secondary)' }}>· {v.company}</span>}
                          </div>
                        </div>
                        <Badge tone="danger" dot={true}>Pending Review</Badge>
                      </div>

                      {/* Card Body */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0', borderBottom: '1px solid var(--card-border)' }}>
                        {/* Flagged By */}
                        <div style={{ padding: '16px 24px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>🛡 Flagged By</div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{v.flaggedByName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                            {v.flaggedAt ? new Date(v.flaggedAt).toLocaleString() : 'Date unknown'}
                          </div>
                        </div>

                        {/* Visit History */}
                        <div style={{ padding: '16px 24px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>📋 Visit History</div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{v.visitHistory.length} recorded visit{v.visitHistory.length !== 1 ? 's' : ''}</div>
                          {v.visitHistory.length > 0 && (
                            <div style={{ fontSize: '0.73rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                              Last: {new Date(v.visitHistory[0].scheduledAt || v.visitHistory[0].createdAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Visitor Type */}
                        <div style={{ padding: '16px 24px' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>🏷 Visitor Type</div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{v.visitorType || 'Guest'}</div>
                        </div>
                      </div>

                      {/* Flag Reason */}
                      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>⚠️ Security Flag Reason</div>
                        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '12px 16px', color: 'var(--color-danger)', fontSize: '0.88rem', lineHeight: '1.5', fontStyle: 'italic' }}>
                          "{v.flagReason}"
                        </div>
                      </div>

                      {/* Admin Decision Actions */}
                      {user.role === 'Admin' && (
                        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginRight: 'auto' }}>
                            📌 Your decision will be logged and applied immediately
                          </span>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '9px 20px', fontSize: '0.85rem', borderColor: 'rgba(74,222,128,0.4)', color: 'var(--color-success)' }}
                            onClick={() => handleDismissBlacklist(v.id)}
                          >
                            ✓ Clear Flag — Allow Entry
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '9px 20px', fontSize: '0.85rem' }}
                            onClick={() => handleConfirmBlacklist(v.id, v.fullName, v.flagReason)}
                          >
                            🚫 Confirm Blacklist
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: Today's Queue */}
          {currentView === 'queue' && (
            <div>
              {/* Stat summary bar */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span>Expected Invites</span>
                    <Clock size={16} color="#60a5fa" />
                  </div>
                  <div className="stat-value">{queueStats.expected}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span>Checked In / In Office</span>
                    <UserCheck size={16} color="#4ade80" />
                  </div>
                  <div className="stat-value">{queueStats.checkedin}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span>Waiting in Lobby</span>
                    <Clock size={16} color="#fbbf24" />
                  </div>
                  <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{queueStats.waiting}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span>Departed Today</span>
                    <Clock size={16} color="#a1a1aa" />
                  </div>
                  <div className="stat-value">{queueStats.checkedout}</div>
                </div>
              </div>

              {/* Data Table */}
              <div className="table-card">
                <div className="table-header">
                  <div style={{ display: 'flex', gap: '12px', width: '60%' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Filter queue by visitor, host, purpose..." 
                        value={queueSearch}
                        onChange={e => setQueueSearch(e.target.value)}
                        style={{ paddingLeft: '36px' }}
                      />
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
                    </div>
                  </div>
                  {user.role === 'Receptionist' && (
                    <button className="btn btn-primary" onClick={() => setShowPreRegModal(true)}>
                      <Plus size={16} />
                      <span>Pre-Register Guest</span>
                    </button>
                  )}
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Visitor Details</th>
                        <th>Classification</th>
                        <th>Host Employee</th>
                        <th>Purpose of Visit</th>
                        <th>Check In Time</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQueue.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '40px 0', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                            No visitors registered in lobby queue today.
                          </td>
                        </tr>
                      ) : (
                        filteredQueue.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{item.visitorName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{item.visitorCompany || 'Independent'}</div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '4px' }}>
                                {item.visitorType}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{item.hostName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{item.hostPhone}</div>
                            </td>
                            <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.purpose}
                            </td>
                            <td>
                              {item.checkedInAt ? new Date(item.checkedInAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                            </td>
                            <td>
                              <span className={`badge badge-${item.status.toLowerCase()}`}>
                                {getStatusLabel(item.status)}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {item.status === 'Waiting' && user.role === 'Receptionist' && (
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleApproveCheckIn(item.id)}>
                                    Approve Entry
                                  </button>
                                  <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowDenyModal(item.id)}>
                                    Deny
                                  </button>
                                </div>
                              )}
                              {(item.status === 'CheckedIn' || item.status === 'InMeeting') && user.role === 'Receptionist' && (
                                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleCheckOut(item.id)}>
                                  Check Out
                                </button>
                              )}
                              {item.status === 'Denied' && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>Denied: {item.deniedReason}</span>
                              )}
                              {item.status === 'Expected' && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-indigo-accent)' }}>Pre-Registered</span>
                              )}
                              {item.status === 'CheckedOut' && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Departed</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Employees Directory */}
          {currentView === 'employees' && (
            <div>
              <div className="table-card">
                <div className="table-header">
                  <div style={{ position: 'relative', width: '50%' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Search host directory by name or department..." 
                      value={empSearch}
                      onChange={e => setEmpSearch(e.target.value)}
                      style={{ paddingLeft: '36px' }}
                    />
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
                  </div>
                  {user.role !== 'Admin' && user.role === 'SuperAdmin' && (
                    <button className="btn btn-primary" onClick={() => setShowAddEmpModal(true)}>
                      <Plus size={16} />
                      <span>Add Host Employee</span>
                    </button>
                  )}
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Host Name</th>
                        <th>Department</th>
                        <th>Email Address</th>
                        <th>Phone Number</th>
                        <th>Location Desk</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-secondary)' }}>
                            No employees found matching directory search.
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((e) => (
                          <tr key={e.id}>
                            <td style={{ fontWeight: 600 }}>{e.fullName}</td>
                            <td>
                              <span style={{ fontSize: '0.8rem', background: 'rgba(99,102,241,0.1)', color: 'var(--color-indigo-accent)', padding: '4px 8px', borderRadius: '4px' }}>
                                {e.departmentName}
                              </span>
                            </td>
                            <td>{e.email}</td>
                            <td>{e.phone}</td>
                            <td>Floor {e.floor || 'N/A'}</td>
                            <td>
                              <span style={{ color: e.isActive ? '#4ade80' : '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                                {e.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* VIEW: Analytics Summary Charts */}
          {currentView === 'analytics' && analytics && (
            <div>
              {/* Stat Summary Cards */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span>Lobby Dwell Avg Time</span>
                    <Clock size={16} />
                  </div>
                  <div className="stat-value">{analytics.avgVisitMinutes} <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>mins</span></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Checked-out guests average</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span>Today's Registrations</span>
                    <Users size={16} />
                  </div>
                  <div className="stat-value">{analytics.todaysVisitors} <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>guests</span></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Today's lobby volume</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span>Total Registrations (30d)</span>
                    <Users size={16} style={{ color: 'var(--color-indigo-accent)' }} />
                  </div>
                  <div className="stat-value" style={{ color: 'var(--color-indigo-accent)' }}>{analytics.total30d} <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>total</span></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Rolling 30-day volume</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span>Repeat Guest Rate</span>
                    <UserCheck size={16} />
                  </div>
                  <div className="stat-value">{analytics.repeatRate}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{analytics.repeatVisitors} repeat guests (30d)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span>Blocked Incidents (30d)</span>
                    <ShieldAlert size={16} color="#ef4444" />
                  </div>
                  <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{analytics.deniedEntries}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px' }}>Today: {analytics.deniedEntriesToday} blocked</div>
                </div>
              </div>

              {/* Recharts Graphical Visualizer - Row 1 */}
              <div className="charts-grid">
                <div className="chart-card">
                  <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Visitor Volume History (7 Days)</h3>
                  <div style={{ width: '100%', height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.weeklyTrend}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                        <XAxis dataKey="date" stroke="#a1a1aa" fontSize={11} />
                        <YAxis stroke="#a1a1aa" fontSize={11} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: 'var(--card-bg-solid)', borderColor: 'var(--card-border)', color: 'var(--color-text-primary)', borderRadius: '8px' }} labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600 }} itemStyle={{ color: 'var(--color-text-primary)' }} />
                        <Area type="monotone" dataKey="count" name="Visits" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-card">
                  <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Visits by Department (30d)</h3>
                  <div style={{ width: '100%', height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height="70%">
                      <PieChart>
                        <Pie
                          data={analytics.visitorsByDept}
                          dataKey="count"
                          nameKey="department"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          fill="#8884d8"
                          labelLine={false}
                        >
                          {analytics.visitorsByDept.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--card-bg-solid)', borderColor: 'var(--card-border)', color: 'var(--color-text-primary)', borderRadius: '8px' }} labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600 }} itemStyle={{ color: 'var(--color-text-primary)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Manual Legend listing with percentages */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '10px', fontSize: '0.8rem' }}>
                      {analytics.visitorsByDept.map((entry: any, index: number) => {
                        const total = analytics.visitorsByDept.reduce((acc: number, curr: any) => acc + curr.count, 0);
                        const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0;
                        return (
                          <div key={entry.department} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '10px', height: '10px', background: COLORS[index % COLORS.length], borderRadius: '50%' }}></div>
                            <span>{entry.department}: {entry.count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recharts Graphical Visualizer - Row 2 */}
              <div className="charts-grid">
                <div className="chart-card">
                  <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Lobby Load by Hour (30d Peak Times)</h3>
                  <div style={{ width: '100%', height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                        <XAxis dataKey="hour" stroke="#a1a1aa" fontSize={10} />
                        <YAxis stroke="#a1a1aa" fontSize={11} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: 'var(--card-bg-solid)', borderColor: 'var(--card-border)', color: 'var(--color-text-primary)', borderRadius: '8px' }} labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600 }} itemStyle={{ color: 'var(--color-text-primary)' }} />
                        <Bar dataKey="count" name="Registrations" radius={[4, 4, 0, 0]}>
                          {analytics.hourlyData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-card">
                  <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Top Purposes of Visit (30d Intent)</h3>
                  <div style={{ width: '100%', height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={analytics.visitorsByPurpose}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                        <XAxis type="number" stroke="#a1a1aa" fontSize={11} allowDecimals={false} />
                        <YAxis dataKey="purpose" type="category" stroke="#a1a1aa" fontSize={10} width={120} />
                        <Tooltip contentStyle={{ background: 'var(--card-bg-solid)', borderColor: 'var(--card-border)', color: 'var(--color-text-primary)', borderRadius: '8px' }} labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600 }} itemStyle={{ color: 'var(--color-text-primary)' }} />
                        <Bar dataKey="count" name="Visits" radius={[0, 4, 4, 0]}>
                          {analytics.visitorsByPurpose.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}



        </div>
      </main>

      {/* MODAL: Pre-Register Guest */}
      {showPreRegModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ 
            maxWidth: '850px', 
            width: '90%', 
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            borderRadius: '12px',
            padding: '36px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--card-border)', paddingBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {user?.role === 'Security' ? 'Register Walk-in Visitor' : 'Pre-Register Expected Guest'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                  Provide visitor credentials and allocate an internal host for the visit.
                </p>
              </div>
              <button 
                style={{ 
                  background: 'var(--menu-item-bg-hover)', border: '1px solid var(--card-border)', 
                  color: 'var(--color-text-secondary)', 
                  cursor: 'pointer',
                  padding: '10px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }} 
                onClick={() => setShowPreRegModal(false)}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--card-border)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--menu-item-bg-hover)'}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePreRegister}>
              {/* SECTION 1: VISITOR INFO */}
              <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981', display: 'flex' }}><User size={18} /></span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Visitor Credentials</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Visitor Full Name *</label>
                  <input type="text" className="form-input" required value={preName} onChange={e => setPreName(e.target.value)} placeholder="Jane Doe" style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Company / Organization</label>
                  <input type="text" className="form-input" value={preCompany} onChange={e => setPreCompany(e.target.value)} placeholder="Acme Corp" style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={preEmail} 
                    onChange={e => setPreEmail(e.target.value)} 
                    placeholder="jane@doe.com" 
                    style={{ width: '100%', height: '42px', fontSize: '0.9rem' }}
                  />
                  {preEmail.trim().length > 0 && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(preEmail.trim()) ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ Please enter a valid email address (e.g. name@domain.com)
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Example: name@domain.com</div>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Phone Number</label>
                    {prePhone.trim() && (() => {
                      const clean = prePhone.trim();
                      let activePrefix = prePhoneCountryCode;
                      let checkDigits = clean.replace(/\D/g, '');
                      if (clean.startsWith('+')) {
                        const matchedPrefix = ['+971', '+353', '+880', '+977', '+234', '+254', '+233', '+852', '+886', '+358', '+966'].find(p => clean.startsWith(p));
                        activePrefix = matchedPrefix || clean.substring(0, 3);
                        checkDigits = clean.replace(activePrefix, '').replace(/\D/g, '');
                      }
                      const limit = getPhoneLimit(activePrefix);
                      const isWrongLength = checkDigits.length !== limit;
                      return (
                        <span style={{ fontSize: '0.75rem', color: isWrongLength ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                          {checkDigits.length} / {limit} digits {isWrongLength && '(Incorrect length)'}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      className="form-input" 
                      value={prePhoneCountryCode} 
                      onChange={e => setPrePhoneCountryCode(e.target.value)} 
                      style={{ width: '110px', background: 'var(--menu-item-bg)', padding: '10px 8px', height: '42px', fontSize: '0.9rem' }}
                    >
                      <option value="+1">+1 (US)</option>
                      <option value="+91">+91 (IN)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+61">+61 (AU)</option>
                      <option value="+65">+65 (SG)</option>
                      <option value="+971">+971 (AE)</option>
                      <option value="+49">+49 (DE)</option>
                      <option value="+33">+33 (FR)</option>
                      <option value="+81">+81 (JP)</option>
                      <option value="+82">+82 (KR)</option>
                      <option value="+27">+27 (ZA)</option>
                      <option value="+55">+55 (BR)</option>
                    </select>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={prePhone} 
                      onChange={e => setPrePhone(e.target.value)} 
                      placeholder="(555) 0199" 
                      style={{ flex: 1, height: '42px', fontSize: '0.9rem' }}
                    />
                  </div>
                  {(() => {
                    const clean = prePhone.trim();
                    if (!clean) return <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Select country code &amp; enter local number</div>;
                    
                    let activePrefix = prePhoneCountryCode;
                    let checkDigits = clean.replace(/\D/g, '');
                    let finalPhoneVal = '';
                    if (clean.startsWith('+')) {
                      const matchedPrefix = ['+971', '+353', '+880', '+977', '+234', '+254', '+233', '+852', '+886', '+358', '+966'].find(p => clean.startsWith(p));
                      activePrefix = matchedPrefix || clean.substring(0, 3);
                      checkDigits = clean.replace(activePrefix, '').replace(/\D/g, '');
                      finalPhoneVal = clean;
                    } else {
                      finalPhoneVal = `${prePhoneCountryCode}${clean}`;
                    }

                    const limit = getPhoneLimit(activePrefix);
                    const isOver = checkDigits.length > limit;
                    const isUnder = checkDigits.length > 0 && checkDigits.length < limit;
                    const phoneRegex = /^\+[1-9][0-9\s\-()]{6,19}$/;
                    const isFormatInvalid = !phoneRegex.test(finalPhoneVal);

                    if (isOver || isUnder || isFormatInvalid) {
                      return (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px', fontWeight: 500 }}>
                          {isOver 
                            ? `⚠️ Max digits exceeded for ${activePrefix} (Limit is ${limit} digits)` 
                            : isUnder
                            ? `⚠️ Too few digits for ${activePrefix} (Must be exactly ${limit} digits)`
                            : `⚠️ Invalid phone format (Must start with country code prefix)`}
                        </div>
                      );
                    }
                    return <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Select country code &amp; enter local number</div>;
                  })()}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Visitor's Office Location (Address / City)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={preLocation} 
                  onChange={e => setPreLocation(e.target.value)} 
                  placeholder="e.g. 123 Main St, New York or Bangalore HQ" 
                  style={{ width: '100%', height: '42px', fontSize: '0.9rem' }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Simple location/address to trace back origin if needed</div>
              </div>

              {/* SECTION 2: VISIT DETAILS */}
              <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '8px', marginBottom: '20px', marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981', display: 'flex' }}><History size={18} /></span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Visit Details</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Visitor Classification</label>
                  <select className="form-input" value={preType} onChange={(e: any) => { const newType = e.target.value; setPreType(newType); if (newType !== 'VIP' && preGuestCount > 10) setPreGuestCount(10); }} style={{ background: 'var(--menu-item-bg)', width: '100%', height: '42px', fontSize: '0.9rem' }}>
                    <option value="Guest">Guest</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Candidate">Candidate</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Scheduled Date &amp; Time *</label>
                  <input type="datetime-local" className="form-input" required value={preScheduled} onChange={e => setPreScheduled(e.target.value)} min={getLocalISOString()} style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Number of Guests</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min="0"
                    max={preType === 'VIP' ? undefined : 10}
                    value={preGuestCount} 
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setPreGuestCount(preType === 'VIP' ? val : Math.min(10, val));
                    }} 
                    style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Filter by Dept</label>
                  <select className="form-input" value={preRegDeptFilter} onChange={e => setPreRegDeptFilter(e.target.value)} style={{ background: 'var(--menu-item-bg)', width: '100%', height: '42px', fontSize: '0.9rem' }}>
                    <option value="">All Departments</option>
                    {depts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Host Employee *</label>
                  <select className="form-input" required value={preHostId} onChange={e => setPreHostId(e.target.value)} style={{ background: 'var(--menu-item-bg)', width: '100%', height: '42px', fontSize: '0.9rem' }}>
                    <option value="">-- Choose Host --</option>
                    {employees.filter(emp => !preRegDeptFilter || emp.departmentId === preRegDeptFilter).map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.departmentName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Purpose of Visit *</label>
                  <input type="text" className="form-input" required value={prePurpose} onChange={e => setPrePurpose(e.target.value)} placeholder="Quarterly sync" style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--card-border)', paddingTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPreRegModal(false)} style={{ padding: '12px 32px', fontSize: '0.9rem' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 36px', fontSize: '0.9rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  {user?.role === 'Security' ? 'Register Walk-in' : 'Pre-Register Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Deny Entry Reason */}
      {showDenyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px' }}>Deny Visitor Access</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Please specify the safety reason for blocking this walk-in entry request.
            </p>

            <form onSubmit={handleDenyCheckIn}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Deny Reason *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={denyReason} 
                  onChange={e => setDeniedReason(e.target.value)} 
                  placeholder="Visitor does not match identification records" 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDenyModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-danger">Confirm Deny</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Host Employee */}
      {showAddEmpModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Add Employee Host Profile</h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }} onClick={() => setShowAddEmpModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEmployee}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Host Full Name *</label>
                <input type="text" className="form-input" required value={addEmpName} onChange={e => setAddEmpName(e.target.value)} placeholder="Tanya Verma" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Email Address *</label>
                  <input type="email" className="form-input" required value={addEmpEmail} onChange={e => setAddEmpEmail(e.target.value)} placeholder="tanya@company.com" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Phone Number *</label>
                  <input type="text" className="form-input" required value={addEmpPhone} onChange={e => setAddEmpPhone(e.target.value)} placeholder="+1 (555) 0123" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Department *</label>
                  <select className="form-input" required value={addEmpDeptId} onChange={e => setAddEmpDeptId(e.target.value)} style={{ background: 'var(--menu-item-bg)' }}>
                    <option value="">-- Select Dept --</option>
                    {depts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Desk Location Floor</label>
                  <input type="text" className="form-input" value={addEmpFloor} onChange={e => setAddEmpFloor(e.target.value)} placeholder="Floor 3" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddEmpModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Blacklist */}
      {showAddBlModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Flag Individual on Security Blacklist</h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer' }} onClick={() => setShowAddBlModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddBlacklist}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>Full Name *</label>
                <input type="text" className="form-input" required value={addBlName} onChange={e => setAddBlName(e.target.value)} placeholder="Intruder Name" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>Severity Level</label>
                <select className="form-input" value={addBlSeverity} onChange={(e: any) => setAddBlSeverity(e.target.value)} style={{ background: 'var(--menu-item-bg)', color: 'var(--color-text-primary)' }}>
                  <option value="Low">Low (Caution)</option>
                  <option value="Medium">Medium (Escalate to Host)</option>
                  <option value="High">High (Immediate Security Arrest)</option>
                </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>Reason for Blacklist *</label>
                <input type="text" className="form-input" required value={addBlReason} onChange={e => setAddBlReason(e.target.value)} placeholder="Trespassing on premises 2025-11" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddBlModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger">Confirm Blacklist Flag</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Flag Blacklist (Security) */}
      {showFlagBlacklistModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ background: 'var(--card-bg-solid)', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Flag Visitor for Blacklist Review</h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer' }} onClick={() => setShowFlagBlacklistModal(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFlagBlacklist}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>Reason for Flagging *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={flagReasonStr} 
                  onChange={e => setFlagReasonStr(e.target.value)} 
                  placeholder="Suspicious behavior or unauthorized entry attempt" 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowFlagBlacklistModal(null); setFlagReasonStr(''); }}>Cancel</button>
                <button type="submit" className="btn btn-danger">Flag Visitor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Visitor Pass */}
      {showPassModal && (
        <div className="modal-overlay" style={{ zIndex: 1100, flexDirection: 'column', gap: '16px' }}>
          {/* Inject print-only CSS so the button row disappears on actual print */}
          <style>{`
            @media print {
              /* Hide buttons */
              .pass-actions { display: none !important; }

              /* Strip the dark overlay backdrop */
              .modal-overlay {
                position: static !important;
                background: transparent !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                display: block !important;
                padding: 0 !important;
              }

              /* Clean white page — no app chrome */
              body, html {
                background: #ffffff !important;
                overflow: visible !important;
              }

              /* Hide everything except the pass card */
              body > * { display: none !important; }
              body > #root { display: block !important; }
              .app-layout > * { display: none !important; }
              .app-layout .modal-overlay { display: block !important; }

              /* Pass card sits flush on the white page */
              #visitor-pass-card {
                box-shadow: none !important;
                border-radius: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 !important;
              }

              /* Force exact colors for header gradient & badges */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>

          {/* ── Printable pass card ── */}
          <div id="visitor-pass-card" style={{ maxWidth: '640px', width: '100%', background: '#fff', color: '#111', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            {/* Pass Header */}
            <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', padding: '24px 32px', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', letterSpacing: '0.22em', opacity: 0.7, marginBottom: '4px' }}>VISITOR MANAGEMENT SYSTEM</div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>VISITOR PASS</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '3px' }}>{showPassModal.branchName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.68rem', opacity: 0.7 }}>BADGE NUMBER</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'monospace', background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '8px', marginTop: '4px', letterSpacing: '0.05em' }}>
                    {showPassModal.badgeNumber}
                  </div>
                </div>
              </div>
            </div>

            {/* Pass Body */}
            <div className="visitor-pass-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '22px' }}>
                <div>
                  <div className="visitor-pass-label">VISITOR</div>
                  <div className="visitor-pass-value">{showPassModal.visitorName}</div>
                  <div className="visitor-pass-subvalue">{showPassModal.visitorCompany || 'Independent'}</div>
                  {showPassModal.visitorPhone && (
                    <div className="visitor-pass-subvalue" style={{ marginTop: '2px' }}>{showPassModal.visitorPhone}</div>
                  )}
                  <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', background: '#e0e7ff', color: '#3730a3', padding: '3px 10px', borderRadius: '99px', fontWeight: 600 }}>
                      {showPassModal.visitorType}
                    </span>
                    {showPassModal.additionalGuests > 0 && (
                      <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: '99px', fontWeight: 600 }}>
                        +{showPassModal.additionalGuests} {showPassModal.additionalGuests === 1 ? 'Guest' : 'Guests'}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="visitor-pass-label">HOST EMPLOYEE</div>
                  <div className="visitor-pass-value">{showPassModal.hostName}</div>
                  <div className="visitor-pass-subvalue">{showPassModal.department}</div>
                  <div className="visitor-pass-subvalue">{showPassModal.hostPhone}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '18px', marginBottom: '22px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <div className="visitor-pass-label">PURPOSE</div>
                  <div style={{ fontSize: '0.9rem', color: '#111', fontWeight: 500 }}>{showPassModal.purpose}</div>
                </div>
                <div>
                  <div className="visitor-pass-label">CHECK-IN TIME</div>
                  <div style={{ fontSize: '0.9rem', color: '#111', fontWeight: 500 }}>
                    {new Date(showPassModal.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="visitor-pass-subvalue">
                    {new Date(showPassModal.checkedInAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="visitor-pass-label">ZONE ACCESS</div>
                  <div style={{ fontSize: '0.9rem', color: '#111', fontWeight: 500 }}>{showPassModal.zoneAccess}</div>
                </div>
              </div>

              {/* Signature Block */}
              <div className="visitor-pass-sig-block">
                <div className="visitor-pass-sig-label">HOST SIGNATURE (to be collected post-visit &amp; submitted to security)</div>
                <div style={{ display: 'flex', gap: '28px' }}>
                  <div style={{ flex: 2 }}>
                    <div style={{ borderBottom: '1px solid #9ca3af', height: '36px', marginBottom: '5px' }}></div>
                    <div className="visitor-pass-sig-text">Signature of {showPassModal.hostName}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ borderBottom: '1px solid #9ca3af', height: '36px', marginBottom: '5px' }}></div>
                    <div className="visitor-pass-sig-text">Date</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Floating action buttons — hidden on print ── */}
          <div className="pass-actions" style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '10px 24px', fontSize: '0.95rem' }}
              onClick={() => setShowPassModal(null)}
            >
              Close
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontSize: '0.95rem', background: 'linear-gradient(135deg,#1e1b4b,#4338ca)' }}
              onClick={() => window.print()}
            >
              🖨 Print Pass
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Employee – Add / Edit Remark for Security */}
      {showRemarkModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} style={{ color: 'var(--color-indigo-accent)' }} />
                  {showRemarkModal.remarks ? 'Edit Remark for Security' : 'Add Remark for Security'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  For <strong style={{ color: 'var(--color-purple-accent)' }}>{showRemarkModal.visitorName}</strong> visiting on{' '}
                  <strong style={{ color: 'var(--color-warning)' }}>{new Date(showRemarkModal.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                </p>
              </div>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }} onClick={() => { setShowRemarkModal(null); setRemarkText(''); }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.78rem', color: 'var(--color-indigo-accent)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <FileText size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>This remark will be visible to security under the visitor's details panel in Check Invitation. Use it to share context — e.g. "VIP guest, escort to 4th floor" or "carrying equipment".</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Your Remark / Note</label>
              <textarea
                className="form-input"
                rows={4}
                value={remarkText}
                onChange={e => setRemarkText(e.target.value)}
                placeholder="e.g. Guest is a VIP client, please escort to conference room B on 3rd floor. May be carrying a laptop bag."
                maxLength={500}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.88rem', lineHeight: '1.5' }}
              />
              <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{remarkText.length}/500</div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" style={{ padding: '10px 24px', fontSize: '0.9rem' }} onClick={() => { setShowRemarkModal(null); setRemarkText(''); }}>
                Cancel
              </button>
              {showRemarkModal.remarks && (
                <button type="button" style={{ padding: '10px 20px', fontSize: '0.9rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: 'var(--color-danger)', cursor: 'pointer' }} onClick={() => setRemarkText('')}>
                  Clear
                </button>
              )}
              <button type="button" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }} onClick={handleUpdateRemark}>
                Save Remark
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDE PANEL: Security – Visitor Visit Details with Remarks Tab */}
      {selectedInviteDetails && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          right: 0, 
          bottom: 0, 
          width: '420px', 
          background: 'var(--card-bg-solid)', 
          borderLeft: '1px solid var(--card-border)', 
          boxShadow: 'var(--card-shadow)', 
          zIndex: 9000, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          transition: 'var(--transition-theme)'
        }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar name={selectedInviteDetails.visitorName} size="md" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{selectedInviteDetails.visitorName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{selectedInviteDetails.visitorEmail || 'No email'}</div>
              </div>
            </div>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '4px' }} onClick={() => setSelectedInviteDetails(null)}>
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', padding: '8px', borderBottom: '1px solid var(--card-border)' }}>
            {(['general', 'host', 'remarks'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setDetailPanelTab(tab)} 
                className={`tab-button ${detailPanelTab === tab ? 'active' : ''}`}
              >
                {tab === 'general' ? '📋 General' : tab === 'host' ? '👤 Host' : (
                  <>
                    <MessageSquare size={12} />
                    Remarks
                    {selectedInviteDetails.remarks && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--active-industries-text)', display: 'inline-block' }} />}
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {detailPanelTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Visitor Type', value: selectedInviteDetails.visitorType || 'Guest' },
                  { label: 'Company', value: selectedInviteDetails.visitorCompany || 'Independent' },
                  { label: 'Visit Purpose', value: selectedInviteDetails.purpose, color: 'var(--color-purple-accent)' },
                  { label: 'Phone', value: selectedInviteDetails.visitorPhone || '—' },
                ].map(row => (
                  <div key={row.label} style={{ background: 'var(--card-bg-subtle)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>{row.label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: (row as any).color || 'var(--color-text-primary)' }}>{row.value}</div>
                  </div>
                ))}
                <div style={{ background: 'var(--card-bg-subtle)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Scheduled At</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-warning)' }}>{new Date(selectedInviteDetails.scheduledAt).toLocaleString()}</div>
                  {new Date(selectedInviteDetails.scheduledAt).toDateString() === new Date().toDateString()
                    ? <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', marginTop: '4px', fontWeight: 600 }}>• Today's Visit</div>
                    : <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: '4px', fontWeight: 600 }}>• Future Visit</div>
                  }
                </div>
                <div style={{ background: 'var(--card-bg-subtle)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Status</div>
                  <Badge tone={getStatusTone(selectedInviteDetails.status)} dot={true}>{getStatusLabel(selectedInviteDetails.status)}</Badge>
                </div>
              </div>
            )}

            {detailPanelTab === 'host' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'var(--card-bg-subtle)', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar name={selectedInviteDetails.hostName} size="md" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{selectedInviteDetails.hostName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{selectedInviteDetails.hostPhone || 'No phone on file'}</div>
                  </div>
                </div>
                {selectedInviteDetails.hostDept && (
                  <div style={{ background: 'var(--card-bg-subtle)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Department</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedInviteDetails.hostDept}</div>
                  </div>
                )}
              </div>
            )}

            {detailPanelTab === 'remarks' && (
              <div>
                {selectedInviteDetails.remarks ? (
                  <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <MessageSquare size={16} style={{ color: 'var(--color-indigo-accent)' }} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-indigo-accent)' }}>Host's Remark for Security</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-purple-accent)', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
                      {selectedInviteDetails.remarks}
                    </div>
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(99,102,241,0.15)', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                      Left by host: <strong style={{ color: 'var(--color-text-secondary)' }}>{selectedInviteDetails.hostName}</strong>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <MessageSquare size={36} style={{ margin: '0 auto 16px', opacity: 0.25, color: 'var(--color-text-secondary)' }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>No remarks from host</div>
                    <div style={{ fontSize: '0.78rem', marginTop: '8px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                      The host can add a note via their <em style={{ color: 'var(--color-text-secondary)' }}>My Future Visits</em> page.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real-time Popup Notifications */}
      {realtimeNotification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          maxWidth: '420px',
          width: '90%',
          animation: 'slideIn 0.3s ease-out forwards',
          background: 'var(--card-bg)',
          borderRadius: '16px',
          border: '1.5px solid var(--color-indigo-accent)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'var(--backdrop-blur)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {realtimeNotification.type === 'arrived' ? (
            <>
              {/* Type: Visitor Arrived */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--color-success)',
                  borderRadius: '50%',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bell size={20} className="pulse-slow" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Visitor Arrived!</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Instant Host Notification</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
                Your pre-registered visitor, <strong style={{ color: 'var(--color-indigo-accent)' }}>{realtimeNotification.visitorName}</strong>, has just arrived at the lobby.
              </p>
              <button 
                onClick={() => setRealtimeNotification(null)}
                className="btn btn-primary"
                style={{ alignSelf: 'flex-end', padding: '6px 16px', fontSize: '0.8rem' }}
              >
                Acknowledge
              </button>
            </>
          ) : (
            <>
              {/* Type: Visit Delayed */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  color: 'var(--color-warning)',
                  borderRadius: '50%',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Schedule Delay Requested</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Gate Control Advisory</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
                Host <strong style={{ color: 'var(--color-text-primary)' }}>{realtimeNotification.hostName}</strong> is currently busy and has requested to delay <strong style={{ color: 'var(--color-text-primary)' }}>{realtimeNotification.visitorName}</strong>'s visit by <strong style={{ color: 'var(--color-warning)' }}>{realtimeNotification.delayMinutes} minutes</strong>.
              </p>
              <div style={{ 
                background: 'var(--card-bg-subtle)', 
                borderRadius: '8px', 
                padding: '8px 12px', 
                fontSize: '0.8rem',
                borderLeft: '3px solid var(--color-warning)',
                color: 'var(--color-text-primary)'
              }}>
                New expected arrival: <strong>{realtimeNotification.newTime}</strong>
              </div>
              <button 
                onClick={() => setRealtimeNotification(null)}
                className="btn btn-secondary"
                style={{ alignSelf: 'flex-end', padding: '6px 16px', fontSize: '0.8rem', color: 'var(--color-text-primary)' }}
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      )}

      {/* Session Timeout Warning Modal */}
      {showSessionWarning && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '400px', width: '100%', background: 'var(--card-bg-solid)', border: '1px solid var(--card-border)', textAlign: 'center', padding: '32px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--color-warning)',
              borderRadius: '50%',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <Clock size={32} className="pulse-slow" />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '10px' }}>
              Session Expiring Soon
            </h3>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '24px' }}>
              You have been inactive. For security, your session will end in <strong style={{ color: 'var(--color-warning)' }}>{formatTime(warningCountdown)}</strong>.
            </p>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '24px', fontStyle: 'italic' }}>
              Move your mouse, scroll, or press any key to automatically stay logged in.
            </p>
            
            <Button 
              variant="primary" 
              style={{ width: '100%', padding: '12px' }} 
              onClick={handleExtendSession}
            >
              Extend Session
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
