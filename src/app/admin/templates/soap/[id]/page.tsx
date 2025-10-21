"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import { SoapTemplateForm } from "~/components/admin/SoapTemplateForm";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { use } from "react";

export default function EditSoapTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { data: template, isLoading } = api.templates.getSoapTemplate.useQuery({
    id: resolvedParams.id,
  });

  const updateMutation = api.templates.updateSoapTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
      router.push("/admin/templates/soap");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update template");
    },
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    await updateMutation.mutateAsync({
      id: resolvedParams.id,
      data: data as Parameters<typeof updateMutation.mutateAsync>[0]['data'],
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <svg className="h-12 w-12 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Template not found</p>
            <p className="text-sm text-muted-foreground">The template you&apos;re looking for doesn&apos;t exist</p>
          </div>
          <Link href="/admin/templates/soap">
            <Button className="gap-2 shadow-md">
              <ArrowLeft className="h-4 w-4" />
              Back to Templates
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Link href="/admin/templates/soap">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit SOAP Template</h1>
          <p className="text-base text-muted-foreground">{template.display_name}</p>
        </div>
      </div>

      <SoapTemplateForm
        initialData={template}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
