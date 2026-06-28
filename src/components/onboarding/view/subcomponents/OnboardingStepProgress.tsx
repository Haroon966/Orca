import { Check, FolderOpen, GitBranch, HeartPulse, LogIn, Plug, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type OnboardingStepProgressProps = {
  currentStep: number;
};

const STEP_ICONS = [GitBranch, LogIn, FolderOpen, Plug, Sparkles, HeartPulse];

export default function OnboardingStepProgress({ currentStep }: OnboardingStepProgressProps) {
  const { t } = useTranslation('onboarding');

  const onboardingSteps = [
    { title: t('steps.git'), required: true },
    { title: t('steps.agents'), required: false },
    { title: t('steps.projects'), required: false },
    { title: t('steps.mcp'), required: false },
    { title: t('steps.features'), required: false },
    { title: t('steps.health'), required: false },
  ];

  return (
    <div className="mb-8 overflow-x-auto">
      <div className="flex min-w-[640px] items-center justify-between">
        {onboardingSteps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const Icon = STEP_ICONS[index] ?? Check;

          return (
            <div key={step.title} className="contents">
              <div className="flex flex-1 flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                    isCompleted
                      ? 'border-green-500 bg-green-500 text-white'
                      : isActive
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>

                <div className="mt-2 max-w-[88px] text-center">
                  <p className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </p>
                  {step.required ? (
                    <span className="text-[10px] text-red-500">{t('required')}</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{t('optional')}</span>
                  )}
                </div>
              </div>

              {index < onboardingSteps.length - 1 && (
                <div className={`mx-1 h-0.5 w-full max-w-[24px] flex-1 transition-colors duration-200 ${isCompleted ? 'bg-green-500' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
