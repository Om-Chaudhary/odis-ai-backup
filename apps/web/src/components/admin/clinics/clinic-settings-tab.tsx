import type { Database } from "@odis-ai/shared/types";
import { Card } from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";

type Clinic = Database["public"]["Tables"]["clinics"]["Row"];

interface ClinicSettingsTabProps {
  clinic: Clinic;
  clinicId: string;
}

export function ClinicSettingsTab({ clinic }: ClinicSettingsTabProps) {
  const businessHours = clinic.business_hours as Record<
    string,
    { open: string; close: string; enabled: boolean }
  > | null;

  return (
    <div className="space-y-6">
      {/* Business Hours */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Business Hours
        </h3>
        {businessHours ? (
          <div className="space-y-3">
            {Object.entries(businessHours).map(([day, hours]) => (
              <div key={day} className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 capitalize">
                  {day}
                </span>
                {hours.enabled ? (
                  <span className="text-sm text-slate-600">
                    {hours.open} - {hours.close}
                  </span>
                ) : (
                  <Badge variant="secondary">Closed</Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No business hours configured</p>
        )}
      </Card>

      {/* Branding */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Branding</h3>
        <div className="grid gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">Logo URL</p>
            <p className="text-sm text-slate-900">
              {clinic.logo_url ?? "Not set"}
            </p>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Primary Color
            </p>
            <div className="flex items-center gap-2">
              {clinic.primary_color && (
                <div
                  className="h-6 w-6 rounded border border-slate-200"
                  style={{ backgroundColor: clinic.primary_color }}
                />
              )}
              <p className="text-sm text-slate-900">
                {clinic.primary_color ?? "Not set"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Email Configuration */}
      {(clinic.email_header_text ?? clinic.email_footer_text) && (
        <Card className="border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Email Configuration
          </h3>
          <div className="space-y-4">
            {clinic.email_header_text && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500">
                  Header Text
                </p>
                <p className="text-sm text-slate-900">
                  {clinic.email_header_text}
                </p>
              </div>
            )}
            {clinic.email_footer_text && (
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500">
                  Footer Text
                </p>
                <p className="text-sm text-slate-900">
                  {clinic.email_footer_text}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
