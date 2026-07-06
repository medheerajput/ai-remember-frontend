// const API_BASE_URL = 'http://10.0.2.2:5000/api/v1';
const API_BASE_URL = 'https://lipogrammatic-allyson-nonstudiously.ngrok-free.dev/api/v1';


interface ApiRequestParams {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
}

export const apiRequest = async <T>(
  path: string,
  {method = 'GET', token, body}: ApiRequestParams = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();

  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'Something went wrong');
  }

  return json.data as T;
};