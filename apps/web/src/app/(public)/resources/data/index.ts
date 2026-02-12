// Re-export types
export type { ResourcePageData } from "./types";

// Re-export individual resources
export { aahaDischargeInstructions } from "./aaha-discharge-instructions";
export { veterinaryDischargeInstructionsTemplate } from "./veterinary-discharge-instructions-template";
export { veterinaryClientCommunicationGuide } from "./veterinary-client-communication-guide";
export { veterinaryClientComplianceGuide } from "./veterinary-client-compliance-guide";
export { veterinaryMissedCallsCost } from "./veterinary-missed-calls-cost";
export { veterinaryAnsweringServiceCostGuide } from "./veterinary-answering-service-cost-guide";
export { veterinaryPracticeAutomationGuide } from "./veterinary-practice-automation-guide";
export { afterHoursVeterinaryAnsweringService } from "./after-hours-veterinary-answering-service";
export { veterinaryDentalDischargeInstructions } from "./veterinary-dental-discharge-instructions";
export { veterinarySurgeryDischargeInstructions } from "./veterinary-surgery-discharge-instructions";
export { veterinaryClientRetentionGuide } from "./veterinary-client-retention-guide";
export { bestVeterinaryAnsweringService } from "./best-veterinary-answering-service";
export { aiVeterinaryReceptionistGuide } from "./ai-veterinary-receptionist-guide";
export { veterinaryFrontDeskOverwhelm } from "./veterinary-front-desk-overwhelm";

// Aggregated data and slugs
import { aahaDischargeInstructions } from "./aaha-discharge-instructions";
import { veterinaryDischargeInstructionsTemplate } from "./veterinary-discharge-instructions-template";
import { veterinaryClientCommunicationGuide } from "./veterinary-client-communication-guide";
import { veterinaryClientComplianceGuide } from "./veterinary-client-compliance-guide";
import { veterinaryMissedCallsCost } from "./veterinary-missed-calls-cost";
import { veterinaryAnsweringServiceCostGuide } from "./veterinary-answering-service-cost-guide";
import { veterinaryPracticeAutomationGuide } from "./veterinary-practice-automation-guide";
import { afterHoursVeterinaryAnsweringService } from "./after-hours-veterinary-answering-service";
import { veterinaryDentalDischargeInstructions } from "./veterinary-dental-discharge-instructions";
import { veterinarySurgeryDischargeInstructions } from "./veterinary-surgery-discharge-instructions";
import { veterinaryClientRetentionGuide } from "./veterinary-client-retention-guide";
import { bestVeterinaryAnsweringService } from "./best-veterinary-answering-service";
import { aiVeterinaryReceptionistGuide } from "./ai-veterinary-receptionist-guide";
import { veterinaryFrontDeskOverwhelm } from "./veterinary-front-desk-overwhelm";
import type { ResourcePageData } from "./types";

export const resources: Record<string, ResourcePageData> = {
  "aaha-discharge-instructions": aahaDischargeInstructions,
  "veterinary-discharge-instructions-template":
    veterinaryDischargeInstructionsTemplate,
  "veterinary-client-communication-guide": veterinaryClientCommunicationGuide,
  "veterinary-client-compliance-guide": veterinaryClientComplianceGuide,
  "veterinary-missed-calls-cost": veterinaryMissedCallsCost,
  "veterinary-answering-service-cost-guide":
    veterinaryAnsweringServiceCostGuide,
  "veterinary-practice-automation-guide": veterinaryPracticeAutomationGuide,
  "after-hours-veterinary-answering-service":
    afterHoursVeterinaryAnsweringService,
  "veterinary-dental-discharge-instructions":
    veterinaryDentalDischargeInstructions,
  "veterinary-surgery-discharge-instructions":
    veterinarySurgeryDischargeInstructions,
  "veterinary-client-retention-guide": veterinaryClientRetentionGuide,
  "best-veterinary-answering-service": bestVeterinaryAnsweringService,
  "ai-veterinary-receptionist-guide": aiVeterinaryReceptionistGuide,
  "veterinary-front-desk-overwhelm": veterinaryFrontDeskOverwhelm,
};

export const resourceSlugs = Object.keys(resources);
