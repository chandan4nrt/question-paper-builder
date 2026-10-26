import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '../../auth/hooks/useAuth';
import { extractErrorMessage } from '../../../services/api';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(loginSchema) });
  const loginMutation = useLogin();

  return (
    <div className="app-shell login-shell">
      <div className="login-wrapper">
        <div className="card login-card">
          <div className="login-header">
            <span className="app-logo login-logo">📚</span>
            <h1 className="login-title">Question Bank</h1>
            <p className="muted text-sm">Staff Portal — Sign in to continue</p>
          </div>
          <form onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
            <label className="field">
              <span>Email</span>
              <input type="email" {...register('email')} />
              {formState.errors.email && <span className="error-text">{formState.errors.email.message}</span>}
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" {...register('password')} />
              {formState.errors.password && <span className="error-text">{formState.errors.password.message}</span>}
            </label>
            <button type="submit" className="btn-block" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
            </button>
            {loginMutation.isError && (
              <div className="alert alert-error login-alert">{extractErrorMessage(loginMutation.error)}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}