"use client";

import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { CallDetailResponse } from "~/server/actions/retell";
import { formatPhoneNumber } from "~/lib/utils/phone-formatting";
import { getRelativeTime } from "~/lib/utils/date-grouping";
import { Clock, Phone } from "lucide-react";
import { initiateScheduledCall } from "~/server/actions/retell";
import { useToast } from "~/hooks/use-toast";

interface ScheduledCallsSectionProps {
  calls: CallDetailResponse[];
  onCallInitiated?: () => void;
}

export function ScheduledCallsSection({
  calls,
  onCallInitiated,
}: ScheduledCallsSectionProps) {
  if (calls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="text-primary h-5 w-5" />
        <h2 className="text-lg font-semibold">
          Scheduled Calls ({calls.length})
        </h2>
      </div>

      <div className="grid gap-3">
        {calls.map((call) => (
          <ScheduledCallCard
            key={call.id}
            call={call}
            onCallInitiated={onCallInitiated}
          />
        ))}
      </div>
    </div>
  );
}

function ScheduledCallCard({
  call,
  onCallInitiated,
}: {
  call: CallDetailResponse;
  onCallInitiated?: () => void;
}) {
  const { toast } = useToast();
  const [isInitiating, setIsInitiating] = useState(false);

  const handleCallNow = async () => {
    setIsInitiating(true);

    try {
      const result = await initiateScheduledCall(call.id);

      if (result.success) {
        toast({
          title: "Call Initiated",
          description: `Calling ${formatPhoneNumber(result.data?.phoneNumber ?? "")}...`,
        });
        onCallInitiated?.();
      } else {
        toast({
          title: "Failed to Initiate Call",
          description: result.error ?? "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsInitiating(false);
    }
  };

  return (
    <Card className="hover:border-primary/50 border-2 border-dashed p-4 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div>
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                {call.call_variables?.pet_name ?? "Unknown Pet"}
                <Badge variant="secondary" className="text-xs font-normal">
                  Scheduled
                </Badge>
              </h3>
              <p className="text-muted-foreground text-sm">
                {call.call_variables?.owner_name ?? "Unknown Owner"} •{" "}
                {formatPhoneNumber(call.phone_number)}
              </p>
            </div>
          </div>

          <div className="text-muted-foreground text-xs">
            <span>Scheduled {getRelativeTime(call.created_at)}</span>
          </div>

          {call.metadata?.notes && typeof call.metadata.notes === "string" ? (
            <p className="text-muted-foreground text-sm italic">
              Note: {call.metadata.notes}
            </p>
          ) : null}
        </div>

        {/* Right side: Actions */}
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            onClick={handleCallNow}
            disabled={isInitiating}
            className="gap-2"
          >
            {isInitiating ? (
              <>
                <span className="animate-spin">⏳</span>
                Initiating...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4" />
                Call Now
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
