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
import { ArrowLeft, Loader2, Briefcase, User, FileText, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: caseData, isLoading, refetch } = api.cases.getCase.useQuery(
    { id },
    { enabled: !!id }
  );

  const [status, setStatus] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [visibility, setVisibility] = useState<string>("");

  // Update mutation
  const updateMutation = api.cases.updateCase.useMutation({
    onSuccess: () => {
      toast.success("Case updated successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update case");
    },
  });

  const handleSave = async () => {
    const updates: Record<string, string | null> = {};
    if (status) updates.status = status;
    if (type) updates.type = type;
    if (visibility) updates.visibility = visibility;

    if (Object.keys(updates).length > 0) {
      await updateMutation.mutateAsync({
        id,
        data: updates,
      });
      // Reset form
      setStatus("");
      setType("");
      setVisibility("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading case...
          </p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="space-y-4">
        <Link href="/admin/cases">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Cases
          </Button>
        </Link>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold">Case not found</h2>
          <p className="text-muted-foreground mt-2">
            The case you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const patient = caseData.patient as unknown as { name?: string; species?: string; breed?: string; owner_name?: string; owner_phone?: string; owner_email?: string } | null;
  const soapNotes = caseData.soap_notes as unknown as Array<{ id: string; subjective?: string; objective?: string; assessment?: string; plan?: string; created_at: string }> ?? [];
  const dischargeSummaries = caseData.discharge_summaries as unknown as Array<{ id: string; content?: string; created_at: string }> ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Link href="/admin/cases">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Cases
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Case Details
            </h1>
            <p className="text-sm text-muted-foreground">
              View and update case information
            </p>
          </div>
        </div>
      </div>

      {/* Case Status Update */}
      <Card>
        <CardHeader>
          <CardTitle>Update Case</CardTitle>
          <CardDescription>Modify case status, type, or visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={caseData.status ?? "Select status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder={caseData.type ?? "Select type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkup">Checkup</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger>
                  <SelectValue placeholder={caseData.visibility ?? "Select visibility"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || (!status && !type && !visibility)}
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

      {/* Patient Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Patient Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {patient ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Patient Name</p>
                <p className="font-medium">{patient.name ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Species</p>
                <p className="font-medium">{patient.species ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Breed</p>
                <p className="font-medium">{patient.breed ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-medium">{patient.owner_name ?? "N/A"}</p>
              </div>
              {patient.owner_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Owner Phone</p>
                  <p className="font-medium">{patient.owner_phone}</p>
                </div>
              )}
              {patient.owner_email && (
                <div>
                  <p className="text-sm text-muted-foreground">Owner Email</p>
                  <p className="font-medium">{patient.owner_email}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No patient information available</p>
          )}
        </CardContent>
      </Card>

      {/* SOAP Notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>SOAP Notes ({soapNotes.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {soapNotes.length > 0 ? (
            <div className="space-y-4">
              {soapNotes.map((note) => (
                <div key={note.id} className="rounded-lg border p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(note.created_at).toLocaleString()}
                  </p>
                  {note.subjective && (
                    <div>
                      <p className="text-sm font-medium">Subjective:</p>
                      <p className="text-sm text-muted-foreground">{note.subjective}</p>
                    </div>
                  )}
                  {note.objective && (
                    <div>
                      <p className="text-sm font-medium">Objective:</p>
                      <p className="text-sm text-muted-foreground">{note.objective}</p>
                    </div>
                  )}
                  {note.assessment && (
                    <div>
                      <p className="text-sm font-medium">Assessment:</p>
                      <p className="text-sm text-muted-foreground">{note.assessment}</p>
                    </div>
                  )}
                  {note.plan && (
                    <div>
                      <p className="text-sm font-medium">Plan:</p>
                      <p className="text-sm text-muted-foreground">{note.plan}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No SOAP notes yet</p>
          )}
        </CardContent>
      </Card>

      {/* Discharge Summaries */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Discharge Summaries ({dischargeSummaries.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {dischargeSummaries.length > 0 ? (
            <div className="space-y-4">
              {dischargeSummaries.map((summary) => (
                <div key={summary.id} className="rounded-lg border p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(summary.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{summary.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No discharge summaries yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
