import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { setToken } from '../../../services/api';

const STAFF_KEY = 'erp_staff_profile';

export function getStoredProfile() {
  const raw = localStorage.getItem(STAFF_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function useLogin() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload) => login(payload),
    onSuccess: (result) => {
      setToken(result.token);
      const profile = { fullName: result.fullName, email: result.email, role: result.role };
      localStorage.setItem(STAFF_KEY, JSON.stringify(profile));
      navigate('/staff/question-bank');
    },
  });
}