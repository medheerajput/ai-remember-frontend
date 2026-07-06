import {apiRequest} from './apiClient';

export interface ProfileResponse {
  user: {
    uid: string;
    email: string;
    name: string | null;
    subscriptionStatus: string;
    currentPlanId: string;
    trial?: {
      startedAt: string;
      endsAt: string;
      isUsed: boolean;
    };
  };
  subscription?: {
    status: string;
    planId: string;
    productId: string;
  } | null;
  aiUsage?: {
    monthKey: string;
    monthlyLimit: number;
    usedThisMonth: number;
    remaining: number;
  } | null;
}

export const getProfile = async (token: string) => {
  return apiRequest<ProfileResponse>('/profile/me', {
    method: 'GET',
    token,
  });
};