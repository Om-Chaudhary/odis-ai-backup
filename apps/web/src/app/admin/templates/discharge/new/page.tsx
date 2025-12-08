"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import { DischargeTemplateForm } from "~/components/admin/DischargeTemplateForm";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@odis/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewDischargeTemplatePage() {
  const router = useRouter();

  const createMutation =
    api.templates.createDischargeSummaryTemplate.useMutation({
      onSuccess: () => {
        toast.success("Discharge template created successfully");
        router.push("/admin/templates/discharge");
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to create template");
      },
    });

  const handleSubmit = async (data: {
    name: string;
    content: string;
    is_default: boolean;
    user_id: string;
  }) => {
    await createMutation.mutateAsync(data);
  };

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
            Create Discharge Summary Template
          </h1>
          <p className="text-muted-foreground text-base">
            Create a new discharge summary template
          </p>
        </div>
      </div>

      <DischargeTemplateForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
