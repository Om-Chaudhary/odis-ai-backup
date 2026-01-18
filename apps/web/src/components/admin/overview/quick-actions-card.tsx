"use client";

import Link from "next/link";
import { Building2, UserPlus, RefreshCw, Zap } from "lucide-react";
import { Card } from "@odis-ai/shared/ui/card";

const actions = [
  {
    title: "Create Clinic",
    description: "Add a new veterinary clinic to the platform",
    icon: Building2,
    href: "/admin/clinics?action=create",
    color: "teal",
  },
  {
    title: "Invite User",
    description: "Send invitation to a new team member",
    icon: UserPlus,
    href: "/admin/users?action=invite",
    color: "blue",
  },
  {
    title: "Trigger Sync",
    description: "Manually initiate a PIMS sync operation",
    icon: RefreshCw,
    href: "/admin/sync?action=trigger",
    color: "emerald",
  },
];

export function QuickActionsCard() {
  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm">
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm shadow-teal-500/20">
            <Zap className="h-[18px] w-[18px] text-white" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Quick Actions
            </h3>
            <p className="text-xs text-slate-500">
              Common administrative tasks
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100/80 p-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-slate-50"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all group-hover:scale-105 ${
                  action.color === "teal"
                    ? "bg-teal-50 text-teal-600 group-hover:bg-teal-100"
                    : action.color === "blue"
                      ? "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                      : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-700 transition-colors group-hover:text-teal-700">
                  {action.title}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {action.description}
                </div>
              </div>
              <div className="opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-50">
                  <svg
                    className="h-3 w-3 text-teal-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
