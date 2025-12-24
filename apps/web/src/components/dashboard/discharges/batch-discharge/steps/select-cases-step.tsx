import { Button } from "@odis-ai/shared/ui/button";
import { Checkbox } from "@odis-ai/shared/ui/checkbox";
import { Input } from "@odis-ai/shared/ui/input";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Alert, AlertDescription } from "@odis-ai/shared/ui/alert";
import { ScrollArea } from "@odis-ai/shared/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import {
  ArrowRight,
  Search,
  Calendar,
  Loader2,
  Users,
  CheckCircle,
  Mail,
  Phone,
  Stethoscope,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@odis-ai/shared/util";
import type { BatchEligibleCase } from "@odis-ai/shared/types";
import type { DateFilter } from "../types";

interface SelectCasesStepProps {
  filteredCases: BatchEligibleCase[];
  selectableCases: BatchEligibleCase[];
  selectedCases: Set<string>;
  dateFilter: DateFilter;
  searchQuery: string;
  dateCounts: Record<DateFilter, number>;
  dayLabels: Record<DateFilter, string>;
  emailsEnabled: boolean;
  callsEnabled: boolean;
  isLoading: boolean;
  onSelectCase: (caseId: string) => void;
  onSelectAll: () => void;
  onDateFilterChange: (filter: DateFilter) => void;
  onSearchChange: (query: string) => void;
  onNext: () => void;
}

