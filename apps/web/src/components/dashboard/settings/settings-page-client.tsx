"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Building2,
  Palette,
  Settings as SettingsIcon,
  Send,
  PhoneIncoming,
  Loader2,
  ChevronRight,
  Save,
} from "lucide-react";
import { api } from "~/trpc/client";
import type { DischargeSettings } from "@odis-ai/shared/types";
import { toast } from "sonner";
import { cn } from "@odis-ai/shared/util";
import { useForm } from "react-hook-form";
import { Button } from "@odis-ai/shared/ui/button";
import {
  ClinicInfoSection,
  EmailSchedulingSection,
  CallSchedulingSection,
  BatchPreferencesSection,
  VapiConfigSection,
  BrandingSection,
  SystemSettingsSection,
} from "./discharge-settings/sections";

const NAV_ITEMS = [
  {
    id: "clinic",
    label: "Clinic Profile",
    icon: Building2,
  },
  {
    id: "outbound",
    label: "Outbound Scheduling",
    icon: Send,
  },
  {
    id: "branding",
    label: "Email Branding",
    icon: Palette,
  },
  {
    id: "inbound",
    label: "Inbound Calls",
    icon: PhoneIncoming,
  },
  {
    id: "system",
    label: "System & Testing",
    icon: SettingsIcon,
  },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]["id"];

