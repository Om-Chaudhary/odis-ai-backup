import type { Database } from "@odis-ai/shared/types";
import { Card } from "@odis-ai/shared/ui/card";
import { formatDistanceToNow } from "date-fns";

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

interface UserProfileSectionProps {
  user: User;
  userId: string;
}

export function UserProfileSection({ user }: UserProfileSectionProps) {
  return (
    <Card className="border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">
        Profile Information
      </h3>

      <div className="space-y-4">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-500">Full Name</p>
          <p className="text-sm text-slate-900">
            {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
              "Not set"}
          </p>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-slate-500">Email</p>
          <p className="text-sm text-slate-900">{user.email}</p>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-slate-500">
            Platform Role
          </p>
          <p className="text-sm text-slate-900 capitalize">
            {user.role ?? "staff"}
          </p>
        </div>

        {user.clinic_name && (
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Primary Clinic
            </p>
            <p className="text-sm text-slate-900">{user.clinic_name}</p>
          </div>
        )}

        <div>
          <p className="mb-1 text-sm font-medium text-slate-500">Joined</p>
          <p className="text-sm text-slate-900">
            {formatDistanceToNow(new Date(user.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>

        {user.created_at && (
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Last Sign In
            </p>
            <p className="text-sm text-slate-900">
              {formatDistanceToNow(new Date(user.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
