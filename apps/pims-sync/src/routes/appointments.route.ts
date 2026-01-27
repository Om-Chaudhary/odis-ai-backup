/**
 * Appointment Routes
 *
 * API routes for PIMS appointment operations.
 *
 * Endpoints:
 * - POST /api/appointments/search-patient - Search for existing patients
 * - POST /api/appointments/create         - Create appointment (existing or new client)
 * - POST /api/appointments/cancel         - Cancel appointment
 * - POST /api/appointments/reschedule     - Cancel old + create new (atomic reschedule)
 */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { apiKeyAuth, type AuthenticatedRequest } from "../middleware";
import { createProviderForClinic } from "../services";
import { buildErrorResponse, extractErrorMessage } from "../lib/response";
import { calculateEndTime } from "../lib/date-utils";

export const appointmentsRouter: ReturnType<typeof Router> = Router();

// Apply API key authentication
appointmentsRouter.use((req: Request, res: Response, next: NextFunction) => {
    void apiKeyAuth()(req, res, next);
});

/* ========================================
   Request body types
   ======================================== */

interface SearchPatientRequest {
    query: string;
    limit?: number;
}

interface CreateAppointmentRequest {
    // For existing patients
    patientId?: string;
    clientId?: string;

    // For new clients/patients
    isNewClient?: boolean;
    newClient?: {
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
    };
    newPatient?: {
        name: string;
        species: string;
        breed?: string;
    };

    // Appointment details (required)
    date: string;       // YYYY-MM-DD
    startTime: string;  // HH:MM
    endTime?: string;   // HH:MM (defaults to startTime + 15min)
    reason: string;
    note?: string;

    // Optional IDEXX-specific fields
    providerId?: string;
    appointmentTypeId?: string;
    roomId?: string;
}

interface CancelAppointmentRequest {
    appointmentId: string;  // IDEXX Neo appointment ID
    reason?: string;
}

interface RescheduleAppointmentRequest {
    // Original appointment to cancel
    cancelAppointmentId: string;

    // New appointment details
    patientId: string;
    clientId?: string;
    date: string;
    startTime: string;
    endTime?: string;
    reason: string;
    note?: string;
    providerId?: string;
    appointmentTypeId?: string;
    roomId?: string;
}

/* ========================================
   POST /api/appointments/search-patient
   ======================================== */

appointmentsRouter.post("/search-patient", (req: Request, res: Response) => {
    void handleSearchPatient(req as AuthenticatedRequest, res);
});

