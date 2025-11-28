import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Mail, Stethoscope } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface DashboardProfileHeaderProps {
  user: User;
  profile: {
    first_name: string | null;
    last_name: string | null;
    role: string;
    clinic_name: string | null;
    license_number: string | null;
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

  return (
    <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center">
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#31aba3] to-[#2a9a92] opacity-20 blur-sm"></div>
        <Avatar className="relative h-20 w-20 border-2 border-white shadow-sm ring-2 ring-[#31aba3]/20">
          {profile?.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={fullName} />
          )}
          <AvatarFallback className="bg-gradient-to-br from-[#31aba3] to-[#10b981] text-xl text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 18
                ? "afternoon"
                : "evening"}
            , {firstName}
          </h1>
          <Badge
            variant="secondary"
            className="w-fit border-emerald-200/50 bg-emerald-100/50 text-emerald-700 capitalize"
          >
            {roleDisplay}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
          {profile?.clinic_name && (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#31aba3]"></span>
              {profile.clinic_name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </span>
          {profile?.license_number && (
            <span className="flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              Lic: {profile.license_number}
            </span>
          )}
        </div>
      </div>

      {role === "admin" && (
        <Button
          variant="outline"
          className="border-[#31aba3]/30 bg-white/50 hover:bg-[#31aba3]/5 hover:text-[#31aba3]"
          asChild
        >
          <a href="/admin">Admin Panel</a>
        </Button>
      )}
    </div>
  );
}
