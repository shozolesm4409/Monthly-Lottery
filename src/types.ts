export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface LotteryCampaign {
  id: string;
  title: string;
  description: string;
  prizePool: number;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  status: 'active' | 'drawn' | 'cancelled';
  winnerEmail?: string | null;
  winnerTicket?: string | null;
  createdAt: string;
  drawDate?: string;
  selectedUsers?: string[];
  totalUsers?: number;
  totalMonths?: number;
  monthlyAmount?: number;
  monthlyDrawDate?: string;
  monthlyTotalAmount?: number;
  totalAmount?: number;
  winnersPerDraw?: number;
  drawType?: 'Super Admin' | 'Admin/Super Admin' | 'Winner';
  panelId?: string; // Links this campaign to a specific Multi-Dashboard panel
  monthlyDraws?: {
    monthNumber: number;
    drawDate: string;
    winnerId?: string;
    winnerName?: string;
    winnerEmail?: string;
    status: 'pending' | 'completed';
    prizeAmount?: number;
    winners?: {
      id: string;
      name: string;
      email: string;
      prizeAmount: number;
    }[];
  }[];
}

export interface DashboardPanel {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  icon?: string;
}

export interface RaffleTicket {
  id: string;
  lotteryId: string;
  lotteryTitle?: string;
  ticketNumber: string;
  buyerEmail: string;
  buyerName: string;
  purchasedAt: string;
  status: 'pending' | 'won' | 'lost';
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  campus?: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Pending';
  permission: string;
  phone?: string;
  createdAt?: string;
  panelId?: string;
  photoURL?: string;
  winnings?: {
    campaignId: string;
    campaignTitle: string;
    drawMonthNum: number;
    prizeAmount: number;
    drawDate: string;
  }[];
  payHistory?: {
    id: string;
    campaignId: string;
    campaignTitle: string;
    roundMonthNum: number;
    amount: number;
    date: string;
    status: 'PAID' | 'PENDING';
    winnerName?: string;
  }[];
}

export interface AppNotification {
  id: string;
  userId: string; // Recipient user ID (typically email or uid)
  title: string;
  message: string;
  type: 'general' | 'victory' | 'system';
  createdAt: string;
  read: boolean;
  campaignId?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
