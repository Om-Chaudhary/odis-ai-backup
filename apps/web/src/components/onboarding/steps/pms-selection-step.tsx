"use client";

import {
  PMS_TYPES,
  PMS_LABELS,
  type PmsType,
} from "~/app/api/onboarding/schemas";
import { Database, Stethoscope, Monitor, Server, FileText } from "lucide-react";

interface PmsSelectionStepProps {
  selected: PmsType | "";
  onSelect: (type: PmsType) => void;
}

const PMS_ICONS: Record<PmsType, React.ElementType> = {
  idexx_neo: Stethoscope,
  cornerstone: Database,
  avimark: Monitor,
  covetrus_pulse: Server,
  clientrax: FileText,
};

const PMS_DESCRIPTIONS: Record<PmsType, string> = {
  idexx_neo: "Cloud-based practice management by IDEXX",
  cornerstone: "IDEXX Cornerstone on-premise system",
  avimark: "Covetrus AVImark practice management",
  covetrus_pulse: "Cloud-native platform by Covetrus",
  clientrax: "ClientTrax practice management system",
};

/**
 * Step 1: Select PMS
 *
 * Shows cards for each supported practice management system.
 */
export function PmsSelectionStep({
  selected,
  onSelect,
}: PmsSelectionStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Select Your Practice Management System
        </h2>
        <p className="mt-2 text-slate-600">
          Choose the PMS your clinic uses so we can integrate with your patient
          data.
        </p>
      </div>

      <div className="grid gap-3">
        {PMS_TYPES.map((type) => {
          const Icon = PMS_ICONS[type];
          const isSelected = selected === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={`flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                  isSelected
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p
                  className={`font-semibold ${isSelected ? "text-teal-900" : "text-slate-900"}`}
                >
                  {PMS_LABELS[type]}
                </p>
                <p className="text-sm text-slate-500">
                  {PMS_DESCRIPTIONS[type]}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