export function SelectCasesStep({
  filteredCases,
  selectableCases,
  selectedCases,
  dateFilter,
  searchQuery,
  dateCounts,
  dayLabels,
  emailsEnabled,
  callsEnabled,
  isLoading,
  onSelectCase,
  onSelectAll,
  onDateFilterChange,
  onSearchChange,
  onNext,
}: SelectCasesStepProps) {
  const selectedCasesWithEmail = filteredCases.filter(
    (c) => selectedCases.has(c.id) && c.hasEmail,
  ).length;
  const selectedCasesWithPhone = filteredCases.filter(
    (c) => selectedCases.has(c.id) && c.hasPhone,
  ).length;
  const excludedCasesCount = filteredCases.length - selectableCases.length;

  const isCaseSelectable = (c: BatchEligibleCase) => {
    if (emailsEnabled && callsEnabled) {
      return c.hasEmail || c.hasPhone;
    } else if (emailsEnabled) {
      return c.hasEmail;
    } else if (callsEnabled) {
      return c.hasPhone;
    }
    return false;
  };

  return (
    <Card>
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Select Cases</CardTitle>
            <CardDescription>
              Choose which cases to include in this batch
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search patients or owners..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filters - Individual Days */}
          <div className="flex items-center gap-1.5">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-slate-50/50 p-1">
              {(
                [
                  "today",
                  "yesterday",
                  "day-2",
                  "day-3",
                  "day-4",
                ] as DateFilter[]
              ).map((day) => (
                <Button
                  key={day}
                  variant={dateFilter === day ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onDateFilterChange(day)}
                  className="h-7 gap-1.5 px-2.5"
                >
                  {dayLabels[day]}
                  {dateCounts[day] > 0 && (
                    <Badge
                      variant={dateFilter === day ? "default" : "secondary"}
                      className="h-5 min-w-5 px-1.5"
                    >
                      {dateCounts[day]}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="text-muted-foreground/30 mx-auto h-12 w-12" />
            <p className="text-muted-foreground mt-4">
              No eligible cases found
            </p>
            <p className="text-muted-foreground text-sm">
              Cases need clinical notes and valid contact information
            </p>
          </div>
        ) : (
          <>
            {/* Select All Header */}
            <div className="flex items-center justify-between border-y bg-gradient-to-r from-slate-50/50 to-transparent px-4 py-3">
              <label className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  checked={
                    selectedCases.size === selectableCases.length &&
                    selectableCases.length > 0
                  }
                  onCheckedChange={onSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedCases.size === selectableCases.length
                    ? "Deselect all"
                    : "Select all"}
                </span>
              </label>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground text-sm font-medium">
                  {filteredCases.length} case
                  {filteredCases.length !== 1 ? "s" : ""}
                </span>
                {selectedCasesWithEmail > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
                    <Mail className="h-3 w-3" />
                    {selectedCasesWithEmail} Email
                  </span>
                )}
                {selectedCasesWithPhone > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <Phone className="h-3 w-3" />
                    {selectedCasesWithPhone} Call
                  </span>
                )}
              </div>
            </div>

            {/* Excluded Cases Warning */}
            {excludedCasesCount > 0 && (
              <Alert className="mx-4 mb-2 border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800">
                  <strong>{excludedCasesCount}</strong> case
                  {excludedCasesCount !== 1 ? "s" : ""} hidden due to missing{" "}
                  {emailsEnabled && callsEnabled
                    ? "contact info"
                    : emailsEnabled
                      ? "email address"
                      : "phone number"}
                </AlertDescription>
              </Alert>
            )}

            {/* Case List */}
            <ScrollArea className="h-[400px]">
              <div className="divide-y">
                {filteredCases.map((caseData) => {
                  const isSelectable = isCaseSelectable(caseData);
                  return (
                    <div
                      key={caseData.id}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 transition-colors",
                        isSelectable && "hover:bg-slate-50/50",
                        selectedCases.has(caseData.id) && "bg-emerald-50/30",
                        !isSelectable && "opacity-50",
                      )}
                    >
                      <Checkbox
                        checked={selectedCases.has(caseData.id)}
                        onCheckedChange={() => onSelectCase(caseData.id)}
                        disabled={!isSelectable}
                      />
                      {/* Date Column */}
                      <div className="w-20 shrink-0 text-center">
                        <div className="text-xs font-medium text-slate-700">
                          {caseData.scheduledAt
                            ? format(parseISO(caseData.scheduledAt), "MMM d")
                            : caseData.createdAt
                              ? format(parseISO(caseData.createdAt), "MMM d")
                              : "N/A"}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {caseData.scheduledAt
                            ? format(parseISO(caseData.scheduledAt), "EEE")
                            : caseData.createdAt
                              ? format(parseISO(caseData.createdAt), "EEE")
                              : ""}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {caseData.patientName}
                          </span>
                          {(caseData.source === "idexx_neo" ||
                            caseData.source === "idexx_extension") && (
                            <Badge
                              variant="outline"
                              className="border-blue-200 bg-blue-50 text-xs text-blue-700"
                            >
                              IDEXX
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground truncate text-sm">
                          {caseData.ownerName ?? "Unknown owner"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {caseData.hasIdexxNotes && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Stethoscope className="h-3 w-3" />
                            Notes
                          </Badge>
                        )}
                        {caseData.hasDischargeSummary && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <FileText className="h-3 w-3" />
                            Summary
                          </Badge>
                        )}
                      </div>
                      {/* Email/Call Status */}
                      <div className="flex items-center gap-1.5">
                        {caseData.hasEmail && (
                          <div
                            className={cn(
                              "rounded-full p-1.5",
                              caseData.emailSent
                                ? "bg-blue-500"
                                : "bg-blue-100",
                            )}
                            title={
                              caseData.emailSent
                                ? "Email sent"
                                : "Email pending"
                            }
                          >
                            {caseData.emailSent ? (
                              <CheckCircle className="h-3 w-3 text-white" />
                            ) : (
                              <Mail className="h-3 w-3 text-blue-600" />
                            )}
                          </div>
                        )}
                        {caseData.hasPhone && (
                          <div
                            className={cn(
                              "rounded-full p-1.5",
                              caseData.callSent
                                ? "bg-green-500"
                                : "bg-green-100",
                            )}
                            title={
                              caseData.callSent ? "Call made" : "Call pending"
                            }
                          >
                            {caseData.callSent ? (
                              <CheckCircle className="h-3 w-3 text-white" />
                            ) : (
                              <Phone className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                        )}
                        {/* Missing contact warning */}
                        {!isSelectable && (
                          <Badge
                            variant="outline"
                            className="ml-auto border-amber-200 bg-amber-50 text-amber-700"
                          >
                            {!caseData.hasEmail && emailsEnabled
                              ? "No email"
                              : "No phone"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-between border-t bg-gradient-to-r from-slate-50/30 to-transparent p-4">
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground text-sm font-medium">
            {selectedCases.size} case{selectedCases.size !== 1 ? "s" : ""}{" "}
            selected
          </p>
          {selectedCases.size > 0 && (
            <div className="flex gap-3 text-xs">
              {selectedCasesWithEmail > 0 && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Mail className="h-3 w-3" />
                  {selectedCasesWithEmail} Email
                </span>
              )}
              {selectedCasesWithPhone > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <Phone className="h-3 w-3" />
                  {selectedCasesWithPhone} Call
                </span>
              )}
            </div>
          )}
        </div>
        <Button
          onClick={onNext}
          disabled={selectedCases.size === 0}
          className="gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
