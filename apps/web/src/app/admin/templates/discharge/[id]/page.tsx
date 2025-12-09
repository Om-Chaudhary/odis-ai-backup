"use client";

import { useRouter, useParams } from "next/navigation";
import { api } from "~/trpc/client";
import { DischargeTemplateForm } from "~/components/admin/forms/discharge-template-form";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@odis-ai/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditDischargeTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: template, isLoading } =
    api.templates.getDischargeSummaryTemplate.useQuery(
      { id },
      { enabled: !!id },
    );

  const updateMutation =
    api.templates.updateDischargeSummaryTemplate.useMutation({
      onSuccess: () => {
        toast.success("Discharge template updated successfully");
        router.push("/admin/templates/discharge");
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to update template");
      },
    });

  const handleSubmit = async (data: {
    name: string;
    content: string;
    is_default: boolean;
    user_id: string;
  }) => {
    await updateMutation.mutateAsync({
      id,
      data,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="space-y-4">
        <Link href="/admin/templates/discharge">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-primary/10 hover:text-primary gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </Button>
        </Link>
        <div className="py-16 text-center">
          <h2 className="text-2xl font-bold">Template not found</h2>
          <p className="text-muted-foreground mt-2">
            The template you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Link href="/admin/templates/discharge">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-primary/10 hover:text-primary gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            Edit Discharge Summary Template
          </h1>
          <p className="text-muted-foreground text-base">
            Update the discharge summary template details
          </p>
        </div>
      </div>

      <DischargeTemplateForm
        initialData={{
          name: template.name,
          content: template.content,
          is_default: template.is_default ?? false,
          user_id: template.user_id,
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
