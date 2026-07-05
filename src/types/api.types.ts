export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: unknown;
}

export interface UserProfile {
  _id?: string;
  uid: string;
  email: string;
  name: string | null;
  authProvider: string;

  trial: {
    startedAt: string;
    endsAt: string;
    isUsed: boolean;
  };

  subscriptionStatus: 'trialing' | 'active' | 'expired' | 'cancelled' | 'blocked';

  currentPlanId: 'monthly_9';

  lastLoginAt: string;
  isDeleted: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface Subscription {
  _id?: string;
  userId: string;
  provider: 'google_play';
  planId: 'monthly_9';
  productId: 'remember_ai_monthly';
  status: 'active' | 'expired' | 'cancelled' | 'pending' | 'trialing';
  purchaseToken: string | null;
  orderId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  autoRenewing: boolean;
  lastVerifiedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiUsage {
  _id?: string;
  userId: string;
  monthKey: string;
  monthlyLimit: number;
  usedThisMonth: number;
  remaining: number;
  resetAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileResponse {
  user: UserProfile;
  subscription: Subscription | null;
  aiUsage: AiUsage | null;
}