"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@odis-ai/shared/ui/dialog";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import { toast } from "sonner";

type UserRole =
  | "veterinarian"
  | "vet_tech"
  | "admin"
  | "practice_owner"
  | "client";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({
  open,
  onOpenChange,
}: InviteUserDialogProps) {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "vet_tech" as UserRole,
    clinicId: "",
    clinicRole: "member" as "owner" | "admin" | "member",
  });

  const { data: clinicsData } = api.admin.clinics.list.useQuery({
    isActive: true,
    limit: 100,
    offset: 0,
  });

  // Type assertion to break deep type inference chain
  const clinics = clinicsData as
    | { clinics: Array<{ id: string; name: string }> }
    | undefined;

  const inviteMutation = api.admin.users.invite.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      onOpenChange(false);
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        role: "vet_tech",
        clinicId: "",
        clinicRole: "member",
      });
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to send invitation");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clinicId) {
      toast.error("Please select a clinic");
      return;
    }

    inviteMutation.mutate({
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      clinicId: formData.clinicId,
      clinicRole: formData.clinicRole,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation to a new user to join the platform
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinic">Clinic *</Label>
            <Select
              value={formData.clinicId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, clinicId: value }))
              }
            >
              <SelectTrigger id="clinic">
                <SelectValue placeholder="Select a clinic" />
              </SelectTrigger>
              <SelectContent>
                {}
                {clinics?.clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Platform Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="veterinarian">Veterinarian</SelectItem>
                  <SelectItem value="vet_tech">Vet Tech</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="practice_owner">Practice Owner</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicRole">Clinic Role *</Label>
              <Select
                value={formData.clinicRole}
                onValueChange={(value: "owner" | "admin" | "member") =>
                  setFormData((prev) => ({ ...prev, clinicRole: value }))
                }
              >
                <SelectTrigger id="clinicRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700"
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
