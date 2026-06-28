import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AUTH_TOKEN_KEY, DISABLE_AUTH } from '../../../constants/auth';
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
  const [user, setUser] = useState<AuthUser | null>(DISABLE_AUTH ? { username: 'local' } : null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [authRequired, setAuthRequired] = useState(!DISABLE_AUTH);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(DISABLE_AUTH);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      setAuthRequired(Boolean(payload.authRequired));
      setNeedsSetup(Boolean(payload.needsSetup));

      if (!payload.authRequired) {
        setIsAuthenticated(true);
        setUser({ username: 'local' });
        return;
      }

      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const userResponse = await api.auth.user();
      if (!userResponse.ok) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const userPayload = await userResponse.json();
      setUser(userPayload.user ?? null);
      setIsAuthenticated(true);
    } catch (caughtError) {
      console.error('Error checking auth status:', caughtError);
      if (DISABLE_AUTH) {
        setIsAuthenticated(true);
        setUser({ username: 'local' });
      }
    }
  }, []);

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

  const refreshAuth = useCallback(async () => {
    await checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    void checkAuthStatus()
      .then(() => checkOnboardingStatus())
      .finally(() => {
        setIsLoading(false);
      });
  }, [checkAuthStatus, checkOnboardingStatus]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      hasCompletedOnboarding,
      refreshOnboardingStatus,
      isAuthenticated,
      authRequired,
      needsSetup,
      refreshAuth,
    }),
    [
      authRequired,
      hasCompletedOnboarding,
      isAuthenticated,
      isLoading,
      needsSetup,
      refreshAuth,
      refreshOnboardingStatus,
      user,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
