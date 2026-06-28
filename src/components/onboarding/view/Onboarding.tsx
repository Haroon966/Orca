import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authenticatedFetch } from '../../../utils/api';
import { useProviderAuthStatus } from '../../provider-auth/hooks/useProviderAuthStatus';
import ProviderLoginModal from '../../provider-auth/view/ProviderLoginModal';
import AgentConnectionsStep from './subcomponents/AgentConnectionsStep';
import GitConfigurationStep from './subcomponents/GitConfigurationStep';
import OnboardingStepProgress from './subcomponents/OnboardingStepProgress';
import HealthCheckStep from './steps/HealthCheckStep';
import McpIntroStep from './steps/McpIntroStep';
import PowerFeaturesStep from './steps/PowerFeaturesStep';
import ProjectDiscoveryStep from './steps/ProjectDiscoveryStep';
import {
  gitEmailPattern,
  readErrorMessageFromResponse,
} from './utils';

const LAST_STEP = 5;

type OnboardingProps = {
  onComplete?: () => void | Promise<void>;
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useTranslation('onboarding');
  const [currentStep, setCurrentStep] = useState(0);
  const [gitName, setGitName] = useState('');
  const [gitEmail, setGitEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeClaudeLogin, setActiveClaudeLogin] = useState(false);
  const {
    providerAuthStatus,
    checkProviderAuthStatus,
    refreshProviderAuthStatuses,
  } = useProviderAuthStatus();

  const previousActiveLoginRef = useRef<boolean | undefined>(undefined);

  const loadGitConfig = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/user/git-config');
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { gitName?: string; gitEmail?: string };
      if (payload.gitName) {
        setGitName(payload.gitName);
      }
      if (payload.gitEmail) {
        setGitEmail(payload.gitEmail);
      }
    } catch (caughtError) {
      console.error('Error loading git config:', caughtError);
    }
  }, []);

  useEffect(() => {
    void loadGitConfig();
    void refreshProviderAuthStatuses(['claude']);
  }, [loadGitConfig, refreshProviderAuthStatuses]);

  useEffect(() => {
    const previousActive = previousActiveLoginRef.current;
    previousActiveLoginRef.current = activeClaudeLogin;

    if (previousActive && !activeClaudeLogin) {
      void refreshProviderAuthStatuses(['claude']);
    }
  }, [activeClaudeLogin, refreshProviderAuthStatuses]);

  const handleClaudeLoginOpen = () => {
    setActiveClaudeLogin(true);
  };

  const handleLoginComplete = (exitCode: number) => {
    if (exitCode === 0) {
      void checkProviderAuthStatus('claude');
    }
  };

  const handleNextStep = async () => {
    setErrorMessage('');

    if (currentStep !== 0) {
      setCurrentStep((previous) => Math.min(previous + 1, LAST_STEP));
      return;
    }

    if (!gitName.trim() || !gitEmail.trim()) {
      setErrorMessage('Both git name and email are required.');
      return;
    }

    if (!gitEmailPattern.test(gitEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authenticatedFetch('/api/user/git-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitName, gitEmail }),
      });

      if (!response.ok) {
        const message = await readErrorMessageFromResponse(response, 'Failed to save git configuration');
        throw new Error(message);
      }

      setCurrentStep((previous) => previous + 1);
    } catch (caughtError) {
      setErrorMessage(caughtError instanceof Error ? caughtError.message : 'Failed to save git configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviousStep = () => {
    setErrorMessage('');
    setCurrentStep((previous) => Math.max(previous - 1, 0));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await authenticatedFetch('/api/user/complete-onboarding', { method: 'POST' });
      if (!response.ok) {
        const message = await readErrorMessageFromResponse(response, 'Failed to complete onboarding');
        throw new Error(message);
      }

      await onComplete?.();
    } catch (caughtError) {
      setErrorMessage(caughtError instanceof Error ? caughtError.message : 'Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrentStepValid = currentStep === 0
    ? Boolean(gitName.trim() && gitEmail.trim() && gitEmailPattern.test(gitEmail))
    : true;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <GitConfigurationStep
            gitName={gitName}
            gitEmail={gitEmail}
            isSubmitting={isSubmitting}
            onGitNameChange={setGitName}
            onGitEmailChange={setGitEmail}
          />
        );
      case 1:
        return (
          <AgentConnectionsStep
            claudeStatus={providerAuthStatus.claude}
            onOpenClaudeLogin={handleClaudeLoginOpen}
          />
        );
      case 2:
        return <ProjectDiscoveryStep />;
      case 3:
        return <McpIntroStep />;
      case 4:
        return <PowerFeaturesStep />;
      case 5:
        return <HealthCheckStep />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-2xl">
          <OnboardingStepProgress currentStep={currentStep} />

          <div className="rounded-lg border border-border bg-card p-8 shadow-lg">
            {renderStep()}

            {errorMessage && (
              <div className="mt-6 rounded-lg border border-red-300 bg-red-100 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep === 0 || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('previous')}
              </button>

              <div className="flex items-center gap-3">
                {currentStep < LAST_STEP ? (
                  <button
                    onClick={handleNextStep}
                    disabled={!isCurrentStepValid || isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('saving')}
                      </>
                    ) : (
                      <>
                        {currentStep === 0 ? t('next') : t('skip')}
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('completing')}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {t('finish')}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeClaudeLogin && (
        <ProviderLoginModal
          isOpen={activeClaudeLogin}
          onClose={() => setActiveClaudeLogin(false)}
          provider="claude"
          onComplete={handleLoginComplete}
        />
      )}
    </>
  );
}
