"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Plus,
  FileText,
  PhoneCall,
  Settings as SettingsIcon,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { buildClinicUrl, useOptionalClinic } from "~/lib/clinic-context";

export function QuickActionsPanel() {
  const clinicContext = useOptionalClinic();
  const clinicSlug = clinicContext?.clinicSlug ?? null;

  const buildTargetUrl = (path: string) => {
    if (!clinicSlug) {
      return path;
    }

    const [pathname = path, search = ""] = path.split("?");
    // Strip legacy /dashboard prefix before rebuilding clinic-scoped path
    const scopedPath = pathname.replace(/^\/dashboard/, "") || "/";
    const base = buildClinicUrl(clinicSlug, scopedPath);
    return search ? `${base}?${search}` : base;
  };

  return (
    <Card className="rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md transition-all hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-slate-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href={buildTargetUrl("/dashboard/discharges")}
            className="block"
          >
            <Button
              variant="outline"
              className="h-auto w-full flex-col gap-2 py-4 transition-all hover:border-[#31aba3] hover:bg-[#31aba3]/5"
            >
              <FileText className="h-5 w-5 text-[#31aba3]" />
              <span className="text-sm font-medium">View Cases</span>
            </Button>
          </Link>

          <Link
            href={buildTargetUrl("/dashboard/discharges?action=new")}
            className="block"
          >
            <Button
              variant="outline"
              className="h-auto w-full flex-col gap-2 py-4 transition-all hover:border-[#31aba3] hover:bg-[#31aba3]/5"
            >
              <Plus className="h-5 w-5 text-[#31aba3]" />
              <span className="text-sm font-medium">New Case</span>
            </Button>
          </Link>

          <Link
            href={buildTargetUrl("/dashboard/discharges?action=call")}
            className="block"
          >
            <Button
              variant="outline"
              className="h-auto w-full flex-col gap-2 py-4 transition-all hover:border-[#31aba3] hover:bg-[#31aba3]/5"
            >
              <PhoneCall className="h-5 w-5 text-[#31aba3]" />
              <span className="text-sm font-medium">Schedule Call</span>
            </Button>
          </Link>

          <Link href={buildTargetUrl("/dashboard/settings")} className="block">
            <Button
              variant="outline"
              className="h-auto w-full flex-col gap-2 py-4 transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              <SettingsIcon className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium">Settings</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
