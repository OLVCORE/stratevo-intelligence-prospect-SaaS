// src/components/onboarding/ProgressBar.tsx

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export function ProgressBar({ currentStep, totalSteps, onStepClick }: ProgressBarProps) {
  const percentage = (currentStep / totalSteps) * 100;

  const steps = [
    { number: 1, label: 'Dados Básicos' },
    { number: 2, label: 'Atividades' },
    { number: 3, label: 'Cliente Ideal' },
    { number: 4, label: 'Diferenciais' },
    { number: 5, label: 'ICP Benchmarking' },
    { number: 6, label: 'Revisão' },
  ];

  const handleStepClick = (stepNumber: number) => {
    if (onStepClick && stepNumber !== currentStep) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-muted">
          <div
            style={{ width: `${percentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-primary-foreground justify-center bg-primary transition-all duration-500"
          />
        </div>
      </div>

      {/* Step Labels */}
      <div className="flex justify-between">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`flex flex-col items-center ${
              step.number <= currentStep ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <button
              type="button"
              onClick={() => handleStepClick(step.number)}
              disabled={!onStepClick}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${
                step.number < currentStep
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                  : step.number === currentStep
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 cursor-default'
                  : onStepClick
                  ? 'bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              title={onStepClick && step.number !== currentStep ? `Ir para ${step.label}` : step.label}
            >
              {step.number < currentStep ? '✓' : step.number}
            </button>
            <span className="text-xs font-medium hidden sm:block">
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

