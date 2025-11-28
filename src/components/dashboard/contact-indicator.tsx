"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "~/components/ui/badge";

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
  testMode = false,
}: ContactIndicatorProps) {
  const Icon = type === "phone" ? Phone : Mail;

  if (!isValid) {
    return (
      <div className="flex items-center gap-2 text-sm transition-smooth">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 transition-smooth" />
        <span className="text-amber-700">
          {type === "phone" ? "Phone" : "Email"} required
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm transition-smooth">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 transition-smooth" />
      <span className="text-slate-700">
        {type === "phone" ? "Phone" : "Email"}: {value}
      </span>
      {testMode && (
        <Badge variant="outline" className="text-xs">
          Test
        </Badge>
      )}
    </div>
  );
}


