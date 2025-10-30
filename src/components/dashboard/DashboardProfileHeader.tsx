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
    <Card className="border-slate-200 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#31aba3] to-[#2a9a92] opacity-20 blur-sm"></div>
            <Avatar className="relative h-24 w-24 ring-2 ring-[#31aba3]/30">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={fullName} />
              )}
              <AvatarFallback className="text-2xl bg-gradient-to-br from-[#31aba3] to-[#2a9a92] text-white">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{fullName}</h1>
              <Badge variant="secondary" className="w-fit capitalize bg-gradient-to-r from-[#31aba3]/10 to-[#2a9a92]/5 text-[#31aba3] border-[#31aba3]/20">
                {roleDisplay}
              </Badge>
            </div>
            {profile?.clinic_name && (
              <p className="text-slate-600 font-medium">{profile.clinic_name}</p>
            )}
            <div className="text-slate-600 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Mail className="size-4 text-[#31aba3]" />
                {user.email}
              </div>
              {profile?.license_number && (
                <div className="flex items-center gap-1">
                  <Stethoscope className="size-4 text-[#31aba3]" />
                  License: {profile.license_number}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="size-4 text-[#31aba3]" />
                Joined {joinedDate}
              </div>
            </div>
          </div>
          {role === "admin" && (
            <Button variant="default" className="bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg hover:shadow-xl hover:shadow-[#31aba3]/30 transition-all hover:scale-105" asChild>
              <a href="/admin">Admin Panel</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
