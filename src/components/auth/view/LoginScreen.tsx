import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AUTH_TOKEN_KEY } from '../../../constants/auth';
import { ORCA_PRODUCT_NAME } from '../../../config/orca';
import AuthErrorAlert from './AuthErrorAlert';
import AuthInputField from './AuthInputField';
import AuthScreenLayout from './AuthScreenLayout';

type LoginScreenProps = {
  needsSetup: boolean;
  onAuthenticated: () => void;
};

export default function LoginScreen({ needsSetup, onAuthenticated }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (needsSetup && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (needsSetup && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = needsSetup ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Authentication failed');
      }

      if (payload.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
      }

      onAuthenticated();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      title={needsSetup ? `Set up ${ORCA_PRODUCT_NAME}` : `Sign in to ${ORCA_PRODUCT_NAME}`}
      description={
        needsSetup
          ? 'Create an admin account to protect Orca on your network.'
          : 'Enter your credentials to continue.'
      }
      footerText={needsSetup ? 'You can change credentials later in the database.' : 'Protected self-hosted instance'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInputField
          id="username"
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="admin"
          isDisabled={isSubmitting}
          autoComplete="username"
        />
        <AuthInputField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          isDisabled={isSubmitting}
          autoComplete={needsSetup ? 'new-password' : 'current-password'}
        />
        {needsSetup && (
          <AuthInputField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            isDisabled={isSubmitting}
            autoComplete="new-password"
          />
        )}

        {error && <AuthErrorAlert errorMessage={error} />}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {needsSetup ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </AuthScreenLayout>
  );
}
