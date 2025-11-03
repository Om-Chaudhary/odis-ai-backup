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
    <Card className="border-slate-200/60 shadow-xl bg-white/90 backdrop-blur-md relative overflow-hidden">
      {/* Subtle gradient background for the card */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: "linear-gradient(135deg, rgba(49, 171, 163, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)"
        }}
      />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            {/* Enhanced glow effect */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#31aba3] to-[#10b981] opacity-30 blur-lg animate-pulse-slow"></div>
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#31aba3] to-[#2a9a92] opacity-40 blur-sm"></div>
            <Avatar className="relative h-24 w-24 ring-2 ring-[#31aba3]/40 shadow-lg">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={fullName} />
              )}
              <AvatarFallback className="text-2xl bg-gradient-to-br from-[#31aba3] to-[#10b981] text-white shadow-inner">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-[#31aba3] to-slate-700 bg-clip-text text-transparent animate-gradient-subtle" style={{ backgroundSize: "200% 200%" }}>
                {fullName}
              </h1>
              <Badge 
                variant="secondary" 
                className="w-fit capitalize bg-gradient-to-r from-[#31aba3]/15 to-[#10b981]/10 text-[#31aba3] border-[#31aba3]/30 shadow-sm hover:shadow-md transition-shadow"
              >
                {roleDisplay}
              </Badge>
            </div>
            {profile?.clinic_name && (
              <p className="text-slate-700 font-semibold text-lg">{profile.clinic_name}</p>
            )}
            <div className="text-slate-600 flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 group">
                <div className="p-1 rounded-full bg-[#31aba3]/10 group-hover:bg-[#31aba3]/20 transition-colors">
                  <Mail className="size-4 text-[#31aba3]" />
                </div>
                <span className="group-hover:text-slate-800 transition-colors">{user.email}</span>
              </div>
              {profile?.license_number && (
                <div className="flex items-center gap-2 group">
                  <div className="p-1 rounded-full bg-[#31aba3]/10 group-hover:bg-[#31aba3]/20 transition-colors">
                    <Stethoscope className="size-4 text-[#31aba3]" />
                  </div>
                  <span className="group-hover:text-slate-800 transition-colors">License: {profile.license_number}</span>
                </div>
              )}
              <div className="flex items-center gap-2 group">
                <div className="p-1 rounded-full bg-[#31aba3]/10 group-hover:bg-[#31aba3]/20 transition-colors">
                  <Calendar className="size-4 text-[#31aba3]" />
                </div>
                <span className="group-hover:text-slate-800 transition-colors">Joined {joinedDate}</span>
              </div>
            </div>
          </div>
          {role === "admin" && (
            <Button 
              variant="default" 
              className="bg-gradient-to-r from-[#31aba3] to-[#10b981] text-white shadow-xl hover:shadow-2xl hover:shadow-[#31aba3]/40 transition-all hover:scale-105 hover:from-[#2a9a92] hover:to-[#0d9488] group relative overflow-hidden" 
              asChild
            >
              <a href="/admin" className="relative z-10">
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer"></div>
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
