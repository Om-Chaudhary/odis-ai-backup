"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/client";
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

  const handleSubmit = async (data: Record<string, unknown>) => {
    await createMutation.mutateAsync(data as Parameters<typeof createMutation.mutateAsync>[0]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Link href="/admin/templates/soap">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-gradient-to-r hover:from-[#31aba3]/10 hover:to-[#2a9a92]/5 hover:text-[#31aba3] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Create SOAP Template</h1>
          <p className="text-base text-slate-600">
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
