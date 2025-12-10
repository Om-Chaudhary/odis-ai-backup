"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";
import { Label } from "@odis-ai/ui/label";
import { Button } from "@odis-ai/ui/button";
import { Spinner } from "@odis-ai/ui/spinner";
import { fetchPatients } from "~/server/actions/patients";
import type { CallPatient } from "@odis-ai/types";
import { formatPhoneNumber } from "@odis-ai/utils/phone-formatting";
import { Plus } from "lucide-react";

interface PatientSelectProps {
  value?: string;
  onValueChange: (patientId: string | undefined) => void;
  onAddNew?: () => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function PatientSelect({
  value,
  onValueChange,
  onAddNew,
  label = "Patient",
  placeholder = "Select a patient",
  required = false,
}: PatientSelectProps) {
  const [patients, setPatients] = useState<CallPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load patients on mount
  useEffect(() => {
    async function loadPatients() {
      setIsLoading(true);
      setError(null);

      const result = await fetchPatients();

      if (result.success && result.data) {
        setPatients(result.data);
      } else {
        setError(result.error ?? "Failed to load patients");
      }

      setIsLoading(false);
    }

    void loadPatients();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && (
          <Label>
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
        )}
        <div className="flex items-center gap-2 rounded-md border p-3">
          <Spinner className="h-4 w-4" />
          <span className="text-muted-foreground text-sm">
            Loading patients...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        {label && (
          <Label>
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
        )}
        <div className="rounded-md border border-red-500 bg-red-50 p-3 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
      )}

      <div className="flex gap-2">
        <Select
          value={value}
          onValueChange={(newValue) => {
            // Handle "none" option separately
            if (newValue === "__none__") {
              onValueChange(undefined);
            } else {
              onValueChange(newValue);
            }
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {/* Option to clear selection */}
            <SelectItem value="__none__">
              <span className="text-muted-foreground italic">
                No patient selected
              </span>
            </SelectItem>

            {patients.length === 0 ? (
              <div className="text-muted-foreground p-2 text-center text-sm">
                No patients found
              </div>
            ) : (
              patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{patient.pet_name}</span>
                    <span className="text-muted-foreground text-xs">
                      {patient.owner_name} •{" "}
                      {formatPhoneNumber(patient.owner_phone)}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}

            {/* Add new patient option */}
            {onAddNew && (
              <>
                <div className="my-1 border-t" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onAddNew();
                  }}
                  className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Patient</span>
                </button>
              </>
            )}
          </SelectContent>
        </Select>

        {onAddNew && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onAddNew}
            title="Add new patient"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Show selected patient details */}
      {value && value !== "__none__" && (
        <div className="bg-muted/50 rounded-md border p-3">
          {(() => {
            const selectedPatient = patients.find((p) => p.id === value);
            if (!selectedPatient) return null;

            return (
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    {selectedPatient.pet_name}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Owner:</span>{" "}
                    <span className="font-medium">
                      {selectedPatient.owner_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    <span className="font-medium">
                      {formatPhoneNumber(selectedPatient.owner_phone)}
                    </span>
                  </div>
                  {selectedPatient.vet_name && (
                    <div>
                      <span className="text-muted-foreground">Vet:</span>{" "}
                      <span>{selectedPatient.vet_name}</span>
                    </div>
                  )}
                  {selectedPatient.clinic_name && (
                    <div>
                      <span className="text-muted-foreground">Clinic:</span>{" "}
                      <span>{selectedPatient.clinic_name}</span>
                    </div>
                  )}
                </div>
                {selectedPatient.discharge_summary && (
                  <div className="mt-2 border-t pt-2">
                    <span className="text-muted-foreground">
                      Discharge Summary:
                    </span>
                    <p className="mt-1 line-clamp-2 text-xs">
                      {selectedPatient.discharge_summary}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// Export the reload function type for parent components
export type PatientSelectRef = {
  reloadPatients: () => Promise<void>;
};
