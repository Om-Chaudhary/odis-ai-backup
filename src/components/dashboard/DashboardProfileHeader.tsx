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
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={fullName} />
              )}
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <h1 className="text-2xl font-bold">{fullName}</h1>
              <Badge variant="secondary" className="w-fit capitalize">
                {roleDisplay}
              </Badge>
            </div>
            {profile?.clinic_name && (
              <p className="text-muted-foreground">{profile.clinic_name}</p>
            )}
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Mail className="size-4" />
                {user.email}
              </div>
              {profile?.license_number && (
                <div className="flex items-center gap-1">
                  <Stethoscope className="size-4" />
                  License: {profile.license_number}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="size-4" />
                Joined {joinedDate}
              </div>
            </div>
          </div>
          {role === "admin" && (
            <Button variant="default" asChild>
              <a href="/admin">Admin Panel</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
