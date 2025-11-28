"use client";

import { Phone, Mail, CheckCircle2, AlertCircle } from "lucide-react";

interface ContactIndicatorProps {
  type: "phone" | "email";
  value: string | undefined | null;
  isValid: boolean;
  testMode?: boolean;
}

export function ContactIndicator({
  type,
  value,
  isValid,
  testMode: _testMode = false,
}: ContactIndicatorProps) {
  const Icon = type === "phone" ? Phone : Mail;

  if (!isValid) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <Icon className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        <span className="truncate text-slate-600">
          {value ?? (type === "phone" ? "No phone" : "No email")}
        </span>
        <AlertCircle className="h-3 w-3 shrink-0 text-amber-600" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
      <span className="truncate text-slate-700">{value}</span>
      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
    </div>
  );
}
