import axios, {AxiosRequestConfig, Method} from 'axios';
import auth from '@react-native-firebase/auth';

export const API_BASE_URL =
  'https://lipogrammatic-allyson-nonstudiously.ngrok-free.dev/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

apiClient.interceptors.request.use(async config => {
  const currentUser = auth().currentUser;

  if (currentUser) {
    const token = await currentUser.getIdToken();

    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    } as any;
  }

  return config;
});

interface ApiRequestOptions {
  method?: Method;
  token?: string;
  body?: unknown;
  params?: Record<string, unknown>;
}

export const apiRequest = async <T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  try {
    const config: AxiosRequestConfig = {
      url,
      method: options.method ?? 'GET',
      params: options.params,
      data: options.body,
      headers: {
        'ngrok-skip-browser-warning': 'true',
        ...(options.token
          ? {
              Authorization: `Bearer ${options.token}`,
            }
          : {}),
      },
    };

    const response = await apiClient.request(config);

    return response.data as T;
  } catch (error: any) {
    console.log('API ERROR URL:', url);
    console.log('API ERROR STATUS:', error?.response?.status);
    console.log('API ERROR DATA:', error?.response?.data);
    console.log('API ERROR MESSAGE:', error?.message);

    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Something went wrong.';

    throw new Error(backendMessage);
  }
};