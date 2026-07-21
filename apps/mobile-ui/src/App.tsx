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
  XCircle,
  X,
  History,
  User,
  Loader2,
  Calendar,
  MessageSquare,
  FileText,
  Edit2,
  Camera,
  RefreshCw
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
import { LocalNotifications } from '@capacitor/local-notifications';
import { useLoading } from './components/LoadingSpinner';

const BACKEND_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';



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
  visitorType?: string;
}

const avatarSizesMap = {
  xs: { width: '24px', height: '24px', fontSize: '10px' },
  sm: { width: '32px', height: '32px', fontSize: '12px' },
  md: { width: '40px', height: '40px', fontSize: '14px' },
  lg: { width: '48px', height: '48px', fontSize: '16px' },
  xl: { width: '64px', height: '64px', fontSize: '18px' },
};

const getAvatarColors = (type?: string) => {
  const t = type?.toLowerCase();
  if (t === 'guest') {
    return {
      bg: 'var(--visitor-guest-bg)',
      color: 'var(--visitor-guest-text)',
      border: 'var(--visitor-guest-border)'
    };
  }
  if (t === 'vendor') {
    return {
      bg: 'var(--visitor-vendor-bg)',
      color: 'var(--visitor-vendor-text)',
      border: 'var(--visitor-vendor-border)'
    };
  }
  if (t === 'candidate') {
    return {
      bg: 'var(--visitor-candidate-bg)',
      color: 'var(--visitor-candidate-text)',
      border: 'var(--visitor-candidate-border)'
    };
  }
  if (t === 'contractor') {
    return {
      bg: 'var(--visitor-contractor-bg)',
      color: 'var(--visitor-contractor-text)',
      border: 'var(--visitor-contractor-border)'
    };
  }
  if (t === 'vip') {
    return {
      bg: 'var(--visitor-vip-bg)',
      color: 'var(--visitor-vip-text)',
      border: 'var(--visitor-vip-border)'
    };
  }
  return {
    bg: 'rgba(224, 90, 71, 0.08)',
    color: 'var(--indigo-primary)',
    border: 'rgba(224, 90, 71, 0.3)'
  };
};

export function Avatar({ src, name, size = 'md', className, style, ring, online, visitorType }: AvatarProps) {
  const sizeStyle = avatarSizesMap[size] || avatarSizesMap.md;
  const initialsText = getInitials(name);
  const colors = getAvatarColors(visitorType);
  
  const ringStyle = ring ? {
    boxShadow: '0 0 0 2px var(--indigo-primary), 0 0 0 4px var(--bg-dark)',
  } : {};

  return (
    <span className={className} style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: '8px',
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
            borderRadius: '8px',
            objectFit: 'cover',
            border: `1px solid ${colors.border}`
          }}
        />
      ) : (
        <span
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            fontWeight: 600,
            color: colors.color,
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
            right: '-2px',
            bottom: '-2px',
            height: '10px',
            width: '10px',
            borderRadius: '50%',
            border: '2px solid var(--bg-dark)',
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

export function CredentialBadge({ label, value }: { label?: string; value: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      border: '1.5px dashed var(--color-indigo-accent)',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '0.8rem',
      fontWeight: 600,
      color: 'var(--color-indigo-accent)',
      background: 'rgba(99, 102, 241, 0.03)'
    }}>
      {label && <span style={{ opacity: 0.7 }}>{label}:</span>}
      <span>{value}</span>
    </span>
  );
}

const statusConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  expected: { label: 'Expected', icon: '📅', color: 'var(--status-expected-text)', bg: 'var(--status-expected)' },
  preregistered: { label: 'Pre-Registered', icon: '📅', color: 'var(--status-expected-text)', bg: 'var(--status-expected)' },
  checkedin: { label: 'Checked In', icon: '🟢', color: 'var(--status-checkedin-text)', bg: 'var(--status-checkedin)' },
  inmeeting: { label: 'In Meeting', icon: '🟢', color: 'var(--status-checkedin-text)', bg: 'var(--status-checkedin)' },
  active: { label: 'Active', icon: '🟢', color: 'var(--status-checkedin-text)', bg: 'var(--status-checkedin)' },
  waiting: { label: 'Waiting', icon: '⏳', color: 'var(--status-waiting-text)', bg: 'var(--status-waiting)' },
  checkedout: { label: 'Checked Out', icon: '⚪', color: 'var(--status-checkedout-text)', bg: 'var(--status-checkedout)' },
  departed: { label: 'Checked Out', icon: '⚪', color: 'var(--status-checkedout-text)', bg: 'var(--status-checkedout)' },
  denied: { label: 'Denied Entry', icon: '🚫', color: 'var(--status-denied-text)', bg: 'var(--status-denied)' },
  cancelled: { label: 'Cancelled', icon: '❌', color: 'var(--status-denied-text)', bg: 'var(--status-denied)' },
  cancellation_pending_reception: { label: 'Cancel Requested', icon: '⚠️', color: 'var(--status-denied-text)', bg: 'var(--status-denied)' },
};

export function StatusIndicator({ status }: { status: string }) {
  const key = status?.toLowerCase() || '';
  const config = statusConfig[key] || { label: status, icon: '•', color: 'var(--color-text-secondary)', bg: 'var(--card-bg-subtle)' };
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      background: config.bg,
      color: config.color,
      borderLeft: `4px solid ${config.color}`,
      borderRadius: '0 6px 6px 0',
      fontSize: '0.8rem',
      fontWeight: 600,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>{config.icon}</span>
      <span style={{ letterSpacing: '0.3px' }}>{config.label}</span>
    </div>
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
          background: 'linear-gradient(180deg, var(--indigo-primary) 0%, var(--indigo-secondary) 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(224, 90, 71, 0.2)',
        };
      case 'danger':
        return {
          background: 'linear-gradient(180deg, var(--btn-danger-bg-start) 0%, var(--btn-danger-bg-end) 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
        };
      case 'secondary':
      default:
        return {
          background: 'var(--btn-secondary-bg)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--btn-secondary-border)',
        };
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`btn btn-${variant}`}
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


