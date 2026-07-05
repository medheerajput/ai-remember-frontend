import {apiClient} from './apiClient';
import type {ApiResponse, ProfileResponse} from '../types/api.types';

export const profileApi = {
  createProfile: async (name?: string) => {
    const response = await apiClient.post<ApiResponse<ProfileResponse>>(
      '/profile/create',
      {
        name,
      },
    );

    return response.data.data;
  },

  getProfile: async () => {
    const response =
      await apiClient.get<ApiResponse<ProfileResponse>>('/profile/me');

    return response.data.data;
  },

  updateProfile: async (name: string) => {
    const response = await apiClient.patch<ApiResponse<ProfileResponse>>(
      '/profile/update',
      {
        name,
      },
    );

    return response.data.data;
  },

  deleteProfile: async () => {
    const response = await apiClient.delete<ApiResponse<{deleted: boolean}>>(
      '/profile/delete',
    );

    return response.data.data;
  },
};