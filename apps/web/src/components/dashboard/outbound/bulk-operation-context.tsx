"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type BulkOperationPhase =
  | "idle"
  | "generating"
  | "scheduling"
  | "complete"
  | "error";

export interface CaseProgress {
  id: string;
  patientName: string;
  status: "pending" | "generating" | "scheduled" | "failed";
  error?: string;
}

export interface BulkOperationState {
  phase: BulkOperationPhase;
  totalCases: number;
  processedCases: number;
  currentCase: string | null;
  cases: CaseProgress[];
  successCount: number;
  failedCount: number;
  isMinimized: boolean;
  errorMessage?: string;
}

interface BulkOperationContextValue extends BulkOperationState {
  startOperation: (cases: Array<{ id: string; patientName: string }>) => void;
  updateCaseStatus: (
    caseId: string,
    status: CaseProgress["status"],
    error?: string,
  ) => void;
  setPhase: (phase: BulkOperationPhase, errorMessage?: string) => void;
  setMinimized: (minimized: boolean) => void;
  clearOperation: () => void;
  incrementProcessed: () => void;
}

const initialState: BulkOperationState = {
  phase: "idle",
  totalCases: 0,
  processedCases: 0,
  currentCase: null,
  cases: [],
  successCount: 0,
  failedCount: 0,
  isMinimized: false,
};

const BulkOperationContext = createContext<BulkOperationContextValue | null>(
  null,
);

export function BulkOperationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BulkOperationState>(initialState);

  const startOperation = useCallback(
    (cases: Array<{ id: string; patientName: string }>) => {
      setState({
        phase: "generating",
        totalCases: cases.length,
        processedCases: 0,
        currentCase: cases[0]?.id ?? null,
        cases: cases.map((c) => ({
          id: c.id,
          patientName: c.patientName,
          status: "pending" as const,
        })),
        successCount: 0,
        failedCount: 0,
        isMinimized: false,
      });
    },
    [],
  );

  const updateCaseStatus = useCallback(
    (caseId: string, status: CaseProgress["status"], error?: string) => {
      setState((prev) => {
        const updatedCases = prev.cases.map((c) =>
          c.id === caseId ? { ...c, status, error } : c,
        );
        const successCount = updatedCases.filter(
          (c) => c.status === "scheduled",
        ).length;
        const failedCount = updatedCases.filter(
          (c) => c.status === "failed",
        ).length;

        // Find the next pending case to mark as current
        const nextPending = updatedCases.find((c) => c.status === "pending");

        return {
          ...prev,
          cases: updatedCases,
          successCount,
          failedCount,
          currentCase: nextPending?.id ?? null,
        };
      });
    },
    [],
  );

  const setPhase = useCallback(
    (phase: BulkOperationPhase, errorMessage?: string) => {
      setState((prev) => ({ ...prev, phase, errorMessage }));
    },
    [],
  );

  const setMinimized = useCallback((minimized: boolean) => {
    setState((prev) => ({ ...prev, isMinimized: minimized }));
  }, []);

  const clearOperation = useCallback(() => {
    setState(initialState);
  }, []);

  const incrementProcessed = useCallback(() => {
    setState((prev) => ({
      ...prev,
      processedCases: prev.processedCases + 1,
    }));
  }, []);

  return (
    <BulkOperationContext.Provider
      value={{
        ...state,
        startOperation,
        updateCaseStatus,
        setPhase,
        setMinimized,
        clearOperation,
        incrementProcessed,
      }}
    >
      {children}
    </BulkOperationContext.Provider>
  );
}

export function useBulkOperation() {
  const context = useContext(BulkOperationContext);
  if (!context) {
    throw new Error(
      "useBulkOperation must be used within a BulkOperationProvider",
    );
  }
  return context;
}