export default function App() {
  const { showLoader, hideLoader, withLoader } = useLoading();
  const [token, setToken] = useState<string | null>(localStorage.getItem('vms_token'));
  const [user, setUser] = useState<any | null>(null);
  const [currentView, setCurrentView] = useState<View>('queue');
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  useEffect(() => {
    const checkMobile = () => {
      const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;
      const isUaMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);
      const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 768;
      setIsMobile(!!isCapacitor || isUaMobile || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [realtimeNotification, setRealtimeNotification] = useState<{
    type: 'arrived' | 'delay' | 'blacklisted_arrival' | 'unblock_request' | 'unblock_approved' | 'unblock_denied' | 'blacklisted_host_rejected';
    visitorName: string;
    visitorId?: string;
    visitId?: string;
    hostName?: string;
    targetHostId?: string;
    photoUrl?: string;
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
  const [confirmedBlacklisted, setConfirmedBlacklisted] = useState<any[]>([]);
  const [preRegDeptFilter, setPreRegDeptFilter] = useState('');

  // Authentication Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [captchaRequired, setCaptchaRequired] = useState<boolean>(false);
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [captchaQuestion, setCaptchaQuestion] = useState<string>('What is 4 + 7?');

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
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'warning', title?: string, text: string } | null>(null);

  // Queue Data States
  const [queue, setQueue] = useState<any[]>([]);
  const [queueSearch, setQueueSearch] = useState('');
  const [showPreRegModal, setShowPreRegModal] = useState(false);
  const [showBlacklistBlockedModal, setShowBlacklistBlockedModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState<string | null>(null); // holds visitId
  const [denyReason, setDeniedReason] = useState('');
  const [showPassModal, setShowPassModal] = useState<any | null>(null); // holds printed pass data
  const [showCheckInPhotoModal, setShowCheckInPhotoModal] = useState<string | null>(null); // holds visitId
  const [showArrivalPhotoModal, setShowArrivalPhotoModal] = useState<string | null>(null); // holds visitId for mobile arrival photo
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState<boolean>(false); // mobile logout confirmation
  const [mobileHistory, setMobileHistory] = useState<View[]>([]); // navigation history stack for mobile swipe back
  const touchStartPosRef = useRef<{ x: number, y: number } | null>(null);
  const [showSwipeBackIndicator, setShowSwipeBackIndicator] = useState<boolean>(false);
  const [completeEmail, setCompleteEmail] = useState('');
  const [completePhone, setCompletePhone] = useState('');
  const [completePhoneCountryCode, setCompletePhoneCountryCode] = useState('+1');

  // Camera states
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [showFullscreenVisitorPhoto, setShowFullscreenVisitorPhoto] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null); // Request lock to prevent double clicks
  const [isNetworkSlow, setIsNetworkSlow] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Mobile Pull to Refresh states
  const [pullY, setPullY] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const touchStartYRef = useRef<number>(0);

  // Future invitations for Check Invitation
  const [futureInvitations, setFutureInvitations] = useState<any[]>([]);
  const [inviteSearch, setInviteSearch] = useState('');

  // Remark states
  const [showRemarkModal, setShowRemarkModal] = useState<any | null>(null); // holds Visit record
  const [remarkText, setRemarkText] = useState('');

  // Visitor visit details modal/panel for Security
  const [selectedInviteDetails, setSelectedInviteDetails] = useState<any | null>(null); // holds invitation/visit record
  const [detailPanelTab, setDetailPanelTab] = useState<'general' | 'host' | 'remarks'>('general');

  // Auto-dismiss alert messages and trigger mobile push notification
  useEffect(() => {
    if (alertMessage) {
      if (isMobile) {
        const defaultTitle = alertMessage.type === 'success' 
          ? 'Operation Successful' 
          : alertMessage.type === 'warning'
          ? 'System Advisory'
          : 'Security Alert';
        sendMobileDeviceNotification(alertMessage.title || defaultTitle, alertMessage.text, '/123.png');
      }

      const displayTime = alertMessage.type === 'success' ? 2500 : 5000;
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, displayTime);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [alertMessage, isMobile]);

  // Online / Offline Network Listener
  useEffect(() => {
    const handleOffline = () => {
      setAlertMessage({
        type: 'error',
        text: '⚠️ You are currently offline. Please wait a moment while connection restores.'
      });
    };
    const handleOnline = () => {
      setAlertMessage({
        type: 'success',
        text: '✅ Network connection restored!'
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Pull-to-refresh Gesture Handlers for Mobile
  const handleTouchStartPull = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartYRef.current = e.touches[0].clientY;
    } else {
      touchStartYRef.current = 0;
    }
  };

  const handleTouchMovePull = (e: React.TouchEvent) => {
    if (touchStartYRef.current === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartYRef.current;
    if (diff > 0 && diff < 120) {
      setPullY(diff);
    }
  };

  const handleTouchEndPull = async () => {
    if (pullY > 60 && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(0);
      try {
        await withLoader(async () => {
          await Promise.all([
            fetchQueue(true),
            fetchBlacklistReview(),
            fetchEmployeeVisits(),
            fetchFutureInvitations()
          ]);
        }, 'Syncing Mobile Data…');
        setAlertMessage({ type: 'success', text: 'Data refreshed successfully! 🔄' });
      } catch (err) {
        console.error('Refresh error:', err);
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullY(0);
    }
    touchStartYRef.current = 0;
  };

  // Mobile Network Watchdog & Request Lock Wrapper (Prevents duplicate requests when network is slow)
  const executeWithNetworkWatchdog = async <T,>(actionId: string, actionFn: () => Promise<T>): Promise<T | undefined> => {
    if (pendingActionId) return undefined; // Prevent duplicate clicks while request is in flight
    setPendingActionId(actionId);
    setIsNetworkSlow(false);

    // Watchdog timer: if request takes > 2.5s, warn user network is slow
    const slowTimer = setTimeout(() => {
      setIsNetworkSlow(true);
      setAlertMessage({
        type: 'warning',
        text: '⚠️ Network connection is slow. Please wait a moment while we process your request...'
      });
    }, 2500);

    return await withLoader(async () => {
      try {
        const result = await actionFn();
        clearTimeout(slowTimer);
        setIsNetworkSlow(false);
        setPendingActionId(null);
        return result;
      } catch (err: any) {
        clearTimeout(slowTimer);
        setIsNetworkSlow(false);
        setPendingActionId(null);
        console.error('Mobile network action error:', err);
        setAlertMessage({
          type: 'error',
          text: '⚠️ Network error occurred. Please check your connection and try again.'
        });
        return undefined;
      }
    }, 'Processing…');
  };

  const handleMobileGoBack = () => {
    // 1. Close active modals / bottom drawers first
    if (showArrivalPhotoModal) { setShowArrivalPhotoModal(null); stopCamera(); return; }
    if (showCheckInPhotoModal) { setShowCheckInPhotoModal(null); stopCamera(); return; }
    if (showLogoutConfirmModal) { setShowLogoutConfirmModal(false); return; }
    if (showPreRegModal) { setShowPreRegModal(false); return; }
    if (showDenyModal) { setShowDenyModal(null); return; }
    if (selectedInviteDetails) { setSelectedInviteDetails(null); return; }
    if (isMobileMenuOpen) { setIsMobileMenuOpen(false); return; }

    // 2. Navigate back to previous screen in history stack
    if (mobileHistory.length > 0) {
      const prevView = mobileHistory[mobileHistory.length - 1];
      showLoader('Loading View…');
      setMobileHistory(prev => prev.slice(0, -1));
      setCurrentView(prevView);
      hideLoader();

      setShowSwipeBackIndicator(true);
      setTimeout(() => setShowSwipeBackIndicator(false), 700);
    }
  };

  const navigateMobileView = (newView: View) => {
    if (newView !== currentView) {
      showLoader('Loading View…');
      setMobileHistory(prev => [...prev, currentView]);
      setCurrentView(newView);
      hideLoader();
    }
  };


  // Mobile Native System Tray & Push Notification helper
  const sendMobileDeviceNotification = async (title: string, body: string, iconUrl?: string) => {
    // 1. Capacitor Native Android Local Notification (System Tray Push Notification)
    try {
      const isCapacitorNative = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform();
      if (isCapacitorNative || isMobile) {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }

        try {
          await LocalNotifications.createChannel({
            id: 'vms_alerts',
            name: 'VMS Security Alerts',
            description: 'VMS mobile alerts for visitor arrivals, blacklist events, and unblock approvals',
            importance: 5,
            visibility: 1,
            vibration: true
          });
        } catch (chErr) {}

        await LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: body,
              id: Math.floor(Math.random() * 1000000),
              channelId: 'vms_alerts',
              schedule: { at: new Date(Date.now() + 50) },
              smallIcon: 'ic_stat_icon',
              extra: null
            }
          ]
        });
      }
    } catch (err) {
      console.log('Native LocalNotifications fallback to Web Notification API:', err);
    }

    // 2. Web Notification API Fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: iconUrl || '/123.png',
            badge: '/123.png',
            tag: 'vms-mobile-notification'
          });
        } catch (e) {
          console.error('Mobile notification error:', e);
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            try {
              new Notification(title, {
                body,
                icon: iconUrl || '/123.png',
                badge: '/123.png'
              });
            } catch (e) {}
          }
        });
      }
    }
  };

  useEffect(() => {
    if (isMobile) {
      try {
        LocalNotifications.requestPermissions();
      } catch (e) {}
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [isMobile]);

  const startCamera = async (overrideFacingMode?: 'user' | 'environment') => {
    const currentFacing = overrideFacingMode || facingMode;
    try {
      const constraints: MediaStreamConstraints = { 
        video: isMobile 
          ? { facingMode: { ideal: currentFacing }, width: { ideal: 640 }, height: { ideal: 640 } } 
          : { width: 320, height: 320, facingMode: currentFacing } 
      };
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        setIsCameraActive(true);
      } else {
        throw new Error('Camera device API not available.');
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        setIsCameraActive(true);
      } catch (fallbackErr) {
        setAlertMessage({ type: 'error', text: 'Camera permission denied or camera device unavailable. Please allow camera access in your device settings.' });
      }
    }
  };

  const toggleCameraFacingMode = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    stopCamera();
    setTimeout(() => {
      startCamera(nextMode);
    }, 150);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 320);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const triggerCheckIn = (visitId: string) => {
    const v = queue.find(item => item.id === visitId);
    // If visitor photo was already captured (e.g. upon arrival), reuse it for the pass without asking twice
    if (v && (v.visitorPhoto || v.photoUrl)) {
      handleApproveCheckIn(visitId);
      return;
    }

    if (user?.role === 'Security' || user?.role === 'Receptionist') {
      if (v) {
        setCompleteEmail(v.visitorEmail || '');
        const phoneVal = v.visitorPhone || '';
        if (phoneVal.startsWith('+')) {
          const parts = phoneVal.split(' ');
          if (parts.length > 1) {
            setCompletePhoneCountryCode(parts[0]);
            setCompletePhone(parts.slice(1).join(' '));
          } else {
            const matchedPrefix = ['+971', '+353', '+880', '+977', '+234', '+254', '+233', '+852', '+886', '+358', '+966'].find(p => phoneVal.startsWith(p));
            const prefix = matchedPrefix || phoneVal.substring(0, 3);
            setCompletePhoneCountryCode(prefix);
            setCompletePhone(phoneVal.replace(prefix, '').trim());
          }
        } else {
          setCompletePhoneCountryCode('+1');
          setCompletePhone(phoneVal);
        }
      }
      setShowCheckInPhotoModal(visitId);
      setCapturedPhoto(null);
      setIsCameraActive(false);
    } else {
      handleApproveCheckIn(visitId);
    }
  };

  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!showPreRegModal) {
      stopCamera();
      setCapturedPhoto(null);
    }
  }, [showPreRegModal]);

  useEffect(() => {
    if (!showCheckInPhotoModal) {
      stopCamera();
      setCapturedPhoto(null);
    }
  }, [showCheckInPhotoModal]);

  useEffect(() => {
    if (!showArrivalPhotoModal) {
      stopCamera();
      setCapturedPhoto(null);
    }
  }, [showArrivalPhotoModal]);

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

  // Edit Employee Form States
  const [showEditEmpModal, setShowEditEmpModal] = useState(false);
  const [editEmpId, setEditEmpId] = useState('');
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpEmail, setEditEmpEmail] = useState('');
  const [editEmpPhone, setEditEmpPhone] = useState('');
  const [editEmpFloor, setEditEmpFloor] = useState('');
  const [editEmpDeptId, setEditEmpDeptId] = useState('');
  const [editEmpActive, setEditEmpActive] = useState(true);
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
                    .select('fullName, photoUrl')
                    .eq('id', newRecord.visitorId)
                    .single();
                  
                  if (visData) {
                    setRealtimeNotification({
                      type: 'arrived',
                      visitorName: visData.fullName,
                      photoUrl: visData.photoUrl || undefined
                    });
                    if (isMobile) {
                      sendMobileDeviceNotification(
                        'Visitor Arrived!',
                        `${visData.fullName} has just arrived at the lobby.`,
                        visData.photoUrl || '/123.png'
                      );
                    }
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

  // Global Broadcast Channel for Realtime Unblock Workflow & Notifications
  useEffect(() => {
    if (!token || !user) return;

    const channel = supabase.channel('vms_global_broadcast');

    channel
      .on('broadcast', { event: 'blacklisted_arrived' }, (payload: any) => {
        const p = payload.payload;
        if (user.role === 'Employee' && employeeId && employeeId === p.hostEmployeeId) {
          setRealtimeNotification({
            type: 'blacklisted_arrival' as any,
            visitorName: p.visitorName,
            visitorId: p.visitorId,
            visitId: p.visitId,
            hostName: p.hostName
          });
          if (isMobile) {
            sendMobileDeviceNotification(
              '🚨 Blacklisted Visitor Arrived!',
              `${p.visitorName} is at the security gate and is currently blacklisted.`,
              '/123.png'
            );
          }
        }
      })
      .on('broadcast', { event: 'unblock_request' }, (payload: any) => {
        const p = payload.payload;
        if (user.role === 'Admin') {
          setRealtimeNotification({
            type: 'unblock_request' as any,
            visitorName: p.visitorName,
            visitorId: p.visitorId,
            visitId: p.visitId,
            hostName: p.hostName,
            targetHostId: p.hostEmployeeId
          });
          if (isMobile) {
            sendMobileDeviceNotification(
              '🔓 Unblock Visitor Request',
              `Host ${p.hostName} requested to unblock visitor ${p.visitorName}.`,
              '/123.png'
            );
          }
        }
      })
      .on('broadcast', { event: 'unblock_decision' }, (payload: any) => {
        const p = payload.payload;
        const isTargetHost = user.role === 'Employee' && employeeId === p.targetHostId;
        const isSecurity = user.role === 'Security';

        if (isTargetHost || isSecurity) {
          if (p.decision === 'approved') {
            setRealtimeNotification({
              type: 'unblock_approved' as any,
              visitorName: p.visitorName
            });
            fetchQueue(true);
            fetchEmployeeVisits();
          } else if (p.decision === 'denied') {
            setRealtimeNotification({
              type: 'unblock_denied' as any,
              visitorName: p.visitorName
            });
          }
        }
      })
      .on('broadcast', { event: 'blacklisted_host_rejected' }, (payload: any) => {
        const p = payload.payload;
        if (['Security', 'Admin'].includes(user.role)) {
          setRealtimeNotification({
            type: 'blacklisted_host_rejected' as any,
            visitorName: p.visitorName,
            hostName: p.hostName
          });
          if (isMobile) {
            sendMobileDeviceNotification(
              '🚫 Blacklisted Entry Rejected',
              `Host ${p.hostName} rejected entry for blacklisted visitor ${p.visitorName}. Do not process further.`,
              '/123.png'
            );
          }
          fetchQueue(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, user, employeeId, isMobile]);

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

  const getMaxFutureISOString = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 6);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    let checkPassed = false;
    let checkData: any = null;

    // 1. Perform backend pre-login security check (Email block, CAPTCHA, IP rate limits)
    try {
      const checkRes = await fetch(`${BACKEND_API_URL}/api/v1/auth/pre-login-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          captchaAnswer: captchaInput
        })
      });
      checkData = await checkRes.json();
      checkPassed = true;
    } catch (err) {
      console.warn("Backend security check server is offline. Falling back to direct Supabase Auth.");
      checkPassed = false;
    }

    if (checkPassed && checkData && !checkData.success) {
      setLoading(false);
      if (checkData.error === 'CAPTCHA_REQUIRED') {
        setCaptchaRequired(true);
        if (checkData.captchaQuestion) {
          setCaptchaQuestion(checkData.captchaQuestion);
        }
        setLoginError(checkData.message);
        return;
      } else if (checkData.error === 'IP_LOCKED' || checkData.error === 'EMAIL_LOCKED') {
        setLoginError(checkData.message);
        return;
      } else {
        setLoginError(checkData.message || 'Security check failed.');
        return;
      }
    }

    try {
      // 2. Perform actual Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });

      if (error) throw error;

      if (data?.session) {
        // 3. Notify backend of successful login (non-blocking if server is offline)
        if (checkPassed) {
          try {
            await fetch(`${BACKEND_API_URL}/api/v1/auth/log-login-success`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: loginEmail })
            });
          } catch (e) {
            console.warn("Could not log success to backend server.");
          }
        }

        // Reset frontend local states
        setCaptchaRequired(false);
        setCaptchaInput('');
        setCaptchaQuestion('What is 4 + 7?');
        localStorage.removeItem('vms_login_attempts');
        localStorage.removeItem('vms_login_lockout_until');
        setLoginAttempts(0);
        setLockoutUntil(0);

        localStorage.setItem('vms_token', data.session.access_token);
        setToken(data.session.access_token);
        setAlertMessage({ type: 'success', text: `Welcome back!` });
      }
    } catch (err: any) {
      // 4. Notify backend of failed login attempt
      let failedLoggedOnBackend = false;
      if (checkPassed) {
        try {
          const failRes = await fetch(`${BACKEND_API_URL}/api/v1/auth/log-login-failure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: loginEmail })
          });
          const failData = await failRes.json();
          failedLoggedOnBackend = true;

          const newAttempts = failData.emailAttempts || (loginAttempts + 1);
          setLoginAttempts(newAttempts);
          localStorage.setItem('vms_login_attempts', String(newAttempts));

          if (failData.ipAttempts >= 10) {
            setLoginError('Too many unsuccessful login attempts from your network. You are locked out for 15 minutes.');
          } else if (newAttempts >= 5) {
            setLoginError('Too many unsuccessful login attempts. This account is locked for 15 minutes.');
          } else {
            setLoginError(err.message || 'Login failed. Verify credentials.');
          }

          if (newAttempts >= 3 || failData.ipAttempts >= 3) {
            setCaptchaRequired(true);
          }
        } catch (backendErr) {
          console.warn("Could not log failure to backend server.");
        }
      }

      // If backend was offline or could not log failure, fall back to pure local browser lockout
      if (!failedLoggedOnBackend) {
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
      // Get branch users
      const { data: branchUsers } = await supabase
        .from('User')
        .select('id')
        .eq('branchId', user.branchId);
      const branchUserIds = (branchUsers || []).map((u: any) => u.id);

      // Get branch blacklist
      const { data: branchBlacklist } = await supabase
        .from('Blacklist')
        .select('visitorId, fullName')
        .in('addedByUserId', branchUserIds);
      const blacklistedVisitorIds = new Set((branchBlacklist || []).map((b: any) => b.visitorId).filter(Boolean));
      const blacklistedNames = new Set((branchBlacklist || []).map((b: any) => b.fullName?.toLowerCase().trim()).filter(Boolean));

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
        .or('blacklistFlag.eq.pending_review,isBlacklisted.eq.true');

      if (error) throw error;

      if (data) {
        const { data: usersData } = await supabase
          .from('User')
          .select('id, fullName');
        
        const userMap = new Map((usersData || []).map((u: any) => [u.id, u.fullName]));

        const filteredVisitors = data.filter((v: any) => {
          const isFlaggedHere = v.blacklistFlag === 'pending_review' && branchUserIds.includes(v.flaggedByUserId);
          const isBlacklistedHere = (v.id && blacklistedVisitorIds.has(v.id)) || (v.fullName && blacklistedNames.has(v.fullName.toLowerCase().trim()));
          return isFlaggedHere || isBlacklistedHere;
        });

        const parsed = await Promise.all(filteredVisitors.map(async (visitor: any) => {
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

          const isBlacklistedHere = (visitor.id && blacklistedVisitorIds.has(visitor.id)) || (visitor.fullName && blacklistedNames.has(visitor.fullName.toLowerCase().trim()));

          return {
            ...visitor,
            isBlacklisted: isBlacklistedHere,
            blacklistFlag: branchUserIds.includes(visitor.flaggedByUserId) ? visitor.blacklistFlag : 'none',
            flaggedByName: userMap.get(visitor.flaggedByUserId) || 'Security Staff',
            visitHistory: visitsData || []
          };
        }));
        setFlaggedVisitors(parsed.filter((v: any) => v.blacklistFlag === 'pending_review'));
        setConfirmedBlacklisted(parsed.filter((v: any) => v.isBlacklisted === true));
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
  const handleRemoveFromBlacklist = async (visitorId: string) => {
    try {
      // Get branch users
      const { data: branchUsers } = await supabase
        .from('User')
        .select('id')
        .eq('branchId', user.branchId);
      const branchUserIds = (branchUsers || []).map((u: any) => u.id);

      // Clean up the corresponding Blacklist table entry for this branch
      const { error: blDeleteErr } = await supabase
        .from('Blacklist')
        .delete()
        .eq('visitorId', visitorId)
        .in('addedByUserId', branchUserIds);

      if (blDeleteErr) throw blDeleteErr;

      // Check if there are other blacklist entries remaining for this visitor
      const { data: remainingBl } = await supabase
        .from('Blacklist')
        .select('id')
        .eq('visitorId', visitorId);

      const { error } = await supabase
        .from('Visitor')
        .update({
          isBlacklisted: remainingBl && remainingBl.length > 0,
          blacklistFlag: 'none'
        })
        .eq('id', visitorId);

      if (error) throw error;

      await supabase.from('AuditLog').insert({
        actorUserId: user.id,
        action: 'REMOVE_FROM_BLACKLIST',
        entityType: 'Visitor',
        entityId: visitorId
      });

      setAlertMessage({ type: 'success', text: 'Visitor removed from blacklist successfully.' });
      fetchBlacklistReview();
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Failed to remove visitor from blacklist' });
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
    return executeWithNetworkWatchdog(`arrive_${visitId}`, async () => {
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
    });
  };

  // Security Notify Host when Blacklisted Visitor Arrives
  const handleSecurityNotifyHostBlacklisted = async (item: any) => {
    return executeWithNetworkWatchdog(`notify_host_${item.id}`, async () => {
      const channel = supabase.channel('vms_global_broadcast');
      await channel.send({
        type: 'broadcast',
        event: 'blacklisted_arrived',
        payload: {
          visitId: item.id,
          visitorId: item.visitorId,
          visitorName: item.visitorName,
          hostEmployeeId: item.hostId,
          hostName: item.hostName
        }
      });

      await supabase.from('Notification').insert({
        recipientVisitorId: item.visitorId,
        channel: 'InApp',
        message: `🚨 Blacklisted Visitor ${item.visitorName} is at the security gate.`,
        status: 'Queued'
      });

      setAlertMessage({
        type: 'success',
        text: `Host ${item.hostName} notified about blacklisted visitor ${item.visitorName}.`
      });
    });
  };

  // Host Request Admin to Unblock Visitor
  const handleHostRequestUnblock = async (visitId: string, visitorId: string, visitorName: string) => {
    return executeWithNetworkWatchdog(`request_unblock_${visitId}`, async () => {
      const channel = supabase.channel('vms_global_broadcast');
      await channel.send({
        type: 'broadcast',
        event: 'unblock_request',
        payload: {
          visitId,
          visitorId,
          visitorName,
          hostEmployeeId: employeeId,
          hostName: user?.fullName || 'Host'
        }
      });

      setRealtimeNotification(null);
      setAlertMessage({
        type: 'success',
        text: `Request sent to Admin to unblock ${visitorName}.`
      });
    });
  };

  // Host Rejects Entry for Blacklisted Visitor
  const handleHostRejectBlacklisted = async (visitId: string, visitorId: string, visitorName: string) => {
    return executeWithNetworkWatchdog(`reject_blacklisted_${visitId}`, async () => {
      if (visitId) {
        await supabase
          .from('Visit')
          .update({
            status: 'denied',
            deniedReason: 'Denied entry by host (Blacklisted visitor)'
          })
          .eq('id', visitId);
      }

      const channel = supabase.channel('vms_global_broadcast');
      await channel.send({
        type: 'broadcast',
        event: 'blacklisted_host_rejected',
        payload: {
          visitId,
          visitorId,
          visitorName,
          hostName: user?.fullName || 'Host'
        }
      });

      setRealtimeNotification(null);
      setAlertMessage({
        type: 'warning',
        text: `You rejected entry for blacklisted visitor ${visitorName}. Security has been notified.`
      });
      fetchEmployeeVisits();
    });
  };


  // Admin Decisions on Unblock Request
  const handleAdminApproveUnblock = async (visitorId: string, visitorName: string, targetHostId?: string) => {
    return executeWithNetworkWatchdog(`approve_unblock_${visitorId}`, async () => {
      const { data: branchUsers } = await supabase.from('User').select('id').eq('branchId', user.branchId);
      const branchUserIds = (branchUsers || []).map((u: any) => u.id);

      await supabase.from('Blacklist').delete().eq('visitorId', visitorId).in('addedByUserId', branchUserIds);
      await supabase.from('Visitor').update({ isBlacklisted: false, blacklistFlag: 'none' }).eq('id', visitorId);

      await supabase.from('AuditLog').insert({
        actorUserId: user.id,
        action: 'ADMIN_UNBLOCK_VISITOR',
        entityType: 'Visitor',
        entityId: visitorId
      });

      const channel = supabase.channel('vms_global_broadcast');
      await channel.send({
        type: 'broadcast',
        event: 'unblock_decision',
        payload: {
          decision: 'approved',
          visitorName,
          targetHostId
        }
      });

      setRealtimeNotification(null);
      setAlertMessage({ type: 'success', text: `Visitor ${visitorName} unblocked successfully!` });

      fetchQueue();
      fetchBlacklistReview();
    });
  };

  const handleAdminDenyUnblock = async (visitorId: string, visitorName: string, targetHostId?: string) => {
    return executeWithNetworkWatchdog(`deny_unblock_${visitorId}`, async () => {
      const channel = supabase.channel('vms_global_broadcast');
      await channel.send({
        type: 'broadcast',
        event: 'unblock_decision',
        payload: {
          decision: 'denied',
          visitorName,
          targetHostId
        }
      });

      setRealtimeNotification(null);
      setAlertMessage({
        type: 'error',
        text: `Unblock request for ${visitorName} denied. Entry remains restricted.`
      });
    });
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
      // Get branch users
      const { data: branchUsers } = await supabase
        .from('User')
        .select('id')
        .eq('branchId', user.branchId);
      const branchUserIds = (branchUsers || []).map((u: any) => u.id);

      // Get branch blacklist
      const { data: branchBlacklist } = await supabase
        .from('Blacklist')
        .select('visitorId, fullName')
        .in('addedByUserId', branchUserIds);
      const blacklistedVisitorIds = new Set((branchBlacklist || []).map((b: any) => b.visitorId).filter(Boolean));
      const blacklistedNames = new Set((branchBlacklist || []).map((b: any) => b.fullName?.toLowerCase().trim()).filter(Boolean));

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
            photoUrl,
            isBlacklisted,
            blacklistFlag,
            flaggedByUserId
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
          .map((v: any) => {
            const isBl = (v.Visitor?.id && blacklistedVisitorIds.has(v.Visitor.id)) ||
                         (v.Visitor?.fullName && blacklistedNames.has(v.Visitor.fullName.toLowerCase().trim())) ||
                         false;
            return {
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
              additionalGuests: v.additionalGuests || 0,
              isBlacklisted: isBl,
              blacklistFlag: branchUserIds.includes(v.Visitor?.flaggedByUserId) ? (v.Visitor?.blacklistFlag || '') : 'none'
            };
          })
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
      // Get branch users
      const { data: branchUsers } = await supabase
        .from('User')
        .select('id')
        .eq('branchId', user.branchId);
      const branchUserIds = (branchUsers || []).map((u: any) => u.id);

      // Get branch blacklist
      const { data: branchBlacklist } = await supabase
        .from('Blacklist')
        .select('visitorId, fullName')
        .in('addedByUserId', branchUserIds);
      const blacklistedVisitorIds = new Set((branchBlacklist || []).map((b: any) => b.visitorId).filter(Boolean));
      const blacklistedNames = new Set((branchBlacklist || []).map((b: any) => b.fullName?.toLowerCase().trim()).filter(Boolean));

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
            photoUrl,
            isBlacklisted,
            blacklistFlag,
            flaggedByUserId
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
              photoUrl,
              isBlacklisted,
              blacklistFlag,
              flaggedByUserId
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
        const mapped = data.filter((v: any) => v.Visitor !== null).map((v: any) => {
          const isBl = (v.Visitor?.id && blacklistedVisitorIds.has(v.Visitor.id)) ||
                       (v.Visitor?.fullName && blacklistedNames.has(v.Visitor.fullName.toLowerCase().trim())) ||
                       false;
          return {
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
            photoUrl: v.Visitor?.photoUrl || '',
            isBlacklisted: isBl,
            blacklistFlag: branchUserIds.includes(v.Visitor?.flaggedByUserId) ? (v.Visitor?.blacklistFlag || '') : 'none',
            remarks: v.remarks || ''
          };
        });
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
      // Get branch users
      const { data: branchUsers } = await supabase
        .from('User')
        .select('id')
        .eq('branchId', user.branchId);
      const branchUserIds = (branchUsers || []).map((u: any) => u.id);

      // Get branch blacklist
      const { data: branchBlacklist } = await supabase
        .from('Blacklist')
        .select('visitorId, fullName')
        .in('addedByUserId', branchUserIds);
      const blacklistedVisitorIds = new Set((branchBlacklist || []).map((b: any) => b.visitorId).filter(Boolean));
      const blacklistedNames = new Set((branchBlacklist || []).map((b: any) => b.fullName?.toLowerCase().trim()).filter(Boolean));

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
            photoUrl,
            location,
            isBlacklisted
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
        const mapped = data.filter((v: any) => v.Visitor !== null).map((v: any) => {
          const isBl = (v.Visitor?.id && blacklistedVisitorIds.has(v.Visitor.id)) ||
                       (v.Visitor?.fullName && blacklistedNames.has(v.Visitor.fullName.toLowerCase().trim())) ||
                       false;
          return {
            id: v.id,
            visitorId: v.Visitor?.id || '',
            visitorName: v.Visitor?.fullName || 'Visitor',
            visitorEmail: v.Visitor?.email || '',
            visitorPhone: v.Visitor?.phone || '',
            visitorCompany: v.Visitor?.company || '',
            visitorType: v.Visitor?.visitorType || 'Guest',
            visitorLocation: v.Visitor?.location || '',
            photoUrl: v.Visitor?.photoUrl || '',
            isBlacklisted: isBl,
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
          };
        });
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

  const handleCloseBlacklistBlockedModal = () => {
    setShowBlacklistBlockedModal(false);
    setShowPreRegModal(false);
    if (currentView === 'employee_invite') {
      setCurrentView('employee_scheduled');
    }
  };

  // Pre-Register Guest Handler
  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preName || !preHostId || !prePurpose || !preScheduled) return;

    // Validate Name (only alphabets and spaces)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(preName.trim())) {
      setAlertMessage({ type: 'error', text: 'Visitor Name must contain only alphabetic characters and spaces.' });
      return;
    }

    // Validate that scheduled date and time is not in the past
    if (new Date(preScheduled).getTime() < Date.now() - 60000) {
      setAlertMessage({ type: 'error', text: 'Scheduled date and time cannot be in the past.' });
      return;
    }

    // Validate that scheduled date and time is not more than 6 months in the future
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);
    if (new Date(preScheduled).getTime() > maxFutureDate.getTime()) {
      setAlertMessage({ type: 'error', text: 'Scheduled date and time cannot be more than 6 months in the future.' });
      return;
    }

    // Validate guest count limits (Max 10 for non-VIP)
    if (preType !== 'VIP' && preGuestCount > 10) {
      setAlertMessage({ type: 'error', text: 'Number of guests cannot exceed 10 for non-VIP visitors.' });
      return;
    }

    // Validate presence of email and phone according to user role
    if (user?.role === 'Employee') {
      if (!preEmail.trim() && !prePhone.trim()) {
        setAlertMessage({ type: 'error', text: 'Please provide at least a visitor email address or a phone number.' });
        return;
      }
    } else {
      if (!preEmail.trim() || !prePhone.trim()) {
        setAlertMessage({ type: 'error', text: 'Please provide both email address and phone number for walk-in visitors.' });
        return;
      }
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
      // 1. Check Blacklist Status first
      let blacklistCheck = false;
      const emailInput = preEmail.trim().toLowerCase();
      const phoneInput = finalPhone.trim();

      // Get branch users
      const { data: branchUsers } = await supabase
        .from('User')
        .select('id')
        .eq('branchId', user.branchId);
      const branchUserIds = (branchUsers || []).map((u: any) => u.id);

      // Find matching visitors
      const { data: matchingVisitors } = await supabase
        .from('Visitor')
        .select('id, fullName, email, phone')
        .or(`email.eq.${emailInput},phone.eq.${phoneInput},fullName.ilike.${preName.trim()}`);

      if (matchingVisitors && matchingVisitors.length > 0) {
        const matchingVisitorIds = matchingVisitors.map((v: any) => v.id);
        
        let query = supabase
          .from('Blacklist')
          .select('id')
          .in('addedByUserId', branchUserIds);
          
        if (matchingVisitorIds.length > 0) {
          query = query.or(`visitorId.in.(${matchingVisitorIds.join(',')}),fullName.ilike.${preName.trim()}`);
        } else {
          query = query.ilike('fullName', preName.trim());
        }
        
        const { data: blMatches } = await query;
        if (blMatches && blMatches.length > 0) {
          blacklistCheck = true;
        }
      } else {
        // Just search by name in Blacklist table for this branch
        const { data: blMatches } = await supabase
          .from('Blacklist')
          .select('id')
          .in('addedByUserId', branchUserIds)
          .ilike('fullName', preName.trim());
        if (blMatches && blMatches.length > 0) {
          blacklistCheck = true;
        }
      }

      if (blacklistCheck) {
        setShowBlacklistBlockedModal(true);
        return;
      }

      // 2. Check or Create Visitor
      let visitorId = '';
      
      // Look up visitors with the same name
      const { data: nameMatches } = await supabase
        .from('Visitor')
        .select('id, email, phone')
        .ilike('fullName', preName.trim());

      if (nameMatches && nameMatches.length > 0) {
        // Find if there's an existing visitor record where the entered details match the stored details
        const match = nameMatches.find(v => {
          const emailDb = (v.email || '').trim().toLowerCase();
          const phoneDb = (v.phone || '').trim();

          const emailOk = emailInput === emailDb;
          const phoneOk = phoneInput === phoneDb;

          return emailOk && phoneOk;
        });

        if (match) {
          visitorId = match.id;
        }
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
            location: preLocation || null,
            photoUrl: capturedPhoto || null
          })
          .select('id')
          .single();

        if (crErr) throw crErr;
        if (created) visitorId = created.id;
      } else if (capturedPhoto) {
        await supabase
          .from('Visitor')
          .update({ photoUrl: capturedPhoto })
          .eq('id', visitorId);
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
  const handleApproveCheckIn = async (
    visitId: string, 
    photoToAttach?: string | null,
    completedEmail?: string | null,
    completedPhone?: string | null
  ) => {
    return executeWithNetworkWatchdog(`checkin_${visitId}`, async () => {
      // Fetch full visit details for the pass before updating
      const { data: visitData, error: fetchErr } = await supabase
        .from('Visit')
        .select(`
          id, visitorId, purpose, scheduledAt, additionalGuests, status,
          Visitor ( fullName, company, visitorType, email, phone, photoUrl ),
          Employee ( fullName, phone, Department ( name ) )
        `)
        .eq('id', visitId)
        .single();

      if (fetchErr) throw fetchErr;

      if (visitData?.status === 'Denied') {
        setAlertMessage({ type: 'error', text: 'This visit has already been denied entry by the host/employee.' });
        return;
      }

      if (visitData?.visitorId) {
        const updatePayload: any = {};
        if (photoToAttach) updatePayload.photoUrl = photoToAttach;
        if (completedEmail) updatePayload.email = completedEmail;
        if (completedPhone) updatePayload.phone = completedPhone;

        if (Object.keys(updatePayload).length > 0) {
          await supabase
            .from('Visitor')
            .update(updatePayload)
            .eq('id', visitData.visitorId);
          if (visitData.Visitor) {
            if (photoToAttach) (visitData.Visitor as any).photoUrl = photoToAttach;
            if (completedEmail) (visitData.Visitor as any).email = completedEmail;
            if (completedPhone) (visitData.Visitor as any).phone = completedPhone;
          }
        }
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
          photoUrl: v?.photoUrl || '',
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
    });
  };

  // Deny Check-In
  const handleDenyCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDenyModal) return;

    return executeWithNetworkWatchdog(`deny_${showDenyModal}`, async () => {
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
    });
  };

  // Execute manual Check-Out
  const handleCheckOut = async (visitId: string) => {
    return executeWithNetworkWatchdog(`checkout_${visitId}`, async () => {
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
    });
  };

  // Add Employee Host
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmpName || !addEmpEmail || !addEmpPhone || !addEmpDeptId) return;

    // Validate Name (only alphabets and spaces)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(addEmpName.trim())) {
      setAlertMessage({ type: 'error', text: 'Host Name must contain only alphabetic characters and spaces.' });
      return;
    }

    // Validate Phone Number (digits, spaces, dashes, parens, optional leading +; between 7 and 15 digits)
    const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
    const cleanPhone = addEmpPhone.trim().replace(/\D/g, '');
    if (!phoneRegex.test(addEmpPhone.trim()) || cleanPhone.length < 7 || cleanPhone.length > 15) {
      setAlertMessage({ type: 'error', text: 'Please enter a valid phone number (7 to 15 digits).' });
      return;
    }

    // Validate Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(addEmpEmail.trim())) {
      setAlertMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

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

  const startEditEmployee = (emp: any) => {
    setEditEmpId(emp.id);
    setEditEmpName(emp.fullName);
    setEditEmpEmail(emp.email);
    setEditEmpPhone(emp.phone);
    setEditEmpFloor(emp.floor || '');
    setEditEmpDeptId(emp.departmentId || '');
    setEditEmpActive(emp.isActive);
    setShowEditEmpModal(true);
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmpId || !editEmpName || !editEmpEmail || !editEmpPhone || !editEmpDeptId) return;

    // Validate Name (only alphabets and spaces)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(editEmpName.trim())) {
      setAlertMessage({ type: 'error', text: 'Employee Name must contain only alphabetic characters and spaces.' });
      return;
    }

    // Validate Phone Number (digits, spaces, dashes, parens, optional leading +; between 7 and 15 digits)
    const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
    const cleanPhone = editEmpPhone.trim().replace(/\D/g, '');
    if (!phoneRegex.test(editEmpPhone.trim()) || cleanPhone.length < 7 || cleanPhone.length > 15) {
      setAlertMessage({ type: 'error', text: 'Please enter a valid phone number (7 to 15 digits).' });
      return;
    }

    // Validate Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(editEmpEmail.trim())) {
      setAlertMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    try {
      const { error } = await supabase
        .from('Employee')
        .update({
          fullName: editEmpName,
          email: editEmpEmail,
          phone: editEmpPhone,
          floor: editEmpFloor || null,
          departmentId: editEmpDeptId,
          isActive: editEmpActive
        })
        .eq('id', editEmpId);

      if (error) throw error;

      setAlertMessage({ type: 'success', text: `Employee ${editEmpName} updated successfully.` });
      setShowEditEmpModal(false);
      fetchEmployees();
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Failed to update employee' });
    }
  };

  const handleRemoveEmployee = async (empId: string, empName: string) => {
    if (!confirm(`Are you sure you want to remove employee ${empName}? This will delete their profile or deactivate them if they have past visits.`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('Employee')
        .delete()
        .eq('id', empId);

      if (error) {
        console.warn("Hard delete failed, deactivating instead", error);
        const { error: updateError } = await supabase
          .from('Employee')
          .update({ isActive: false })
          .eq('id', empId);

        if (updateError) throw updateError;
        setAlertMessage({ type: 'success', text: `Employee ${empName} has past records, so they were deactivated instead of deleted.` });
      } else {
        setAlertMessage({ type: 'success', text: `Employee ${empName} was successfully removed.` });
      }
      fetchEmployees();
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Failed to remove employee' });
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--indigo-primary)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '24px', justifyContent: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #c84e3c, #e05a47)',
              borderRadius: '12px',
              padding: '8px',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(224, 90, 71, 0.3)'
            }}>
              <Building size={20} />
            </div>
            <span>VMS Staff Portal</span>
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

            {captchaRequired && (
              <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🛡️ Security Check
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                  Please prove you are human: <strong>{captchaQuestion}</strong>
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter answer"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value)}
                  style={{ width: '100%', height: '38px', fontSize: '0.9rem' }}
                  required
                />
              </div>
            )}

            <Button type="submit" variant="primary" style={{ width: '100%', padding: '12px' }} isLoading={loading} disabled={lockoutUntil > Date.now()}>
              Sign In
            </Button>
          </form>


        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Mobile View Rendering & Helpers
  // ────────────────────────────────────────────────────────────────────────

  const getMobileMenuItems = () => {
    const items: { view: View; label: string; icon: React.ComponentType<any> }[] = [];
    if (!user) return items;
    if (user.role === 'Security') {
      items.push(
        { view: 'security_arrivals', label: "Today's Arrivals", icon: Clock },
        { view: 'check_invite', label: "Check Invitation", icon: Search },
        { view: 'security_history', label: "Past Records", icon: History }
      );
    } else if (user.role === 'Employee') {
      items.push(
        { view: 'employee_scheduled', label: "Today's Scheduled", icon: Clock },
        { view: 'employee_past', label: "Past Hosted Visits", icon: History },
        { view: 'employee_future', label: "My Future Visits", icon: Calendar },
        { view: 'employee_invite', label: "Invite Future Guest", icon: Plus }
      );
    } else {
      // Admin / Receptionist / Staff
      items.push(
        { view: 'queue', label: "Lobby Queue", icon: Clock },
        { view: 'employees', label: "Company Directory", icon: Users },
        { view: 'blacklist_review', label: "Blacklist Review Queue", icon: ShieldAlert },
        { view: 'analytics', label: "Analytics", icon: BarChart2 }
      );
    }
    return items;
  };

  const getViewIcon = (view: View) => {
    switch (view) {
      case 'security_arrivals':
      case 'employee_scheduled':
      case 'queue':
        return <Clock size={20} />;
      case 'check_invite':
        return <Search size={20} />;
      case 'security_history':
      case 'employee_past':
        return <History size={20} />;
      case 'employee_future':
        return <Calendar size={20} />;
      case 'employee_invite':
        return <Plus size={20} />;
      case 'employees':
        return <Users size={20} />;
      case 'blacklist_review':
        return <ShieldAlert size={20} />;
      case 'analytics':
        return <BarChart2 size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  const renderMobileQueueView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Expected', val: queueStats.expected, color: '#60a5fa' },
            { label: 'In Office', val: queueStats.checkedin, color: '#4ade80' },
            { label: 'Waiting', val: queueStats.waiting, color: '#fbbf24' },
            { label: 'Departed', val: queueStats.checkedout, color: '#a1a1aa' }
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--card-bg)',
              border: '1.5px solid var(--card-border)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{stat.label}</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: stat.color }} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{stat.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Filter queue by visitor, host..." 
              value={queueSearch}
              onChange={e => setQueueSearch(e.target.value)}
              style={{ paddingLeft: '36px', height: '40px', fontSize: '0.85rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
          </div>
          {user.role === 'Receptionist' && (
            <button 
              className="btn btn-primary" 
              onClick={() => setShowPreRegModal(true)}
              style={{ width: '100%', justifyContent: 'center', height: '40px', fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              <span>Pre-Register Guest</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredQueue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
              No visitors registered in lobby queue today.
            </div>
          ) : (
            filteredQueue.map(item => (
              <div key={item.id} style={{
                background: 'var(--card-bg)',
                border: item.isBlacklisted ? '1.5px solid var(--color-danger)' : '1.5px solid var(--card-border)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Avatar name={item.visitorName} visitorType={item.visitorType} size="md" src={item.photoUrl || undefined} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.visitorName}
                      </div>
                      <span style={{ color: `var(--visitor-${item.visitorType?.toLowerCase()}-text)`, fontWeight: 600, fontSize: '0.75rem', background: `var(--visitor-${item.visitorType?.toLowerCase()}-bg)`, border: `1px solid var(--visitor-${item.visitorType?.toLowerCase()}-border)`, padding: '2px 8px', borderRadius: '12px', flexShrink: 0 }}>
                        {item.visitorType}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      🏢 {item.visitorCompany || 'Independent'}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--card-bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div>💬 <strong>Purpose:</strong> {item.purpose}</div>
                  <div>👤 <strong>Host:</strong> {item.hostName} ({item.hostPhone || 'N/A'})</div>
                  {item.checkedInAt && (
                    <div>🟢 <strong>Checked In:</strong> {new Date(item.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '10px' }}>
                  <StatusIndicator status={item.status} />
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {item.isBlacklisted ? (
                      <span style={{ background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>⚠️ BLACKLISTED</span>
                    ) : (
                      <>
                        {item.status === 'Waiting' && user.role === 'Receptionist' && (
                          <>
                            <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => triggerCheckIn(item.id)}>
                              Approve
                            </button>
                            <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => setShowDenyModal(item.id)}>
                              Deny
                            </button>
                          </>
                        )}
                        {(item.status === 'CheckedIn' || item.status === 'InMeeting') && user.role === 'Receptionist' && (
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => handleCheckOut(item.id)}>
                            Check Out
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderMobileSecurityArrivalsView = () => {
    return (
      <div 
        onTouchStart={handleTouchStartPull}
        onTouchMove={handleTouchMovePull}
        onTouchEnd={handleTouchEndPull}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100vh' }}
      >
        {(pullY > 0 || isRefreshing) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            background: 'var(--card-bg-subtle)',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--color-indigo-accent)',
            transition: 'all 0.2s ease-out'
          }}>
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing data...' : pullY > 60 ? 'Release to refresh' : 'Pull down to refresh ⬇️'}</span>
          </div>
        )}

        {isNetworkSlow && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid #f59e0b',
            color: '#f59e0b',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Loader2 size={16} className="animate-spin" /> Network connection is slow. Please wait a moment...
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search today's arrivals..." 
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
                style={{ paddingLeft: '36px', height: '40px', fontSize: '0.85rem', width: '100%' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={async () => {
                setIsRefreshing(true);
                await Promise.all([fetchQueue(true), fetchBlacklistReview(), fetchEmployeeVisits()]);
                setIsRefreshing(false);
                setAlertMessage({ type: 'success', text: 'Data refreshed! 🔄' });
              }}
              style={{ padding: '0 12px', height: '40px' }}
              title="Refresh Queue Data"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowPreRegModal(true)}
            style={{ width: '100%', justifyContent: 'center', height: '40px', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Register Walk-in</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeArrivalsToday.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
              No visits scheduled at the gate for today.
            </div>
          ) : filteredArrivals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
              No matching arrivals found.
            </div>
          ) : (
            filteredArrivals.map(item => (
              <div key={item.id} style={{
                background: 'var(--card-bg)',
                border: item.isBlacklisted ? '1.5px solid var(--color-danger)' : '1.5px solid var(--card-border)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Avatar name={item.visitorName} visitorType={item.visitorType} size="md" src={item.photoUrl || undefined} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.visitorName}
                      </div>
                      <span style={{ color: `var(--visitor-${item.visitorType?.toLowerCase()}-text)`, fontWeight: 600, fontSize: '0.75rem', background: `var(--visitor-${item.visitorType?.toLowerCase()}-bg)`, border: `1px solid var(--visitor-${item.visitorType?.toLowerCase()}-border)`, padding: '2px 8px', borderRadius: '12px', flexShrink: 0 }}>
                        {item.visitorType}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      🏢 {item.visitorCompany || 'Independent'}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--card-bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div>💬 <strong>Purpose:</strong> {item.purpose}</div>
                  <div>👤 <strong>Host:</strong> {item.hostName} ({item.hostPhone || 'N/A'})</div>
                  {item.scheduledAt && (
                    <div>⏰ <strong>Scheduled:</strong> {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  )}
                  {item.additionalGuests > 0 && (
                    <div style={{ color: 'var(--color-warning)', fontWeight: 600 }}>➕ {item.additionalGuests} Additional Guests</div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--card-border)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <StatusIndicator status={item.status} />
                    {item.isBlacklisted && <Badge tone="danger">⚠️ BLACKLISTED</Badge>}
                  </div>
                  
                  {!item.isBlacklisted && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      {item.status === 'Expected' && (
                        <>
                          <button 
                            className="btn btn-primary" 
                            disabled={!!pendingActionId}
                            style={{ padding: '8px 10px', fontSize: '0.8rem', justifyContent: 'center' }} 
                            onClick={() => executeWithNetworkWatchdog(`arrive_${item.id}`, async () => { setShowArrivalPhotoModal(item.id); })}
                          >
                            {pendingActionId === `arrive_${item.id}` ? <Loader2 size={14} className="animate-spin" /> : 'Arrived'}
                          </button>
                          <button className="btn btn-danger" style={{ padding: '8px 10px', fontSize: '0.8rem', justifyContent: 'center' }} onClick={() => setShowDenyModal(item.id)}>
                            Deny Entry
                          </button>
                        </>
                      )}
                      {item.status === 'Waiting' && (
                        <>
                          <button 
                            className="btn btn-primary" 
                            disabled={!!pendingActionId}
                            style={{ padding: '8px 10px', fontSize: '0.8rem', justifyContent: 'center' }} 
                            onClick={() => executeWithNetworkWatchdog(`checkin_${item.id}`, async () => { triggerCheckIn(item.id); })}
                          >
                            {pendingActionId === `checkin_${item.id}` ? <Loader2 size={14} className="animate-spin" /> : 'Check In'}
                          </button>
                          <button className="btn btn-danger" style={{ padding: '8px 10px', fontSize: '0.8rem', justifyContent: 'center' }} onClick={() => setShowDenyModal(item.id)}>
                            Deny Entry
                          </button>
                        </>
                      )}
                      {item.status === 'CheckedIn' && (
                        <button 
                          className="btn btn-danger" 
                          disabled={!!pendingActionId}
                          style={{ gridColumn: 'span 2', padding: '8px 10px', fontSize: '0.8rem', justifyContent: 'center' }} 
                          onClick={() => handleCheckOut(item.id)}
                        >
                          {pendingActionId === `checkout_${item.id}` ? <Loader2 size={14} className="animate-spin" /> : 'Check Out'}
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '6px' }}>
                    {!item.isBlacklisted ? (
                      <button 
                        className="btn btn-secondary" 
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem', justifyContent: 'center', borderColor: '#ef4444', color: 'var(--color-danger)' }} 
                        onClick={() => setShowFlagBlacklistModal(item.visitorId)}
                      >
                        Flag Blacklist
                      </button>
                    ) : (
                      <button 
                        className="btn btn-warning" 
                        disabled={!!pendingActionId}
                        style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem', justifyContent: 'center', fontWeight: 600 }} 
                        onClick={() => handleSecurityNotifyHostBlacklisted(item)}
                      >
                        {pendingActionId === `notify_host_${item.id}` ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          '🔔 Notify Host'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderMobileCheckInviteView = () => {
    const filtered = futureInvitations.filter((item: any) => 
      item.visitorName.toLowerCase().includes(inviteSearch.toLowerCase()) ||
      item.hostName.toLowerCase().includes(inviteSearch.toLowerCase())
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          background: 'var(--card-bg)',
          border: '1.5px solid var(--card-border)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>Verify Visitor Invitation</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '12px' }}>Verify future invitations made by host/employees.</p>
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search future invitations..." 
              value={inviteSearch} 
              onChange={e => setInviteSearch(e.target.value)} 
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.8rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {futureInvitations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
              No future invitations scheduled.
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
              No matching invitations found.
            </div>
          ) : (
            filtered.map(item => {
              const isBl = item.isBlacklisted;
              const isFlagged = item.blacklistFlag === 'pending_review';
              const isToday = new Date(item.scheduledAt).toDateString() === new Date().toDateString();
              
              return (
                <div key={item.id} style={{
                  background: 'var(--card-bg)',
                  border: isBl ? '1.5px solid var(--color-danger)' : '1.5px solid var(--card-border)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: 'var(--card-shadow)'
                }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <Avatar name={item.visitorName} visitorType={item.visitorType} size="md" src={item.photoUrl || undefined} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>{item.visitorName}</span>
                          {isBl && <Badge tone="danger" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Watch</Badge>}
                          {isFlagged && <Badge tone="warning" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Review</Badge>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          🏢 {item.visitorCompany || 'Independent'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--card-bg-subtle)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div>👤 <strong>Host:</strong> {item.hostName || 'N/A'}</div>
                    <div>📅 <strong>Scheduled:</strong> {new Date(item.scheduledAt).toLocaleString()}</div>
                    {isToday ? (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 600 }}>• Today's Booking</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 600 }}>• Future Booking</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '10px' }}>
                    <StatusIndicator status={item.status} />
                    
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {!isBl && ['Expected', 'Waiting'].includes(item.status) && isToday && (
                        <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => setShowArrivalPhotoModal(item.id)}>
                          Mark Arrived
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => {
                          setDetailPanelTab('general');
                          setSelectedInviteDetails({ ...item, hostDept: item.hostDept || '' });
                        }}
                      >
                        <FileText size={12} /> Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderMobileSecurityHistoryView = () => {
    const filtered = pastRecords.filter((item: any) => 
      item.visitorName.toLowerCase().includes(pastSearch.toLowerCase()) ||
      item.hostName.toLowerCase().includes(pastSearch.toLowerCase()) ||
      item.visitorCompany.toLowerCase().includes(pastSearch.toLowerCase())
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          background: 'var(--card-bg)',
          border: '1.5px solid var(--card-border)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>Visitor History Log</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '12px' }}>Search and review completed &amp; past visitor records.</p>
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search past logs..." 
              value={pastSearch} 
              onChange={e => setPastSearch(e.target.value)} 
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.8rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pastRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
              No past visitor logs found.
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
              No matching past records found.
            </div>
          ) : (
            filtered.map(item => (
              <div key={item.id} style={{
                background: 'var(--card-bg)',
                border: '1.5px solid var(--card-border)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Avatar name={item.visitorName} visitorType={item.visitorType} size="md" src={item.photoUrl || undefined} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span>{item.visitorName}</span>
                      {item.isBlacklisted && <Badge tone="danger" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Banned</Badge>}
                      {item.additionalGuests > 0 && <Badge tone="warning" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>+{item.additionalGuests} Guests</Badge>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      🏢 {item.visitorCompany || 'Independent'} · <span style={{ color: `var(--visitor-${item.visitorType?.toLowerCase()}-text)` }}>{item.visitorType}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--card-bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div>👤 <strong>Host:</strong> {item.hostName} ({item.department || 'General'})</div>
                  <div>💬 <strong>Purpose:</strong> "{item.purpose}"</div>
                  {item.badgeNumber && item.badgeNumber !== 'N/A' && (
                    <div>🏷️ <strong>Badge:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-indigo-accent)' }}>{item.badgeNumber}</span></div>
                  )}
                  <div style={{ borderTop: '1px dashed var(--card-border)', marginTop: '4px', paddingTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div>📅 Date: {new Date(item.scheduledAt).toLocaleDateString()}</div>
                    {item.checkedInAt && <div style={{ color: 'var(--color-success)' }}>🟢 Checked In: {new Date(item.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                    {item.checkedOutAt && <div style={{ color: 'var(--color-danger)' }}>🔴 Checked Out: {new Date(item.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                    {item.deniedReason && <div style={{ color: 'var(--color-danger)' }}>⚠️ Denied Reason: {item.deniedReason}</div>}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <StatusIndicator status={item.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderMobileEmployeesView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search host directory..." 
              value={empSearch}
              onChange={e => setEmpSearch(e.target.value)}
              style={{ paddingLeft: '36px', height: '40px', fontSize: '0.85rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
          </div>
          {user.role === 'Admin' && (
            <button 
              className="btn btn-primary" 
              onClick={() => setShowAddEmpModal(true)}
              style={{ width: '100%', justifyContent: 'center', height: '40px', fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              <span>Add Employee</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredEmployees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
              No employees found.
            </div>
          ) : (
            filteredEmployees.map(e => (
              <div key={e.id} style={{
                background: 'var(--card-bg)',
                border: '1.5px solid var(--card-border)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Avatar name={e.fullName} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{e.fullName}</span>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.1)', color: 'var(--color-indigo-accent)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        {e.departmentName}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      Floor {e.floor || 'N/A'} Desk Location
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--card-bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  <div>✉️ <strong>Email:</strong> {e.email}</div>
                  <div>📞 <strong>Phone:</strong> {e.phone}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <strong>Status:</strong>
                    <span style={{ color: e.isActive ? '#4ade80' : '#ef4444', fontWeight: 600 }}>
                      {e.isActive ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </div>
                </div>

                {user.role === 'Admin' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid var(--card-border)', paddingTop: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}
                      onClick={() => startEditEmployee(e)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}
                      onClick={() => handleRemoveEmployee(e.id, e.fullName)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderMobileBlacklistReviewView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} style={{ color: 'var(--color-danger)' }} />
            Security Flag Review Queue
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {flaggedVisitors.length > 0
              ? `${flaggedVisitors.length} pending reviews from security`
              : 'All clear — no pending flags'}
          </p>
          {user.role === 'Admin' && (
            <button 
              className="btn btn-danger" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '12px', fontSize: '0.8rem', height: '36px' }} 
              onClick={() => setShowAddBlModal(true)}
            >
              <Plus size={14} />
              <span>Manually Blacklist Person</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {flaggedVisitors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', background: 'rgba(34,197,94,0.03)', border: '1px dashed rgba(34,197,94,0.2)', borderRadius: '12px', color: 'var(--color-success)' }}>
              ✓ All Clear — No Pending Reviews
            </div>
          ) : (
            flaggedVisitors.map(v => (
              <div key={v.id} style={{
                background: 'var(--card-bg)',
                border: '1.5px solid rgba(239,68,68,0.2)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(239,68,68,0.05)'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                    {v.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-danger)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.fullName}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--color-text-secondary)' }}>{v.email || 'No email'} · {v.phone || 'No phone'}</div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(239,68,68,0.04)',
                  border: '1px solid rgba(239,68,68,0.1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  color: 'var(--color-danger)',
                  fontStyle: 'italic'
                }}>
                  "Reason: {v.flagReason}"
                </div>

                <div style={{
                  fontSize: '0.72rem',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  <div>🛡️ Flagged by: <strong>{v.flaggedByName}</strong></div>
                  <div>📅 Date: {v.flaggedAt ? new Date(v.flaggedAt).toLocaleString() : 'N/A'}</div>
                  <div>📊 History: {v.visitHistory.length} recorded visits</div>
                </div>

                {user.role === 'Admin' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid var(--card-border)', paddingTop: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px', fontSize: '0.75rem', justifyContent: 'center', color: 'var(--color-success)', borderColor: 'rgba(74,222,128,0.3)' }}
                      onClick={() => handleDismissBlacklist(v.id)}
                    >
                      Allow Entry
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}
                      onClick={() => handleConfirmBlacklist(v.id, v.fullName, v.flagReason)}
                    >
                      Ban / Blacklist
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} style={{ color: 'var(--color-danger)' }} />
            Banned List ({confirmedBlacklisted.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {confirmedBlacklisted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                No confirmed blacklisted visitors.
              </div>
            ) : (
              confirmedBlacklisted.map(v => (
                <div key={v.id} style={{
                  background: 'var(--card-bg)',
                  border: '1.5px solid var(--card-border)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  boxShadow: 'var(--card-shadow)'
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.fullName}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{v.company || 'Independent'}</div>
                  </div>
                  {user.role === 'Admin' && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.7rem', height: '28px', flexShrink: 0 }}
                      onClick={() => handleRemoveFromBlacklist(v.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMobileAnalyticsView = () => {
    if (!analytics) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
          Loading analytical metrics...
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Avg Dwell Time', val: `${analytics.avgVisitMinutes} min`, icon: Clock, desc: 'Lobby checked-out average' },
            { label: 'Today Volume', val: `${analytics.todaysVisitors} guests`, icon: Users, desc: 'Today\'s lobby registrations' },
            { label: 'Total Volume (30d)', val: `${analytics.total30d} entries`, icon: Users, desc: 'Rolling 30-day volume', color: 'var(--color-indigo-accent)' },
            { label: 'Repeat Guest Rate', val: `${analytics.repeatRate}%`, icon: UserCheck, desc: `${analytics.repeatVisitors} repeat guests (30d)` },
            { label: 'Banned Incidents (30d)', val: analytics.deniedEntries, icon: ShieldAlert, desc: `Today: ${analytics.deniedEntriesToday} denied`, color: 'var(--color-danger)' }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: 'var(--card-bg)',
              border: '1.5px solid var(--card-border)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div>
                <span style={{ fontSize: '0.73rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{item.label}</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: item.color || 'var(--color-text-primary)', marginTop: '2px' }}>{item.val}</div>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>{item.desc}</span>
              </div>
              <div style={{
                background: 'var(--card-bg-subtle)',
                padding: '8px',
                borderRadius: '8px',
                color: item.color || 'var(--color-indigo-accent)'
              }}>
                <item.icon size={18} />
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'var(--card-bg)',
          border: '1.5px solid var(--card-border)',
          borderRadius: '14px',
          padding: '14px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>Visitor Volume Trend (7 Days)</h4>
          <div style={{ width: '100%', height: '180px', fontSize: '0.7rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weeklyTrend} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="mobileColorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={8} />
                <YAxis stroke="#a1a1aa" fontSize={8} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--card-bg-solid)', borderColor: 'var(--card-border)', color: 'var(--color-text-primary)', fontSize: '0.75rem' }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#mobileColorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{
          background: 'var(--card-bg)',
          border: '1.5px solid var(--card-border)',
          borderRadius: '14px',
          padding: '14px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', alignSelf: 'flex-start' }}>Visits by Department (30d)</h4>
          <div style={{ width: '100%', height: '140px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.visitorsByDept}
                  dataKey="count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  fill="#8884d8"
                >
                  {analytics.visitorsByDept.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '0.7rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '6px', fontSize: '0.7rem' }}>
            {analytics.visitorsByDept.map((entry: any, index: number) => (
              <div key={entry.department} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <div style={{ width: '8px', height: '8px', background: COLORS[index % COLORS.length], borderRadius: '50%' }}></div>
                <span>{entry.department}: {entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMobileEmployeeScheduledView = () => {
    const todayStr = new Date().toDateString();
    const todayScheduledVisits = employeeVisits.filter((item: any) => {
      const schedDateStr = new Date(item.scheduledAt).toDateString();
      const isActive = ['Expected', 'Waiting', 'CheckedIn'].includes(item.status);
      return schedDateStr === todayStr && isActive;
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          background: 'var(--card-bg)',
          border: '1.5px solid var(--card-border)',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Today's Scheduled Visitors</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>Active visitor schedules for today.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {todayScheduledVisits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', fontSize: '0.82rem' }}>
              No visitors scheduled for today. Pre-register guest under "Invite Future Guest".
            </div>
          ) : (
            todayScheduledVisits.map((item: any) => (
              <div key={item.id} style={{
                background: 'var(--card-bg)',
                border: '1.5px solid var(--card-border)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Avatar name={item.visitorName} visitorType={item.visitorType} size="md" src={item.photoUrl || undefined} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.visitorName}
                      </div>
                      {item.additionalGuests > 0 && (
                        <Badge tone="warning" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>+{item.additionalGuests}</Badge>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      🏢 {item.visitorCompany || 'Independent'} · <span style={{ color: `var(--visitor-${item.visitorType?.toLowerCase()}-text)` }}>{item.visitorType}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--card-bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  <div>💬 <strong>Purpose:</strong> "{item.purpose}"</div>
                  <div>⏰ <strong>Arrival:</strong> {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  {item.visitorEmail && <div>✉️ <strong>Email:</strong> {item.visitorEmail}</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <StatusIndicator status={item.status} />
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {item.status === 'Waiting' && (
                      <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => setShowDenyModal(item.id)}>
                        Deny
                      </button>
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
                          style={{ padding: '4px 8px', fontSize: '0.75rem', height: '30px', width: '90px', background: 'var(--menu-item-bg)' }}
                        >
                          <option value="" disabled>⏳ Delay</option>
                          <option value="15">15 Min</option>
                          <option value="30">30 Min</option>
                          <option value="45">45 Min</option>
                          <option value="60">1 Hour</option>
                        </select>
                        <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => handleEmployeeCancelVisit(item.id)}>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderMobileEmployeePastView = () => {
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          background: 'var(--card-bg)',
          border: '1.5px solid var(--card-border)',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Past Hosted Visits</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>Historical visitor entries hosted by you.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pastHostedVisits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', fontSize: '0.82rem' }}>
              No past hosted visits found.
            </div>
          ) : (
            pastHostedVisits.map((item: any) => (
              <div key={item.id} style={{
                background: 'var(--card-bg)',
                border: '1.5px solid var(--card-border)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Avatar name={item.visitorName} visitorType={item.visitorType} size="md" src={item.photoUrl || undefined} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.visitorName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      🏢 {item.visitorCompany || 'Independent'} · <span style={{ color: `var(--visitor-${item.visitorType?.toLowerCase()}-text)` }}>{item.visitorType}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--card-bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  <div>💬 <strong>Purpose:</strong> "{item.purpose}"</div>
                  <div>📅 <strong>Date:</strong> {new Date(item.scheduledAt).toLocaleDateString()}</div>
                  {item.checkedInAt && <div>🟢 <strong>Checked In:</strong> {new Date(item.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                  {item.checkedOutAt && <div>🔴 <strong>Checked Out:</strong> {new Date(item.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                  {item.deniedReason && <div style={{ color: 'var(--color-danger)', marginTop: '2px' }}>⚠️ Denied Reason: {item.deniedReason}</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <StatusIndicator status={item.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderMobileEmployeeFutureView = () => {
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          background: 'var(--card-bg)',
          border: '1.5px solid var(--card-border)',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Upcoming Visitors</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>Future visits hosted by you.</p>
          </div>
          <Badge tone="indigo" style={{ fontSize: '0.75rem' }}>{futureVisits.length} total</Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {futureVisits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', fontSize: '0.82rem' }}>
              No upcoming visits scheduled. pre-register guests in the next tab.
            </div>
          ) : (
            futureVisits.map((item: any) => {
              const schedDate = new Date(item.scheduledAt);
              const daysFromNow = Math.ceil((schedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isThisWeek = daysFromNow <= 7;
              
              return (
                <div key={item.id} style={{
                  background: 'var(--card-bg)',
                  border: '1.5px solid var(--card-border)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: 'var(--card-shadow)'
                }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <Avatar name={item.visitorName} visitorType={item.visitorType} size="md" src={item.photoUrl || undefined} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.visitorName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        🏢 {item.visitorCompany || 'Independent'} · <span style={{ color: `var(--visitor-${item.visitorType?.toLowerCase()}-text)` }}>{item.visitorType}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--card-bg-subtle)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <div>💬 <strong>Purpose:</strong> "{item.purpose}"</div>
                    <div>📅 <strong>Date:</strong> {schedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    <div>⏰ <strong>Time:</strong> {schedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ color: daysFromNow === 1 ? 'var(--color-danger)' : isThisWeek ? 'var(--color-warning)' : 'var(--color-info)', fontWeight: 600, marginTop: '2px' }}>
                      {daysFromNow === 1 ? '• Tomorrow' : `• In ${daysFromNow} days`}
                    </div>
                  </div>

                  {item.remarks && (
                    <div style={{
                      background: 'rgba(99,102,241,0.05)',
                      border: '1px solid rgba(99,102,241,0.15)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '0.75rem',
                      color: 'var(--color-indigo-accent)'
                    }}>
                      <strong>Remark for Security:</strong> "{item.remarks}"
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '10px' }}>
                    <StatusIndicator status={item.status} />
                    <button
                      onClick={() => {
                        setShowRemarkModal(item);
                        setRemarkText(item.remarks || '');
                      }}
                      style={{
                        background: 'var(--btn-secondary-bg)',
                        border: '1px solid var(--btn-secondary-border)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit2 size={12} />
                      {item.remarks ? 'Edit Note' : 'Add Note'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderMobileEmployeeInviteView = () => {
    return (
      <div style={{
        background: 'var(--card-bg)',
        border: '1.5px solid var(--card-border)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: 'var(--card-shadow)'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Invite Expected Guest</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Pre-register visitor credentials for a future schedule.</p>
        
        <form onSubmit={handlePreRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Visitor Full Name *</label>
            <input type="text" className="form-input" required value={preName} onChange={e => setPreName(e.target.value)} placeholder="Jane Doe" style={{ height: '38px', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Company / Organization</label>
            <input type="text" className="form-input" value={preCompany} onChange={e => setPreCompany(e.target.value)} placeholder="Acme Corp" style={{ height: '38px', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Email Address</label>
            <input type="email" className="form-input" value={preEmail} onChange={e => setPreEmail(e.target.value)} placeholder="jane@doe.com" style={{ height: '38px', fontSize: '0.85rem' }} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Phone Number</label>
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
                return (
                  <span style={{ fontSize: '0.7rem', color: checkDigits.length !== limit ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    {checkDigits.length}/{limit} digits
                  </span>
                );
              })()}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select 
                className="form-input" 
                value={prePhoneCountryCode} 
                onChange={e => setPrePhoneCountryCode(e.target.value)} 
                style={{ width: '85px', background: 'var(--menu-item-bg)', padding: '6px', height: '38px', fontSize: '0.8rem' }}
              >
                <option value="+1">+1</option>
                <option value="+91">+91</option>
                <option value="+44">+44</option>
                <option value="+61">+61</option>
                <option value="+65">+65</option>
                <option value="+971">+971</option>
              </select>
              <input 
                type="text" 
                className="form-input" 
                value={prePhone} 
                onChange={e => setPrePhone(e.target.value)} 
                placeholder="(555) 0199" 
                style={{ flex: 1, height: '38px', fontSize: '0.85rem' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Origin Location</label>
            <input type="text" className="form-input" value={preLocation} onChange={e => setPreLocation(e.target.value)} placeholder="e.g. Bangalore" style={{ height: '38px', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Classification</label>
            <select className="form-input" value={preType} onChange={(e: any) => setPreType(e.target.value)} style={{ background: 'var(--menu-item-bg)', height: '38px', fontSize: '0.85rem' }}>
              <option value="Guest">Guest</option>
              <option value="Vendor">Vendor</option>
              <option value="Contractor">Contractor</option>
              <option value="Candidate">Candidate</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Scheduled Date &amp; Time *</label>
            <input type="datetime-local" className="form-input" required value={preScheduled} onChange={e => setPreScheduled(e.target.value)} min={getLocalISOString()} max={getMaxFutureISOString()} style={{ height: '38px', fontSize: '0.85rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Purpose of Visit *</label>
            <input type="text" className="form-input" required value={prePurpose} onChange={e => setPrePurpose(e.target.value)} placeholder="Quarterly sync" style={{ height: '38px', fontSize: '0.85rem' }} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: '40px', fontSize: '0.85rem', marginTop: '8px' }}>
            Send Invitation &amp; Register
          </button>
        </form>
      </div>
    );
  };

  const renderMobileView = () => {
    const menuItems = getMobileMenuItems();
    const currentItem = menuItems.find(item => item.view === currentView) || menuItems[0];
    
    return (
      <div 
        className="mobile-app-layout"
        onTouchStart={(e) => {
          if (!isMobile) return;
          const touch = e.touches[0];
          touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(e) => {
          if (!isMobile || !touchStartPosRef.current) return;
          const touch = e.changedTouches[0];
          const deltaX = touch.clientX - touchStartPosRef.current.x;
          const deltaY = touch.clientY - touchStartPosRef.current.y;
          const startX = touchStartPosRef.current.x;
          touchStartPosRef.current = null;

          const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
          if (['input', 'textarea', 'select'].includes(targetTag)) return;

          // Swipe right from left portion of screen to trigger Go Back
          if (deltaX > 70 && Math.abs(deltaY) < 70 && startX < window.innerWidth * 0.5) {
            handleMobileGoBack();
          }
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          background: 'var(--bg-gradient)',
          color: 'var(--color-text-primary)'
        }}
      >
        {showSwipeBackIndicator && (
          <div style={{
            position: 'fixed',
            top: '70px',
            left: '16px',
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <span>◀</span> Going Back
          </div>
        )}
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>

        {/* Mobile Top Header */}
        <header style={{
          height: '60px',
          borderBottom: '1px solid var(--card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 16px',
          background: 'var(--card-bg)',
          backdropFilter: 'var(--backdrop-blur)',
          zIndex: 100,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/123.png" 
              alt="VMS Mobile Logo" 
              style={{ 
                height: '32px', 
                width: 'auto', 
                objectFit: 'contain',
                borderRadius: '6px'
              }} 
            />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>VMS Gateway</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: 'var(--btn-secondary-bg)',
                border: '1px solid var(--btn-secondary-border)',
                borderRadius: '8px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-text-primary)'
              }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <span style={{ fontSize: '0.75rem', background: 'var(--card-bg-subtle)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-glass)', color: 'var(--color-indigo-accent)', fontWeight: 600 }}>
              {user.branchName}
            </span>
          </div>
        </header>

        {/* Main View Area */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          paddingBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--card-bg)',
                border: '1.5px solid var(--card-border)',
                borderRadius: '12px',
                color: 'var(--color-text-primary)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: 'var(--card-shadow)',
                backdropFilter: 'var(--backdrop-blur)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--indigo-primary)', display: 'flex' }}>
                  {getViewIcon(currentView)}
                </span>
                <span>{currentItem?.label || "Select View"}</span>
              </div>
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>▼</span>
            </button>
          </div>

          {currentView === 'queue' && renderMobileQueueView()}
          {currentView === 'security_arrivals' && renderMobileSecurityArrivalsView()}
          {currentView === 'check_invite' && renderMobileCheckInviteView()}
          {currentView === 'security_history' && renderMobileSecurityHistoryView()}
          {currentView === 'employees' && renderMobileEmployeesView()}
          {currentView === 'blacklist_review' && renderMobileBlacklistReviewView()}
          {currentView === 'analytics' && renderMobileAnalyticsView()}
          {currentView === 'employee_scheduled' && renderMobileEmployeeScheduledView()}
          {currentView === 'employee_past' && renderMobileEmployeePastView()}
          {currentView === 'employee_future' && renderMobileEmployeeFutureView()}
          {currentView === 'employee_invite' && renderMobileEmployeeInviteView()}

        </main>

        {/* Sticky Mobile Footer */}
        <footer style={{
          height: '64px',
          borderTop: '1px solid var(--card-border)',
          background: 'var(--card-bg)',
          backdropFilter: 'var(--backdrop-blur)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Avatar name={user.fullName} size="sm" online={true} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{user.fullName}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{user.role}</div>
            </div>
          </div>
          <Button variant="danger" style={{ padding: '8px 12px', fontSize: '0.8rem', height: '36px' }} onClick={() => setShowLogoutConfirmModal(true)} leftIcon={<LogOut size={12} />}>
            Logout
          </Button>
        </footer>

        {/* Bottom Sheet Drawer */}
        {isMobileMenuOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            animation: 'fadeIn 0.2s ease-out'
          }} onClick={() => setIsMobileMenuOpen(false)}>
            <div style={{
              width: '100%',
              background: 'var(--card-bg-solid)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '20px 16px',
              boxShadow: '0 -10px 25px rgba(0,0,0,0.15)',
              maxHeight: '80vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }} onClick={e => e.stopPropagation()}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--card-border)',
                paddingBottom: '12px'
              }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>Select Dashboard View</span>
                <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {menuItems.map(item => {
                  const isActive = item.view === currentView;
                  return (
                    <button
                      key={item.view}
                      onClick={() => {
                        navigateMobileView(item.view);
                        setIsMobileMenuOpen(false);
                        if (item.view === 'employee_scheduled' || item.view === 'employee_past' || item.view === 'employee_future') {
                          fetchEmployeeVisits();
                        }
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: isActive ? '1px solid var(--active-features-border)' : '1px solid transparent',
                        background: isActive ? 'var(--active-features-bg)' : 'transparent',
                        color: isActive ? 'var(--active-features-text)' : 'var(--color-text-primary)',
                        textAlign: 'left',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'flex', color: isActive ? 'inherit' : 'var(--indigo-primary)' }}>
                        {getViewIcon(item.view)}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={isMobile ? "mobile-app-layout" : "app-layout"}
      style={isMobile ? { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' } : undefined}
    >
      {isMobile ? (
        renderMobileView()
      ) : (
        <>
          {/* Sidebar Navigation */}
          <nav className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid var(--card-border)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #c84e3c, #e05a47)',
            borderRadius: '12px',
            padding: '8px',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(224, 90, 71, 0.3)'
          }}>
            <Building size={20} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>VMS Gateway</span>
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
                                <Avatar name={item.visitorName} visitorType={item.visitorType} size="md" src={item.photoUrl || undefined} />
                                <div>
                                  <div style={{ fontWeight: 600 }}>{item.visitorName}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{item.visitorCompany || 'Independent'}</span>
                                    <span style={{ opacity: 0.4 }}>•</span>
                                    <span style={{ color: `var(--visitor-${item.visitorType?.toLowerCase()}-text)`, fontWeight: 600 }}>{item.visitorType}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {item.additionalGuests > 0 ? (
                                  <Badge tone="warning">
                                    +{item.additionalGuests} Guests
                                  </Badge>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>No guests</span>
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
                              <StatusIndicator status={item.status} />
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                                {item.isBlacklisted ? (
                                  <Badge tone="danger">⚠️ BLACKLISTED</Badge>
                                ) : (
                                  <>
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
                                        <Button variant="primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => triggerCheckIn(item.id)} leftIcon={<CheckCircle size={12} />}>
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
                                    <Avatar name={item.visitorName} visitorType={item.visitorType} size="md" src={item.photoUrl || undefined} />
                                    <div>
                                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{item.visitorName}</span>
                                        {isBl && <Badge tone="danger">⚠️ BLACKLISTED</Badge>}
                                        {isFlagged && <Badge tone="warning">⚠️ PENDING REVIEW</Badge>}
                                      </div>
                                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>{item.visitorEmail || 'No email provided'}</span>
                                        <span style={{ opacity: 0.4 }}>•</span>
                                        <span style={{ color: `var(--visitor-${item.visitorType?.toLowerCase()}-text)`, fontWeight: 600 }}>{item.visitorType}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                                    {item.visitorCompany || 'Independent'}
                                  </span>
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
                                  <StatusIndicator status={item.status} />
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
                                  <Avatar name={item.visitorName} visitorType={item.visitorType} size="md" src={item.photoUrl || undefined} />
                                  
                                  {/* Details */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{item.visitorName}</span>
                                      {item.isBlacklisted && <Badge tone="danger">⚠️ BLACKLISTED</Badge>}
                                      
                                      {item.additionalGuests > 0 && (
                                        <Badge tone="warning">
                                          +{item.additionalGuests} Guests
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {/* Company Info & Visitor Type under name */}
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                      <span>🏢 {item.visitorCompany || 'Independent'}</span>
                                      <span style={{ opacity: 0.4 }}>•</span>
                                      <span style={{ color: `var(--visitor-${item.visitorType?.toLowerCase()}-text)`, fontWeight: 600 }}>{item.visitorType}</span>
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
                                    borderLeft: '3px solid var(--indigo-primary)'
                                  }}>
                                    "{item.purpose}"
                                  </div>
                                  {item.badgeNumber && item.badgeNumber !== 'N/A' && (
                                    <div style={{ alignSelf: 'flex-start' }}>
                                      <CredentialBadge label="Badge" value={item.badgeNumber} />
                                    </div>
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
                                <StatusIndicator status={item.status} />
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
                                  <Avatar name={item.visitorName} visitorType={item.visitorType} size="md" src={item.photoUrl || undefined} />
                                  
                                  {/* Details */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{item.visitorName}</span>
                                      
                                      {item.additionalGuests > 0 && (
                                        <Badge tone="warning">
                                          +{item.additionalGuests} Guests
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {/* Company Info & Visitor Type under name */}
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                      <span>🏢 {item.visitorCompany || 'Independent'}</span>
                                      <span style={{ opacity: 0.4 }}>•</span>
                                      <span style={{ color: `var(--visitor-${item.visitorType?.toLowerCase()}-text)`, fontWeight: 600 }}>{item.visitorType}</span>
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
                                <StatusIndicator status={item.status} />
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
                                  <Avatar name={item.visitorName} visitorType={item.visitorType} size="md" src={item.photoUrl || undefined} />
                                  
                                  {/* Details */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{item.visitorName}</span>
                                      
                                      {item.additionalGuests > 0 && (
                                        <Badge tone="warning">
                                          +{item.additionalGuests} Guests
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {/* Company Info & Visitor Type under name */}
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                      <span>🏢 {item.visitorCompany || 'Independent'}</span>
                                      <span style={{ opacity: 0.4 }}>•</span>
                                      <span style={{ color: `var(--visitor-${item.visitorType?.toLowerCase()}-text)`, fontWeight: 600 }}>{item.visitorType}</span>
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
                                <StatusIndicator status={item.status} />
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
                        <Calendar size={20} style={{ color: 'var(--indigo-primary)' }} />
                        Upcoming Scheduled Visitors
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Future visits where you are the host. Read-only — add a remark to help security prepare.</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--indigo-primary)', fontWeight: 600, background: 'rgba(200, 78, 60, 0.08)', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(200, 78, 60, 0.2)' }}>
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
                                <Avatar name={item.visitorName} visitorType={item.visitorType} size="lg" src={item.photoUrl || undefined} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                                    {item.visitorName}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span>🏢 {item.visitorCompany || 'Independent'}</span>
                                    <span style={{ opacity: 0.4 }}>•</span>
                                    <span style={{ color: `var(--visitor-${item.visitorType?.toLowerCase()}-text)`, fontWeight: 600 }}>{item.visitorType}</span>
                                    {item.visitorEmail && (
                                      <>
                                        <span style={{ opacity: 0.4 }}>•</span>
                                        <span>✉ {item.visitorEmail}</span>
                                      </>
                                    )}
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
                                <StatusIndicator status={item.status} />

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
                    <span style={{ color: 'var(--indigo-primary)', display: 'flex' }}><User size={18} /></span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Visitor credentials</span>
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
                    <span style={{ color: 'var(--indigo-primary)', display: 'flex' }}><History size={18} /></span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Visit details</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Visitor Classification</label>
                      <select className="form-input" value={preType} onChange={(e: any) => setPreType(e.target.value)} style={{ background: 'var(--menu-item-bg)', width: '100%', height: '42px', fontSize: '0.9rem' }}>
                        <option value="Guest">Guest</option>
                        <option value="Vendor">Vendor</option>
                        <option value="Contractor">Contractor</option>
                        <option value="Candidate">Candidate</option>
                        <option value="VIP">VIP</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Scheduled Date &amp; Time *</label>
                      <input type="datetime-local" className="form-input" required value={preScheduled} onChange={e => setPreScheduled(e.target.value)} min={getLocalISOString()} max={getMaxFutureISOString()} style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} />
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
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {user.role === 'Admin' && (
                    <button className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowAddBlModal(true)}>
                      <Plus size={16} />
                      <span>Manually Blacklist Person</span>
                    </button>
                  )}
                  {flaggedVisitors.length > 0 && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '8px 18px', color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.88rem' }}>
                      ⚠️ {flaggedVisitors.length} Pending Review{flaggedVisitors.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
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
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: '6px' }}>🛡 Flagged by</div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{v.flaggedByName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                            {v.flaggedAt ? new Date(v.flaggedAt).toLocaleString() : 'Date unknown'}
                          </div>
                        </div>

                        {/* Visit History */}
                        <div style={{ padding: '16px 24px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: '6px' }}>📋 Visit history</div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{v.visitHistory.length} recorded visit{v.visitHistory.length !== 1 ? 's' : ''}</div>
                          {v.visitHistory.length > 0 && (
                            <div style={{ fontSize: '0.73rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                              Last: {new Date(v.visitHistory[0].scheduledAt || v.visitHistory[0].createdAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Visitor Type */}
                        <div style={{ padding: '16px 24px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: '6px' }}>🏷 Visitor type</div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{v.visitorType || 'Guest'}</div>
                        </div>
                      </div>

                      {/* Flag Reason */}
                      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: '8px' }}>⚠️ Security flag reason</div>
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

              {/* Confirmed Blacklist Section */}
              <div style={{ marginTop: '48px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={22} style={{ color: 'var(--color-danger)' }} />
                  Confirmed Blacklisted Visitors
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  {confirmedBlacklisted.length > 0
                    ? `${confirmedBlacklisted.length} visitor${confirmedBlacklisted.length > 1 ? 's' : ''} currently banned from entering the premises`
                    : 'No confirmed blacklisted visitors'}
                </p>
              </div>

              {confirmedBlacklisted.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '16px' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>No visitors currently confirmed on the blacklist.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {confirmedBlacklisted.map((v: any) => (
                    <div key={v.id} style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
                    }}>
                      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--color-danger)', flexShrink: 0 }}>
                          {v.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--color-text-primary)' }}>{v.fullName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            {v.email && <span>{v.email}</span>}
                            {v.email && v.phone && <span style={{ margin: '0 8px', color: 'var(--color-text-secondary)' }}>|</span>}
                            {v.phone && <span>{v.phone}</span>}
                            {v.company && <span style={{ marginLeft: '8px', color: 'var(--color-text-secondary)' }}>· {v.company}</span>}
                          </div>
                        </div>
                        {user.role === 'Admin' && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '0.8rem', borderColor: 'var(--color-text-secondary)', color: 'var(--color-text-primary)' }}
                            onClick={() => handleRemoveFromBlacklist(v.id)}
                          >
                            Remove from Blacklist
                          </button>
                        )}
                      </div>
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
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Avatar name={item.visitorName} visitorType={item.visitorType} size="md" src={item.photoUrl || undefined} />
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.visitorName}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>🏢 {item.visitorCompany || 'Independent'}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ color: `var(--visitor-${item.visitorType?.toLowerCase()}-text)`, fontWeight: 600, fontSize: '0.85rem' }}>
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
                              <StatusIndicator status={item.status} />
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {item.isBlacklisted ? (
                                <span className="badge badge-danger" style={{ background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>⚠️ BLACKLISTED</span>
                              ) : (
                                <>
                                  {item.status === 'Waiting' && user.role === 'Receptionist' && (
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                      <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => triggerCheckIn(item.id)}>
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
                                </>
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
                  {user.role === 'Admin' && (
                    <button className="btn btn-primary" onClick={() => setShowAddEmpModal(true)}>
                      <Plus size={16} />
                      <span>Add Employee</span>
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
                        {user.role === 'Admin' && <th style={{ textAlign: 'right' }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={user.role === 'Admin' ? 7 : 6} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-secondary)' }}>
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
                            {user.role === 'Admin' && (
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                    onClick={() => startEditEmployee(e)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                    onClick={() => handleRemoveEmployee(e.id, e.fullName)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            )}
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
      </>
      )}

      {/* MODAL: Pre-Register Guest */}
      {showPreRegModal && (
        <div className="modal-overlay" style={{ padding: isMobile ? '12px' : '0', overflowY: 'auto', zIndex: 1100 }}>
          <div className="modal-content" style={{ 
            maxWidth: '850px', 
            width: isMobile ? '100%' : '90%', 
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            borderRadius: '12px',
            padding: isMobile ? '20px 16px' : '36px',
            maxHeight: isMobile ? '85vh' : '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--card-border)', paddingBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {user?.role === 'Security' ? 'Register Walk-in Visitor' : 'Pre-Register Expected Guest'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
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
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePreRegister}>
              {/* SECTION 1: VISITOR INFO */}
              <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--indigo-primary)', display: 'flex' }}><User size={18} /></span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Visitor credentials</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '12px' : '24px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Visitor Full Name *</label>
                  <input type="text" className="form-input" required value={preName} onChange={e => setPreName(e.target.value)} placeholder="Jane Doe" style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Company / Organization</label>
                  <input type="text" className="form-input" value={preCompany} onChange={e => setPreCompany(e.target.value)} placeholder="Acme Corp" style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '12px' : '24px', marginBottom: '20px' }}>
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
                <span style={{ color: 'var(--indigo-primary)', display: 'flex' }}><History size={18} /></span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Visit details</span>
              </div>
 
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '12px' : '24px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Visitor Classification</label>
                  <select className="form-input" value={preType} onChange={(e: any) => setPreType(e.target.value)} style={{ background: 'var(--menu-item-bg)', width: '100%', height: '42px', fontSize: '0.9rem' }}>
                    <option value="Guest">Guest</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Candidate">Candidate</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Scheduled Date &amp; Time *</label>
                  <input type="datetime-local" className="form-input" required value={preScheduled} onChange={e => setPreScheduled(e.target.value)} min={getLocalISOString()} max={getMaxFutureISOString()} style={{ width: '100%', height: '42px', fontSize: '0.9rem' }} />
                </div>
              </div>
 
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? '12px' : '24px', marginBottom: '32px' }}>
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
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 36px', fontSize: '0.9rem', background: 'linear-gradient(135deg, var(--indigo-primary), var(--indigo-secondary))', border: 'none', color: '#fff' }}>
                  {user?.role === 'Security' ? 'Register Walk-in' : 'Pre-Register Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Check-In Photo Capture (Security only) */}
      {showCheckInPhotoModal && (() => {
        const activeVisit = queue.find(v => v.id === showCheckInPhotoModal);
        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ 
              maxWidth: '500px', 
              width: '90%', 
              background: 'var(--card-bg)', border: '1px solid var(--card-border)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              borderRadius: '12px',
              padding: '36px',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Visitor Photo Capture
                </h3>
                <button 
                  style={{ 
                    background: 'none', border: 'none', 
                    color: 'var(--color-text-secondary)', 
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }} 
                  onClick={() => {
                    stopCamera();
                    setShowCheckInPhotoModal(null);
                    setCapturedPhoto(null);
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                Please capture a photo of the visitor to proceed with check-in.
              </p>

              {/* Video / Captured Image Container */}
              <div style={{ position: 'relative', width: '280px', height: '280px', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--card-border)', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                {isCameraActive ? (
                  <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay playsInline muted />
                ) : capturedPhoto ? (
                  <img src={capturedPhoto} alt="Captured Visitor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: 'var(--color-text-secondary)' }}>
                    <User size={64} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <span style={{ fontSize: '0.8rem', display: 'block' }}>Camera Off</span>
                  </div>
                )}
              </div>

              {/* Camera Control Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
                {!isCameraActive && !capturedPhoto && (
                  <button type="button" className="btn btn-primary" onClick={() => startCamera()} style={{ fontSize: '0.9rem', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Camera size={16} /> Start Camera
                  </button>
                )}
                {isCameraActive && (
                  <>
                    <button type="button" className="btn btn-success" onClick={capturePhoto} style={{ fontSize: '0.9rem', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, var(--indigo-primary), var(--indigo-secondary))', border: 'none', color: '#fff' }}>
                      <Camera size={16} /> Capture Photo
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={toggleCameraFacingMode} style={{ fontSize: '0.85rem', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RefreshCw size={14} /> Flip ({facingMode === 'user' ? 'Front' : 'Back'})
                    </button>
                  </>
                )}
                {(isCameraActive || capturedPhoto) && (
                  <button type="button" className="btn btn-secondary" onClick={() => { stopCamera(); setCapturedPhoto(null); }} style={{ fontSize: '0.9rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <X size={16} /> Clear
                  </button>
                )}
              </div>

              {/* If visitor details are missing, show inputs to complete them */}
              {activeVisit && (!activeVisit.visitorEmail || !activeVisit.visitorPhone) && (
                <div style={{ textAlign: 'left', marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--card-border)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={14} style={{ color: '#f59e0b' }} /> Complete Missing Visitor Details
                  </div>
                  
                  {!activeVisit.visitorEmail && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Email Address *</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        value={completeEmail} 
                        onChange={e => setCompleteEmail(e.target.value)} 
                        placeholder="visitor@example.com" 
                        style={{ width: '100%', height: '38px', fontSize: '0.85rem' }} 
                      />
                    </div>
                  )}

                  {!activeVisit.visitorPhone && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Phone Number *</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select 
                          className="form-input" 
                          value={completePhoneCountryCode} 
                          onChange={e => setCompletePhoneCountryCode(e.target.value)} 
                          style={{ width: '90px', background: 'var(--menu-item-bg)', padding: '6px', height: '38px', fontSize: '0.85rem' }}
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
                          value={completePhone} 
                          onChange={e => setCompletePhone(e.target.value)} 
                          placeholder="(555) 0199" 
                          style={{ flex: 1, height: '38px', fontSize: '0.85rem' }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--card-border)', paddingTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    stopCamera();
                    setShowCheckInPhotoModal(null);
                    setCapturedPhoto(null);
                  }}
                  style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  disabled={!capturedPhoto}
                  onClick={async () => {
                    if (!showCheckInPhotoModal || !capturedPhoto) return;

                    let emailToSave = null;
                    let phoneToSave = null;

                    if (activeVisit) {
                      // Validate missing email
                      if (!activeVisit.visitorEmail) {
                        const trimmedEmail = completeEmail.trim();
                        if (!trimmedEmail) {
                          setAlertMessage({ type: 'error', text: 'Email is required to complete check-in.' });
                          return;
                        }
                        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                        if (!emailRegex.test(trimmedEmail)) {
                          setAlertMessage({ type: 'error', text: 'Please enter a valid email address.' });
                          return;
                        }
                        emailToSave = trimmedEmail;
                      }

                      // Validate missing phone
                      if (!activeVisit.visitorPhone) {
                        const trimmedPhone = completePhone.trim();
                        if (!trimmedPhone) {
                          setAlertMessage({ type: 'error', text: 'Phone number is required to complete check-in.' });
                          return;
                        }
                        
                        let finalPhone = '';
                        if (trimmedPhone.startsWith('+')) {
                          finalPhone = trimmedPhone;
                        } else {
                          finalPhone = `${completePhoneCountryCode} ${trimmedPhone}`;
                        }

                        const phoneRegex = /^\+[1-9][0-9\s\-()]{6,19}$/;
                        if (!phoneRegex.test(finalPhone)) {
                          setAlertMessage({ type: 'error', text: 'Please enter a valid phone number. If entering a country code prefix manually, start it with "+".' });
                          return;
                        }

                        // Enforce country-specific phone digit limits
                        let activePrefix = completePhoneCountryCode;
                        let checkDigits = trimmedPhone.replace(/\D/g, '');
                        if (trimmedPhone.startsWith('+')) {
                          const matchedPrefix = ['+971', '+353', '+880', '+977', '+234', '+254', '+233', '+852', '+886', '+358', '+966']
                            .find(p => trimmedPhone.startsWith(p)) || trimmedPhone.substring(0, 3);
                          activePrefix = matchedPrefix;
                          checkDigits = trimmedPhone.replace(activePrefix, '').replace(/\D/g, '');
                        }
                        const limit = getPhoneLimit(activePrefix);
                        if (checkDigits.length !== limit) {
                          setAlertMessage({ 
                            type: 'error', 
                            text: `Phone number must be exactly ${limit} digits for ${activePrefix}. Currently it has ${checkDigits.length} digits.` 
                          });
                          return;
                        }
                        phoneToSave = finalPhone;
                      }
                    }

                    const vid = showCheckInPhotoModal;
                    setShowCheckInPhotoModal(null);
                    await handleApproveCheckIn(vid, capturedPhoto, emailToSave, phoneToSave);
                    setCapturedPhoto(null);
                  }}
                  style={{ 
                    padding: '10px 24px', 
                    fontSize: '0.9rem', 
                    background: capturedPhoto ? 'linear-gradient(135deg, var(--indigo-primary), var(--indigo-secondary))' : 'var(--card-border)', 
                    cursor: capturedPhoto ? 'pointer' : 'not-allowed',
                    opacity: capturedPhoto ? 1 : 0.6
                  }}
                >
                  Complete Check-In
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Arrival Visitor Photo (Mobile Only) */}
      {showArrivalPhotoModal && (() => {
        const activeVisit = queue.find(item => item.id === showArrivalPhotoModal) || 
                            futureInvitations.find(item => item.id === showArrivalPhotoModal);
        const visitorName = activeVisit?.visitorName || 'Visitor';

        return (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content" style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={20} style={{ color: 'var(--color-indigo-accent)' }} />
                  Capture Visitor Arrival Photo
                </h3>
                <button 
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                  onClick={() => {
                    stopCamera();
                    setShowArrivalPhotoModal(null);
                    setCapturedPhoto(null);
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                Please take a photo of <strong style={{ color: 'var(--color-text-primary)' }}>{visitorName}</strong> at arrival. This photo will be attached to the instant notification sent to the host.
              </p>

              {/* Video / Captured Image Container */}
              <div style={{ position: 'relative', width: '260px', height: '260px', borderRadius: '14px', overflow: 'hidden', border: '2px solid var(--card-border)', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                {isCameraActive ? (
                  <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay playsInline muted />
                ) : capturedPhoto ? (
                  <img src={capturedPhoto} alt="Captured Visitor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: 'var(--color-text-secondary)' }}>
                    <User size={64} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <span style={{ fontSize: '0.8rem', display: 'block' }}>Camera Off</span>
                  </div>
                )}
              </div>

              {/* Camera Control Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                {!isCameraActive && !capturedPhoto && (
                  <button type="button" className="btn btn-primary" onClick={() => startCamera()} style={{ fontSize: '0.9rem', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Camera size={16} /> Start Camera
                  </button>
                )}
                {isCameraActive && (
                  <>
                    <button type="button" className="btn btn-success" onClick={capturePhoto} style={{ fontSize: '0.9rem', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, var(--indigo-primary), var(--indigo-secondary))', border: 'none', color: '#fff' }}>
                      <Camera size={16} /> Capture Photo
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={toggleCameraFacingMode} style={{ fontSize: '0.85rem', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RefreshCw size={14} /> Flip ({facingMode === 'user' ? 'Front' : 'Back'})
                    </button>
                  </>
                )}
                {(isCameraActive || capturedPhoto) && (
                  <button type="button" className="btn btn-secondary" onClick={() => { stopCamera(); setCapturedPhoto(null); }} style={{ fontSize: '0.9rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <X size={16} /> Clear
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    stopCamera();
                    setShowArrivalPhotoModal(null);
                    setCapturedPhoto(null);
                  }}
                  style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  disabled={!capturedPhoto}
                  onClick={async () => {
                    if (!showArrivalPhotoModal || !capturedPhoto) return;
                    const vid = showArrivalPhotoModal;
                    
                    try {
                      // 1. Get visitorId for this visit
                      if (activeVisit?.visitorId) {
                        await supabase
                          .from('Visitor')
                          .update({ photoUrl: capturedPhoto })
                          .eq('id', activeVisit.visitorId);
                      }

                      // 2. Mark visitor as arrived ('Waiting')
                      await handleSecurityMarkArrived(vid);

                      setAlertMessage({ type: 'success', text: '✅ Arrival photo captured and sent to host notification!' });
                    } catch (err: any) {
                      setAlertMessage({ type: 'error', text: err.message || 'Failed to update arrival photo' });
                    } finally {
                      stopCamera();
                      setCapturedPhoto(null);
                      setShowArrivalPhotoModal(null);
                    }
                  }}
                  style={{ 
                    padding: '10px 24px', 
                    fontSize: '0.9rem', 
                    background: capturedPhoto ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--card-border)', 
                    cursor: capturedPhoto ? 'pointer' : 'not-allowed',
                    opacity: capturedPhoto ? 1 : 0.6
                  }}
                >
                  Confirm Arrival &amp; Notify Host
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* MODAL: Mobile Logout Confirmation */}
      {showLogoutConfirmModal && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ maxWidth: '380px', width: '90%', textAlign: 'center', padding: '24px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <LogOut size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Confirm Log Out
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: '1.4' }}>
              Are you sure you want to log out of your session? You will need to sign in again to access your dashboard.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowLogoutConfirmModal(false)}
                style={{ padding: '10px', fontSize: '0.85rem', justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setShowLogoutConfirmModal(false);
                  handleLogout();
                }}
                style={{ padding: '10px', fontSize: '0.85rem', justifyContent: 'center' }}
              >
                Yes, Log Out
              </button>
            </div>
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

      {/* MODAL: Edit Host Employee */}
      {showEditEmpModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Edit Employee Profile</h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }} onClick={() => setShowEditEmpModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditEmployee}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Host Full Name *</label>
                <input type="text" className="form-input" required value={editEmpName} onChange={e => setEditEmpName(e.target.value)} placeholder="Tanya Verma" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Email Address *</label>
                  <input type="email" className="form-input" required value={editEmpEmail} onChange={e => setEditEmpEmail(e.target.value)} placeholder="tanya@company.com" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Phone Number *</label>
                  <input type="text" className="form-input" required value={editEmpPhone} onChange={e => setEditEmpPhone(e.target.value)} placeholder="+1 (555) 0123" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Department *</label>
                  <select className="form-input" required value={editEmpDeptId} onChange={e => setEditEmpDeptId(e.target.value)} style={{ background: 'var(--menu-item-bg)' }}>
                    <option value="">-- Select Dept --</option>
                    {depts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Desk Location Floor</label>
                  <input type="text" className="form-input" value={editEmpFloor} onChange={e => setEditEmpFloor(e.target.value)} placeholder="Floor 3" />
                </div>
              </div>
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="editEmpActiveCheckbox"
                  checked={editEmpActive}
                  onChange={e => setEditEmpActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="editEmpActiveCheckbox" style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', cursor: 'pointer', userSelect: 'none' }}>
                  Profile Active (Available as Host)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditEmpModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
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
              @page {
                margin: 0;
              }

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
                margin: 1.5cm !important;
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
              <div style={{ display: 'flex', gap: '24px', marginBottom: '22px' }}>
                {/* Left Side: Photo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                  {showPassModal.photoUrl ? (
                    <img 
                      src={showPassModal.photoUrl} 
                      alt="Visitor" 
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        objectFit: 'cover', 
                        borderRadius: '8px', 
                        border: '2px solid #e5e7eb',
                        backgroundColor: '#f3f4f6'
                      }} 
                    />
                  ) : (
                    <div style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '8px', 
                      border: '2px dashed #d1d5db', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#9ca3af',
                      backgroundColor: '#f9fafb'
                    }}>
                      <User size={32} style={{ color: '#9ca3af' }} />
                      <span style={{ fontSize: '0.65rem', marginTop: '4px', color: '#9ca3af', fontWeight: 600 }}>No Photo</span>
                    </div>
                  )}
                </div>

                {/* Right Side: Visitor & Host Information */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
          width: isMobile ? '100%' : '420px', 
          background: 'var(--card-bg-solid)', 
          borderLeft: isMobile ? 'none' : '1px solid var(--card-border)', 
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
              <Avatar name={selectedInviteDetails.visitorName} size="md" src={selectedInviteDetails.photoUrl || undefined} />
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
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: '5px' }}>{row.label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: (row as any).color || 'var(--color-text-primary)' }}>{row.value}</div>
                  </div>
                ))}
                <div style={{ background: 'var(--card-bg-subtle)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: '5px' }}>Scheduled at</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-warning)' }}>{new Date(selectedInviteDetails.scheduledAt).toLocaleString()}</div>
                  {new Date(selectedInviteDetails.scheduledAt).toDateString() === new Date().toDateString()
                    ? <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', marginTop: '4px', fontWeight: 600 }}>• Today's Visit</div>
                    : <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: '4px', fontWeight: 600 }}>• Future Visit</div>
                  }
                </div>
                <div style={{ background: 'var(--card-bg-subtle)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: '5px' }}>Status</div>
                  <StatusIndicator status={selectedInviteDetails.status} />
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
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: '5px' }}>Department</div>
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
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-indigo-accent)' }}>Host's remark for security</span>
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

      {/* App-Themed Card Notification Modal (Matching correct.jpeg specification) */}
      {alertMessage && (
        <div style={{
          position: 'fixed',
          top: isMobile ? '20px' : '24px',
          right: isMobile ? '5%' : '24px',
          left: isMobile ? '5%' : 'auto',
          zIndex: 999999,
          maxWidth: isMobile ? '90%' : '420px',
          width: '100%',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          background: 'var(--card-bg, #18181b)',
          borderRadius: '18px',
          border: alertMessage.type === 'success' 
            ? '1.5px solid rgba(16, 185, 129, 0.4)' 
            : alertMessage.type === 'warning'
            ? '1.5px solid rgba(245, 158, 11, 0.4)'
            : '1.5px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 20px 30px -5px rgba(0, 0, 0, 0.5), 0 10px 15px -5px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(12px)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: alertMessage.type === 'success' 
                ? 'rgba(16, 185, 129, 0.15)' 
                : alertMessage.type === 'warning'
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
              border: alertMessage.type === 'success' 
                ? '1px solid rgba(16, 185, 129, 0.3)' 
                : alertMessage.type === 'warning'
                ? '1px solid rgba(245, 158, 11, 0.3)'
                : '1px solid rgba(239, 68, 68, 0.3)',
              color: alertMessage.type === 'success' 
                ? 'var(--color-success, #10b981)' 
                : alertMessage.type === 'warning'
                ? 'var(--color-warning, #f59e0b)'
                : 'var(--color-danger, #ef4444)',
              borderRadius: '50%',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {alertMessage.type === 'success' ? (
                <CheckCircle size={22} />
              ) : alertMessage.type === 'warning' ? (
                <Clock size={22} />
              ) : (
                <ShieldAlert size={22} className="pulse-slow" />
              )}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--color-text-primary, #ffffff)' }}>
                {alertMessage.title || (
                  alertMessage.type === 'success' 
                    ? 'Operation Successful' 
                    : alertMessage.type === 'warning'
                    ? 'System Advisory'
                    : 'Security Alert'
                )}
              </h4>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 600,
                color: alertMessage.type === 'success' 
                  ? 'var(--color-success, #10b981)' 
                  : alertMessage.type === 'warning'
                  ? 'var(--color-warning, #f59e0b)'
                  : 'var(--color-danger, #ef4444)'
              }}>
                {alertMessage.type === 'success' 
                  ? 'System Notification' 
                  : alertMessage.type === 'warning'
                  ? 'Gate Control Warning'
                  : 'Action Restricted'}
              </span>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-primary, #e4e4e7)', lineHeight: '1.5' }}>
            {alertMessage.text}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button 
              onClick={() => setAlertMessage(null)}
              className="btn btn-secondary"
              style={{
                padding: '6px 16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--color-text-primary, #ffffff)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              Dismiss
            </button>
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
              {realtimeNotification.photoUrl && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', margin: '4px 0 8px' }}>
                  <div 
                    onClick={() => setShowFullscreenVisitorPhoto(realtimeNotification.photoUrl || null)}
                    style={{ position: 'relative', cursor: 'pointer' }}
                    title="Tap to view fullscreen photo"
                  >
                    <img 
                      src={realtimeNotification.photoUrl} 
                      alt={realtimeNotification.visitorName}
                      style={{
                        width: '130px',
                        height: '130px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        border: '2.5px solid var(--color-indigo-accent)',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.25)'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      background: 'rgba(0,0,0,0.75)',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)'
                    }}>
                      🔍 Tap Fullscreen
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowFullscreenVisitorPhoto(realtimeNotification.photoUrl || null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-indigo-accent)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      marginTop: '2px'
                    }}
                  >
                    View Fullscreen Visitor Photo 🔍
                  </button>
                </div>
              )}
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
          ) : (realtimeNotification as any).type === 'blacklisted_arrival' ? (
            <>
              {/* Type: Blacklisted Visitor Arrived (Host Notification) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--color-danger)',
                  borderRadius: '50%',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldAlert size={20} className="pulse-slow" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Blacklisted Visitor Arrived</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>Gate Security Alert</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
                Visitor <strong style={{ color: 'var(--color-danger)' }}>{(realtimeNotification as any).visitorName}</strong> has arrived at security, but is currently marked as <strong style={{ color: 'var(--color-danger)' }}>blacklisted</strong>.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button 
                  onClick={() => handleHostRejectBlacklisted((realtimeNotification as any).visitId || '', (realtimeNotification as any).visitorId || '', (realtimeNotification as any).visitorName)}
                  className="btn btn-danger"
                  disabled={!!pendingActionId}
                  style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  {pendingActionId === `reject_blacklisted_${(realtimeNotification as any).visitId}` ? <Loader2 size={14} className="animate-spin" /> : 'Reject Entry 🚫'}
                </button>
                <button 
                  onClick={() => handleHostRequestUnblock((realtimeNotification as any).visitId || '', (realtimeNotification as any).visitorId || '', (realtimeNotification as any).visitorName)}
                  className="btn btn-warning"
                  disabled={!!pendingActionId}
                  style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  {pendingActionId === `request_unblock_${(realtimeNotification as any).visitId}` ? <Loader2 size={14} className="animate-spin" /> : 'Request Admin to Unblock 🔓'}
                </button>
              </div>
            </>
          ) : (realtimeNotification as any).type === 'unblock_request' ? (
            <>
              {/* Type: Unblock Request (Admin Notification) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: 'var(--color-indigo-accent)',
                  borderRadius: '50%',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Visitor Unblock Requested</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-indigo-accent)' }}>Admin Approval Required</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
                Host <strong style={{ color: 'var(--color-text-primary)' }}>{(realtimeNotification as any).hostName}</strong> requested to unblock visitor <strong style={{ color: 'var(--color-indigo-accent)' }}>{(realtimeNotification as any).visitorName}</strong>.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button 
                  onClick={() => handleAdminDenyUnblock((realtimeNotification as any).visitorId || '', (realtimeNotification as any).visitorName, (realtimeNotification as any).targetHostId)}
                  className="btn btn-danger"
                  disabled={!!pendingActionId}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Deny Unblock ❌
                </button>
                <button 
                  onClick={() => handleAdminApproveUnblock((realtimeNotification as any).visitorId || '', (realtimeNotification as any).visitorName, (realtimeNotification as any).targetHostId)}
                  className="btn btn-success"
                  disabled={!!pendingActionId}
                  style={{ padding: '6px 14px', fontSize: '0.8rem', background: 'var(--color-success)', color: '#fff', border: 'none' }}
                >
                  Approve & Unblock ✅
                </button>
              </div>
            </>
          ) : (realtimeNotification as any).type === 'unblock_approved' ? (
            <>
              {/* Type: Unblock Approved */}
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
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Visitor Unblocked</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>Admin Decision</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
                Admin has approved unblocking visitor <strong style={{ color: 'var(--color-success)' }}>{realtimeNotification.visitorName}</strong>. Entry is now permitted.
              </p>
              <button 
                onClick={() => setRealtimeNotification(null)}
                className="btn btn-success"
                style={{ alignSelf: 'flex-end', padding: '6px 16px', fontSize: '0.8rem', background: 'var(--color-success)', color: '#fff', border: 'none' }}
              >
                Got It
              </button>
            </>
          ) : (realtimeNotification as any).type === 'unblock_denied' ? (
            <>
              {/* Type: Unblock Denied */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--color-danger)',
                  borderRadius: '50%',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <XCircle size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Unblock Request Denied</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>Admin Decision</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
                Admin has denied unblocking visitor <strong style={{ color: 'var(--color-danger)' }}>{realtimeNotification.visitorName}</strong>. Entry remains restricted.
              </p>
              <button 
                onClick={() => setRealtimeNotification(null)}
                className="btn btn-secondary"
                style={{ alignSelf: 'flex-end', padding: '6px 16px', fontSize: '0.8rem' }}
              >
                Acknowledged
              </button>
            </>
          ) : (realtimeNotification as any).type === 'blacklisted_host_rejected' ? (
            <>
              {/* Type: Blacklisted Entry Rejected by Host (Security Notification) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--color-danger)',
                  borderRadius: '50%',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <XCircle size={20} className="pulse-slow" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Blacklisted Entry Rejected</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>Host Decision Alert</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
                Host <strong style={{ color: 'var(--color-text-primary)' }}>{(realtimeNotification as any).hostName}</strong> has <strong style={{ color: 'var(--color-danger)' }}>REJECTED</strong> entry for blacklisted visitor <strong style={{ color: 'var(--color-danger)' }}>{realtimeNotification.visitorName}</strong>. Do NOT process entry further.
              </p>
              <button 
                onClick={() => setRealtimeNotification(null)}
                className="btn btn-secondary"
                style={{ alignSelf: 'flex-end', padding: '6px 16px', fontSize: '0.8rem' }}
              >
                Acknowledged
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

      {/* Fullscreen Visitor Photo Modal */}
      {showFullscreenVisitorPhoto && (
        <div 
          onClick={() => setShowFullscreenVisitorPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999999,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <button
            onClick={() => setShowFullscreenVisitorPhoto(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <X size={24} />
          </button>
          
          <img 
            src={showFullscreenVisitorPhoto}
            alt="Visitor Fullscreen Photo"
            style={{
              maxWidth: '92vw',
              maxHeight: '82vh',
              borderRadius: '16px',
              objectFit: 'contain',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{ color: '#ffffff', marginTop: '16px', fontSize: '0.85rem', fontWeight: 500, opacity: 0.8 }}>
            Tap anywhere to dismiss
          </div>
        </div>
      )}

      {/* Blacklist Blocked Modal */}
      {showBlacklistBlockedModal && (
        <div className="modal-overlay" style={{ zIndex: 1300 }}>
          <div className="modal-content" style={{ maxWidth: '400px', width: '100%', background: 'var(--card-bg-solid)', border: '1px solid var(--card-border)', textAlign: 'center', padding: '32px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--color-danger)',
              borderRadius: '50%',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <ShieldAlert size={32} />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '10px' }}>
              Registration Blocked
            </h3>
            
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
              this person is blacklisted by admin/organisation, contact admin for further support.
            </p>
            
            <Button 
              variant="danger" 
              style={{ width: '100%', padding: '12px' }} 
              onClick={handleCloseBlacklistBlockedModal}
            >
              Close
            </Button>
          </div>
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
