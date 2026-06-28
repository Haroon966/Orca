import type { ReactNode } from 'react';

export type AuthUser = {
  id?: number | string;
  username: string;
  [key: string]: unknown;
};

export type OnboardingStatusPayload = {
  hasCompletedOnboarding?: boolean;
};

export type ApiErrorPayload = {
  error?: string;
  message?: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  refreshOnboardingStatus: () => Promise<void>;
  isAuthenticated: boolean;
  authRequired: boolean;
  needsSetup: boolean;
  refreshAuth: () => Promise<void>;
};

export type AuthProviderProps = {
  children: ReactNode;
};
