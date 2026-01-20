"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Card } from "@odis-ai/shared/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/client";

export default function CreateClinicPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    timezone: "America/New_York",
    pimsType: "idexx" as "idexx" | "neo",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMutation = api.admin.clinics.create.useMutation<any>({
    onSuccess: (data) => {
      toast.success("Clinic created successfully");

      router.push(`/admin/clinics/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create clinic");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    createMutation.mutate({
      name: formData.name,
      slug: formData.slug,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      timezone: formData.timezone,
      pimsType: formData.pimsType,
    });
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug:
        prev.slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
    }));
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Create New Clinic
          </h1>
          <p className="text-sm text-slate-500">
            Add a new veterinary clinic to the platform
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="border-slate-200 bg-white p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Basic Information
              </h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Clinic Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Riverside Veterinary Hospital"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="slug">
                    URL Slug *
                    <span className="ml-2 text-xs text-slate-500">
                      (lowercase, hyphens only)
                    </span>
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="e.g., riverside-vet"
                    pattern="^[a-z0-9-]+$"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="clinic@example.com"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Configuration
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone *</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, timezone: value }))
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">
                        Eastern (ET)
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central (CT)
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain (MT)
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific (PT)
                      </SelectItem>
                      <SelectItem value="America/Phoenix">
                        Arizona (MST)
                      </SelectItem>
                      <SelectItem value="America/Anchorage">
                        Alaska (AKT)
                      </SelectItem>
                      <SelectItem value="Pacific/Honolulu">
                        Hawaii (HST)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pimsType">PIMS Type *</Label>
                  <Select
                    value={formData.pimsType}
                    onValueChange={(value: "idexx" | "neo") =>
                      setFormData((prev) => ({ ...prev, pimsType: value }))
                    }
                  >
                    <SelectTrigger id="pimsType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idexx">IDEXX Neo</SelectItem>
                      <SelectItem value="neo">Neo (standalone)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Clinic"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
