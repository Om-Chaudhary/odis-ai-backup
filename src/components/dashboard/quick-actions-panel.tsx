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

export function QuickActionsPanel() {
  return (
    <Card className="border-slate-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-slate-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/cases" className="block">
            <Button
              variant="outline"
              className="h-auto w-full flex-col gap-2 py-4 transition-all hover:border-[#31aba3] hover:bg-[#31aba3]/5"
            >
              <FileText className="h-5 w-5 text-[#31aba3]" />
              <span className="text-sm font-medium">View Cases</span>
            </Button>
          </Link>

          <Link href="/dashboard/cases?action=new" className="block">
            <Button
              variant="outline"
              className="h-auto w-full flex-col gap-2 py-4 transition-all hover:border-[#31aba3] hover:bg-[#31aba3]/5"
            >
              <Plus className="h-5 w-5 text-[#31aba3]" />
              <span className="text-sm font-medium">New Case</span>
            </Button>
          </Link>

          <Link href="/dashboard/cases?action=call" className="block">
            <Button
              variant="outline"
              className="h-auto w-full flex-col gap-2 py-4 transition-all hover:border-[#31aba3] hover:bg-[#31aba3]/5"
            >
              <PhoneCall className="h-5 w-5 text-[#31aba3]" />
              <span className="text-sm font-medium">Schedule Call</span>
            </Button>
          </Link>

          <Link href="/dashboard/settings" className="block">
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
