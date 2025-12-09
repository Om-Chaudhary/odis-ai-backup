"use client";

import { useState } from "react";
import { Button } from "@odis-ai/ui/button";
import { Input } from "@odis-ai/ui/input";
import { Label } from "@odis-ai/ui/label";
import { Switch } from "@odis-ai/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@odis-ai/ui/card";
import { Loader2, User, Lock, Briefcase } from "lucide-react";

interface UserFormProps {
  initialData?: {
    id?: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    role:
      | "veterinarian"
      | "vet_tech"
      | "admin"
      | "practice_owner"
      | "client"
      | null;
    clinic_name: string | null;
    license_number: string | null;
    onboarding_completed: boolean | null;
    avatar_url: string | null;
  };
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isSubmitting: boolean;
  mode: "create" | "edit";
}

export function UserForm({
  initialData,
  onSubmit,
  isSubmitting,
  mode,
}: UserFormProps) {
  const [formData, setFormData] = useState({
    email: initialData?.email ?? "",
    first_name: initialData?.first_name ?? "",
    last_name: initialData?.last_name ?? "",
    role: initialData?.role ?? "veterinarian",
    clinic_name: initialData?.clinic_name ?? "",
    license_number: initialData?.license_number ?? "",
    onboarding_completed: initialData?.onboarding_completed ?? false,
    avatar_url: initialData?.avatar_url ?? "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For edit mode, don't send password if it's empty
    const submitData: Record<string, unknown> = { ...formData };
    if (mode === "edit" && !submitData.password) {
      delete submitData.password;
    }

    await onSubmit(submitData);
  };

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Information */}
      <Card className="rounded-xl border-slate-200 bg-white/80 shadow-lg backdrop-blur-sm">
        <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-[#31aba3]/10 to-[#2a9a92]/5 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <User className="h-5 w-5 text-[#31aba3]" />
            Basic Information
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            User personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="first_name"
                className="text-sm font-semibold text-slate-700"
              >
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                required
                className="border-slate-200 shadow-sm transition-all focus:border-[#31aba3] focus:ring-2 focus:ring-[#31aba3]/20"
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="last_name"
                className="text-sm font-semibold text-slate-700"
              >
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                required
                className="border-slate-200 shadow-sm transition-all focus:border-[#31aba3] focus:ring-2 focus:ring-[#31aba3]/20"
                placeholder="Enter last name"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-slate-700"
              >
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                disabled={mode === "edit"}
                className="border-slate-200 shadow-sm transition-all focus:border-[#31aba3] focus:ring-2 focus:ring-[#31aba3]/20 disabled:opacity-60"
                placeholder="user@example.com"
              />
              {mode === "edit" && (
                <p className="text-muted-foreground text-xs">
                  Email cannot be changed after creation
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="role"
                className="text-sm font-semibold text-slate-700"
              >
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => updateField("role", value)}
                required
              >
                <SelectTrigger className="border-slate-200 shadow-sm">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="veterinarian">Veterinarian</SelectItem>
                  <SelectItem value="vet_tech">Vet Tech</SelectItem>
                  <SelectItem value="practice_owner">Practice Owner</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      {mode === "create" && (
        <Card className="rounded-xl border-slate-200 bg-white/80 shadow-lg backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-[#31aba3]/10 to-[#2a9a92]/5 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
              <Lock className="h-5 w-5 text-[#31aba3]" />
              Authentication
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Set the initial password for the user account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-semibold text-slate-700"
              >
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                required={mode === "create"}
                minLength={8}
                className="border-slate-200 shadow-sm transition-all focus:border-[#31aba3] focus:ring-2 focus:ring-[#31aba3]/20"
                placeholder="Minimum 8 characters"
              />
              <p className="text-muted-foreground text-xs">
                Password must be at least 8 characters long
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professional Information */}
      <Card className="rounded-xl border-slate-200 bg-white/80 shadow-lg backdrop-blur-sm">
        <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-[#31aba3]/10 to-[#2a9a92]/5 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <Briefcase className="h-5 w-5 text-[#31aba3]" />
            Professional Information
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Workplace and licensing details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="clinic_name"
                className="text-sm font-semibold text-slate-700"
              >
                Clinic Name
              </Label>
              <Input
                id="clinic_name"
                value={formData.clinic_name}
                onChange={(e) => updateField("clinic_name", e.target.value)}
                className="border-slate-200 shadow-sm transition-all focus:border-[#31aba3] focus:ring-2 focus:ring-[#31aba3]/20"
                placeholder="Enter clinic name"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="license_number"
                className="text-sm font-semibold text-slate-700"
              >
                License Number
              </Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => updateField("license_number", e.target.value)}
                className="border-slate-200 shadow-sm transition-all focus:border-[#31aba3] focus:ring-2 focus:ring-[#31aba3]/20"
                placeholder="Enter license number"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-lg border-2 border-[#31aba3]/20 bg-gradient-to-r from-[#31aba3]/5 to-[#2a9a92]/5 p-4">
            <Switch
              id="onboarding_completed"
              checked={formData.onboarding_completed}
              onCheckedChange={(checked) =>
                updateField("onboarding_completed", checked)
              }
            />
            <div className="space-y-0.5">
              <Label
                htmlFor="onboarding_completed"
                className="cursor-pointer text-sm font-semibold text-slate-900"
              >
                Onboarding Completed
              </Label>
              <p className="text-xs text-slate-600">
                Mark if user has completed the onboarding process
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="sticky bottom-0 z-20 flex items-center justify-between gap-4 rounded-lg border-2 border-[#31aba3]/20 bg-white/95 p-4 shadow-xl backdrop-blur-sm">
        <p className="text-sm font-medium text-slate-700">
          {mode === "create" ? "Create" : "Update"} user account to save changes
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          className="gap-2 bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#31aba3]/30"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create User" : "Update User"}
        </Button>
      </div>
    </form>
  );
}
