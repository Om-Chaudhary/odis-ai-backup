"use client";

import { Shield, Key } from "lucide-react";
import { Button } from "@odis-ai/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@odis-ai/ui/card";
import { Input } from "@odis-ai/ui/input";
import { Label } from "@odis-ai/ui/label";
import { Separator } from "@odis-ai/ui/separator";
import { Switch } from "@odis-ai/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@odis-ai/ui/tabs";
import { Badge } from "@odis-ai/ui/badge";
import type { User } from "@supabase/supabase-js";

interface DashboardProfileContentProps {
  user: User;
  profile: {
    first_name: string | null;
    last_name: string | null;
    role: string;
    clinic_name: string | null;
    license_number: string | null;
  } | null;
}

export default function DashboardProfileContent({
  user,
  profile,
}: DashboardProfileContentProps) {
  return (
    <Tabs defaultValue="personal" className="space-y-6">
      <TabsList className="relative grid w-full grid-cols-3 overflow-hidden border border-slate-100 bg-white shadow-sm">
        <TabsTrigger
          value="personal"
          className="relative z-10 transition-all hover:bg-slate-50 data-[state=active]:bg-[#31aba3] data-[state=active]:text-white data-[state=active]:shadow-sm"
        >
          Personal
        </TabsTrigger>
        <TabsTrigger
          value="account"
          className="relative z-10 transition-all hover:bg-slate-50 data-[state=active]:bg-[#31aba3] data-[state=active]:text-white data-[state=active]:shadow-sm"
        >
          Account
        </TabsTrigger>
        <TabsTrigger
          value="security"
          className="relative z-10 transition-all hover:bg-slate-50 data-[state=active]:bg-[#31aba3] data-[state=active]:text-white data-[state=active]:shadow-sm"
        >
          Security
        </TabsTrigger>
      </TabsList>

      {/* Personal Information */}
      <TabsContent value="personal" className="space-y-6">
        <Card className="relative overflow-hidden rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md transition-all hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
          <CardHeader className="relative z-10 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Personal Information
            </CardTitle>
            <CardDescription className="text-slate-600">
              Update your personal details and profile information.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  defaultValue={profile?.first_name ?? ""}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  defaultValue={profile?.last_name ?? ""}
                  placeholder="Enter your last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user.email ?? ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name</Label>
                <Input
                  id="clinicName"
                  defaultValue={profile?.clinic_name ?? ""}
                  placeholder="Your veterinary practice"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  defaultValue={profile?.license_number ?? ""}
                  placeholder="Professional license number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  defaultValue={profile?.role.replace(/_/g, " ") ?? ""}
                  disabled
                  className="bg-muted capitalize"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                className="border-slate-300 transition-all hover:border-[#31aba3]/30 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="bg-gradient-to-r from-[#31aba3] to-[#10b981] text-white shadow-xl transition-all hover:scale-105 hover:from-[#2a9a92] hover:to-[#0d9488] hover:shadow-2xl hover:shadow-[#31aba3]/40"
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Account Settings */}
      <TabsContent value="account" className="space-y-6">
        <Card className="relative overflow-hidden rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md transition-all hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
          <CardHeader className="relative z-10 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Account Settings
            </CardTitle>
            <CardDescription className="text-slate-600">
              Manage your account preferences and settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base text-slate-900">
                  Account Status
                </Label>
                <p className="text-sm text-slate-600">
                  Your account is currently active
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-green-200 bg-green-50 text-green-700"
              >
                Active
              </Badge>
            </div>
            <Separator className="bg-slate-100" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base text-slate-900">User ID</Label>
                <p className="font-mono text-sm text-slate-600">{user.id}</p>
              </div>
            </div>
            <Separator className="bg-slate-100" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base text-slate-900">Data Export</Label>
                <p className="text-sm text-slate-600">
                  Download a copy of your data
                </p>
              </div>
              <Button
                variant="outline"
                className="border-slate-200 transition-all hover:border-[#31aba3] hover:bg-teal-50 hover:text-[#31aba3]"
              >
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Security Settings */}
      <TabsContent value="security" className="space-y-6">
        <Card className="relative overflow-hidden rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md transition-all hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
          <CardHeader className="relative z-10 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Security Settings
            </CardTitle>
            <CardDescription className="text-slate-600">
              Manage your account security and authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base text-slate-900">Password</Label>
                  <p className="text-sm text-slate-600">Manage your password</p>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-200 transition-all hover:border-[#31aba3] hover:bg-teal-50 hover:text-[#31aba3]"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </div>
              <Separator className="bg-slate-100" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base text-slate-900">
                    Email Confirmed
                  </Label>
                  <p className="text-sm text-slate-600">
                    Your email address verification status
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    user.email_confirmed_at
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-yellow-200 bg-yellow-50 text-yellow-700"
                  }
                >
                  {user.email_confirmed_at ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <Separator className="bg-slate-100" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base text-slate-900">
                    Login Notifications
                  </Label>
                  <p className="text-sm text-slate-600">
                    Get notified when someone logs into your account
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-slate-100" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base text-slate-900">
                    Active Sessions
                  </Label>
                  <p className="text-sm text-slate-600">
                    Manage devices that are logged into your account
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-200 transition-all hover:border-[#31aba3] hover:bg-teal-50 hover:text-[#31aba3]"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  View Sessions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
