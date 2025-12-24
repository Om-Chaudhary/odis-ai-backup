import { scheduleDischarge } from "../../services/discharge/discharge-scheduler";
import { logger, getUserFriendlyErrorMessage } from "@odis-ai/extension/shared";
import { useState } from "react";

const odisLogger = logger.child("[ODIS]");

/**
 * Hook for managing discharge scheduling
 */
export const useDischargeScheduling = () => {
  const [isSchedulingCall, setIsSchedulingCall] = useState(false);

  const scheduleDischargeCall = async () => {
    if (isSchedulingCall) return;

    try {
      setIsSchedulingCall(true);
      const result = await scheduleDischarge();

      if (!result.success) {
        throw new Error(result.error || "Failed to schedule discharge");
      }

      // Build success message
      if (result.actions && result.actions.length > 0) {
        alert(
          `✅ Discharge ${result.actions.join(" & ")} scheduled successfully!`,
        );
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      odisLogger.error("Error scheduling discharge", { error });

      const errorMessage = getUserFriendlyErrorMessage(
        error,
        "schedule discharge",
      );
      alert(`ODIS Extension: ${errorMessage}`);
    } finally {
      setIsSchedulingCall(false);
    }
  };

  return {
    isSchedulingCall,
    scheduleDischargeCall,
  };
};
