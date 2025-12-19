/**
 * Inbound Router
 *
 * Combines all inbound data procedures into a single router:
 * - Appointment requests (from VAPI schedule-appointment tool)
 * - Clinic messages (from VAPI leave-message tool)
 * - Statistics for dashboard
 */

import { createTRPCRouter } from "~/server/api/trpc";
import { listAppointmentsRouter } from "./procedures/list-appointments";
import { listMessagesRouter } from "./procedures/list-messages";
import { getStatsRouter } from "./procedures/get-stats";
import { updateAppointmentRouter } from "./procedures/update-appointment";
import { updateMessageRouter } from "./procedures/update-message";
import { deleteAppointmentRouter } from "./procedures/delete-appointment";
import { deleteMessageRouter } from "./procedures/delete-message";
import { callAssociationsRouter } from "./procedures/call-associations";

export const inboundRouter = createTRPCRouter({
  // Queries
  listAppointmentRequests: listAppointmentsRouter.listAppointmentRequests,
  listClinicMessages: listMessagesRouter.listClinicMessages,
  getInboundStats: getStatsRouter.getInboundStats,
  checkCallAppointmentAssociation:
    callAssociationsRouter.checkCallAppointmentAssociation,
  checkCallMessageAssociation:
    callAssociationsRouter.checkCallMessageAssociation,
  getCallerNameByPhone: callAssociationsRouter.getCallerNameByPhone,

  // Mutations
  updateAppointmentRequest: updateAppointmentRouter.updateAppointmentRequest,
  updateClinicMessage: updateMessageRouter.updateClinicMessage,
  markMessageRead: updateMessageRouter.markMessageRead,
  deleteAppointmentRequest: deleteAppointmentRouter.deleteAppointmentRequest,
  deleteClinicMessage: deleteMessageRouter.deleteClinicMessage,
});
