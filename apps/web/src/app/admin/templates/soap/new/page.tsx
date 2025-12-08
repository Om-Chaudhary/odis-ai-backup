"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import { SoapTemplateForm } from "~/components/admin/SoapTemplateForm";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@odis/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewSoapTemplatePage() {
  const router = useRouter();

  const createMutation = api.templates.createSoapTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      router.push("/admin/templates/soap");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create template");
    },
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    await createMutation.mutateAsync(
      data as Parameters<typeof createMutation.mutateAsync>[0],
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Link href="/admin/templates/soap">
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
            Create SOAP Template
          </h1>
          <p className="text-muted-foreground text-base">
            Create a new SOAP note template with customizable sections
          </p>
        </div>
      </div>

      <SoapTemplateForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
