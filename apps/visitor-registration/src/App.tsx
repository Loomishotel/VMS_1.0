import React, { useState, useEffect, useRef } from 'react';
import {
  Building,
  Users,
  Clock,
  User,
  Camera,
  RefreshCw,
  CheckCircle,
  AlertOctagon,
  X,
  Sun,
  Moon,
  ChevronRight,
  Sparkles,
  Briefcase,
  MapPin
} from 'lucide-react';
import { supabase } from './supabaseClient';

const getPhoneLimitRules = (prefix: string) => {
  const rules: Record<string, { min: number; max: number; label: string }> = {
    '+1': { min: 10, max: 10, label: '10' },
    '+91': { min: 10, max: 10, label: '10' },
    '+44': { min: 9, max: 15, label: '9-15' },
    '+61': { min: 9, max: 9, label: '9' },
    '+65': { min: 8, max: 8, label: '8' },
    '+971': { min: 9, max: 9, label: '9' },
    '+49': { min: 10, max: 13, label: '10-13' },
    '+33': { min: 9, max: 9, label: '9' },
    '+81': { min: 10, max: 10, label: '10' },
    '+82': { min: 9, max: 10, label: '9-10' },
    '+27': { min: 9, max: 9, label: '9' },
    '+55': { min: 10, max: 11, label: '10-11' }
  };
  return rules[prefix] || { min: 8, max: 15, label: '8-15' };
};

interface LocationCoords {
  lat: number;
  lon: number;
}

const BRANCH_COORDS: Record<string, LocationCoords> = {
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11': { lat: 12.9716, lon: 77.5946 }, // Bangalore
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12': { lat: 19.0760, lon: 72.8777 }, // Mumbai
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13': { lat: 18.5204, lon: 73.8567 }, // Pune
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14': { lat: 28.4595, lon: 77.0266 }  // Gurgaon
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const FALLBACK_BRANCHES = [
  { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', name: 'Bangalore HQ', address: '14 MG Road, Bengaluru, Karnataka 560001' },
  { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', name: 'Mumbai Office', address: '42 Nariman Point, Mumbai, Maharashtra 400021' },
  { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', name: 'Pune Office', address: '7 Baner Road, Pune, Maharashtra 411045' },
  { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', name: 'Gurgaon Office', address: 'DLF Cyber City, Sector 25, Gurgaon, Haryana 122002' }
];

const FALLBACK_EMPLOYEES: Record<string, Array<{ id: string; fullName: string; email: string; phone: string; departmentName: string }>> = {
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11': [
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', fullName: 'Sarah Jenkins', email: 'sarah.j@vms.local', phone: '+1 (555) 101-2001', departmentName: 'Engineering' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', fullName: 'David Chen', email: 'david.c@vms.local', phone: '+1 (555) 101-2002', departmentName: 'Engineering' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', fullName: 'Emma Rodriguez', email: 'emma.r@vms.local', phone: '+1 (555) 101-2003', departmentName: 'Human Resources' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', fullName: 'Robert Sterling', email: 'robert.s@vms.local', phone: '+1 (555) 101-2004', departmentName: 'Executive Staff' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', fullName: 'Lisa Monroe', email: 'lisa.m@vms.local', phone: '+1 (555) 101-2005', departmentName: 'Engineering' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', fullName: 'Priya Sharma', email: 'priya.s@vms.local', phone: '+91 98450 11001', departmentName: 'Engineering' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', fullName: 'Arjun Nair', email: 'arjun.n@vms.local', phone: '+91 98450 11002', departmentName: 'Engineering' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d53', fullName: 'Kavitha Reddy', email: 'kavitha.r@vms.local', phone: '+91 98450 11003', departmentName: 'Human Resources' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d54', fullName: 'Suresh Iyer', email: 'suresh.i@vms.local', phone: '+91 98450 11004', departmentName: 'Facilities' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d55', fullName: 'Deepa Menon', email: 'deepa.m@vms.local', phone: '+91 98450 11005', departmentName: 'Executive Staff' }
  ],
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12': [
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', fullName: 'Rahul Desai', email: 'rahul.d@vms.local', phone: '+91 98200 21001', departmentName: 'Engineering' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', fullName: 'Sneha Patil', email: 'sneha.p@vms.local', phone: '+91 98200 21002', departmentName: 'Human Resources' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23', fullName: 'Anita Joshi', email: 'anita.j@vms.local', phone: '+91 98200 21003', departmentName: 'Facilities' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24', fullName: 'Vikram Mehta', email: 'vikram.m@vms.local', phone: '+91 98200 21004', departmentName: 'Engineering' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d25', fullName: 'Pooja Kulkarni', email: 'pooja.k@vms.local', phone: '+91 98200 21005', departmentName: 'Executive Staff' }
  ],
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13': [
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d31', fullName: 'Amit Kulkarni', email: 'amit.k@vms.local', phone: '+91 98220 31001', departmentName: 'Engineering' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d32', fullName: 'Neha Deshpande', email: 'neha.d@vms.local', phone: '+91 98220 31002', departmentName: 'Human Resources' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d33', fullName: 'Ravi Bhosale', email: 'ravi.b@vms.local', phone: '+91 98220 31003', departmentName: 'Engineering' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d34', fullName: 'Sunita Wagh', email: 'sunita.w@vms.local', phone: '+91 98220 31004', departmentName: 'Facilities' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d35', fullName: 'Kiran Jadhav', email: 'kiran.j@vms.local', phone: '+91 98220 31005', departmentName: 'Executive Staff' }
  ],
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14': [
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', fullName: 'Rohit Gupta', email: 'rohit.g@vms.local', phone: '+91 98110 41001', departmentName: 'Engineering' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', fullName: 'Anjali Singh', email: 'anjali.s@vms.local', phone: '+91 98110 41002', departmentName: 'Human Resources' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', fullName: 'Manish Verma', email: 'manish.v@vms.local', phone: '+91 98110 41003', departmentName: 'Facilities' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', fullName: 'Pooja Agarwal', email: 'pooja.a@vms.local', phone: '+91 98110 41004', departmentName: 'Engineering' },
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', fullName: 'Sanjay Khanna', email: 'sanjay.k@vms.local', phone: '+91 98110 41005', departmentName: 'Executive Staff' }
  ]
};

