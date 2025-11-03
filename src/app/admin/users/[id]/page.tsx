"use client";

import { useRouter, useParams } from "next/navigation";
import { api } from "~/trpc/client";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ArrowLeft, Loader2, Users as UsersIcon, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: user, isLoading, refetch } = api.templates.getUser.useQuery(
    { id },
    { enabled: !!id }
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  // Update mutation
  const updateMutation = api.templates.updateUser.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      void refetch();
      // Reset form
      setFirstName("");
      setLastName("");
      setRole("");
      setClinicName("");
      setClinicEmail("");
      setClinicPhone("");
      setLicenseNumber("");
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update user");
    },
  });

  const handleSave = async () => {
    const updates: Record<string, string> = {};
    if (firstName) updates.first_name = firstName;
    if (lastName) updates.last_name = lastName;
    if (role) updates.role = role;
    if (clinicName) updates.clinic_name = clinicName;
    if (clinicEmail) updates.clinic_email = clinicEmail;
    if (clinicPhone) updates.clinic_phone = clinicPhone;
    if (licenseNumber) updates.license_number = licenseNumber;

    if (Object.keys(updates).length > 0) {
      await updateMutation.mutateAsync({
        id,
        data: updates,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading user...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </Link>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold">User not found</h2>
          <p className="text-muted-foreground mt-2">
            The user you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <UsersIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              User Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              View and update user information
            </p>
          </div>
        </div>
      </div>

      {/* Current Information */}
      <Card>
        <CardHeader>
          <CardTitle>Current Information</CardTitle>
          <CardDescription>User account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user.first_name} {user.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{user.role?.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clinic Name</p>
              <p className="font-medium">{user.clinic_name ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clinic Email</p>
              <p className="font-medium">{user.clinic_email ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clinic Phone</p>
              <p className="font-medium">{user.clinic_phone ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">License Number</p>
              <p className="font-medium">{user.license_number ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Joined</p>
              <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update User</CardTitle>
          <CardDescription>Modify user profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={user.first_name ?? "First name"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={user.last_name ?? "Last name"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder={user.role ?? "Select role"} />
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
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder={user.license_number ?? "License number"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic Name</Label>
              <Input
                id="clinicName"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder={user.clinic_name ?? "Clinic name"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicEmail">Clinic Email</Label>
              <Input
                id="clinicEmail"
                type="email"
                value={clinicEmail}
                onChange={(e) => setClinicEmail(e.target.value)}
                placeholder={user.clinic_email ?? "clinic@example.com"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicPhone">Clinic Phone</Label>
              <Input
                id="clinicPhone"
                type="tel"
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
                placeholder={user.clinic_phone ?? "Phone number"}
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || (!firstName && !lastName && !role && !clinicName && !clinicEmail && !clinicPhone && !licenseNumber)}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
