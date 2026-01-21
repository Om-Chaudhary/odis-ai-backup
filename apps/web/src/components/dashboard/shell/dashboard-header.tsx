"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Menu,
  TestTube,
  Settings2,
  X,
  Bell,
  HelpCircle,
  Settings,
  CreditCard,
  Shield,
  AlertTriangle,
  CheckCircle2,
  PhoneMissed,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { DashboardHeaderSearch } from "./dashboard-header-search";
import { api } from "~/trpc/client";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@odis-ai/shared/ui/dialog";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@odis-ai/shared/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/shared/ui/tooltip";
import { toast } from "sonner";
import type { DischargeSettings } from "@odis-ai/shared/types";
import { cn } from "@odis-ai/shared/util";
import { useOptionalClinic } from "@odis-ai/shared/ui/clinic-context";

interface DashboardHeaderProps {
  profile?: {
    first_name: string | null;
    last_name: string | null;
    role: string;
    avatar_url: string | null;
  } | null;
}

export function DashboardHeader({ profile }: DashboardHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: settings, refetch } = api.cases.getDischargeSettings.useQuery();

  // Determine breadcrumbs based on pathname
  const getBreadcrumbs = (): Array<{ label: string }> => {
    const isInbound = pathname.includes("/inbound");
    const isOutbound = pathname.includes("/outbound");

    if (isInbound) {
      const outcomeParam = searchParams.get("outcome");
      let filterLabel = "All Calls";
      if (outcomeParam === "emergency") filterLabel = "Emergency";
      else if (outcomeParam === "appointment") filterLabel = "Appointments";
      else if (outcomeParam === "callback") filterLabel = "Callback";
      else if (outcomeParam === "info") filterLabel = "Info";
      else if (outcomeParam && outcomeParam !== "all") filterLabel = "Filtered";
      return [{ label: "After Hours" }, { label: filterLabel }];
    }

    if (isOutbound) {
      const viewParam = searchParams.get("view");
      const viewLabel =
        viewParam === "needs_attention" ? "Needs Attention" : "All Calls";
      return [{ label: "Discharge" }, { label: viewLabel }];
    }

    return [];
  };

  const breadcrumbs = getBreadcrumbs();

  const updateSettingsMutation = api.cases.updateDischargeSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update settings");
    },
  });

  const handleUpdate = (newSettings: DischargeSettings) => {
    updateSettingsMutation.mutate({
      clinicName: newSettings.clinicName || undefined,
      clinicPhone: newSettings.clinicPhone || undefined,
      clinicEmail: newSettings.clinicEmail || undefined,
      emergencyPhone: newSettings.emergencyPhone || undefined,
      testModeEnabled: newSettings.testModeEnabled,
      testContactName: newSettings.testContactName ?? undefined,
      testContactEmail: newSettings.testContactEmail ?? undefined,
      testContactPhone: newSettings.testContactPhone ?? undefined,
      voicemailDetectionEnabled: newSettings.voicemailDetectionEnabled,
      defaultScheduleDelayMinutes:
        newSettings.defaultScheduleDelayMinutes ?? null,
      primaryColor: newSettings.primaryColor ?? undefined,
      logoUrl: newSettings.logoUrl ?? null,
      emailHeaderText: newSettings.emailHeaderText ?? null,
      emailFooterText: newSettings.emailFooterText ?? null,
      preferredEmailStartTime: newSettings.preferredEmailStartTime ?? null,
      preferredEmailEndTime: newSettings.preferredEmailEndTime ?? null,
      preferredCallStartTime: newSettings.preferredCallStartTime ?? null,
      preferredCallEndTime: newSettings.preferredCallEndTime ?? null,
      emailDelayDays: newSettings.emailDelayDays ?? null,
      callDelayDays: newSettings.callDelayDays ?? null,
      maxCallRetries: newSettings.maxCallRetries ?? null,
      batchIncludeIdexxNotes: newSettings.batchIncludeIdexxNotes,
      batchIncludeManualTranscriptions:
        newSettings.batchIncludeManualTranscriptions,
    });
  };

  const isTestMode = settings?.testModeEnabled ?? false;
  const clinicContext = useOptionalClinic();

  // Build URLs
  const clinicSlug = clinicContext?.clinicSlug;
  const settingsUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/settings`
    : "/dashboard/settings";
  const billingUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/billing`
    : "/dashboard/billing";
  // Check if user is admin
  const isAdmin = profile?.role === "admin";

  return (
    <TooltipProvider delayDuration={0}>
      <header
        className={cn(
          "relative flex h-14 shrink-0 items-center border-b transition-all duration-300",
          isTestMode
            ? "border-amber-200/50 bg-gradient-to-r from-amber-50/80 via-amber-50/60 to-amber-50/80"
            : "border-teal-200/30 bg-white/60 backdrop-blur-md",
        )}
      >
        {/* Subtle bottom edge highlight */}
        {!isTestMode && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />
        )}

        <div className="relative z-10 flex flex-1 items-center justify-between px-4">
          {/* Left: Mobile menu + Breadcrumbs */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button (hidden on md+ screens) */}
            <Button
              variant="ghost"
              size="icon"
              className="-ml-1 h-8 w-8 rounded-lg md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <nav className="hidden items-center gap-1.5 md:flex">
                {breadcrumbs.map((item, index) => (
                  <span key={index} className="flex items-center gap-1.5">
                    {index > 0 && (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-medium",
                        index === breadcrumbs.length - 1
                          ? "text-slate-800"
                          : "text-slate-500",
                      )}
                    >
                      {item.label}
                    </span>
                  </span>
                ))}
              </nav>
            )}
          </div>

          {/* Right: Search + Actions + User */}
          <div className="flex items-center gap-2">
            <DashboardHeaderSearch />

            {/* Test Mode Controls */}
            {isTestMode && settings && (
              <TestModeControls
                settings={settings}
                onUpdate={handleUpdate}
                isLoading={updateSettingsMutation.isPending}
              />
            )}

            {/* Divider before utility icons */}
            <div className="hidden h-6 w-px bg-slate-200 md:block" />

            {/* Help Icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  asChild
                >
                  <a
                    href="https://odisai.net/support"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <HelpCircle className="h-[18px] w-[18px]" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Help & Support</p>
              </TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <NotificationsDropdown clinicSlug={clinicSlug} />

            {/* User Profile - Clerk UserButton */}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 rounded-lg ring-1 ring-slate-200",
                  userButtonTrigger:
                    "rounded-lg hover:bg-slate-100 transition-colors",
                },
              }}
              afterSignOutUrl="/sign-in"
              showName={true}
            >
              <UserButton.MenuItems>
                <UserButton.Link
                  label="Settings"
                  labelIcon={<Settings className="h-4 w-4" />}
                  href={settingsUrl}
                />
                <UserButton.Link
                  label="Billing"
                  labelIcon={<CreditCard className="h-4 w-4" />}
                  href={billingUrl}
                />
                {isAdmin && (
                  <UserButton.Link
                    label="Admin Panel"
                    labelIcon={<Shield className="h-4 w-4 text-amber-600" />}
                    href="/admin"
                  />
                )}
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}

