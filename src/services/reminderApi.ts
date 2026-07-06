const API_BASE_URL = 'https://lipogrammatic-allyson-nonstudiously.ngrok-free.dev/api/v1';

export type ApiReminderStatus = 'pending' | 'completed' | 'missed' | 'cancelled';

export interface ApiReminder {
  id: string;
  title: string;
  description: string | null;
  normalizedSummary: string | null;
  memoryId: string | null;
  remindAt: string;
  timezone: string;
  repeat: {
    type: 'none' | 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  status: ApiReminderStatus;
  createdAt?: string;
  updatedAt?: string;
}

const getAuthHeaders = (token: string) => {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const fetchReminders = async (
  token: string,
  status: 'pending' | 'completed' | 'missed' | 'all',
): Promise<ApiReminder[]> => {
  const response = await fetch(`${API_BASE_URL}/reminders?status=${status}`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch reminders.');
  }

  return data.reminders ?? [];
};

export const completeReminder = async (
  token: string,
  reminderId: string,
): Promise<ApiReminder> => {
  const response = await fetch(
    `${API_BASE_URL}/reminders/${reminderId}/complete`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(token),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to complete reminder.');
  }

  return data.reminder;
};

export const deleteReminder = async (
  token: string,
  reminderId: string,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to delete reminder.');
  }
};

export const updateReminder = async (
  token: string,
  reminderId: string,
  payload: {
    title?: string;
    description?: string | null;
    remindAt?: string;
    timezone?: string;
    repeat?: {
      type: 'none' | 'daily' | 'weekly' | 'monthly';
      interval: number;
    };
  },
): Promise<ApiReminder> => {
  const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to update reminder.');
  }

  return data.reminder;
};