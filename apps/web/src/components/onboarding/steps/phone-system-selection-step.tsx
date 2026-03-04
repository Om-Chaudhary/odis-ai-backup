"use client";

import {
  PHONE_SYSTEM_TYPES,
  PHONE_SYSTEM_LABELS,
  type PhoneSystemType,
} from "~/app/api/onboarding/schemas";
import { Phone, Radio, Headphones, HelpCircle } from "lucide-react";

interface PhoneSystemSelectionStepProps {
  selected: PhoneSystemType | "";
  onSelect: (type: PhoneSystemType) => void;
}

const PHONE_ICONS: Record<PhoneSystemType, React.ElementType> = {
  weave: Phone,
  otto: Radio,
  mitel: Headphones,
  other: HelpCircle,
};

const PHONE_DESCRIPTIONS: Record<PhoneSystemType, string> = {
  weave: "Unified communications platform for healthcare",
  otto: "OTTO Communications phone system",
  mitel: "Mitel business phone system",
  other: "Another phone system not listed here",
};

/**
 * Step 3: Select Phone System
 *
 * Shows cards for each supported phone system.
 */
export function PhoneSystemSelectionStep({
  selected,
  onSelect,
}: PhoneSystemSelectionStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Select Your Phone System
        </h2>
        <p className="mt-2 text-slate-600">
          Choose the phone system your clinic uses for client communication.
        </p>
      </div>

      <div className="grid gap-3">
        {PHONE_SYSTEM_TYPES.map((type) => {
          const Icon = PHONE_ICONS[type];
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
                  {PHONE_SYSTEM_LABELS[type]}
                </p>
                <p className="text-sm text-slate-500">
                  {PHONE_DESCRIPTIONS[type]}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
