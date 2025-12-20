import { Progress } from "@odis-ai/ui/progress";
import type { Step } from "../types";

interface StepProgressProps {
  currentStep: Step;
}

export function StepProgress({ currentStep }: StepProgressProps) {
  const stepProgress =
    currentStep === "select"
      ? 20
      : currentStep === "schedule"
        ? 40
        : currentStep === "review"
          ? 60
          : currentStep === "processing"
            ? 80
            : 100;

  const stepNumber =
    currentStep === "select"
      ? 1
      : currentStep === "schedule"
        ? 2
        : currentStep === "review"
          ? 3
          : currentStep === "processing"
            ? 4
            : 5;

  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground text-sm">
        Step {stepNumber} of 5
      </div>
      <div className="w-32">
        <Progress value={stepProgress} className="h-2" />
      </div>
    </div>
  );
}
