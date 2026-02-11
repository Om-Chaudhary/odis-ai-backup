// Re-export types
export type { SolutionPageData } from "./types";

// Re-export individual solutions
export { veterinaryAnsweringService } from "./veterinary-answering-service";
export { afterHoursAnswering } from "./after-hours-answering";
export { dischargeFollowUp } from "./discharge-follow-up";
export { emergencyCallCenter } from "./emergency-call-center";
export { aiVeterinaryReceptionist } from "./ai-veterinary-receptionist";

// Aggregated data and slugs
import { veterinaryAnsweringService } from "./veterinary-answering-service";
import { afterHoursAnswering } from "./after-hours-answering";
import { dischargeFollowUp } from "./discharge-follow-up";
import { emergencyCallCenter } from "./emergency-call-center";
import { aiVeterinaryReceptionist } from "./ai-veterinary-receptionist";
import type { SolutionPageData } from "./types";

export const solutions: Record<string, SolutionPageData> = {
  "veterinary-answering-service": veterinaryAnsweringService,
  "after-hours-answering": afterHoursAnswering,
  "discharge-follow-up": dischargeFollowUp,
  "emergency-call-center": emergencyCallCenter,
  "ai-veterinary-receptionist": aiVeterinaryReceptionist,
};

export const solutionSlugs = Object.keys(solutions) as string[];
