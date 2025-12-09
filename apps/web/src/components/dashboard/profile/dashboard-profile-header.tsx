import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@odis-ai/ui/avatar";
import { Mail } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface DashboardProfileHeaderProps {
  user: User;
  profile: {
    first_name: string | null;
    last_name: string | null;
    role: string;
    clinic_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function DashboardProfileHeader({
  user,
  profile,
}: DashboardProfileHeaderProps) {
  const firstName = profile?.first_name ?? "User";
  const lastName = profile?.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const role = profile?.role ?? "veterinarian";
  const roleDisplay = role.replace(/_/g, " ");

  const greeting =
    new Date().getHours() < 12
      ? "morning"
      : new Date().getHours() < 18
        ? "afternoon"
        : "evening";

  return (
    <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
      <div className="animate-fade-in-up flex items-center gap-4">
        <div className="animate-scale-in relative">
          <div className="animate-pulse-glow absolute -inset-1 rounded-full bg-gradient-to-br from-[#31aba3] to-[#2a9a92] opacity-20 blur-sm"></div>
          <Avatar className="transition-smooth relative h-16 w-16 border-2 border-white shadow-sm ring-2 ring-[#31aba3]/20 hover:ring-[#31aba3]/40">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={fullName} />
            )}
            <AvatarFallback className="bg-gradient-to-br from-[#31aba3] to-[#10b981] text-base font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="animate-fade-in-up stagger-1 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Good {greeting}, {firstName}
          </h1>
          <div className="transition-smooth flex items-center gap-3 text-sm text-slate-500">
            {profile?.clinic_name && (
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#31aba3]"></span>
                {profile.clinic_name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </span>
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up stagger-2 flex items-center gap-3">
        <Badge className="animate-scale-in transition-smooth rounded-md border-0 bg-emerald-100 font-medium text-emerald-700 capitalize hover:bg-emerald-200">
          {roleDisplay}
        </Badge>
        {role === "admin" && (
          <Button
            variant="outline"
            size="sm"
            className="transition-smooth border-slate-200 hover:bg-slate-50"
            asChild
          >
            <a href="/admin">Admin Panel</a>
          </Button>
        )}
      </div>
    </div>
  );
}
