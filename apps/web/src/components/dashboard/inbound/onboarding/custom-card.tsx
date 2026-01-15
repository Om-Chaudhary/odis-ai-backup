import type { CardComponentProps } from "onborda";
import { Button } from "@odis-ai/shared/ui";

/**
 * Custom onboarding card component with glassmorphism styling
 *
 * Matches the dashboard's visual theme:
 * - Teal accent colors (teal-500, teal-600)
 * - Glassmorphism with backdrop blur
 * - Gradient backgrounds
 * - Soft shadows
 */
export function CustomOnboardingCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) {
  return (
    <div className="relative max-w-[400px] min-w-[320px] rounded-lg border border-teal-200/50 bg-gradient-to-br from-white/95 via-teal-50/30 to-white/95 p-6 shadow-xl shadow-teal-500/20 backdrop-blur-xl">
      {arrow}

      {step.icon && (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-600">
          {step.icon}
        </div>
      )}

      <h3 className="mb-2 text-lg font-semibold text-gray-900">{step.title}</h3>

      <p className="mb-4 text-sm text-gray-600">{step.content}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Step {currentStep + 1} of {totalSteps}
        </span>

        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button variant="ghost" size="sm" onClick={prevStep}>
              Back
            </Button>
          )}
          <Button variant="default" size="sm" onClick={nextStep}>
            {currentStep === totalSteps - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
