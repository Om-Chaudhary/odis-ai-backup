"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import { UserForm } from "~/components/admin/UserForm";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@odis/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewUserPage() {
  const router = useRouter();

  const createMutation = api.users.createUser.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      router.push("/admin/users");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create user");
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
        <Link href="/admin/users">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 transition-colors hover:bg-gradient-to-r hover:from-[#31aba3]/10 hover:to-[#2a9a92]/5 hover:text-[#31aba3]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Add New User
          </h1>
          <p className="text-base text-slate-600">
            Create a new user account and onboard them to the platform
          </p>
        </div>
      </div>

      <UserForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        mode="create"
      />
    </div>
  );
}
