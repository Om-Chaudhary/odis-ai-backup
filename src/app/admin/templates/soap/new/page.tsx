"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { SoapTemplateForm } from "~/components/admin/SoapTemplateForm";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "~/components/ui/button";
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

  const handleSubmit = async (data: any) => {
    await createMutation.mutateAsync(data);
  };

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
          <h1 className="text-3xl font-bold">Create SOAP Template</h1>
          <p className="text-muted-foreground mt-2">
            Create a new SOAP note template
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
