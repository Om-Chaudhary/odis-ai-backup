"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import { Card } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { Switch } from "@odis-ai/shared/ui/switch";
import { Label } from "@odis-ai/shared/ui/label";
import { Input } from "@odis-ai/shared/ui/input";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Slider } from "@odis-ai/shared/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@odis-ai/shared/ui/table";
import { useAdminContext } from "~/lib/admin-context";
import {
  Play,
  Clock,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function StatusBadge({
  status,
}: {
  status: "running" | "completed" | "failed" | "partial";
}) {
  const variants = {
    running: { color: "bg-blue-100 text-blue-800", icon: Clock },
    completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    failed: { color: "bg-red-100 text-red-800", icon: XCircle },
    partial: {
      color: "bg-yellow-100 text-yellow-800",
      icon: AlertTriangle,
    },
  };

  const { color, icon: Icon } = variants[status];

  return (
    <Badge className={`${color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function AdminAutoSchedulingPage() {
  const { clinics, isGlobalView } = useAdminContext();
  const [selectedConfigClinic, setSelectedConfigClinic] = useState<string>("");
  const utils = api.useUtils();

  // Fetch stats
  const { data: stats } = api.admin.autoScheduling.getStats.useQuery();

  // Fetch recent runs
  const { data: recentRuns, isLoading: runsLoading } =
    api.admin.autoScheduling.getRecentRuns.useQuery({ limit: 10 });

  // Fetch all configs
  const { data: allConfigs } = api.admin.autoScheduling.getAllConfigs.useQuery();

  // Fetch config for selected clinic
  const { data: selectedConfig } =
    api.admin.autoScheduling.getConfig.useQuery(
      { clinicId: selectedConfigClinic },
      { enabled: !!selectedConfigClinic },
    );

  // Mutations
  const toggleEnabled = api.admin.autoScheduling.toggleEnabled.useMutation({
    onSuccess: () => {
      void utils.admin.autoScheduling.getConfig.invalidate();
      void utils.admin.autoScheduling.getAllConfigs.invalidate();
      void utils.admin.autoScheduling.getStats.invalidate();
    },
  });

  const updateConfig = api.admin.autoScheduling.updateConfig.useMutation({
    onSuccess: () => {
      void utils.admin.autoScheduling.getConfig.invalidate();
      void utils.admin.autoScheduling.getAllConfigs.invalidate();
    },
  });

  const triggerRun = api.admin.autoScheduling.triggerForClinic.useMutation({
    onSuccess: () => {
      void utils.admin.autoScheduling.getRecentRuns.invalidate();
      void utils.admin.autoScheduling.getStats.invalidate();
    },
  });

  const handleToggle = (clinicId: string, enabled: boolean) => {
    toggleEnabled.mutate({ clinicId, enabled });
  };

  const handleTriggerRun = (clinicId: string, dryRun: boolean) => {
    triggerRun.mutate({ clinicId, dryRun });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Auto-Scheduling
          </h1>
          <p className="text-sm text-slate-500">
            Configure and monitor automated discharge scheduling
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Enabled Clinics
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.enabledClinics ?? 0}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Cases Processed (Last 10 Runs)
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.totals.casesProcessed ?? 0}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Emails Scheduled
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.totals.emailsScheduled ?? 0}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Calls Scheduled
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.totals.callsScheduled ?? 0}
              </p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <Phone className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Clinic Configurations */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Clinic Configurations
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clinic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Call</TableHead>
                <TableHead>Email Delay</TableHead>
                <TableHead>Call Delay</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(allConfigs ?? []).map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">
                    {config.clinic?.name ?? "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={config.isEnabled}
                      onCheckedChange={(checked) =>
                        handleToggle(config.clinicId, checked)
                      }
                      disabled={toggleEnabled.isPending}
                    />
                  </TableCell>
                  <TableCell>
                    {config.autoEmailEnabled ? (
                      <Badge className="bg-green-100 text-green-800">On</Badge>
                    ) : (
                      <Badge variant="secondary">Off</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {config.autoCallEnabled ? (
                      <Badge className="bg-green-100 text-green-800">On</Badge>
                    ) : (
                      <Badge variant="secondary">Off</Badge>
                    )}
                  </TableCell>
                  <TableCell>{config.emailDelayDays}d</TableCell>
                  <TableCell>{config.callDelayDays}d</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedConfigClinic(config.clinicId)}
                      >
                        Configure
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTriggerRun(config.clinicId, false)}
                        disabled={triggerRun.isPending}
                      >
                        <Play className="mr-1 h-4 w-4" />
                        Run
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(allConfigs ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500">
                    No clinic configurations found. Select a clinic to create
                    one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add New Clinic Config */}
        {isGlobalView && (
          <div className="mt-4 flex items-end gap-4 border-t pt-4">
            <div className="w-72">
              <Label className="mb-2 block text-sm font-medium">
                Add Clinic Configuration
              </Label>
              <Select
                value={selectedConfigClinic}
                onValueChange={setSelectedConfigClinic}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a clinic" />
                </SelectTrigger>
                <SelectContent>
                  {clinics
                    .filter(
                      (c) =>
                        !allConfigs?.some((cfg) => cfg.clinicId === c.id),
                    )
                    .map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Card>

      {/* Selected Clinic Configuration */}
      {selectedConfigClinic && selectedConfig && (
        <Card className="border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Configure:{" "}
              {clinics.find((c) => c.id === selectedConfigClinic)?.name}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedConfigClinic("")}
            >
              Close
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Email Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-700">Email Settings</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-enabled">Auto-schedule emails</Label>
                <Switch
                  id="email-enabled"
                  checked={selectedConfig.autoEmailEnabled}
                  onCheckedChange={(checked) =>
                    updateConfig.mutate({
                      clinicId: selectedConfigClinic,
                      autoEmailEnabled: checked,
                    })
                  }
                />
              </div>
              <div>
                <Label className="mb-2 block">
                  Email delay: {selectedConfig.emailDelayDays} days
                </Label>
                <Slider
                  value={[selectedConfig.emailDelayDays]}
                  min={0}
                  max={7}
                  step={1}
                  onValueChange={([value]) =>
                    updateConfig.mutate({
                      clinicId: selectedConfigClinic,
                      emailDelayDays: value,
                    })
                  }
                />
              </div>
              <div>
                <Label className="mb-2 block">Preferred email time</Label>
                <Input
                  type="time"
                  value={selectedConfig.preferredEmailTime}
                  onChange={(e) =>
                    updateConfig.mutate({
                      clinicId: selectedConfigClinic,
                      preferredEmailTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Call Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-700">Call Settings</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="call-enabled">Auto-schedule calls</Label>
                <Switch
                  id="call-enabled"
                  checked={selectedConfig.autoCallEnabled}
                  onCheckedChange={(checked) =>
                    updateConfig.mutate({
                      clinicId: selectedConfigClinic,
                      autoCallEnabled: checked,
                    })
                  }
                />
              </div>
              <div>
                <Label className="mb-2 block">
                  Call delay: {selectedConfig.callDelayDays} days
                </Label>
                <Slider
                  value={[selectedConfig.callDelayDays]}
                  min={0}
                  max={7}
                  step={1}
                  onValueChange={([value]) =>
                    updateConfig.mutate({
                      clinicId: selectedConfigClinic,
                      callDelayDays: value,
                    })
                  }
                />
              </div>
              <div>
                <Label className="mb-2 block">Preferred call time</Label>
                <Input
                  type="time"
                  value={selectedConfig.preferredCallTime}
                  onChange={(e) =>
                    updateConfig.mutate({
                      clinicId: selectedConfigClinic,
                      preferredCallTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Runs */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Recent Runs
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead>Emails</TableHead>
                <TableHead>Calls</TableHead>
                <TableHead>Errors</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (recentRuns ?? []).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-slate-500"
                  >
                    No runs yet
                  </TableCell>
                </TableRow>
              ) : (
                (recentRuns ?? []).map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      {formatDistanceToNow(new Date(run.startedAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={
                          run.status as
                            | "running"
                            | "completed"
                            | "failed"
                            | "partial"
                        }
                      />
                    </TableCell>
                    <TableCell>{run.totalCasesProcessed}</TableCell>
                    <TableCell>{run.totalEmailsScheduled}</TableCell>
                    <TableCell>{run.totalCallsScheduled}</TableCell>
                    <TableCell>
                      {run.totalErrors > 0 ? (
                        <Badge className="bg-red-100 text-red-800">
                          {run.totalErrors}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {run.completedAt
                        ? `${Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
