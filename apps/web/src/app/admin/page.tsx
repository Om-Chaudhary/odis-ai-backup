"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@odis/ui/card";
import { Button } from "@odis/ui/button";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  FlaskConical,
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  TrendingUp,
} from "lucide-react";
import { api } from "~/trpc/client";
import { useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@odis/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const TIME_RANGES = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
] as const;

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState(30);

  const { data: timeSeriesData, isLoading } =
    api.cases.getTimeSeriesStats.useQuery({
      days: timeRange,
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2">
              <LayoutDashboard className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                Admin Dashboard
              </h1>
              <p className="text-base text-slate-600">
                Track practice metrics and trends over time
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {TIME_RANGES.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? "default" : "outline"}
                onClick={() => setTimeRange(range.value)}
                className={
                  timeRange === range.value
                    ? "bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white"
                    : "border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                }
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {!isLoading && timeSeriesData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Cases Created
              </CardTitle>
              <Briefcase className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                {timeSeriesData.totals.casesCreated}
              </div>
              <p className="text-xs text-slate-600">Last {timeRange} days</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Cases Completed
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                {timeSeriesData.totals.casesCompleted}
              </div>
              <p className="text-xs text-slate-600">Last {timeRange} days</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                SOAP Notes
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                {timeSeriesData.totals.soapNotes}
              </div>
              <p className="text-xs text-slate-600">Last {timeRange} days</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Discharge Summaries
              </CardTitle>
              <FileText className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                {timeSeriesData.totals.dischargeSummaries}
              </div>
              <p className="text-xs text-slate-600">Last {timeRange} days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cases Activity Chart */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800">Cases Activity</CardTitle>
          <CardDescription className="text-slate-600">
            Daily cases created and completed over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center text-slate-500">
              Loading chart data...
            </div>
          ) : timeSeriesData ? (
            <ChartContainer
              config={{
                casesCreated: {
                  label: "Cases Created",
                  color: "hsl(174, 55%, 47%)",
                },
                casesCompleted: {
                  label: "Cases Completed",
                  color: "hsl(158, 64%, 52%)",
                },
              }}
              className="h-[300px]"
            >
              <AreaChart data={timeSeriesData.chartData}>
                <defs>
                  <linearGradient
                    id="fillCasesCreated"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(174, 55%, 47%)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(174, 55%, 47%)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillCasesCompleted"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(158, 64%, 52%)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(158, 64%, 52%)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value: string) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        });
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="casesCreated"
                  stroke="hsl(174, 55%, 47%)"
                  fillOpacity={1}
                  fill="url(#fillCasesCreated)"
                />
                <Area
                  type="monotone"
                  dataKey="casesCompleted"
                  stroke="hsl(158, 64%, 52%)"
                  fillOpacity={1}
                  fill="url(#fillCasesCompleted)"
                />
              </AreaChart>
            </ChartContainer>
          ) : null}
        </CardContent>
      </Card>

      {/* Documentation Activity Chart */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800">
            Documentation Activity
          </CardTitle>
          <CardDescription className="text-slate-600">
            SOAP notes and discharge summaries generated over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center text-slate-500">
              Loading chart data...
            </div>
          ) : timeSeriesData ? (
            <ChartContainer
              config={{
                soapNotes: {
                  label: "SOAP Notes",
                  color: "hsl(199, 89%, 48%)",
                },
                dischargeSummaries: {
                  label: "Discharge Summaries",
                  color: "hsl(262, 83%, 58%)",
                },
              }}
              className="h-[300px]"
            >
              <AreaChart data={timeSeriesData.chartData}>
                <defs>
                  <linearGradient
                    id="fillSoapNotes"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(199, 89%, 48%)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(199, 89%, 48%)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillDischargeSummaries"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(262, 83%, 58%)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(262, 83%, 58%)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value: string) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        });
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="soapNotes"
                  stroke="hsl(199, 89%, 48%)"
                  fillOpacity={1}
                  fill="url(#fillSoapNotes)"
                />
                <Area
                  type="monotone"
                  dataKey="dischargeSummaries"
                  stroke="hsl(262, 83%, 58%)"
                  fillOpacity={1}
                  fill="url(#fillDischargeSummaries)"
                />
              </AreaChart>
            </ChartContainer>
          ) : null}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-slate-800">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-slate-600">
            Common management tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Link href="/admin/templates/soap/new" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 bg-gradient-to-r from-[#31aba3] to-[#2a9a92] py-6 text-white transition-all hover:scale-[1.02] hover:shadow-lg"
              variant="default"
            >
              <div className="rounded-lg bg-white/20 p-2">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">New SOAP</span>
            </Button>
          </Link>
          <Link href="/admin/templates/soap" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 border-slate-200 bg-white py-6 text-slate-700 transition-all hover:scale-[1.02] hover:bg-teal-50 hover:text-teal-700"
              variant="outline"
            >
              <div className="rounded-lg bg-teal-50 p-2">
                <ClipboardList className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">SOAP Templates</span>
            </Button>
          </Link>
          <Link href="/admin/templates/discharge" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 border-slate-200 bg-white py-6 text-slate-700 transition-all hover:scale-[1.02] hover:bg-teal-50 hover:text-teal-700"
              variant="outline"
            >
              <div className="rounded-lg bg-teal-50 p-2">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Discharge Templates</span>
            </Button>
          </Link>
          <Link href="/admin/cases" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 border-slate-200 bg-white py-6 text-slate-700 transition-all hover:scale-[1.02] hover:bg-teal-50 hover:text-teal-700"
              variant="outline"
            >
              <div className="rounded-lg bg-teal-50 p-2">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Cases</span>
            </Button>
          </Link>
          <Link href="/admin/users" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 border-slate-200 bg-white py-6 text-slate-700 transition-all hover:scale-[1.02] hover:bg-teal-50 hover:text-teal-700"
              variant="outline"
            >
              <div className="rounded-lg bg-teal-50 p-2">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Users</span>
            </Button>
          </Link>
          <Link href="/admin/soap-playground" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 border-slate-200 bg-white py-6 text-slate-700 transition-all hover:scale-[1.02] hover:bg-teal-50 hover:text-teal-700"
              variant="outline"
            >
              <div className="rounded-lg bg-teal-50 p-2">
                <FlaskConical className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Playground</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
