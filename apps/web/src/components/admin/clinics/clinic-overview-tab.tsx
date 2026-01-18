import { api } from "~/trpc/client";
import type { Database } from "@odis-ai/shared/types";
import { Card } from "@odis-ai/shared/ui/card";
import { FileText, Phone, Users } from "lucide-react";

type Clinic = Database["public"]["Tables"]["clinics"]["Row"];

interface ClinicOverviewTabProps {
  clinic: Clinic;
  clinicId: string;
}

export function ClinicOverviewTab({
  clinic,
  clinicId,
}: ClinicOverviewTabProps) {
  const { data: stats } = api.admin.clinics.getClinicStats.useQuery({
    clinicId,
    days: 7,
  });

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Cases (7d)</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.cases ?? "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Phone className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Calls (7d)</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.calls ?? "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Users</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.users ?? "—"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Clinic Information */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Clinic Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">Email</p>
            <p className="text-sm text-slate-900">
              {clinic.email ?? "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">Phone</p>
            <p className="text-sm text-slate-900">
              {clinic.phone ?? "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">Address</p>
            <p className="text-sm text-slate-900">
              {clinic.address ?? "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">Timezone</p>
            <p className="text-sm text-slate-900">
              {clinic.timezone ?? "America/New_York"}
            </p>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">PIMS Type</p>
            <p className="font-mono text-sm text-slate-900 uppercase">
              {clinic.pims_type}
            </p>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">Status</p>
            <p className="text-sm text-slate-900">
              {clinic.is_active ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
      </Card>

      {/* VAPI Configuration */}
      {(clinic.outbound_assistant_id ?? clinic.inbound_assistant_id) && (
        <Card className="border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            VAPI Configuration
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {clinic.outbound_assistant_id && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500">
                  Outbound Assistant ID
                </p>
                <p className="font-mono text-sm break-all text-slate-900">
                  {clinic.outbound_assistant_id}
                </p>
              </div>
            )}

            {clinic.outbound_phone_number_id && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500">
                  Outbound Phone Number ID
                </p>
                <p className="font-mono text-sm break-all text-slate-900">
                  {clinic.outbound_phone_number_id}
                </p>
              </div>
            )}

            {clinic.inbound_assistant_id && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500">
                  Inbound Assistant ID
                </p>
                <p className="font-mono text-sm break-all text-slate-900">
                  {clinic.inbound_assistant_id}
                </p>
              </div>
            )}

            {clinic.inbound_phone_number_id && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500">
                  Inbound Phone Number ID
                </p>
                <p className="font-mono text-sm break-all text-slate-900">
                  {clinic.inbound_phone_number_id}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Subscription Information */}
      {clinic.stripe_customer_id && (
        <Card className="border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Subscription
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">
                Stripe Customer ID
              </p>
              <p className="font-mono text-sm text-slate-900">
                {clinic.stripe_customer_id}
              </p>
            </div>

            {clinic.stripe_subscription_id && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500">
                  Subscription ID
                </p>
                <p className="font-mono text-sm text-slate-900">
                  {clinic.stripe_subscription_id}
                </p>
              </div>
            )}

            {clinic.subscription_tier && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500">Tier</p>
                <p className="text-sm text-slate-900 capitalize">
                  {clinic.subscription_tier}
                </p>
              </div>
            )}

            {clinic.subscription_status && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500">
                  Status
                </p>
                <p className="text-sm text-slate-900 capitalize">
                  {clinic.subscription_status}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
