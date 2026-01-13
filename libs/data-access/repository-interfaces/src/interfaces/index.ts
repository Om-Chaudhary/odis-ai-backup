/**
 * Repository Interfaces
 *
 * Contracts for database repository implementations.
 * Enable dependency injection, testability, and loose coupling.
 *
 * @example
 * ```ts
 * import type { ICallRepository } from '@odis-ai/data-access/db/interfaces';
 *
 * class CallService {
 *   constructor(private callRepo: ICallRepository) {}
 *
 *   async scheduleCall(data: CallInsert) {
 *     return this.callRepo.create(data);
 *   }
 * }
 * ```
 */

// Case repository
export type {
  ICasesRepository,
  CaseRow,
  CaseInsert,
  CaseUpdate,
  FindCasesOptions,
} from "./cases-repository.interface";

// Call repository
export type {
  ICallRepository,
  FindCallsOptions,
} from "./call-repository.interface";

// Email repository
export type {
  IEmailRepository,
  FindEmailsOptions,
} from "./email-repository.interface";

// User repository
export type {
  IUserRepository,
  UserSettings,
} from "./user-repository.interface";

// Client repository (pet owners)
export type {
  IClientRepository,
  ClientRow,
  ClientInsert,
  ClientUpdate,
  FindOrCreateClientInput,
  FindClientsOptions,
} from "./client-repository.interface";

// Canonical patient repository (unique pets per clinic)
export type {
  ICanonicalPatientRepository,
  CanonicalPatientRow,
  CanonicalPatientInsert,
  CanonicalPatientUpdate,
  FindOrCreateCanonicalPatientInput,
  FindCanonicalPatientsOptions,
} from "./canonical-patient-repository.interface";
