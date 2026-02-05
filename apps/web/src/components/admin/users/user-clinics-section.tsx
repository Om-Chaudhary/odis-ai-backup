import type { Database } from "@odis-ai/shared/types";
import { Card } from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Button } from "@odis-ai/shared/ui/button";
import { Building2, Plus, X } from "lucide-react";
import Link from "next/link";

type User = Database["public"]["Tables"]["users"]["Row"] & {
  clinics: Array<{
    clinic_id: string;
    role: string;
    clinics: {
      id: string;
      name: string;
      slug: string;
      is_active: boolean;
    } | null;
  }>;
};

interface UserClinicsSectionProps {
  user: User;
  userId: string;
  clinicSlug: string;
}

export function UserClinicsSection({
  user,
  clinicSlug,
}: UserClinicsSectionProps) {
  return (
    <Card className="border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Clinic Access</h3>
        <Button size="sm" variant="outline" className="gap-2">
          <Plus className="h-3 w-3" />
          Add Clinic
        </Button>
      </div>

      {user.clinics && user.clinics.length > 0 ? (
        <div className="space-y-3">
          {user.clinics.map((access) => {
            const clinic = access.clinics;
            if (!clinic) return null;

            return (
              <div
                key={clinic.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:border-amber-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                    <Building2 className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/${clinicSlug}/admin/clinics/${clinic.id}`}
                      className="text-sm font-medium text-slate-900 transition-colors hover:text-amber-700"
                    >
                      {clinic.name}
                    </Link>
                    <p className="text-xs text-slate-500">{clinic.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {access.role}
                  </Badge>
                  {clinic.is_active ? (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-slate-400 hover:text-red-600"
                    onClick={() => {
                      // TODO: Implement revoke access
                      console.log("Revoke access:", clinic.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Building2 className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="mb-3 text-sm text-slate-500">
            No clinic access assigned
          </p>
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="h-3 w-3" />
            Add Clinic Access
          </Button>
        </div>
      )}
    </Card>
  );
}