export function SettingsPageClient() {
  const [activeSection, setActiveSection] = useState<SectionId>("clinic");
  const [isScrolled, setIsScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    clinic: null,
    outbound: null,
    branding: null,
    inbound: null,
    system: null,
  });

  const { data: settingsData, refetch: refetchSettings } =
    api.cases.getDischargeSettings.useQuery();

  const updateSettingsMutation = api.cases.updateDischargeSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
      void refetchSettings();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  const defaultSettings: DischargeSettings = {
    clinicName: "",
    clinicPhone: "",
    clinicEmail: "",
    emergencyPhone: "",
    vetName: "",
    testModeEnabled: false,
    testContactName: "",
    testContactEmail: "",
    testContactPhone: "",
    voicemailDetectionEnabled: false,
    defaultScheduleDelayMinutes: null,
    primaryColor: "#2563EB",
    logoUrl: null,
    emailHeaderText: null,
    emailFooterText: null,
    preferredEmailStartTime: "09:00",
    preferredEmailEndTime: "12:00",
    preferredCallStartTime: "14:00",
    preferredCallEndTime: "17:00",
    emailDelayDays: 1,
    callDelayDays: 2,
    maxCallRetries: 3,
    batchIncludeIdexxNotes: true,
    batchIncludeManualTranscriptions: true,
  };

  const settings = useMemo(
    () => settingsData ?? defaultSettings,
    [settingsData],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty, errors },
  } = useForm<DischargeSettings>({
    defaultValues: settings,
  });

  useEffect(() => {
    if (settingsData) {
      reset(settingsData);
    }
  }, [settingsData, reset]);

  const handleSave = (data: DischargeSettings) => {
    updateSettingsMutation.mutate({
      clinicName: data.clinicName || undefined,
      clinicPhone: data.clinicPhone || undefined,
      clinicEmail: data.clinicEmail || undefined,
      emergencyPhone: data.emergencyPhone || undefined,
      testModeEnabled: data.testModeEnabled,
      testContactName: data.testContactName ?? undefined,
      testContactEmail: data.testContactEmail ?? undefined,
      testContactPhone: data.testContactPhone ?? undefined,
      voicemailDetectionEnabled: data.voicemailDetectionEnabled,
      defaultScheduleDelayMinutes: data.defaultScheduleDelayMinutes ?? null,
      primaryColor: data.primaryColor ?? undefined,
      logoUrl: data.logoUrl ?? null,
      emailHeaderText: data.emailHeaderText ?? null,
      emailFooterText: data.emailFooterText ?? null,
      preferredEmailStartTime: data.preferredEmailStartTime ?? null,
      preferredEmailEndTime: data.preferredEmailEndTime ?? null,
      preferredCallStartTime: data.preferredCallStartTime ?? null,
      preferredCallEndTime: data.preferredCallEndTime ?? null,
      emailDelayDays: data.emailDelayDays ?? null,
      callDelayDays: data.callDelayDays ?? null,
      maxCallRetries: data.maxCallRetries ?? null,
      batchIncludeIdexxNotes: data.batchIncludeIdexxNotes,
      batchIncludeManualTranscriptions: data.batchIncludeManualTranscriptions,
    });
  };

  const scrollToSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    const element = sectionRefs.current[sectionId];
    if (element && contentRef.current) {
      const container = contentRef.current;
      const elementTop = element.offsetTop - container.offsetTop;
      container.scrollTo({
        top: elementTop - 24,
        behavior: "smooth",
      });
    }
  };

  // Track scroll position to update active section and show/hide save bar
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      setIsScrolled(scrollTop > 50);

      const scrollPosition = scrollTop + 100;
      for (const item of NAV_ITEMS) {
        const element = sectionRefs.current[item.id];
        if (element) {
          const elementTop = element.offsetTop - container.offsetTop;
          const elementBottom = elementTop + element.offsetHeight;

          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const showSaveBar = isDirty || isScrolled;

  return (
    <div className="flex h-full">
      {/* Minimal Sidebar Navigation */}
      <div className="flex w-52 shrink-0 flex-col border-r border-slate-200/40">
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-all",
                      isActive
                        ? "bg-teal-50/80 text-teal-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive
                          ? "text-teal-600"
                          : "text-slate-400 group-hover:text-slate-500",
                      )}
                    />
                    <span className="font-medium">{item.label}</span>
                    <ChevronRight
                      className={cn(
                        "ml-auto h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
                        isActive && "text-teal-500 opacity-100",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content Area */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit(handleSave)}>
          {/* Clinic Profile Section */}
          <section
            ref={(el) => {
              sectionRefs.current.clinic = el;
            }}
            id="clinic"
            className="border-b border-slate-100 px-8 py-6"
          >
            <div className="mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-100/80 text-teal-600">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Clinic Profile
                  </h2>
                  <p className="text-xs text-slate-500">
                    Basic clinic details and contact information
                  </p>
                </div>
              </div>
            </div>
            <ClinicInfoSection
              register={register}
              errors={errors}
              settings={settings}
              showSeparator={false}
            />
          </section>

          {/* Outbound Scheduling Section */}
          <section
            ref={(el) => {
              sectionRefs.current.outbound = el;
            }}
            id="outbound"
            className="border-b border-slate-100 px-8 py-6"
          >
            <div className="mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100/80 text-blue-600">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Outbound Scheduling
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure when discharge emails and follow-up calls are sent
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <EmailSchedulingSection watch={watch} setValue={setValue} />
              <CallSchedulingSection watch={watch} setValue={setValue} />
              <BatchPreferencesSection watch={watch} setValue={setValue} />
            </div>
          </section>

          {/* Branding Section */}
          <section
            ref={(el) => {
              sectionRefs.current.branding = el;
            }}
            id="branding"
            className="border-b border-slate-100 px-8 py-6"
          >
            <div className="mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-pink-100/80 text-pink-600">
                  <Palette className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Email Branding
                  </h2>
                  <p className="text-xs text-slate-500">
                    Customize the appearance of your discharge emails
                  </p>
                </div>
              </div>
            </div>
            <BrandingSection
              register={register}
              watch={watch}
              setValue={setValue}
            />
          </section>

          {/* Inbound Calls Section */}
          <section
            ref={(el) => {
              sectionRefs.current.inbound = el;
            }}
            id="inbound"
            className="border-b border-slate-100 px-8 py-6"
          >
            <div className="mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100/80 text-green-600">
                  <PhoneIncoming className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Inbound Calls
                  </h2>
                  <p className="text-xs text-slate-500">
                    VAPI configuration for handling incoming calls
                  </p>
                </div>
              </div>
            </div>
            <VapiConfigSection register={register} />
          </section>

          {/* System & Testing Section */}
          <section
            ref={(el) => {
              sectionRefs.current.system = el;
            }}
            id="system"
            className="px-8 py-6 pb-20"
          >
            <div className="mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100/80 text-amber-600">
                  <SettingsIcon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    System & Testing
                  </h2>
                  <p className="text-xs text-slate-500">
                    Advanced settings, voicemail detection, and test mode
                  </p>
                </div>
              </div>
            </div>
            <SystemSettingsSection
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
            />
          </section>

          {/* Floating Save Bar - appears on scroll or when dirty */}
          <div
            className={cn(
              "fixed bottom-4 left-1/2 z-10 -translate-x-1/2 transition-all duration-300",
              showSaveBar
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-4 opacity-0",
            )}
          >
            <div className="flex items-center gap-4 rounded-full border border-slate-200/60 bg-white/80 px-4 py-2.5 shadow-lg backdrop-blur-md">
              <span className="text-sm text-slate-500">
                {isDirty ? (
                  <span className="text-amber-600">Unsaved changes</span>
                ) : (
                  "All changes saved"
                )}
              </span>
              <Button
                type="submit"
                disabled={!isDirty || updateSettingsMutation.isPending}
                size="sm"
                className="rounded-full bg-teal-600 px-4 hover:bg-teal-700"
              >
                {updateSettingsMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Save
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
