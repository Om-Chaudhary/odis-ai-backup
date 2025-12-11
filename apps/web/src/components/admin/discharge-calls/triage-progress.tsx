"use client";

import { Progress } from "@odis-ai/ui/progress";
import { CheckCircle2, Clock } from "lucide-react";

interface TriageProgressProps {
  total: number;
  reviewed: number;
  reviewedPercentage: number;
  byCategory: {
    to_review: number;
    good: number;
    bad: number;
    voicemail: number;
    failed: number;
    no_answer: number;
    needs_followup: number;
  };
}

export function TriageProgress({
  total,
  reviewed,
  reviewedPercentage,
  byCategory,
}: TriageProgressProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-50 p-2">
            {reviewedPercentage === 100 ? (
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
            ) : (
              <Clock className="h-5 w-5 text-teal-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Triage Progress</h3>
            <p className="text-sm text-slate-500">
              {reviewed} of {total} calls reviewed
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-teal-600">
            {reviewedPercentage}%
          </span>
        </div>
      </div>

      <Progress value={reviewedPercentage} className="mt-4 h-2" />

      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs sm:grid-cols-7">
        <div className="rounded bg-slate-50 px-2 py-1.5">
          <div className="font-semibold text-slate-700">
            {byCategory.to_review}
          </div>
          <div className="text-slate-500">Pending</div>
        </div>
        <div className="rounded bg-emerald-50 px-2 py-1.5">
          <div className="font-semibold text-emerald-700">
            {byCategory.good}
          </div>
          <div className="text-emerald-600">Good</div>
        </div>
        <div className="rounded bg-red-50 px-2 py-1.5">
          <div className="font-semibold text-red-700">{byCategory.bad}</div>
          <div className="text-red-600">Bad</div>
        </div>
        <div className="rounded bg-amber-50 px-2 py-1.5">
          <div className="font-semibold text-amber-700">
            {byCategory.voicemail}
          </div>
          <div className="text-amber-600">VM</div>
        </div>
        <div className="rounded bg-red-50 px-2 py-1.5">
          <div className="font-semibold text-red-700">{byCategory.failed}</div>
          <div className="text-red-600">Failed</div>
        </div>
        <div className="rounded bg-orange-50 px-2 py-1.5">
          <div className="font-semibold text-orange-700">
            {byCategory.no_answer}
          </div>
          <div className="text-orange-600">No Ans</div>
        </div>
        <div className="rounded bg-purple-50 px-2 py-1.5">
          <div className="font-semibold text-purple-700">
            {byCategory.needs_followup}
          </div>
          <div className="text-purple-600">F/U</div>
        </div>
      </div>
    </div>
  );
}
