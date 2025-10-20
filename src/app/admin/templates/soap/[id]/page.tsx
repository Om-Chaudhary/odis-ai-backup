"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
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

  const handleSubmit = async (data: any) => {
    await updateMutation.mutateAsync({
      id: resolvedParams.id,
      data,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Template not found</p>
        <Link href="/admin/templates/soap">
          <Button className="mt-4">Back to Templates</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/templates/soap">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit SOAP Template</h1>
          <p className="text-muted-foreground mt-2">{template.display_name}</p>
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
