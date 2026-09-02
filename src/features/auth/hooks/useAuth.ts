import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login, type LoginPayload } from '../api/authApi';
import { setToken } from '../../../services/api';

const STAFF_KEY = 'erp_staff_profile';

export interface StaffProfile {
  fullName: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'REVIEWER';
}

export function getStoredProfile(): StaffProfile | null {
  const raw = localStorage.getItem(STAFF_KEY);
  return raw ? (JSON.parse(raw) as StaffProfile) : null;
}

export function useLogin() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (result) => {
      setToken(result.token);
      const profile: StaffProfile = { fullName: result.fullName, email: result.email, role: result.role };
      localStorage.setItem(STAFF_KEY, JSON.stringify(profile));
      navigate('/staff/question-bank');
    },
  });
}
