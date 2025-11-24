import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Calendar, Mail, Stethoscope } from "lucide-react";
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

  // Format the joined date
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Unknown";

  return (
    <Card className="relative overflow-hidden border-slate-200/60 bg-white/90 shadow-xl backdrop-blur-md">
      {/* Subtle gradient background for the card */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(49, 171, 163, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
        }}
      />

      <CardContent className="relative z-10 p-6">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            {/* Enhanced glow effect */}
            <div className="animate-pulse-slow absolute -inset-2 rounded-full bg-gradient-to-br from-[#31aba3] to-[#10b981] opacity-30 blur-lg"></div>
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#31aba3] to-[#2a9a92] opacity-40 blur-sm"></div>
            <Avatar className="relative h-24 w-24 shadow-lg ring-2 ring-[#31aba3]/40">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={fullName} />
              )}
              <AvatarFallback className="bg-gradient-to-br from-[#31aba3] to-[#10b981] text-2xl text-white shadow-inner">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <h1
                className="animate-gradient-subtle bg-gradient-to-r from-slate-800 via-[#31aba3] to-slate-700 bg-clip-text text-3xl font-bold text-transparent"
                style={{ backgroundSize: "200% 200%" }}
              >
                {fullName}
              </h1>
              <Badge
                variant="secondary"
                className="w-fit border-[#31aba3]/30 bg-gradient-to-r from-[#31aba3]/15 to-[#10b981]/10 text-[#31aba3] capitalize shadow-sm transition-shadow hover:shadow-md"
              >
                {roleDisplay}
              </Badge>
            </div>
            {profile?.clinic_name && (
              <p className="text-lg font-semibold text-slate-700">
                {profile.clinic_name}
              </p>
            )}
            <div className="flex flex-wrap gap-6 text-sm text-slate-600">
              <div className="group flex items-center gap-2">
                <div className="rounded-full bg-[#31aba3]/10 p-1 transition-colors group-hover:bg-[#31aba3]/20">
                  <Mail className="size-4 text-[#31aba3]" />
                </div>
                <span className="transition-colors group-hover:text-slate-800">
                  {user.email}
                </span>
              </div>
              {profile?.license_number && (
                <div className="group flex items-center gap-2">
                  <div className="rounded-full bg-[#31aba3]/10 p-1 transition-colors group-hover:bg-[#31aba3]/20">
                    <Stethoscope className="size-4 text-[#31aba3]" />
                  </div>
                  <span className="transition-colors group-hover:text-slate-800">
                    License: {profile.license_number}
                  </span>
                </div>
              )}
              <div className="group flex items-center gap-2">
                <div className="rounded-full bg-[#31aba3]/10 p-1 transition-colors group-hover:bg-[#31aba3]/20">
                  <Calendar className="size-4 text-[#31aba3]" />
                </div>
                <span className="transition-colors group-hover:text-slate-800">
                  Joined {joinedDate}
                </span>
              </div>
            </div>
          </div>
          {role === "admin" && (
            <Button
              variant="default"
              className="group relative overflow-hidden bg-gradient-to-r from-[#31aba3] to-[#10b981] text-white shadow-xl transition-all hover:scale-105 hover:from-[#2a9a92] hover:to-[#0d9488] hover:shadow-2xl hover:shadow-[#31aba3]/40"
              asChild
            >
              <a href="/admin" className="relative z-10">
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="animate-shimmer absolute inset-0 skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
                Admin Panel
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
