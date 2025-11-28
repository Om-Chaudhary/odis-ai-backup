"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface CasesNeedingAttentionCardProps {
  casesNeedingDischarge: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  casesNeedingSoap: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  totalCases: number;
}

export function CasesNeedingAttentionCard({
  casesNeedingDischarge,
  casesNeedingSoap,
  totalCases,
}: CasesNeedingAttentionCardProps) {
  const router = useRouter();

  const dischargePercentage =
    totalCases > 0
      ? Math.round((casesNeedingDischarge.total / totalCases) * 100)
      : 0;

  const soapPercentage =
    totalCases > 0
      ? Math.round((casesNeedingSoap.total / totalCases) * 100)
      : 0;

  const handleViewDischarges = () => {
    router.push("/dashboard?tab=cases&missingDischarge=true");
  };

  const handleViewSoap = () => {
    router.push("/dashboard?tab=cases&missingSoap=true");
  };

  return (
    <Card className="animate-card-in-delay-1 transition-smooth border-amber-200/40 bg-gradient-to-br from-amber-50/20 via-white/70 to-white/70 shadow-lg shadow-amber-500/5 backdrop-blur-md hover:scale-[1.01] hover:from-amber-50/25 hover:via-white/75 hover:to-white/75 hover:shadow-xl hover:shadow-amber-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Cases Needing Attention
        </CardTitle>
        <CardDescription>
          Priority action items requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Discharge Summaries Section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium text-slate-900">Discharge Summaries</h4>
            <Badge
              variant="outline"
              className="border-amber-500 text-amber-700"
            >
              {casesNeedingDischarge.thisWeek} this week
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">
                {casesNeedingDischarge.total}
              </span>
              <span className="text-sm text-slate-600">total</span>
            </div>
            <Progress value={dischargePercentage} className="h-2" />
            <p className="text-xs text-slate-500">
              {dischargePercentage}% of cases missing discharge summaries
            </p>
          </div>
        </div>

        {/* SOAP Notes Section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium text-slate-900">SOAP Notes</h4>
            <Badge
              variant="outline"
              className="border-amber-500 text-amber-700"
            >
              {casesNeedingSoap.thisWeek} this week
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">
                {casesNeedingSoap.total}
              </span>
              <span className="text-sm text-slate-600">total</span>
            </div>
            <Progress value={soapPercentage} className="h-2" />
            <p className="text-xs text-slate-500">
              {soapPercentage}% of cases missing SOAP notes
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="transition-smooth flex-1 border-amber-500 text-amber-700 hover:scale-[1.01] hover:bg-amber-50 hover:shadow-sm"
            onClick={handleViewDischarges}
          >
            View Cases Missing Discharges
          </Button>
          <Button
            variant="outline"
            className="transition-smooth flex-1 border-amber-500 text-amber-700 hover:scale-[1.01] hover:bg-amber-50 hover:shadow-sm"
            onClick={handleViewSoap}
          >
            View Cases Missing SOAP
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
