"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Loader2 } from "lucide-react";
import { api } from "~/trpc/client";
import type { Database } from "~/database.types";

type SoapTemplateData = Database["public"]["Tables"]["temp_soap_templates"]["Row"];

interface SoapTemplateFormProps {
  initialData?: SoapTemplateData;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isSubmitting: boolean;
}

export function SoapTemplateForm({
  initialData,
  onSubmit,
  isSubmitting,
}: SoapTemplateFormProps) {
  const [formData, setFormData] = useState({
    template_id: initialData?.template_id ?? "",
    template_name: initialData?.template_name ?? "",
    display_name: initialData?.display_name ?? "",
    person_name: initialData?.person_name ?? "",
    icon_name: initialData?.icon_name ?? "",
    is_default: initialData?.is_default ?? false,
    user_id: initialData?.user_id ?? null,
    subjective_template: initialData?.subjective_template ?? "",
    subjective_prompt: initialData?.subjective_prompt ?? "",
    objective_template: initialData?.objective_template ?? "",
    objective_prompt: initialData?.objective_prompt ?? "",
    assessment_template: initialData?.assessment_template ?? "",
    assessment_prompt: initialData?.assessment_prompt ?? "",
    plan_template: initialData?.plan_template ?? "",
    plan_prompt: initialData?.plan_prompt ?? "",
    client_instructions_template: initialData?.client_instructions_template ?? "",
    client_instructions_prompt: initialData?.client_instructions_prompt ?? "",
    system_prompt_addition: initialData?.system_prompt_addition ?? "",
  });

  const { data: users, isLoading: usersLoading } = api.templates.listUsers.useQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Information */}
      <Card className="rounded-xl border-slate-200 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-[#31aba3]/10 to-[#2a9a92]/5 border-b border-slate-200 pb-3">
          <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
            <span className="text-xl">ℹ️</span>
            Basic Information
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Template identification and display settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template_id" className="text-sm font-semibold text-slate-700">
                Template ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template_id"
                value={formData.template_id}
                onChange={(e) => updateField("template_id", e.target.value)}
                required
                className="shadow-sm transition-all focus:ring-2 focus:ring-[#31aba3]/20 focus:border-[#31aba3] border-slate-200"
                placeholder="e.g., soap_general"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template_name" className="text-sm font-semibold text-foreground">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template_name"
                value={formData.template_name}
                onChange={(e) => updateField("template_name", e.target.value)}
                required
                className="shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., General SOAP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-sm font-semibold text-foreground">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => updateField("display_name", e.target.value)}
                required
                className="shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., General Practice SOAP Note"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person_name" className="text-sm font-semibold text-foreground">
                Person Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="person_name"
                value={formData.person_name}
                onChange={(e) => updateField("person_name", e.target.value)}
                required
                className="shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., Patient"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon_name" className="text-sm font-semibold text-foreground">
                Icon Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="icon_name"
                value={formData.icon_name}
                onChange={(e) => updateField("icon_name", e.target.value)}
                required
                className="shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., Stethoscope"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_id" className="text-sm font-semibold text-foreground">
                Assign to User
              </Label>
              <Select
                value={formData.user_id ?? "unassigned"}
                onValueChange={(value) =>
                  updateField("user_id", value === "unassigned" ? null : value)
                }
                disabled={usersLoading}
              >
                <SelectTrigger className="shadow-sm">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users?.map((user) => {
                    const displayName =
                      user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name} (${user.email})`
                        : user.email;

                    return (
                      <SelectItem key={user.id} value={user.id}>
                        {displayName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-lg border-2 border-[#31aba3]/20 bg-gradient-to-r from-[#31aba3]/5 to-[#2a9a92]/5 p-4">
            <Switch
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => updateField("is_default", checked)}
            />
            <div className="space-y-0.5">
              <Label htmlFor="is_default" className="text-sm font-semibold text-slate-900 cursor-pointer">
                Set as default template
              </Label>
              <p className="text-xs text-slate-600">
                Default templates are available to all users
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SOAP Sections */}
      {[
        { key: "subjective", label: "Subjective", icon: "💭", description: "Patient's reported symptoms and concerns" },
        { key: "objective", label: "Objective", icon: "📊", description: "Observable and measurable findings" },
        { key: "assessment", label: "Assessment", icon: "🔍", description: "Clinical interpretation and diagnosis" },
        { key: "plan", label: "Plan", icon: "📋", description: "Treatment plan and next steps" },
        { key: "client_instructions", label: "Client Instructions", icon: "📝", description: "Patient guidance and directions" },
      ].map((section) => (
        <Card key={section.key} className="rounded-xl border-slate-200 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-teal-50/30 border-b border-slate-200 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
              <span className="text-xl">{section.icon}</span>
              {section.label}
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              {section.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor={`${section.key}_template`} className="text-sm font-semibold text-foreground">
                {section.label} Template
              </Label>
              <Textarea
                id={`${section.key}_template`}
                value={(formData[`${section.key}_template` as keyof typeof formData] as string) ?? ""}
                onChange={(e) =>
                  updateField(`${section.key}_template`, e.target.value)
                }
                className="shadow-sm font-mono text-sm transition-all focus:ring-2 focus:ring-primary/20 max-h-32 min-h-[160px] resize-none overflow-y-auto"
                placeholder="Enter template content..."
              />
              <p className="text-xs text-muted-foreground">
                The base template structure for this section
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${section.key}_prompt`} className="text-sm font-semibold text-foreground">
                {section.label} AI Prompt
              </Label>
              <Textarea
                id={`${section.key}_prompt`}
                value={(formData[`${section.key}_prompt` as keyof typeof formData] as string) ?? ""}
                onChange={(e) =>
                  updateField(`${section.key}_prompt`, e.target.value)
                }
                className="shadow-sm transition-all focus:ring-2 focus:ring-primary/20 max-h-24 min-h-[120px] resize-none overflow-y-auto"
                placeholder="Enter AI generation prompt..."
              />
              <p className="text-xs text-muted-foreground">
                Instructions for AI to generate content for this section
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* System Prompt */}
      <Card className="rounded-xl border-slate-200 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-teal-50/30 border-b border-slate-200 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <span className="text-xl">⚙️</span>
            System Prompt Addition
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Additional instructions for the AI system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          <Label htmlFor="system_prompt_addition" className="text-sm font-semibold text-foreground">
            System Instructions
          </Label>
          <Textarea
            id="system_prompt_addition"
            value={formData.system_prompt_addition ?? ""}
            onChange={(e) =>
              updateField("system_prompt_addition", e.target.value)
            }
            className="shadow-sm transition-all focus:ring-2 focus:ring-primary/20 max-h-40 min-h-[200px] resize-none overflow-y-auto"
            placeholder="Enter additional system instructions..."
          />
          <p className="text-xs text-muted-foreground">
            Global instructions that apply to all sections of this template
          </p>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="sticky bottom-0 z-20 flex items-center justify-between gap-4 rounded-lg border-2 border-[#31aba3]/20 bg-white/95 p-4 shadow-xl backdrop-blur-sm">
        <p className="text-sm text-slate-700 font-medium">
          {initialData?.id ? "Update" : "Create"} your template to make it available for use
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          className="gap-2 bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg hover:shadow-xl hover:shadow-[#31aba3]/30 transition-all hover:scale-105"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {initialData?.id ? "Update Template" : "Create Template"}
        </Button>
      </div>
    </form>
  );
}
