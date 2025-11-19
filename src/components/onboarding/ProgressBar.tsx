// src/components/onboarding/ProgressBar.tsx

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const percentage = (currentStep / totalSteps) * 100;

  const steps = [
    { number: 1, label: 'Dados Básicos' },
    { number: 2, label: 'Atividades' },
    { number: 3, label: 'Cliente Ideal' },
    { number: 4, label: 'Situação Atual' },
    { number: 5, label: 'Histórico' },
  ];

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: `${percentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
          />
        </div>
      </div>

      {/* Step Labels */}
      <div className="flex justify-between">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`flex flex-col items-center ${
              step.number <= currentStep ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                step.number < currentStep
                  ? 'bg-blue-600 text-white'
                  : step.number === currentStep
                  ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.number < currentStep ? '✓' : step.number}
            </div>
            <span className="text-xs font-medium hidden sm:block">
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

