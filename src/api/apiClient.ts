import axios from 'axios';
import auth from '@react-native-firebase/auth';

export const API_BASE_URL = 'https://lipogrammatic-allyson-nonstudiously.ngrok-free.dev/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async config => {
  const currentUser = auth().currentUser;

  if (currentUser) {
    const token = await currentUser.getIdToken();

    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});