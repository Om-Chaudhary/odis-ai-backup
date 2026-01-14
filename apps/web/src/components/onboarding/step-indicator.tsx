interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({
  currentStep,
  totalSteps,
}: StepIndicatorProps) {
  return (
    <div className="mb-6 flex items-center justify-center space-x-4">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg"
                  : isCompleted
                    ? "bg-teal-600 text-white"
                    : "bg-white/20 text-slate-200"
              } `}
            >
              {isCompleted ? (
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                stepNumber
              )}
            </div>

            {stepNumber < totalSteps && (
              <div
                className={`ml-4 h-0.5 w-12 transition-all duration-300 ${
                  isCompleted ? "bg-teal-600" : "bg-white/20"
                } `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
