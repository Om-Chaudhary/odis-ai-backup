"use client";

import { api } from "~/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@odis-ai/shared/ui/table";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { toast } from "sonner";
import { X, Mail } from "lucide-react";

/**
 * Pending Invitations Component
 *
 * Shows pending organization invitations with ability to revoke them.
 */
export function PendingInvitations() {
  const { data, isLoading, refetch } = api.team.listInvitations.useQuery({
    limit: 50,
    offset: 0,
  });

  const revokeMutation = api.team.revokeInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation revoked");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to revoke invitation");
    },
  });

  const handleRevoke = (invitationId: string) => {
    revokeMutation.mutate({ invitationId });
  };

  const getRoleBadge = (role: string) => {
    const labels = {
      "org:owner": "Owner",
      "org:admin": "Admin",
      "org:veterinarian": "Veterinarian",
      "org:member": "Member",
      "org:viewer": "Viewer",
    } as const;

    return (
      <Badge variant="outline">
        {labels[role as keyof typeof labels] ?? role}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Invitations sent but not yet accepted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            Loading invitations...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.invitations.length) {
    return null; // Don't show card if no pending invitations
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              {data.total} invitation{data.total !== 1 ? "s" : ""} awaiting
              acceptance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">
                  {invitation.email}
                </TableCell>
                <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(invitation.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(invitation.id)}
                    disabled={revokeMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
