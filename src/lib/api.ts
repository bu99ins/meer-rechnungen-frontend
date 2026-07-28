import axios, { AxiosInstance } from 'axios';
import { getAccessToken } from './session';

let api: AxiosInstance;

export function getApi(): AxiosInstance {
  if (!api) {
    api = axios.create({
      baseURL: axios.defaults.baseURL || '',
      headers: { 'Content-Type': 'application/json' },
    });
    api.interceptors.request.use((config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
      return config;
    });
  }
  return api;
}
