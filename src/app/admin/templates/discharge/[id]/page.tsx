"use client";

import { useRouter, useParams } from "next/navigation";
import { api } from "~/trpc/client";
import { DischargeTemplateForm } from "~/components/admin/DischargeTemplateForm";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditDischargeTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: template, isLoading } = api.templates.getDischargeSummaryTemplate.useQuery(
    { id },
    { enabled: !!id }
  );

  const updateMutation = api.templates.updateDischargeSummaryTemplate.useMutation({
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading template...
          </p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="space-y-4">
        <Link href="/admin/templates/discharge">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </Button>
        </Link>
        <div className="text-center py-16">
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
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Edit Discharge Summary Template
          </h1>
          <p className="text-base text-muted-foreground">
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
