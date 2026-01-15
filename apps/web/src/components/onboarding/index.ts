/**
 * Onboarding Components
 *
 * Multi-step onboarding flow for new users:
 * 1. Path Selection - Choose to create clinic or join via invitation
 * 2. Clinic Creation - Extended form with PIMS, business hours, etc.
 * 3. Invitation Accepted - Accept invitation and join existing clinic
 * 4. Profile Setup - Complete user profile with name, role, license
 */

// New onboarding flow components
export { OnboardingFlow } from "./onboarding-flow";
export { PathSelection } from "./steps/path-selection";
export { ClinicCreation } from "./steps/clinic-creation";
export { InvitationAccepted } from "./steps/invitation-accepted";
export { ProfileSetup } from "./steps/profile-setup";

// Legacy exports (to be removed in Phase 6)
export * from "./account-step";
export * from "./onboarding-container";
