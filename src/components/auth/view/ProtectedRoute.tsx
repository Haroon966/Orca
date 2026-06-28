import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import Onboarding from '../../onboarding/view/Onboarding';
import AuthLoadingScreen from './AuthLoadingScreen';
import LoginScreen from './LoginScreen';

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const {
    isLoading,
    hasCompletedOnboarding,
    refreshOnboardingStatus,
    isAuthenticated,
    authRequired,
    needsSetup,
    refreshAuth,
  } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (authRequired && !isAuthenticated) {
    return <LoginScreen needsSetup={needsSetup} onAuthenticated={refreshAuth} />;
  }

  if (!hasCompletedOnboarding) {
    return <Onboarding onComplete={refreshOnboardingStatus} />;
  }

  return <>{children}</>;
}
