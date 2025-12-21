"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import {
  Mail,
  Phone,
  User,
  ExternalLink,
  PawPrint,
  Trash2,
} from "lucide-react";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import { DeleteCaseDialog } from "../../cases/delete-case-dialog";
import { calculateAge, formatCaseType } from "./utils";

interface Patient {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  weightKg: number | null;
}

interface Owner {
  name: string | null;
  phone: string | null;
  email: string | null;
}

interface PatientHeaderProps {
  caseData: {
    id: string;
    caseId: string;
    patient: Patient;
    owner: Owner;
    caseType: string | null;
    status: string;
  };
  onDelete?: () => void;
}

/**
 * Patient header with contact info and case link
 */
export function PatientHeader({ caseData, onDelete }: PatientHeaderProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const age = caseData.patient.dateOfBirth
    ? calculateAge(caseData.patient.dateOfBirth)
    : null;

  // Check if case has been sent to hide the case type badge
  const isSentCase =
    caseData.status === "completed" || caseData.status === "failed";

  return (
    <div className="bg-muted/20 space-y-3 p-4 pt-10">
      {/* Patient Name & Case Link */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold">
            {caseData.patient.name}
          </h2>
          <p className="text-muted-foreground text-sm">
            {[caseData.patient.species, caseData.patient.breed, age]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Only show case type badge for unsent cases */}
          {!isSentCase && caseData.caseType && (
            <Badge variant="outline" className="whitespace-nowrap">
              <PawPrint className="mr-1 h-3 w-3" />
              {formatCaseType(caseData.caseType)}
            </Badge>
          )}
          <Link href={`/dashboard/cases/${caseData.caseId}`}>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              View Case
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 gap-1.5"
            onClick={() => setDeleteDialogOpen(true)}
            title="Delete this case"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Owner Contact Info - Clickable */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {caseData.owner.name && (
          <div className="flex items-center gap-1.5">
            <User className="text-muted-foreground h-4 w-4" />
            <span className="font-medium">{caseData.owner.name}</span>
          </div>
        )}
        {caseData.owner.phone && (
          <a
            href={`tel:${caseData.owner.phone}`}
            className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 hover:underline dark:text-teal-400"
          >
            <Phone className="h-4 w-4" />
            <span>{formatPhoneNumber(caseData.owner.phone)}</span>
          </a>
        )}
        {caseData.owner.email && (
          <a
            href={`mailto:${caseData.owner.email}`}
            className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 hover:underline dark:text-teal-400"
          >
            <Mail className="h-4 w-4" />
            <span className="max-w-[200px] truncate">
              {caseData.owner.email}
            </span>
          </a>
        )}
      </div>

      <DeleteCaseDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        caseId={caseData.id}
        patientName={caseData.patient.name}
        onSuccess={onDelete}
      />
    </div>
  );
}
