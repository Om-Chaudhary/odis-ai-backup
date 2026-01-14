"use client";

import { usePathname } from "next/navigation";
import { InboundNavigation } from "./inbound-navigation";
import { OutboundNavigation } from "./outbound-navigation";
import { api } from "~/trpc/client";

interface NavigationPanelProps {
  clinicSlug: string | null;
}

export function NavigationPanel({ clinicSlug }: NavigationPanelProps) {
  const pathname = usePathname();

  // Determine which navigation panel to show based on current route
  const showInboundNav = pathname.includes("/inbound");
  const showOutboundNav = pathname.includes("/outbound");

  // Fetch stats for inbound and outbound
  const { data: inboundStats } = api.inbound.getInboundStats.useQuery(
    {},
    { enabled: !!clinicSlug && showInboundNav },
  );

  const { data: outboundStats } = api.outbound.getDischargeCaseStats.useQuery(
    { clinicSlug: clinicSlug ?? undefined },
    { enabled: !!clinicSlug && showOutboundNav },
  );

  if (!clinicSlug) {
    return null;
  }

  if (!showInboundNav && !showOutboundNav) {
    return null;
  }

  return (
    <div className="hidden h-screen w-52 flex-shrink-0 lg:flex">
      <div className="flex w-full flex-col border-r border-gray-200 bg-gray-50">
        {/* Header spacer - aligned with main header height */}
        <div className="h-16 flex-shrink-0 border-b border-gray-200" />

        {/* Navigation content */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {showInboundNav && (
            <InboundNavigation
              clinicSlug={clinicSlug}
              stats={
                inboundStats?.calls
                  ? {
                      total: inboundStats.calls.total,
                      emergency: inboundStats.calls.emergency,
                      appointment: inboundStats.calls.appointment,
                      callback: inboundStats.calls.callback,
                      info: inboundStats.calls.info,
                    }
                  : undefined
              }
            />
          )}
          {showOutboundNav && (
            <OutboundNavigation
              clinicSlug={clinicSlug}
              stats={
                outboundStats
                  ? {
                      total: outboundStats.total,
                      needsAttention: outboundStats.needsAttention,
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
