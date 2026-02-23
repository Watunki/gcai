import React, { createContext, useContext, useState, useCallback } from "react";
import type { RunData, LoadStatus } from "@/types";
import { loadRunArtifacts } from "@/data/loader";
import { DEFAULT_RUN_ID } from "@/data/constants";

interface RunContextValue {
  data: RunData | null;
  loadStatus: LoadStatus;
  error: string | null;
  runId: string;
  loadRun: (runId: string) => Promise<void>;
}

const RunContext = createContext<RunContextValue | null>(null);

export function RunProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<RunData | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string>(DEFAULT_RUN_ID);

  const loadRun = useCallback(async (id: string) => {
    setRunId(id);
    setLoadStatus("loading");
    setError(null);
    setData(null);

    try {
      const result = await loadRunArtifacts(id);
      setData(result);
      setLoadStatus("ready");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error loading run.";
      setError(message);
      setLoadStatus("error");
    }
  }, []);

  return (
    <RunContext.Provider value={{ data, loadStatus, error, runId, loadRun }}>
      {children}
    </RunContext.Provider>
  );
}

export function useRunData(): RunContextValue {
  const ctx = useContext(RunContext);
  if (!ctx) {
    throw new Error("useRunData must be used within a RunProvider");
  }
  return ctx;
}
