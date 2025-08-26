// Real Supabase Schema Types - Production Ready
export interface SupabaseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "USER" | "ADMIN" | "ORGANIZER";
  isAlumni: boolean;
  organization?: string;
  position?: string;
  graduationYear?: string;
  linkedinUrl?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseEvent {
  id: string;
  title: string;
  description: string;
  type: "CONFERENCE" | "WORKSHOP" | "SEMINAR" | "NETWORKING" | "OTHER";
  startDate: string;
  endDate: string;
  venue: string;
  capacity: number;
  price: number;
  featured: boolean;
  registrationDeadline: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  imageUrl?: string;
}

export interface SupabaseRegistration {
  id: string;
  userId: string;
  eventId: string;
  ticketType: "REGULAR" | "VIP" | "STUDENT" | "EARLY_BIRD";
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "PAYMENT_FAILED" | "PAYMENT_PENDING";
  registrationData: any;
  createdAt: string;
  updatedAt: string;
  // Relations
  user?: SupabaseUser;
  event?: SupabaseEvent;
}

export interface SupabasePayment {
  id: string;
  userId: string;
  registrationId: string;
  reference: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "BANK_TRANSFER_PENDING";
  paymentMethod: "PAYSTACK" | "BANK_TRANSFER";
  completedAt?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  // Relations
  registration?: SupabaseRegistration;
}

export interface SupabaseTicket {
  id: string;
  userId: string;
  eventId: string;
  registrationId: string;
  ticketNumber: string;
  qrCode: string;
  status: "ACTIVE" | "TEMPORARY" | "CANCELLED" | "USED";
  isTemporary: boolean;
  checkedIn: boolean;
  checkedInAt?: string;
  activatedAt?: string;
  createdAt: string;
  // Relations
  user?: SupabaseUser;
  event?: SupabaseEvent;
  registration?: SupabaseRegistration;
}

// Dashboard Analytics Types
export interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  totalUsers: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  bankTransferPending: number;
  totalRevenue: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: "registration" | "payment" | "event" | "user" | "checkin";
  action: string;
  entityId: string;
  userId?: string;
  metadata?: any;
  timestamp: string;
}

// Real-time Event Types
export interface RealtimeEvent {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: any;
  oldRecord?: any;
  timestamp: string;
}
