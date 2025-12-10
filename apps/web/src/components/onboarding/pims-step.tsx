"use client";

import { useState } from "react";
import { Button } from "@odis-ai/ui/button";
import { Label } from "@odis-ai/ui/label";
import { Checkbox } from "@odis-ai/ui/checkbox";
import { Input } from "@odis-ai/ui/input";
import { createClient } from "@odis-ai/db/client";
import Image from "next/image";

interface PIMSStepProps {
  userId: string;
  onComplete: () => void;
}

const PIMS_SYSTEMS = [
  {
    id: "idexx-neo",
    name: "IDEXX Neo",
    logo: "/logos/idexx-neo.svg",
  },
  {
    id: "avimark",
    name: "AVImark",
    logo: "/logos/avimark.png",
  },
  {
    id: "cornerstone",
    name: "Cornerstone (IDEXX)",
    logo: "/logos/idexx-cornerstone.png",
  },
  {
    id: "ezyvet",
    name: "ezyVet",
    logo: "/logos/ezyvet.png",
  },
  {
    id: "digitail",
    name: "Digitail",
    logo: "/logos/digitail.png",
  },
  {
    id: "vetspire",
    name: "Vetspire",
    logo: "/logos/vetspire.png",
  },
  {
    id: "none",
    name: "None / Manual Entry",
    logo: null,
  },
];

export default function PIMSStep({ userId, onComplete }: PIMSStepProps) {
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [credentials, setCredentials] = useState<
    Record<string, { username: string; password: string }>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSystemToggle = (systemId: string) => {
    setSelectedSystems((prev) => {
      if (systemId === "none") {
        // If "None" is selected, clear all other selections and credentials
        setCredentials({});
        return prev.includes("none") ? [] : ["none"];
      } else {
        // If any other system is selected, remove "none" and toggle the system
        const withoutNone = prev.filter((id) => id !== "none");
        const newSystems = withoutNone.includes(systemId)
          ? withoutNone.filter((id) => id !== systemId)
          : [...withoutNone, systemId];

        // Initialize credentials for newly selected systems
        if (!withoutNone.includes(systemId) && systemId !== "none") {
          setCredentials((prevCreds) => ({
            ...prevCreds,
            [systemId]: { username: "", password: "" },
          }));
        } else if (withoutNone.includes(systemId)) {
          // Remove credentials for deselected systems
          setCredentials((prevCreds) => {
            const newCreds = { ...prevCreds };
            delete newCreds[systemId];
            return newCreds;
          });
        }

        return newSystems;
      }
    });
  };

  const handleCredentialChange = (
    systemId: string,
    field: "username" | "password",
    value: string,
  ) => {
    setCredentials((prev) => ({
      ...prev,
      [systemId]: {
        ...(prev[systemId] ?? { username: "", password: "" }),
        [field]: value,
      },
    }));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("users")
        .update({
          pims_systems: selectedSystems,
          pims_credentials: credentials,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      onComplete();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-xl font-bold text-slate-800 sm:text-2xl">
          Connect your PIMS
        </h1>
        <p className="text-sm text-slate-600">
          Select your Practice Information Management System(s) to continue
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium text-slate-700">
          Which PIMS do you use? (Select all that apply)
        </Label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PIMS_SYSTEMS.map((system) => (
            <div
              key={system.id}
              className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-all duration-200 hover:bg-slate-50 ${
                selectedSystems.includes(system.id)
                  ? "border-teal-500 bg-teal-50/50"
                  : "border-slate-200"
              }`}
              onClick={() => handleSystemToggle(system.id)}
            >
              <Checkbox
                id={system.id}
                checked={selectedSystems.includes(system.id)}
                onChange={() => handleSystemToggle(system.id)}
                className="data-[state=checked]:border-teal-600 data-[state=checked]:bg-teal-600"
              />

              <div className="flex flex-1 items-center space-x-3">
                {system.logo && (
                  <div className="relative h-8 w-8 flex-shrink-0">
                    <Image
                      src={system.logo}
                      alt={`${system.name} logo`}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <Label
                  htmlFor={system.id}
                  className="cursor-pointer text-sm font-medium text-slate-700"
                >
                  {system.name}
                </Label>
              </div>
            </div>
          ))}
        </div>

        {selectedSystems.length > 0 && !selectedSystems.includes("none") && (
          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-medium text-slate-700">
              Enter your PIMS credentials for each selected system:
            </Label>
            {selectedSystems
              .filter((id) => id !== "none")
              .map((systemId) => {
                const system = PIMS_SYSTEMS.find((s) => s.id === systemId);
                return (
                  <div
                    key={systemId}
                    className="space-y-3 rounded-lg bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-2">
                      {system?.logo && (
                        <div className="relative h-6 w-6">
                          <Image
                            src={system.logo}
                            alt={`${system.name} logo`}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                      <Label className="text-sm font-semibold text-slate-800">
                        {system?.name} Credentials
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label
                          htmlFor={`${systemId}-username`}
                          className="text-xs text-slate-600"
                        >
                          Username
                        </Label>
                        <Input
                          id={`${systemId}-username`}
                          type="text"
                          placeholder="IDEXX Neo Username"
                          value={credentials[systemId]?.username ?? ""}
                          onChange={(e) =>
                            handleCredentialChange(
                              systemId,
                              "username",
                              e.target.value,
                            )
                          }
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor={`${systemId}-password`}
                          className="text-xs text-slate-600"
                        >
                          Password
                        </Label>
                        <Input
                          id={`${systemId}-password`}
                          type="password"
                          placeholder="IDEXX Neo Password"
                          value={credentials[systemId]?.password ?? ""}
                          onChange={(e) =>
                            handleCredentialChange(
                              systemId,
                              "password",
                              e.target.value,
                            )
                          }
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {selectedSystems.length > 0 && (
          <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
            {selectedSystems.includes("none")
              ? "You can set up PIMS integrations later in your dashboard settings."
              : "These are sandbox credentials for testing purposes only. You can update them later in your dashboard settings."}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={handleComplete}
          disabled={isLoading || selectedSystems.length === 0}
          className="w-full bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-[#2a9a92] hover:to-[#31aba3] hover:shadow-lg hover:shadow-[#31aba3]/30 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Completing setup..." : "Complete setup"}
        </Button>

        {selectedSystems.length === 0 && (
          <p className="text-center text-sm text-slate-500">
            Please select at least one PIMS system to continue
          </p>
        )}
      </div>
    </div>
  );
}