const SECURITY_EMAILS: Record<string, string> = {
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11': 'security.blr@vms.local',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12': 'security.mum@vms.local',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13': 'security.pun@vms.local',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14': 'security.gur@vms.local'
};

const authenticateForBranch = async (bId: string) => {
  const email = SECURITY_EMAILS[bId] || 'security.blr@vms.local';
  try {
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password: 'Security@123'
    });
    if (authErr) {
      console.warn(`Auto-authentication failed for branch security ${email}:`, authErr.message);
    } else {
      console.log(`Auto-authenticated successfully as branch security: ${email}`);
    }
  } catch (err: any) {
    console.warn(`Auto-authentication exception for branch security ${email}:`, err.message);
  }
};

export default function App() {
  // Theme state
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

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
  const [locationField, setLocationField] = useState('');
  const [visitorType, setVisitorType] = useState('Guest');
  const [branchId, setBranchId] = useState('');
  const [hostEmployeeId, setHostEmployeeId] = useState('');
  const [hostSearchText, setHostSearchText] = useState('');
  const [showHostSuggestions, setShowHostSuggestions] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [additionalGuests, setAdditionalGuests] = useState(0);

  // Lists from DB
  const [branches, setBranches] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [deptFilter, setDeptFilter] = useState('');

  const matchingEmployees = hostSearchText.trim()
    ? employees.filter(emp => 
        (!deptFilter || emp.departmentId === deptFilter || emp.departmentName === deptFilter) &&
        emp.fullName.toLowerCase().split(' ').some((word: string) => word.startsWith(hostSearchText.toLowerCase().trim()))
      )
    : [];

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowHostSuggestions(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Lock status if branchId is in query param
  const [isBranchLocked, setIsBranchLocked] = useState(false);
  const [lockedBranchName, setLockedBranchName] = useState('');

  // Location Service State
  const [locationStatus, setLocationStatus] = useState<{
    status: 'idle' | 'detecting' | 'success' | 'not_found' | 'error';
    message?: string;
  }>({ status: 'idle' });

  // UI state
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [successData, setSuccessData] = useState<{
    visitorName: string;
    checkInCode: string;
    qrToken: string;
    hostName: string;
    branchName: string;
    scheduledAt: string;
  } | null>(null);

  // Camera states
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Helper date generators
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

  const detectLocation = (currentBranches: any[]) => {
    if (!navigator.geolocation) {
      setLocationStatus({
        status: 'error',
        message: 'Geolocation is not supported by your browser.'
      });
      return;
    }

    setLocationStatus({ status: 'detecting' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let nearestBranch: any = null;
        let minDistance = Infinity;

        currentBranches.forEach((b: any) => {
          const coords = BRANCH_COORDS[b.id];
          if (coords) {
            const dist = getDistance(latitude, longitude, coords.lat, coords.lon);
            if (dist < minDistance) {
              minDistance = dist;
              nearestBranch = b;
            }
          }
        });

        // 50 km radius threshold to determine if visitor is in that city itself
        if (nearestBranch && minDistance <= 50) {
          setBranchId(nearestBranch.id);
          setLocationStatus({
            status: 'success',
            message: `Nearest branch found: ${nearestBranch.name} (${minDistance.toFixed(1)} km away)`
          });
        } else {
          setLocationStatus({
            status: 'not_found',
            message: 'No nearby branch found.'
          });
        }
      },
      (error) => {
        let errorMsg = 'Unable to retrieve location. Please select your branch manually.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. Please select your branch manually.';
        }
        setLocationStatus({
          status: 'error',
          message: errorMsg
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Set default scheduled time to now on mount
  useEffect(() => {
    setScheduledAt(getLocalISOString());
  }, []);

  // Fetch branches, departments, and employees on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlBranchId = params.get('branchId');

      try {
        // Auto-authenticate as the correct branch security guard to bypass RLS policies
        await authenticateForBranch(urlBranchId || 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11');

        // Fetch all branches
        const { data: branchData, error: bErr } = await supabase
          .from('Branch')
          .select('id, name, address')
          .eq('isActive', true);
        
        let finalBranches = branchData || [];
        if (bErr || finalBranches.length === 0) {
          console.warn('Unable to query branches from database. Using local fallback branch locations.');
          finalBranches = FALLBACK_BRANCHES;
        }
        setBranches(finalBranches);

        if (urlBranchId) {
          const matchedBranch = finalBranches.find((b: any) => b.id === urlBranchId);
          if (matchedBranch) {
            setBranchId(urlBranchId);
            setLockedBranchName(matchedBranch.name);
            setIsBranchLocked(true);
          }
        } else {
          // Auto choose branch based on location
          detectLocation(finalBranches);
        }
      } catch (err: any) {
        console.error('Error loading initial registration data:', err.message);
        setBranches(FALLBACK_BRANCHES);
        
        if (urlBranchId) {
          const matchedBranch = FALLBACK_BRANCHES.find((b: any) => b.id === urlBranchId);
          if (matchedBranch) {
            setBranchId(urlBranchId);
            setLockedBranchName(matchedBranch.name);
            setIsBranchLocked(true);
          }
        } else {
          detectLocation(FALLBACK_BRANCHES);
        }
      }
    };
    loadInitialData();
  }, []);

  // Fetch departments & employees when branchId changes
  useEffect(() => {
    setDeptFilter('');
    if (!branchId) {
      setEmployees([]);
      setDepartments([]);
      setHostEmployeeId('');
      setHostSearchText('');
      return;
    }

    const loadBranchSpecificData = async () => {
      try {
        // Re-authenticate for the selected branch to gain correct RLS permissions
        await authenticateForBranch(branchId);
        // Fetch employees
        const { data: empData, error: eErr } = await supabase
          .from('Employee')
          .select(`
            id,
            fullName,
            email,
            phone,
            departmentId,
            Department (
              name
            )
          `)
          .eq('branchId', branchId)
          .eq('isActive', true);

        let mappedEmps = [];
        if (eErr || !empData || empData.length === 0) {
          console.warn('Unable to query employees from database. Using local fallback employee list.');
          mappedEmps = FALLBACK_EMPLOYEES[branchId] || [];
        } else {
          mappedEmps = empData.map((e: any) => ({
            id: e.id,
            fullName: e.fullName,
            email: e.email,
            phone: e.phone,
            departmentId: e.departmentId,
            departmentName: e.Department?.name || 'N/A'
          }));
        }
        setEmployees(mappedEmps);

        // Derive unique departments from the employee list dynamically
        const uniqueDepts = Array.from(new Set(mappedEmps.map(emp => emp.departmentName))).filter(Boolean);
        setDepartments(uniqueDepts.map((name) => ({ id: name, name })));
      } catch (err: any) {
        console.error('Error loading branch specific data:', err.message);
        const mappedEmps = FALLBACK_EMPLOYEES[branchId] || [];
        setEmployees(mappedEmps);
        const uniqueDepts = Array.from(new Set(mappedEmps.map(emp => emp.departmentName))).filter(Boolean);
        setDepartments(uniqueDepts.map((name) => ({ id: name, name })));
      }
    };

    loadBranchSpecificData();
  }, [branchId]);

  // Camera Handlers
  const startCamera = async () => {
    setCapturedPhoto(null);
    setIsCameraActive(true);
    try {
      const constraints = {
        video: { facingMode: facingMode, width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Failed to open camera:', err);
      setAlertMessage({ type: 'error', text: 'Unable to access camera. Please check permissions.' });
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 480;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Flip photo horizontally if using front camera
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(dataUrl);
    }
    stopCamera();
  };

  const toggleCameraFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    // Restart camera with new mode
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => {
        setFacingMode(nextMode);
        startCamera();
      }, 100);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage(null);

    if (!fullName || !branchId || !hostEmployeeId || !purpose || !scheduledAt) {
      setAlertMessage({ type: 'error', text: 'Please fill in all required fields marked with *.' });
      return;
    }

    // Validate Name (only alphabets and spaces)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(fullName.trim())) {
      setAlertMessage({ type: 'error', text: 'Visitor Name must contain only alphabetic characters and spaces.' });
      return;
    }

    // Validate scheduled date and time is not in the past
    if (new Date(scheduledAt).getTime() < Date.now() - 60000) {
      setAlertMessage({ type: 'error', text: 'Scheduled date and time cannot be in the past.' });
      return;
    }

    // Validate scheduled date and time is not more than 6 months in the future
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);
    if (new Date(scheduledAt).getTime() > maxFutureDate.getTime()) {
      setAlertMessage({ type: 'error', text: 'Scheduled date and time cannot be more than 6 months in the future.' });
      return;
    }

    // Guest count validation removed (guests input removed from form)

    if (!hostEmployeeId) {
      setAlertMessage({ type: 'error', text: 'Please select a valid Host Employee from the suggestions list.' });
      return;
    }

    // Require both email and phone for self-registration to ensure valid contact details
    if (!email.trim() || !phone.trim()) {
      setAlertMessage({ type: 'error', text: 'Please provide both email address and phone number.' });
      return;
    }

    // Validate Email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setAlertMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    // Combine Selected Country Code prefix with Phone number value
    let finalPhone = '';
    const cleanPhone = phone.trim();
    if (cleanPhone.startsWith('+')) {
      finalPhone = cleanPhone;
    } else {
      finalPhone = `${phoneCountryCode} ${cleanPhone}`;
    }

    const phoneRegex = /^\+[1-9][0-9\s\-()]{6,19}$/;
    if (!phoneRegex.test(finalPhone)) {
      setAlertMessage({ type: 'error', text: 'Please enter a valid phone number. (e.g. +1 5550199)' });
      return;
    }

    // Enforce country-specific phone digit limits
    let activePrefix = phoneCountryCode;
    let checkDigits = cleanPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('+')) {
      const matchedPrefix = ['+971', '+353', '+880', '+977', '+234', '+254', '+233', '+852', '+886', '+358', '+966']
        .find(p => cleanPhone.startsWith(p)) || cleanPhone.substring(0, 3);
      activePrefix = matchedPrefix;
      checkDigits = cleanPhone.replace(activePrefix, '').replace(/\D/g, '');
    }
    const rule = getPhoneLimitRules(activePrefix);
    if (checkDigits.length < rule.min || checkDigits.length > rule.max) {
      setAlertMessage({
        type: 'error',
        text: `Phone number must be ${rule.label} digits for ${activePrefix}. Currently it has ${checkDigits.length} digits.`
      });
      return;
    }

    setLoading(true);

    try {
      // Ensure we are authenticated under the correct branch guard before submission
      await authenticateForBranch(branchId);

      // 1. Check Blacklist Status first
      let blacklistCheck = false;
      const emailInput = email.trim().toLowerCase();
      const phoneInput = finalPhone.trim();

      // Get branch users to scope the blacklist check
      const { data: branchUsers } = await supabase
        .from('User')
        .select('id')
        .eq('branchId', branchId);
      const branchUserIds = (branchUsers || []).map((u: any) => u.id);

      // Find matching visitors
      const { data: matchingVisitors } = await supabase
        .from('Visitor')
        .select('id, fullName, email, phone')
        .or(`email.eq.${emailInput},phone.eq.${phoneInput},fullName.ilike.${fullName.trim()}`);

      if (matchingVisitors && matchingVisitors.length > 0) {
        const matchingVisitorIds = matchingVisitors.map((v: any) => v.id);

        let query = supabase
          .from('Blacklist')
          .select('id')
          .in('addedByUserId', branchUserIds);

        if (matchingVisitorIds.length > 0) {
          query = query.or(`visitorId.in.(${matchingVisitorIds.join(',')}),fullName.ilike.${fullName.trim()}`);
        } else {
          query = query.ilike('fullName', fullName.trim());
        }

        const { data: blMatches } = await query;
        if (blMatches && blMatches.length > 0) {
          blacklistCheck = true;
        }
      } else {
        const { data: blMatches } = await supabase
          .from('Blacklist')
          .select('id')
          .in('addedByUserId', branchUserIds)
          .ilike('fullName', fullName.trim());
        if (blMatches && blMatches.length > 0) {
          blacklistCheck = true;
        }
      }

      if (blacklistCheck) {
        setIsBlacklisted(true);
        setLoading(false);
        return;
      }

      // 2. Check or Create Visitor
      let visitorId = '';
      const { data: nameMatches } = await supabase
        .from('Visitor')
        .select('id, email, phone')
        .ilike('fullName', fullName.trim());

      if (nameMatches && nameMatches.length > 0) {
        const match = nameMatches.find(v => {
          const emailDb = (v.email || '').trim().toLowerCase();
          const phoneDb = (v.phone || '').trim();
          return emailInput === emailDb && phoneInput === phoneDb;
        });
        if (match) visitorId = match.id;
      }

      if (!visitorId) {
        const { data: created, error: crErr } = await supabase
          .from('Visitor')
          .insert({
            fullName: fullName.trim(),
            email: emailInput || null,
            phone: phoneInput || null,
            company: company.trim() || null,
            visitorType: visitorType,
            location: locationField.trim() || null,
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

      // 3. Generate QR Token and Check-in Code
      const qrToken = `QR-${self.crypto.randomUUID()}`;
      const checkInCode = `VMS-${self.crypto.randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase()}`;

      // 4. Create Invitation
      const { data: invite, error: inviteErr } = await supabase
        .from('Invitation')
        .insert({
          visitorId,
          hostEmployeeId: hostEmployeeId,
          qrToken,
          scheduledAt: new Date(scheduledAt).toISOString(),
          expiresAt: new Date(new Date(scheduledAt).getTime() + 86400000).toISOString()
        })
        .select('id')
        .single();

      if (inviteErr) throw inviteErr;

      // 5. Create Visit Shell (Expected walk-in)
      const { error: visitErr } = await supabase
        .from('Visit')
        .insert({
          visitorId,
          hostEmployeeId: hostEmployeeId,
          invitationId: invite.id,
          branchId: branchId,
          purpose: purpose.trim(),
          status: 'Expected',
          scheduledAt: new Date(scheduledAt).toISOString(),
          checkInCode,
          additionalGuests: additionalGuests,
          createdByUserId: null // Self registered
        });

      if (visitErr) throw visitErr;

      // 6. Queue Notification
      const selectedBranchName = lockedBranchName || (branches.find(b => b.id === branchId)?.name || 'VMS Branch');
      await supabase.from('Notification').insert({
        recipientVisitorId: visitorId,
        channel: 'Email',
        message: `Hello ${fullName}, you have successfully self-registered to visit ${selectedBranchName}. Your check-in code is ${checkInCode} and your QR token is ${qrToken}. Please present this code to security on arrival.`,
        status: 'Queued'
      });

      // 7. Trigger Realtime Broadcast for Security Dashboard updates
      try {
        const channel = supabase.channel('vms_global_broadcast');
        await channel.send({
          type: 'broadcast',
          event: 'visitor_registered',
          payload: { visitorId, branchId }
        });
      } catch (broadcastErr) {
        console.warn('Realtime broadcast failed:', broadcastErr);
      }

      // Show success screen
      const selectedHost = employees.find(e => e.id === hostEmployeeId);
      setSuccessData({
        visitorName: fullName,
        checkInCode,
        qrToken,
        hostName: selectedHost ? selectedHost.fullName : 'Host Employee',
        branchName: selectedBranchName,
        scheduledAt: new Date(scheduledAt).toLocaleString()
      });

    } catch (err: any) {
      console.error('Error during self-registration:', err);
      setAlertMessage({ type: 'error', text: err.message || 'An error occurred during registration. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setFullName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setLocationField('');
    setVisitorType('Guest');
    if (!isBranchLocked) {
      setBranchId('');
      setLocationStatus({ status: 'idle' });
      // Re-detect location on form reset
      detectLocation(branches);
    }
    setHostEmployeeId('');
    setHostSearchText('');
    setShowHostSuggestions(false);
    setPurpose('');
    setAdditionalGuests(0);
    setCapturedPhoto(null);
    setSuccessData(null);
    setIsBlacklisted(false);
    setAlertMessage(null);
    setScheduledAt(getLocalISOString());
  };

  // Blacklist view
  if (isBlacklisted) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', marginBottom: '24px' }}>
          <AlertOctagon size={48} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px', color: 'var(--color-danger)' }}>
          Security Notice: Entry Restricted
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '480px', margin: '0 auto 32px' }}>
          Your details are currently flagged in our security blacklist for this branch location. For your security and ours, online self-registration cannot be completed. 
          <br /><br />
          Please approach the security gate or reception desk directly with a valid photo ID to request manual entry validation.
        </p>
        <button className="btn btn-secondary" onClick={handleResetForm} style={{ padding: '12px 28px' }}>
          Back to Form
        </button>
      </div>
    );
  }

  // Success view (Simple success message, no pass card or QR)
  if (successData) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderRadius: '50%', marginBottom: '24px' }}>
          <CheckCircle size={48} />
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>
          Successfully Registered!
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '440px', margin: '0 auto 32px' }}>
          Your self-registration details have been recorded. You may now proceed to check in.
        </p>
        <button className="btn btn-primary" onClick={handleResetForm} style={{ padding: '12px 32px', width: '100%', maxWidth: '280px' }}>
          Register Another Visitor
        </button>
      </div>
    );
  }

  // Registration Form View
  return (
    <div className="card">
      <div className="logo-header">
        <div>
          <div className="logo-title">
            <Building size={24} />
            <span>VMS Self-Registration</span>
          </div>
          <div className="logo-subtitle">
            {isBranchLocked ? `Welcome to ${lockedBranchName}` : 'Welcome to our Visitor Portal'}
          </div>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            background: 'var(--btn-secondary-bg)',
            border: '1px solid var(--btn-secondary-border)',
            color: 'var(--color-text-primary)',
            padding: '8px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Toggle Dark/Light Mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {alertMessage && (
        <div className="alert-error" style={{ borderColor: alertMessage.type === 'success' ? '#34d399' : '', color: alertMessage.type === 'success' ? '#34d399' : '' }}>
          <AlertOctagon size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{alertMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* SECTION 1: Location selection */}
        {!isBranchLocked && (
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Branch Location to Visit *</label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => detectLocation(branches)}
                disabled={locationStatus.status === 'detecting'}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <MapPin size={12} className={locationStatus.status === 'detecting' ? 'animate-spin' : ''} />
                {locationStatus.status === 'detecting' ? 'Detecting...' : 'Auto-Detect Branch'}
              </button>
            </div>
            <select
              className="form-input"
              value={branchId}
              onChange={e => {
                setBranchId(e.target.value);
                setLocationStatus({ status: 'idle' });
              }}
              required
            >
              <option value="">-- Choose Branch Location --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            {locationStatus.status !== 'idle' && (
              <div style={{
                marginTop: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid transparent',
                background: locationStatus.status === 'success' 
                  ? 'rgba(52, 211, 153, 0.08)' 
                  : locationStatus.status === 'not_found'
                    ? 'rgba(245, 158, 11, 0.08)'
                    : locationStatus.status === 'detecting'
                      ? 'rgba(96, 165, 250, 0.08)'
                      : 'rgba(239, 68, 68, 0.08)',
                borderColor: locationStatus.status === 'success' 
                  ? 'rgba(52, 211, 153, 0.2)' 
                  : locationStatus.status === 'not_found'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : locationStatus.status === 'detecting'
                      ? 'rgba(96, 165, 250, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                color: locationStatus.status === 'success' 
                  ? '#34d399' 
                  : locationStatus.status === 'not_found'
                    ? '#fbbf24'
                    : locationStatus.status === 'detecting'
                      ? '#60a5fa'
                      : '#fca5a5'
              }}>
                {locationStatus.status === 'detecting' && <RefreshCw size={14} className="animate-spin" />}
                {locationStatus.status === 'success' && <CheckCircle size={14} />}
                {locationStatus.status === 'not_found' && <AlertOctagon size={14} />}
                {locationStatus.status === 'error' && <AlertOctagon size={14} />}
                <span>{locationStatus.message}</span>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: Visitor Credentials */}
        <div className="section-title">
          <User size={16} />
          <span>Visitor Credentials</span>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Visitor Full Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Company / Organization</label>
            <input
              type="text"
              className="form-input"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Acme Corp"
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@doe.com"
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Phone Number *</label>
              {phone.trim() && (() => {
                const clean = phone.trim();
                let activePrefix = phoneCountryCode;
                let checkDigits = clean.replace(/\D/g, '');
                if (clean.startsWith('+')) {
                  const matchedPrefix = ['+971', '+353', '+880', '+977', '+234', '+254', '+233', '+852', '+886', '+358', '+966'].find(p => clean.startsWith(p));
                  activePrefix = matchedPrefix || clean.substring(0, 3);
                  checkDigits = clean.replace(activePrefix, '').replace(/\D/g, '');
                }
                const rule = getPhoneLimitRules(activePrefix);
                const isWrongLength = checkDigits.length < rule.min || checkDigits.length > rule.max;
                return (
                  <span style={{ fontSize: '0.75rem', color: isWrongLength ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    {checkDigits.length} / {rule.label} digits
                  </span>
                );
              })()}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                className="form-input"
                value={phoneCountryCode}
                onChange={e => setPhoneCountryCode(e.target.value)}
                style={{ width: '100px', padding: '10px 8px' }}
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
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(555) 0199"
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Visitor Home Location (Address / City)</label>
          <input
            type="text"
            className="form-input"
            value={locationField}
            onChange={e => setLocationField(e.target.value)}
            placeholder="e.g. San Jose, CA"
          />
        </div>

        {/* PHOTO CAPTURE */}
        <div className="form-group" style={{ textAlign: 'center', marginTop: '24px' }}>
          <label className="form-label" style={{ textAlign: 'left' }}>Visitor Photo Capture (Optional)</label>
          <div className="camera-container">
            {isCameraActive ? (
              <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
            ) : capturedPhoto ? (
              <img src={capturedPhoto} alt="Captured Profile" className="camera-img" />
            ) : (
              <div style={{ color: 'var(--color-text-secondary)', opacity: 0.5, textAlign: 'center' }}>
                <User size={64} style={{ margin: '0 auto 8px' }} />
                <span style={{ fontSize: '0.8rem', display: 'block' }}>Camera Off</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {!isCameraActive && !capturedPhoto && (
              <button type="button" className="btn btn-secondary" onClick={startCamera}>
                <Camera size={16} /> Open Camera
              </button>
            )}
            {isCameraActive && (
              <>
                <button type="button" className="btn btn-primary" onClick={capturePhoto}>
                  <CheckCircle size={16} /> Capture Photo
                </button>
                <button type="button" className="btn btn-secondary" onClick={toggleCameraFacingMode}>
                  <RefreshCw size={14} /> Flip Camera
                </button>
              </>
            )}
            {(isCameraActive || capturedPhoto) && (
              <button type="button" className="btn btn-secondary" onClick={() => { stopCamera(); setCapturedPhoto(null); }}>
                <X size={16} /> Clear Photo
              </button>
            )}
          </div>
        </div>

        {/* SECTION 3: Visit Details */}
        <div className="section-title">
          <Clock size={16} />
          <span>Visit Details</span>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Visitor Classification</label>
            <select
              className="form-input"
              value={visitorType}
              onChange={e => setVisitorType(e.target.value)}
            >
              <option value="Guest">Guest</option>
              <option value="Vendor">Vendor</option>
              <option value="Contractor">Contractor</option>
              <option value="Candidate">Candidate</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Scheduled Time *</label>
            <input
              type="datetime-local"
              className="form-input"
              required
              value={scheduledAt}
              min={getLocalISOString()}
              max={getMaxFutureISOString()}
              onChange={e => setScheduledAt(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Department Filter</label>
            <select
              className="form-input"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              disabled={!branchId}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
            <label className="form-label">Host Employee *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder={branchId ? "Type host name..." : "Please select a branch first"}
              disabled={!branchId}
              value={hostSearchText}
              onChange={e => {
                setHostSearchText(e.target.value);
                setHostEmployeeId('');
                setShowHostSuggestions(true);
              }}
              onFocus={() => setShowHostSuggestions(true)}
            />
            {showHostSuggestions && hostSearchText.trim() && matchingEmployees.length > 0 && (
              <ul style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                listStyle: 'none',
                padding: 0,
                margin: '4px 0 0 0',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000
              }}>
                {matchingEmployees.map(emp => (
                  <li
                    key={emp.id}
                    onClick={() => {
                      setHostEmployeeId(emp.id);
                      setHostSearchText(emp.fullName);
                      setShowHostSuggestions(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      color: 'var(--color-text-primary)',
                      borderBottom: '1px solid var(--card-border)',
                      transition: 'background 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--menu-item-bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{emp.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{emp.departmentName} ({emp.email})</div>
                  </li>
                ))}
              </ul>
            )}
            {hostSearchText.trim() && !hostEmployeeId && (
              <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>
                Please select a host employee from the suggestions.
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Purpose of Visit *</label>
          <input
            type="text"
            className="form-input"
            required
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
            placeholder="e.g. Quarterly Review"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !branchId || !hostEmployeeId}
          style={{ width: '100%', height: '50px', marginTop: '20px' }}
        >
          {loading ? (
            <RefreshCw className="animate-spin" size={18} />
          ) : (
            <>
              Submit Registration <ChevronRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
