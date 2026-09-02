import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '../../auth/hooks/useAuth';
import { extractErrorMessage } from '../../../services/api';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { register, handleSubmit, formState } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const loginMutation = useLogin();

  return (
    <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 1rem' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span className="app-logo" style={{ width: 44, height: 44, fontSize: 22, marginBottom: '0.75rem' }}>📚</span>
            <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Question Bank</h1>
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
              <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{extractErrorMessage(loginMutation.error)}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}