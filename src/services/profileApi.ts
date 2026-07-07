const API_BASE_URL = 'https://lipogrammatic-allyson-nonstudiously.ngrok-free.dev/api/v1';


export interface ProfileUser {
  uid: string;
  email: string;
  name: string | null;
  subscriptionStatus: 'trialing' | 'active' | 'expired' | 'cancelled' | 'blocked';
  currentPlanId: string;
  trial: {
    startedAt: string;
    endsAt: string;
    isUsed: boolean;
  };
}

export interface ProfileEntitlement {
  hasAccess: boolean;
  shouldShowPaywall: boolean;
  status: 'trialing' | 'active' | 'expired' | 'cancelled' | 'blocked';
  plan: {
    planId: string;
    productId: string;
    priceInr: number;
    billingPeriod: 'monthly';
    trialDays: number;
    aiMonthlyLimit: number;
  };
  trial: {
    isActive: boolean;
    startedAt: string;
    endsAt: string;
    daysLeft: number;
  };
  subscription: {
    provider: 'google_play';
    planId: string;
    productId: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    autoRenewing: boolean;
    lastVerifiedAt: string | null;
  };
  aiUsage: {
    monthKey: string;
    monthlyLimit: number;
    usedThisMonth: number;
    remaining: number;
    resetAt: string;
  };
}

export interface ProfileResponse {
  user: ProfileUser;
  subscription: unknown;
  aiUsage: unknown;
  entitlement: ProfileEntitlement;
}

const getAuthHeaders = (token: string) => {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const unwrapApiData = async <T>(response: Response): Promise<T> => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed.');
  }

  return data?.data ?? data;
};

export const fetchProfile = async (token: string): Promise<ProfileResponse> => {
  const response = await fetch(`${API_BASE_URL}/profile/me`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });

  return unwrapApiData<ProfileResponse>(response);
};

export const updateProfileName = async (
  token: string,
  name: string,
): Promise<ProfileResponse> => {
  const response = await fetch(`${API_BASE_URL}/profile/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      name,
    }),
  });

  return unwrapApiData<ProfileResponse>(response);
};

export const deleteProfile = async (token: string): Promise<{deleted: boolean}> => {
  const response = await fetch(`${API_BASE_URL}/profile/me`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });

  return unwrapApiData<{deleted: boolean}>(response);
};