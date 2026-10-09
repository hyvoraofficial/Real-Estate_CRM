export type UserRole = 'ADMIN' | 'SALES_EXECUTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'REQUIREMENT_COLLECTED'
  | 'PROPERTY_SHARED'
  | 'SITE_VISIT'
  | 'NEGOTIATION'
  | 'BOOKED'
  | 'LOST';

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  source: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  latestLead?: {
    id: string;
    status: LeadStatus;
    priority: LeadPriority;
    assignedUser?: { id: string; name: string } | null;
    requirement?: Requirement | null;
  } | null;
  nextFollowUp?: FollowUp | null;
  lastInteraction?: string | null;
  totalLeads?: number;
  leads?: Lead[];
  callLogs?: CallLog[];
  notesList?: Note[];
  siteVisits?: SiteVisit[];
  bookings?: Booking[];
  timeline?: TimelineEvent[];
}

export interface Requirement {
  id: string;
  leadId: string;
  propertyType: string;
  bhk?: string | null;
  preferredLocation: string;
  minBudget?: number | null;
  maxBudget?: number | null;
  minArea?: number | null;
  maxArea?: number | null;
  purpose: string;
  possessionPreference?: string | null;
  furnishingPreference?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Lead {
  id: string;
  customerId: string;
  customer: Customer;
  assignedUserId?: string | null;
  assignedUser?: { id: string; name: string; email?: string; phone?: string } | null;
  status: LeadStatus;
  priority: LeadPriority;
  source: string;
  requirement?: Requirement | null;
  followUps?: FollowUp[];
  callLogs?: CallLog[];
  notes?: Note[];
  siteVisits?: SiteVisit[];
  bookings?: Booking[];
  matchedProperties?: MatchedProperty[];
  timeline?: TimelineEvent[];
  nextFollowUp?: FollowUp | null;
  stats?: {
    calls: number;
    notes: number;
    siteVisits: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type FollowUpType = 'CALL' | 'WHATSAPP' | 'MEETING' | 'SITE_VISIT' | 'OTHER';
export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface FollowUp {
  id: string;
  leadId: string;
  lead?: Lead;
  assignedUserId?: string | null;
  assignedUser?: { id: string; name: string; email?: string } | null;
  scheduledAt: string;
  type: FollowUpType;
  status: FollowUpStatus;
  notes?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export type CallDirection = 'INCOMING' | 'OUTGOING';

export interface CallLog {
  id: string;
  customerId: string;
  customer?: Customer;
  leadId?: string | null;
  lead?: Lead | null;
  phoneNumber: string;
  direction: CallDirection;
  startedAt: string;
  endedAt?: string | null;
  duration: number;
  notes?: string | null;
  recordingUrl?: string | null;
  transcript?: string | null;
  summary?: string | null;
  createdAt: string;
}

export interface Note {
  id: string;
  customerId?: string | null;
  leadId?: string | null;
  userId?: string | null;
  user?: { id: string; name: string; email?: string } | null;
  content: string;
  createdAt: string;
}

export type PropertyStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'RENTED' | 'INACTIVE';

export interface PropertyImage {
  id: string;
  propertyId: string;
  imageUrl: string;
  sortOrder: number;
  createdAt: string;
}

export interface Property {
  id: string;
  title: string;
  propertyType: string;
  bhk?: string | null;
  location: string;
  address?: string | null;
  price: number;
  area: number;
  furnishing?: string | null;
  possession?: string | null;
  description?: string | null;
  status: PropertyStatus;
  images?: PropertyImage[];
  siteVisits?: SiteVisit[];
  bookings?: Booking[];
  createdAt: string;
  updatedAt?: string;
  _count?: {
    siteVisits: number;
    bookings: number;
  };
}

export interface MatchedProperty extends Property {
  matchPercentage: number;
  matchFactors: string[];
}

export type SiteVisitStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface SiteVisit {
  id: string;
  leadId: string;
  lead?: Lead;
  customerId: string;
  customer?: Customer;
  propertyId: string;
  property: Property;
  scheduledAt: string;
  status: SiteVisitStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  id: string;
  leadId: string;
  lead?: Lead;
  customerId: string;
  customer?: Customer;
  propertyId: string;
  property: Property;
  bookingAmount: number;
  bookingDate: string;
  status: BookingStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface TimelineEvent {
  id: string;
  type: 'CALL' | 'NOTE' | 'FOLLOW_UP' | 'SITE_VISIT' | 'BOOKING' | 'LEAD_CREATED' | 'REQUIREMENT_RECORDED';
  title: string;
  description?: string;
  timestamp: string;
  metadata?: any;
}

export interface DashboardStats {
  kpis: {
    totalLeads: number;
    newLeadsToday: number;
    callsToday: number;
    followUpsToday: number;
    overdueFollowUps: number;
    siteVisitsToday: number;
    activeOpportunities: number;
    bookingsCount: number;
    totalBookingValue: number;
    lostLeads: number;
    conversionRate: string;
  };
  charts: {
    pipeline: Array<{ status: LeadStatus; count: number }>;
    sources: Array<{ source: string; count: number }>;
    trend: Array<{ date: string; count: number }>;
  };
  todayFollowUps: FollowUp[];
  overdueFollowUps: FollowUp[];
  recentLeads: Array<{
    id: string;
    status: LeadStatus;
    priority: LeadPriority;
    source: string;
    createdAt: string;
    customer: { id: string; name: string; phone: string };
    requirement?: Requirement | null;
    assignedUser?: { id: string; name: string } | null;
    nextFollowUp?: FollowUp | null;
  }>;
}

export interface ReportData {
  summary: {
    totalLeads: number;
    totalSiteVisits: number;
    totalBookings: number;
    totalLost: number;
    totalRevenue: number;
    conversionRate: string;
  };
  funnel: Array<{ stage: string; status: LeadStatus; count: number }>;
  sources: Array<{ source: string; count: number; percentage: number }>;
  salesPerformance: Array<{
    id: string;
    name: string;
    role: string;
    leadsAssigned: number;
    siteVisitsCompleted: number;
    dealsClosed: number;
    totalRevenue: number;
    followUpsCompleted: number;
    conversionRate: string;
  }>;
  followUpStats: Array<{ name: string; value: number; fill: string }>;
  propertyStats: Array<{
    id: string;
    title: string;
    location: string;
    price: number;
    status: string;
    siteVisits: number;
    bookings: number;
  }>;
}
