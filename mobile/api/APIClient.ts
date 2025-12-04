import axios from 'axios';
import { getApiBaseUrl } from '../utils/getApiBaseUrl';

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  // const token = await SecureStore.getItemAsync('userToken');
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;