async function handleSearchPatient(
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> {
    const startTime = Date.now();
    const { clinic } = req;
    const body = req.body as SearchPatientRequest;

    if (!body.query) {
        res.status(400).json({
            success: false,
            error: "query is required",
            timestamp: new Date().toISOString(),
        });
        return;
    }

    logger.info("Searching patients", { clinicId: clinic.id, query: body.query });

    try {
        const { provider, cleanup } = await createProviderForClinic(clinic.id, { authenticate: true });

        try {
            const result = await provider.searchPatient({
                query: body.query,
                limit: body.limit ?? 10,
            });

            logger.info("Patient search completed", {
                clinicId: clinic.id,
                query: body.query,
                found: result.patients.length,
            });

            res.status(200).json({
                success: true,
                patients: result.patients,
                totalCount: result.totalCount,
                durationMs: Date.now() - startTime,
                timestamp: new Date().toISOString(),
            });
        } finally {
            await cleanup();
        }
    } catch (error) {
        logger.error("Patient search failed", { clinicId: clinic.id, error: extractErrorMessage(error) });
        res.status(500).json(buildErrorResponse(error, startTime));
    }
}

/* ========================================
   POST /api/appointments/create
   ======================================== */

appointmentsRouter.post("/create", (req: Request, res: Response) => {
    void handleCreateAppointment(req as AuthenticatedRequest, res);
});

async function handleCreateAppointment(
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> {
    const startTime = Date.now();
    const { clinic } = req;
    const body = req.body as CreateAppointmentRequest;

    // Validate required fields
    if (!body.date || !body.startTime || !body.reason) {
        res.status(400).json({
            success: false,
            error: "date, startTime, and reason are required",
            timestamp: new Date().toISOString(),
        });
        return;
    }

    // Determine if new client or existing
    const isNewClient = body.isNewClient ?? false;

    if (isNewClient && (!body.newClient || !body.newPatient)) {
        res.status(400).json({
            success: false,
            error: "newClient and newPatient are required for new clients",
            timestamp: new Date().toISOString(),
        });
        return;
    }

    if (!isNewClient && !body.patientId) {
        res.status(400).json({
            success: false,
            error: "patientId is required for existing clients",
            timestamp: new Date().toISOString(),
        });
        return;
    }

    logger.info("Creating appointment", {
        clinicId: clinic.id,
        isNewClient,
        date: body.date,
        time: body.startTime,
    });

    try {
        const { provider, cleanup } = await createProviderForClinic(clinic.id, { authenticate: true });

        try {
            // Calculate end time if not provided (default 15 minutes)
            const endTime = body.endTime ?? calculateEndTime(body.startTime, 15);

            let result;

            if (isNewClient) {
                // Create appointment with new client/patient
                result = await provider.createAppointmentWithNewClient({
                    newClient: body.newClient!,
                    newPatient: body.newPatient!,
                    date: body.date,
                    startTime: body.startTime,
                    endTime,
                    reason: body.reason,
                    note: body.note,
                    providerId: body.providerId,
                    appointmentTypeId: body.appointmentTypeId,
                    roomId: body.roomId,
                });
                logger.debug("Create appointment with new client result", { result });
            } else {
                // Create appointment for existing patient
                result = await provider.createAppointment({
                    patientId: body.patientId!,
                    clientId: body.clientId,
                    date: body.date,
                    startTime: body.startTime,
                    endTime,
                    reason: body.reason,
                    note: body.note,
                    providerId: body.providerId,
                    appointmentTypeId: body.appointmentTypeId,
                    roomId: body.roomId,
                });
                logger.debug("Create appointment for existing patient result", { result });
            }

            logger.info("Appointment creation completed", {
                clinicId: clinic.id,
                success: result.success,
                appointmentId: result.appointmentId,
            });

            res.status(result.success ? 200 : 400).json({
                ...result,
                durationMs: Date.now() - startTime,
                timestamp: new Date().toISOString(),
            });
        } finally {
            await cleanup();
        }
    } catch (error) {
        logger.error("Appointment creation failed", { clinicId: clinic.id, error: extractErrorMessage(error) });
        res.status(500).json(buildErrorResponse(error, startTime));
    }
}

/* ========================================
   POST /api/appointments/cancel
   ======================================== */

appointmentsRouter.post("/cancel", (req: Request, res: Response) => {
    void handleCancelAppointment(req as AuthenticatedRequest, res);
});

async function handleCancelAppointment(
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> {
    const startTime = Date.now();
    const { clinic } = req;
    const body = req.body as CancelAppointmentRequest;

    if (!body.appointmentId) {
        res.status(400).json({
            success: false,
            error: "appointmentId is required",
            timestamp: new Date().toISOString(),
        });
        return;
    }

    logger.info("Cancelling appointment", {
        clinicId: clinic.id,
        appointmentId: body.appointmentId,
    });

    try {
        const { provider, cleanup } = await createProviderForClinic(clinic.id, { authenticate: true });

        try {
            const result = await provider.cancelAppointment({
                appointmentId: body.appointmentId,
                action: "cancel",
                reason: body.reason ?? "Cancelled via phone",
            });

            logger.info("Appointment cancellation completed", {
                clinicId: clinic.id,
                appointmentId: body.appointmentId,
                success: result.success,
            });

            res.status(result.success ? 200 : 400).json({
                ...result,
                durationMs: Date.now() - startTime,
                timestamp: new Date().toISOString(),
            });
        } finally {
            await cleanup();
        }
    } catch (error) {
        logger.error("Appointment cancellation failed", {
            clinicId: clinic.id,
            appointmentId: body.appointmentId,
            error: extractErrorMessage(error),
        });

        res.status(500).json(buildErrorResponse(error, startTime));
    }
}

/* ========================================
   POST /api/appointments/reschedule
   ======================================== */

appointmentsRouter.post("/reschedule", (req: Request, res: Response) => {
    void handleRescheduleAppointment(req as AuthenticatedRequest, res);
});

async function handleRescheduleAppointment(
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> {
    const startTime = Date.now();
    const { clinic } = req;
    const body = req.body as RescheduleAppointmentRequest;

    // Validate required fields
    if (!body.cancelAppointmentId || !body.patientId || !body.date || !body.startTime || !body.reason) {
        res.status(400).json({
            success: false,
            error: "cancelAppointmentId, patientId, date, startTime, and reason are required",
            timestamp: new Date().toISOString(),
        });
        return;
    }

    logger.info("Rescheduling appointment", {
        clinicId: clinic.id,
        cancelAppointmentId: body.cancelAppointmentId,
        newDate: body.date,
        newTime: body.startTime,
    });

    try {
        const { provider, cleanup } = await createProviderForClinic(clinic.id, { authenticate: true });

        try {
            // Step 1: Cancel original appointment
            const cancelResult = await provider.cancelAppointment({
                appointmentId: body.cancelAppointmentId,
                action: "cancel",
                reason: "Rescheduled via phone",
            });

            if (!cancelResult.success) {
                logger.error("Failed to cancel original appointment during reschedule", {
                    clinicId: clinic.id,
                    appointmentId: body.cancelAppointmentId,
                    error: cancelResult.error,
                });

                res.status(400).json({
                    success: false,
                    error: cancelResult.error ?? "Failed to cancel original appointment",
                    phase: "cancel",
                    durationMs: Date.now() - startTime,
                    timestamp: new Date().toISOString(),
                });
                return;
            }

            // Step 2: Create new appointment
            const endTime = body.endTime ?? calculateEndTime(body.startTime, 15);

            const createResult = await provider.createAppointment({
                patientId: body.patientId,
                clientId: body.clientId,
                date: body.date,
                startTime: body.startTime,
                endTime,
                reason: body.reason,
                note: body.note,
                providerId: body.providerId,
                appointmentTypeId: body.appointmentTypeId,
                roomId: body.roomId,
            });

            if (!createResult.success) {
                // Rollback: Log the failure (can't uncancel in IDEXX)
                logger.error("Failed to create new appointment during reschedule - ROLLBACK NEEDED", {
                    clinicId: clinic.id,
                    cancelledAppointmentId: body.cancelAppointmentId,
                    error: createResult.error,
                });

                res.status(400).json({
                    success: false,
                    error: createResult.error ?? "Failed to create new appointment",
                    phase: "create",
                    cancelledAppointmentId: body.cancelAppointmentId,
                    rollbackRequired: true,
                    durationMs: Date.now() - startTime,
                    timestamp: new Date().toISOString(),
                });
                return;
            }

            logger.info("Appointment reschedule completed", {
                clinicId: clinic.id,
                cancelledAppointmentId: body.cancelAppointmentId,
                newAppointmentId: createResult.appointmentId,
            });

            res.status(200).json({
                success: true,
                cancelledAppointmentId: body.cancelAppointmentId,
                newAppointmentId: createResult.appointmentId,
                durationMs: Date.now() - startTime,
                timestamp: new Date().toISOString(),
            });
        } finally {
            await cleanup();
        }
    } catch (error) {
        logger.error("Appointment reschedule failed", {
            clinicId: clinic.id,
            error: extractErrorMessage(error),
        });

        res.status(500).json(buildErrorResponse(error, startTime));
    }
}

