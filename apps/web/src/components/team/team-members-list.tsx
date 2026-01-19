"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import { Button } from "@odis-ai/shared/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@odis-ai/shared/ui/alert-dialog";
import { Badge } from "@odis-ai/shared/ui/badge";
import { toast } from "sonner";
import { InviteTeamMemberDialog } from "./invite-team-member-dialog";
import { MoreHorizontal, UserPlus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@odis-ai/shared/ui/dropdown-menu";
import Image from 'next/image'

/**
 * Team Members List Component
 *
 * Displays and manages team members using Clerk organizations.
 * Only admins and owners can access this.
 */
export function TeamMembersList() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    userId: string;
    email: string;
  } | null>(null);

  const { data, isLoading, refetch } = api.team.list.useQuery({
    limit: 50,
    offset: 0,
  });

  const updateRoleMutation = api.team.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update role");
    },
  });

  const removeMutation = api.team.remove.useMutation({
    onSuccess: () => {
      toast.success("Team member removed");
      setRemoveDialog(null);
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to remove team member");
    },
  });
  type OrganizationRoleType =  "org:owner" | "org:admin" | "org:veterinarian" | "org:member" | "org:viewer";
  const handleRoleChange = (userId: string, newRole: OrganizationRoleType) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleRemove = () => {
    if (removeDialog) {
      removeMutation.mutate({ userId: removeDialog.userId });
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      "org:owner": "default",
      "org:admin": "secondary",
      "org:veterinarian": "outline",
      "org:member": "outline",
      "org:viewer": "outline",
    } as const;

    const labels = {
      "org:owner": "Owner",
      "org:admin": "Admin",
      "org:veterinarian": "Veterinarian",
      "org:member": "Member",
      "org:viewer": "Viewer",
    } as const;

    return (
      <Badge variant={variants[role as keyof typeof variants] ?? "outline"}>
        {labels[role as keyof typeof labels] ?? role}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your clinic's team members and their roles
              </CardDescription>
            </div>
            <Button
              onClick={() => setInviteDialogOpen(true)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading team members...
            </div>
          ) : !data?.members.length ? (
            <div className="py-8 text-center text-muted-foreground">
              No team members yet. Invite your first member to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {member.imageUrl && (
                          <Image
                            src={member.imageUrl}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="h-8 w-8 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium">
                            {member.firstName} {member.lastName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(value: OrganizationRoleType) =>
                          handleRoleChange(member.id, value)
                        }
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue>{getRoleBadge(member.role)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="org:owner">Owner</SelectItem>
                          <SelectItem value="org:admin">Admin</SelectItem>
                          <SelectItem value="org:veterinarian">
                            Veterinarian
                          </SelectItem>
                          <SelectItem value="org:member">Member</SelectItem>
                          <SelectItem value="org:viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setRemoveDialog({
                                open: true,
                                userId: member.id,
                                email: member.email,
                              })
                            }
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InviteTeamMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

      <AlertDialog
        open={removeDialog?.open ?? false}
        onOpenChange={(open) =>
          !open ? setRemoveDialog(null) : undefined
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">{removeDialog?.email}</span> from
              the team? They will lose access to all clinic data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700"
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
