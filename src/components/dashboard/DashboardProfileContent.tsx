"use client";

import { Shield, Key } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
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
      <TabsList className="relative grid w-full grid-cols-3 overflow-hidden border border-slate-200/60 bg-white/90 shadow-xl backdrop-blur-md">
        {/* Subtle gradient background for tabs list */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(49, 171, 163, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
          }}
        />
        <TabsTrigger
          value="personal"
          className="relative z-10 transition-all hover:bg-[#31aba3]/10 data-[state=active]:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#31aba3] data-[state=active]:to-[#10b981] data-[state=active]:text-white data-[state=active]:shadow-xl"
        >
          Personal
        </TabsTrigger>
        <TabsTrigger
          value="account"
          className="relative z-10 transition-all hover:bg-[#31aba3]/10 data-[state=active]:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#31aba3] data-[state=active]:to-[#10b981] data-[state=active]:text-white data-[state=active]:shadow-xl"
        >
          Account
        </TabsTrigger>
        <TabsTrigger
          value="security"
          className="relative z-10 transition-all hover:bg-[#31aba3]/10 data-[state=active]:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#31aba3] data-[state=active]:to-[#10b981] data-[state=active]:text-white data-[state=active]:shadow-xl"
        >
          Security
        </TabsTrigger>
      </TabsList>

      {/* Personal Information */}
      <TabsContent value="personal" className="space-y-6">
        <Card className="relative overflow-hidden border-slate-200/60 bg-white/90 shadow-xl backdrop-blur-md">
          {/* Subtle gradient background */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(49, 171, 163, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
            }}
          />
          <CardHeader className="relative z-10 border-b border-slate-200/60 bg-gradient-to-r from-emerald-50/80 to-teal-50/50">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Personal Information
            </CardTitle>
            <CardDescription className="text-slate-600">
              Update your personal details and profile information.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6">
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
        <Card className="relative overflow-hidden border-slate-200/60 bg-white/90 shadow-xl backdrop-blur-md">
          {/* Subtle gradient background */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(49, 171, 163, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
            }}
          />
          <CardHeader className="relative z-10 border-b border-slate-200/60 bg-gradient-to-r from-emerald-50/80 to-teal-50/50">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Account Settings
            </CardTitle>
            <CardDescription className="text-slate-600">
              Manage your account preferences and settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6">
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
            <Separator className="bg-slate-200" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base text-slate-900">User ID</Label>
                <p className="font-mono text-sm text-slate-600">{user.id}</p>
              </div>
            </div>
            <Separator className="bg-slate-200" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base text-slate-900">Data Export</Label>
                <p className="text-sm text-slate-600">
                  Download a copy of your data
                </p>
              </div>
              <Button
                variant="outline"
                className="border-slate-300 transition-all hover:border-[#31aba3] hover:bg-teal-50 hover:text-[#31aba3] hover:shadow-md"
              >
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Security Settings */}
      <TabsContent value="security" className="space-y-6">
        <Card className="relative overflow-hidden border-slate-200/60 bg-white/90 shadow-xl backdrop-blur-md">
          {/* Subtle gradient background */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(49, 171, 163, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
            }}
          />
          <CardHeader className="relative z-10 border-b border-slate-200/60 bg-gradient-to-r from-emerald-50/80 to-teal-50/50">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Security Settings
            </CardTitle>
            <CardDescription className="text-slate-600">
              Manage your account security and authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base text-slate-900">Password</Label>
                  <p className="text-sm text-slate-600">Manage your password</p>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-300 transition-all hover:border-[#31aba3] hover:bg-teal-50 hover:text-[#31aba3] hover:shadow-md"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </div>
              <Separator className="bg-slate-200" />
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
              <Separator className="bg-slate-200" />
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
              <Separator className="bg-slate-200" />
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
                  className="border-slate-300 transition-all hover:border-[#31aba3] hover:bg-teal-50 hover:text-[#31aba3] hover:shadow-md"
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
