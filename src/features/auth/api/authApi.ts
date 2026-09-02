import { api } from '../../../services/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'REVIEWER';
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await api.post<LoginResult>('/auth/login', payload);
  return data;
}
