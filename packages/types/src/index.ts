// Shared Type Definitions for the Visitor Management System (VMS)

export type VisitorType = 'Guest' | 'Vendor' | 'Contractor' | 'Candidate' | 'VIP' | 'Emergency';

export type VisitStatus = 'Expected' | 'CheckedIn' | 'Waiting' | 'InMeeting' | 'CheckedOut' | 'Denied' | 'Cancelled';

export type NotificationChannel = 'Email' | 'SMS' | 'Push' | 'InApp';

export type NotificationStatus = 'Queued' | 'Sent' | 'Failed' | 'Read';

export type DocumentType = 'ID' | 'NDA' | 'Permit' | 'Insurance' | 'Other';

export type SeverityLevel = 'Low' | 'Medium' | 'High';

export interface BaseResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// User Interfaces (Internal staff)
export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  branchId: string;
  branchName: string;
  phone?: string;
  isActive: boolean;
}

// Employee/Host Interfaces
export interface EmployeeDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  floor?: string;
  isActive: boolean;
  departmentName: string;
  branchId: string;
}

// Visitor Interfaces
export interface VisitorDto {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  visitorType: VisitorType;
  photoUrl?: string;
  isBlacklisted: boolean;
  createdAt: string;
}

// Visit Transactional Interfaces
export interface VisitDto {
  id: string;
  visitorId: string;
  visitorName: string;
  visitorEmail?: string;
  visitorPhone?: string;
  visitorCompany?: string;
  visitorType: VisitorType;
  hostId: string;
  hostName: string;
  hostEmail: string;
  hostPhone: string;
  purpose: string;
  status: VisitStatus;
  scheduledAt?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  deniedReason?: string;
  zoneAccess?: string;
  photoUrl?: string;
}

// Request payloads
export interface LoginRequest {
  email: string;
  passwordHash: string; // or plain password depending on encryption point
}

export interface RegisterVisitorRequest {
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  visitorType: VisitorType;
  idDocumentType?: string;
  idDocumentNumber?: string;
}

export interface PreRegisterRequest {
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  visitorType: VisitorType;
  hostEmployeeId: string;
  purpose: string;
  scheduledAt: string;
}

export interface WalkInRequest {
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  visitorType: VisitorType;
  hostEmployeeId: string;
  purpose: string;
  photoBase64?: string; // webcam capture
}

export interface CheckInRequest {
  qrToken?: string;
  walkIn?: WalkInRequest;
}

export interface CheckOutRequest {
  visitId: string;
}

export interface BlacklistRequest {
  fullName: string;
  idDocumentNumber?: string;
  reason: string;
  severity: SeverityLevel;
}

// Analytics and Dashboard payloads
export interface AnalyticsSummary {
  todaysVisitors: number;
  avgVisitMinutes: number;
  peakHour: string;
  repeatVisitors: number;
  deniedEntries: number;
  visitorsByDept: { department: string; count: number }[];
  weeklyTrend: { date: string; count: number }[];
}

export interface EvacuationItem {
  visitorName: string;
  visitorType: VisitorType;
  hostName: string;
  zoneAccess?: string;
  checkedInAt: string;
  status: 'OnSite' | 'Evacuated';
}
