import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { useRunData } from "@/context/RunContext";
import { Navbar } from "@/components/Navbar";
import { LoadingState } from "@/components/LoadingState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { EmptyState } from "@/components/EmptyState";
import { DEFAULT_RUN_ID } from "@/data/constants";

export default function App() {
  const { loadStatus, error, loadRun } = useRunData();
  const [searchParams] = useSearchParams();
  const runIdParam = searchParams.get("run") ?? DEFAULT_RUN_ID;

  useEffect(() => {
    loadRun(runIdParam);
  }, [runIdParam, loadRun]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {loadStatus === "loading" && <LoadingState />}
        {loadStatus === "error" && error && (
          <div className="max-w-2xl mx-auto mt-12">
            <ErrorBanner
              type="error"
              title="Failed to load run"
              messages={error.split("\n")}
            />
            <div className="mt-6">
              <EmptyState
                title="No run data available"
                description={`Could not load run "${runIdParam}". Make sure the run artifact files are placed in /public/runs/${runIdParam}/.`}
              />
            </div>
          </div>
        )}
        {loadStatus === "ready" && <Outlet />}
        {loadStatus === "idle" && (
          <EmptyState
            title="No run loaded"
            description="Place your run artifact files in /public/runs/demo/ and refresh."
          />
        )}
      </main>
    </div>
  );
}
