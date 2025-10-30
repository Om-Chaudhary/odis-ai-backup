"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { createClient } from "~/lib/supabase/client";
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
  const [credentials, setCredentials] = useState<Record<string, { username: string; password: string }>>({});
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
          setCredentials(prevCreds => ({
            ...prevCreds,
            [systemId]: { username: "", password: "" }
          }));
        } else if (withoutNone.includes(systemId)) {
          // Remove credentials for deselected systems
          setCredentials(prevCreds => {
            const newCreds = { ...prevCreds };
            delete newCreds[systemId];
            return newCreds;
          });
        }

        return newSystems;
      }
    });
  };

  const handleCredentialChange = (systemId: string, field: 'username' | 'password', value: string) => {
    setCredentials(prev => ({
      ...prev,
      [systemId]: {
        ...(prev[systemId] ?? { username: "", password: "" }),
        [field]: value
      }
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
        <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
          Connect your PIMS
        </h1>
        <p className="text-slate-600 text-sm dark:text-slate-400">
          Select your Practice Information Management System(s)
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Which PIMS do you use? (Select all that apply)
        </Label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PIMS_SYSTEMS.map((system) => (
            <div
              key={system.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                selectedSystems.includes(system.id)
                  ? "border-teal-500 bg-teal-50/50 dark:bg-teal-900/20"
                  : "border-slate-200 dark:border-slate-700"
              }`}
              onClick={() => handleSystemToggle(system.id)}
            >
              <Checkbox
                id={system.id}
                checked={selectedSystems.includes(system.id)}
                onChange={() => handleSystemToggle(system.id)}
                className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
              />

              <div className="flex items-center space-x-3 flex-1">
                {system.logo && (
                  <div className="relative w-8 h-8 flex-shrink-0">
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
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {system.name}
                </Label>
              </div>
            </div>
          ))}
        </div>

        {selectedSystems.length > 0 && !selectedSystems.includes("none") && (
          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Enter your PIMS credentials for each selected system:
            </Label>
            {selectedSystems.filter(id => id !== "none").map((systemId) => {
              const system = PIMS_SYSTEMS.find(s => s.id === systemId);
              return (
                <div key={systemId} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {system?.logo && (
                      <div className="relative w-6 h-6">
                        <Image
                          src={system.logo}
                          alt={`${system.name} logo`}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {system?.name} Credentials
                    </Label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${systemId}-username`} className="text-xs text-slate-600 dark:text-slate-400">
                        Username
                      </Label>
                      <Input
                        id={`${systemId}-username`}
                        type="text"
                        placeholder="IDEXX Neo Username"
                        value={credentials[systemId]?.username ?? ""}
                        onChange={(e) => handleCredentialChange(systemId, 'username', e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${systemId}-password`} className="text-xs text-slate-600 dark:text-slate-400">
                        Password
                      </Label>
                      <Input
                        id={`${systemId}-password`}
                        type="password"
                        placeholder="IDEXX Neo Password"
                        value={credentials[systemId]?.password ?? ""}
                        onChange={(e) => handleCredentialChange(systemId, 'password', e.target.value)}
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
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
            {selectedSystems.includes("none")
              ? "You can set up PIMS integrations later in your dashboard settings."
              : "These are sandbox credentials for testing purposes only. You can update them later in your dashboard settings."
            }
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => handleComplete()}
          disabled={isLoading}
          className="flex-1 border-slate-200 dark:border-slate-700"
        >
          Skip for now
        </Button>
        <Button
          onClick={handleComplete}
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-[#2a9a92] hover:to-[#31aba3] hover:shadow-lg hover:shadow-[#31aba3]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? "Completing setup..." : "Complete setup"}
        </Button>
      </div>
    </div>
  );
}
