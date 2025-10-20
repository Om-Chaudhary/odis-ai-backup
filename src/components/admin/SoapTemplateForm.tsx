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
import { api } from "~/trpc/react";

interface SoapTemplateFormProps {
  initialData?: {
    id?: string;
    template_id: string;
    template_name: string;
    display_name: string;
    person_name: string;
    icon_name: string;
    is_default: boolean;
    user_id?: string | null;
    subjective_template?: string | null;
    subjective_prompt?: string | null;
    objective_template?: string | null;
    objective_prompt?: string | null;
    assessment_template?: string | null;
    assessment_prompt?: string | null;
    plan_template?: string | null;
    plan_prompt?: string | null;
    client_instructions_template?: string | null;
    client_instructions_prompt?: string | null;
    system_prompt_addition?: string | null;
  };
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

export function SoapTemplateForm({
  initialData,
  onSubmit,
  isSubmitting,
}: SoapTemplateFormProps) {
  const [formData, setFormData] = useState(
    initialData || {
      template_id: "",
      template_name: "",
      display_name: "",
      person_name: "",
      icon_name: "",
      is_default: false,
      user_id: null,
      subjective_template: "",
      subjective_prompt: "",
      objective_template: "",
      objective_prompt: "",
      assessment_template: "",
      assessment_prompt: "",
      plan_template: "",
      plan_prompt: "",
      client_instructions_template: "",
      client_instructions_prompt: "",
      system_prompt_addition: "",
    }
  );

  const { data: users, isLoading: usersLoading } = api.templates.listUsers.useQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Template identification and display settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template_id">Template ID *</Label>
              <Input
                id="template_id"
                value={formData.template_id}
                onChange={(e) => updateField("template_id", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template_name">Template Name *</Label>
              <Input
                id="template_name"
                value={formData.template_name}
                onChange={(e) => updateField("template_name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => updateField("display_name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person_name">Person Name *</Label>
              <Input
                id="person_name"
                value={formData.person_name}
                onChange={(e) => updateField("person_name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon_name">Icon Name *</Label>
              <Input
                id="icon_name"
                value={formData.icon_name}
                onChange={(e) => updateField("icon_name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_id">Assign to User</Label>
              <Select
                value={formData.user_id || "unassigned"}
                onValueChange={(value) =>
                  updateField("user_id", value === "unassigned" ? null : value)
                }
                disabled={usersLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => updateField("is_default", checked)}
            />
            <Label htmlFor="is_default">Set as default template</Label>
          </div>
        </CardContent>
      </Card>

      {/* SOAP Sections */}
      {[
        { key: "subjective", label: "Subjective" },
        { key: "objective", label: "Objective" },
        { key: "assessment", label: "Assessment" },
        { key: "plan", label: "Plan" },
        { key: "client_instructions", label: "Client Instructions" },
      ].map((section) => (
        <Card key={section.key}>
          <CardHeader>
            <CardTitle>{section.label}</CardTitle>
            <CardDescription>
              Template and AI prompt for {section.label.toLowerCase()} section
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${section.key}_template`}>
                {section.label} Template
              </Label>
              <Textarea
                id={`${section.key}_template`}
                value={formData[`${section.key}_template` as keyof typeof formData] as string || ""}
                onChange={(e) =>
                  updateField(`${section.key}_template`, e.target.value)
                }
                rows={4}
                placeholder="Enter template content..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${section.key}_prompt`}>
                {section.label} AI Prompt
              </Label>
              <Textarea
                id={`${section.key}_prompt`}
                value={formData[`${section.key}_prompt` as keyof typeof formData] as string || ""}
                onChange={(e) =>
                  updateField(`${section.key}_prompt`, e.target.value)
                }
                rows={3}
                placeholder="Enter AI generation prompt..."
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>System Prompt Addition</CardTitle>
          <CardDescription>
            Additional instructions for the AI system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="system_prompt_addition"
            value={formData.system_prompt_addition || ""}
            onChange={(e) =>
              updateField("system_prompt_addition", e.target.value)
            }
            rows={4}
            placeholder="Enter additional system instructions..."
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Update Template" : "Create Template"}
        </Button>
      </div>
    </form>
  );
}
