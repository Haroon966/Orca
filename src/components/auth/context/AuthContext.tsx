import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../../../utils/api';
import type {
  AuthContextValue,
  AuthProviderProps,
  AuthUser,
  OnboardingStatusPayload,
} from '../types';
import { parseJsonSafely } from '../utils';

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user] = useState<AuthUser>({ username: 'local' });
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const response = await api.user.onboardingStatus();
      if (!response.ok) {
        return;
      }

      const payload = await parseJsonSafely<OnboardingStatusPayload>(response);
      setHasCompletedOnboarding(Boolean(payload?.hasCompletedOnboarding));
    } catch (caughtError) {
      console.error('Error checking onboarding status:', caughtError);
      setHasCompletedOnboarding(true);
    }
  }, []);

  const refreshOnboardingStatus = useCallback(async () => {
    await checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  useEffect(() => {
    void checkOnboardingStatus().finally(() => {
      setIsLoading(false);
    });
  }, [checkOnboardingStatus]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      hasCompletedOnboarding,
      refreshOnboardingStatus,
    }),
    [hasCompletedOnboarding, isLoading, refreshOnboardingStatus, user],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
