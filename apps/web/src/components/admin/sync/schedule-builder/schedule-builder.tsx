"use client";

/**
 * Schedule Builder Component
 *
 * Main orchestrator for schedule configuration
 */

import type { ScheduleBuilderProps } from "./types";
import { useScheduleBuilder } from "./hooks/use-schedule-builder";
import { ScheduleModeToggle } from "./schedule-mode-toggle";
import { SimpleSchedulePicker } from "./simple-schedule-picker";
import { AdvancedScheduleInput } from "./advanced-schedule-input";
import { SchedulePreview } from "./schedule-preview";

export function ScheduleBuilder({
  value,
  onChange,
  enabled = true,
  timezone = "America/Los_Angeles",
}: ScheduleBuilderProps) {
  const {
    mode,
    switchMode,
    schedule,
    toggleDay,
    addTime,
    removeTime,
    cronString,
    setCronString,
    validation,
  } = useScheduleBuilder({
    initialCron: value,
    onChange,
  });

  const currentCron = mode === "simple" ? value : cronString;

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Configure when this sync should run
        </p>
        <ScheduleModeToggle
          mode={mode}
          onModeChange={switchMode}
          disabled={!enabled}
        />
      </div>

      {/* Main Content */}
      {mode === "simple" ? (
        <div className="space-y-4">
          {/* Presets */}

          {/* Schedule Picker */}
          <SimpleSchedulePicker
            days={schedule.days}
            times={schedule.times}
            onToggleDay={toggleDay}
            onAddTime={addTime}
            onRemoveTime={removeTime}
            disabled={!enabled}
          />

          {/* Validation Warnings */}
          {!validation.valid && validation.errors.length > 0 && (
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-xs font-medium text-red-900">
                Invalid Schedule
              </p>
              {validation.errors.map((error, i) => (
                <p key={i} className="text-xs text-red-700">
                  • {error}
                </p>
              ))}
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-3">
              {validation.warnings.map((warning, i) => (
                <p key={i} className="text-xs text-amber-700">
                  • {warning}
                </p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <AdvancedScheduleInput
          value={cronString}
          onChange={setCronString}
          disabled={!enabled}
        />
      )}

      {/* Preview */}
      {enabled && validation.valid && (
        <SchedulePreview cron={currentCron} timezone={timezone} />
      )}

      {/* Generated Cron (Simple Mode) */}
      {mode === "simple" && validation.valid && (
        <div className="rounded-lg bg-slate-100 px-3 py-2">
          <p className="text-xs text-slate-500">Generated cron expression:</p>
          <p className="mt-1 font-mono text-sm text-slate-900">{currentCron}</p>
        </div>
      )}
    </div>
  );
}
