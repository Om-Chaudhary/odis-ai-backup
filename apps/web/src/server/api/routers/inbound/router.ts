/**
 * Inbound Router
 *
 * Combines all inbound data procedures into a single router:
 * - Appointment requests (from VAPI schedule-appointment tool)
 * - Statistics for dashboard
 * - Call associations for linking calls to appointments
 */

import { createTRPCRouter } from "~/server/api/trpc";
import { listAppointmentsRouter } from "./procedures/list-appointments";
import { getStatsRouter } from "./procedures/get-stats";
import { updateAppointmentRouter } from "./procedures/update-appointment";
import { deleteAppointmentRouter } from "./procedures/delete-appointment";
import { callAssociationsRouter } from "./procedures/call-associations";
import { clinicScheduleRouter } from "./procedures/clinic-schedule";

export const inboundRouter = createTRPCRouter({
  // Queries
  listAppointmentRequests: listAppointmentsRouter.listAppointmentRequests,
  getInboundStats: getStatsRouter.getInboundStats,
  checkCallAppointmentAssociation:
    callAssociationsRouter.checkCallAppointmentAssociation,
  getCallerNameByPhone: callAssociationsRouter.getCallerNameByPhone,
  getBookingByVapiCallId: callAssociationsRouter.getBookingByVapiCallId,
  getClinicSchedule: clinicScheduleRouter.getClinicSchedule,

  // Mutations
  updateAppointmentRequest: updateAppointmentRouter.updateAppointmentRequest,
  deleteAppointmentRequest: deleteAppointmentRouter.deleteAppointmentRequest,
});
