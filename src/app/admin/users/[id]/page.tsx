"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/client";
import { UserForm } from "~/components/admin/UserForm";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { use } from "react";

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { data: user, isLoading } = api.users.getUser.useQuery({
    id: resolvedParams.id,
  });

  const updateMutation = api.users.updateUser.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      router.push("/admin/users");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    await updateMutation.mutateAsync({
      id: resolvedParams.id,
      data: data as Parameters<typeof updateMutation.mutateAsync>[0]["data"],
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#31aba3]" />
          <p className="text-sm text-slate-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <svg
              className="h-12 w-12 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">User not found</p>
            <p className="text-sm text-muted-foreground">
              The user you&apos;re looking for doesn&apos;t exist
            </p>
          </div>
          <Link href="/admin/users">
            <Button className="gap-2 bg-gradient-to-r from-[#31aba3] to-[#2a9a92] shadow-lg">
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Link href="/admin/users">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-gradient-to-r hover:from-[#31aba3]/10 hover:to-[#2a9a92]/5 hover:text-[#31aba3] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Edit User
          </h1>
          <p className="text-base text-slate-600">
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.email}
          </p>
        </div>
      </div>

      <UserForm
        initialData={user}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        mode="edit"
      />
    </div>
  );
}
