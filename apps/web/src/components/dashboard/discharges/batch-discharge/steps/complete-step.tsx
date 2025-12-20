import { useRouter } from "next/navigation";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import { Alert, AlertDescription } from "@odis-ai/ui/alert";
import { ScrollArea } from "@odis-ai/ui/scroll-area";
import { Separator } from "@odis-ai/ui/separator";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@odis-ai/ui/card";
import {
  CheckCircle,
  XCircle,
  SkipForward,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { cn } from "@odis-ai/utils";
import type { ProcessingResult } from "../types";

interface CompleteStepProps {
  finalResults: ProcessingResult[];
  onStartNewBatch: () => void;
}

export function CompleteStep({
  finalResults,
  onStartNewBatch,
}: CompleteStepProps) {
  const router = useRouter();

  const successCount = finalResults.filter(
    (r) => r.status === "success",
  ).length;
  const failedCount = finalResults.filter((r) => r.status === "failed").length;
  const skippedCount = finalResults.filter(
    (r) => r.status === "skipped",
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2.5">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle>Batch Complete</CardTitle>
            <CardDescription>
              Processing finished - review the results below
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Results Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-700">
                  {successCount}
                </p>
                <p className="text-sm text-emerald-600">
                  Successfully Scheduled
                </p>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "rounded-xl border p-4",
              failedCount > 0
                ? "border-red-200 bg-gradient-to-br from-red-50 to-white"
                : "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "rounded-lg p-2",
                  failedCount > 0 ? "bg-red-100" : "bg-slate-100",
                )}
              >
                <XCircle
                  className={cn(
                    "h-5 w-5",
                    failedCount > 0 ? "text-red-600" : "text-slate-400",
                  )}
                />
              </div>
              <div>
                <p
                  className={cn(
                    "text-3xl font-bold",
                    failedCount > 0 ? "text-red-700" : "text-slate-500",
                  )}
                >
                  {failedCount}
                </p>
                <p
                  className={cn(
                    "text-sm",
                    failedCount > 0 ? "text-red-600" : "text-slate-500",
                  )}
                >
                  Failed
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <SkipForward className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-700">
                  {skippedCount}
                </p>
                <p className="text-sm text-amber-600">Skipped by User</p>
              </div>
            </div>
          </div>
        </div>

        {/* Failed Cases Details */}
        {failedCount > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium text-red-700">Failed Cases</h4>
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-sm text-red-800">
                  The following cases failed to schedule. You can retry them
                  individually from the Cases page.
                </AlertDescription>
              </Alert>
              <ScrollArea className="h-40 rounded-lg border border-red-200">
                <div className="divide-y p-2">
                  {finalResults
                    .filter((r) => r.status === "failed")
                    .map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between px-3 py-2"
                      >
                        <div>
                          <span className="font-medium">
                            {result.patientName}
                          </span>
                          {result.error && (
                            <p className="text-muted-foreground text-xs">
                              {result.error}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="border-red-200 bg-red-50 text-red-700"
                        >
                          Failed
                        </Badge>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-slate-50/30 p-4">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/discharges")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go to Cases
        </Button>
        <Button
          onClick={onStartNewBatch}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <RotateCcw className="h-4 w-4" />
          Start New Batch
        </Button>
      </CardFooter>
    </Card>
  );
}
