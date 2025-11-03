"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
import { Loader2 } from "lucide-react";
import { api } from "~/trpc/client";

interface DischargeTemplateFormProps {
  initialData?: {
    name: string;
    content: string;
    is_default: boolean;
    user_id: string;
  };
  onSubmit: (data: {
    name: string;
    content: string;
    is_default: boolean;
    user_id: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function DischargeTemplateForm({
  initialData,
  onSubmit,
  isSubmitting,
}: DischargeTemplateFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [isDefault, setIsDefault] = useState(initialData?.is_default ?? false);
  const [userId, setUserId] = useState(initialData?.user_id ?? "");

  // Query users for assignment dropdown
  const { data: users, isLoading: isLoadingUsers } =
    api.templates.listUsers.useQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    if (!content.trim()) {
      return;
    }

    if (!userId) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      content: content.trim(),
      is_default: isDefault,
      user_id: userId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Discharge Summary"
              required
            />
          </div>

          {/* Assign to User */}
          <div className="space-y-2">
            <Label htmlFor="user">Assign to User *</Label>
            {isLoadingUsers ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading users...
              </div>
            ) : (
              <Select value={userId} onValueChange={setUserId} required>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Default Template Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is-default" className="text-base">
                Set as Default Template
              </Label>
              <p className="text-muted-foreground text-sm">
                This template will be used by default for this user
              </p>
            </div>
            <Switch
              id="is-default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>

          {/* Template Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Template Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the discharge summary template content..."
              rows={15}
              required
              className="font-mono text-sm"
            />
            <p className="text-muted-foreground text-xs">
              This content will be used as the base template for generating
              discharge summaries
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || !name.trim() || !content.trim() || !userId}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{initialData ? "Update Template" : "Create Template"}</>
          )}
        </Button>
      </div>
    </form>
  );
}
