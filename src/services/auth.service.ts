import api, { setToken } from './api';
import { User } from '../types';

export const loginApi = async (email: string, password: string): Promise<{ token: string; user: User }> => {
  const res = await api.post('/auth/login', { email, password });
  const token = res?.data?.token ?? '';
  const user = res?.data?.user ?? { id: '', email: '', name: '' };
  await setToken(token);
  return { token, user };
};

export const signupApi = async (email: string, password: string, name: string): Promise<{ token: string; user: User }> => {
  const res = await api.post('/signup', { email, password, name });
  const token = res?.data?.token ?? '';
  const user = res?.data?.user ?? { id: '', email: '', name: '' };
  await setToken(token);
  return { token, user };
};

export const getMeApi = async (): Promise<User> => {
  const res = await api.get('/auth/me');
  return res?.data?.user ?? { id: '', email: '', name: '' };
};

export const logoutAction = async () => {
  await setToken(null);
};