interface TestModeControlsProps {
  settings: DischargeSettings;
  onUpdate: (settings: DischargeSettings) => void;
  isLoading?: boolean;
}

function TestModeControls({
  settings,
  onUpdate,
  isLoading = false,
}: TestModeControlsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [testContactName, setTestContactName] = useState(
    settings.testContactName ?? "",
  );
  const [testContactPhone, setTestContactPhone] = useState(
    settings.testContactPhone ?? "",
  );
  const [testContactEmail, setTestContactEmail] = useState(
    settings.testContactEmail ?? "",
  );

  // Sync local state when settings change
  useEffect(() => {
    setTestContactName(settings.testContactName ?? "");
    setTestContactPhone(settings.testContactPhone ?? "");
    setTestContactEmail(settings.testContactEmail ?? "");
  }, [
    settings.testContactName,
    settings.testContactPhone,
    settings.testContactEmail,
  ]);

  const handleSave = () => {
    onUpdate({
      ...settings,
      testContactName,
      testContactPhone,
      testContactEmail,
    });
    setIsEditOpen(false);
  };

  const handleDisable = () => {
    onUpdate({
      ...settings,
      testModeEnabled: false,
    });
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-amber-100/80 px-3 py-1.5 text-xs shadow-sm ring-1 ring-amber-200/50">
          <TestTube className="h-3.5 w-3.5 text-amber-600" />
          <span className="font-semibold text-amber-800">Test Mode</span>
          <span className="hidden text-amber-700/80 sm:inline-block">
            •{" "}
            <span className="font-medium">
              {settings.testContactEmail ??
                settings.testContactPhone ??
                "test contact"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-amber-700 hover:bg-amber-100 hover:text-amber-900"
            onClick={() => setIsEditOpen(true)}
            title="Configure Test Contact"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-amber-700 hover:bg-amber-100 hover:text-amber-900"
            onClick={handleDisable}
            title="Disable Test Mode"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-amber-600" />
              Test Mode Configuration
            </DialogTitle>
            <DialogDescription>
              Configure test contact information. All discharge communications
              will be sent to these details instead of actual pet owners.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-name">Test Contact Name</Label>
              <Input
                id="test-name"
                placeholder="e.g. John Doe"
                value={testContactName}
                onChange={(e) => setTestContactName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-phone">Test Phone Number</Label>
              <Input
                id="test-phone"
                placeholder="e.g. +1 (555) 123-4567"
                value={testContactPhone}
                onChange={(e) => setTestContactPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="e.g. test@example.com"
                value={testContactEmail}
                onChange={(e) => setTestContactEmail(e.target.value)}
              />
            </div>

            <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Test mode is currently enabled. Disable
                it from this banner to send discharges to actual pet owners.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Notifications dropdown showing actionable items
 */
interface NotificationsDropdownProps {
  clinicSlug: string | null | undefined;
}

function NotificationsDropdown({ clinicSlug }: NotificationsDropdownProps) {
  // Fetch stats for notifications
  const { data: outboundStats } = api.outbound.getDischargeCaseStats.useQuery(
    { clinicSlug: clinicSlug ?? undefined },
    { enabled: !!clinicSlug },
  );

  const { data: inboundStats } = api.inbound.getInboundStats.useQuery(
    {},
    { enabled: !!clinicSlug },
  );

  const needsAttention = outboundStats?.needsAttention ?? 0;
  const callbacks = inboundStats?.calls?.callback ?? 0;
  const totalNotifications = needsAttention + callbacks;

  const outboundUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/outbound?view=needs_attention`
    : "/dashboard/outbound?view=needs_attention";
  const inboundUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/inbound?outcome=callback`
    : "/dashboard/inbound?outcome=callback";

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <Bell className="h-[18px] w-[18px]" />
              {totalNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                  {totalNotifications > 9 ? "9+" : totalNotifications}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Notifications</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent className="w-72" align="end" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {totalNotifications > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {totalNotifications}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {totalNotifications === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50">
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">All caught up!</p>
            <p className="text-xs text-slate-500">No items need attention</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {needsAttention > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  href={outboundUrl}
                  className="flex items-start gap-3 px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {needsAttention} discharge
                      {needsAttention === 1 ? "" : "s"} need attention
                    </p>
                    <p className="text-xs text-slate-500">
                      Review failed or flagged calls
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}

            {callbacks > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  href={inboundUrl}
                  className="flex items-start gap-3 px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <PhoneMissed className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {callbacks} callback{callbacks === 1 ? "" : "s"} requested
                    </p>
                    <p className="text-xs text-slate-500">
                      Callers waiting for follow-up
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
