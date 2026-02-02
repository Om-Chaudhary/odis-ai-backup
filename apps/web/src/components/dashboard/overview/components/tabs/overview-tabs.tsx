"use client";

import { useState } from "react";
import { AfterHoursTab } from "./after-hours-tab";
import { DischargeTab } from "./discharge-tab";
import { AIPerformanceTab } from "./ai-performance-tab";
import type { AfterHoursData, DischargeData, AIPerformanceData } from "../../mock-data";

interface OverviewTabsProps {
  afterHours: AfterHoursData;
  discharge: DischargeData;
  aiPerformance: AIPerformanceData;
  clinicSlug: string;
  defaultTab?: string;
}

type TabId = "after-hours" | "discharge" | "ai-performance";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "after-hours", label: "After-Hours Calls" },
  { id: "discharge", label: "Discharge Follow-ups" },
  { id: "ai-performance", label: "AI Agent Performance" },
];

export function OverviewTabs({
  afterHours,
  discharge,
  aiPerformance,
  clinicSlug,
  defaultTab = "after-hours",
}: OverviewTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab as TabId);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        padding: 20,
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#f3f4f6",
          borderRadius: 12,
          padding: 4,
          marginBottom: 16,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 9,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13.5,
              fontWeight: activeTab === tab.id ? 600 : 400,
              background: activeTab === tab.id ? "#fff" : "transparent",
              color: activeTab === tab.id ? "#111827" : "#6b7280",
              boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "after-hours" && (
          <AfterHoursTab data={afterHours} clinicSlug={clinicSlug} />
        )}
        {activeTab === "discharge" && (
          <DischargeTab data={discharge} clinicSlug={clinicSlug} />
        )}
        {activeTab === "ai-performance" && (
          <AIPerformanceTab data={aiPerformance} />
        )}
      </div>
    </div>
  );
}
