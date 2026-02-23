import { useRunData } from "@/context/RunContext";
import { KPICard } from "@/components/KPICard";
import { HashDisplay } from "@/components/HashDisplay";
import { ErrorBanner } from "@/components/ErrorBanner";
import { JsonViewer } from "@/components/JsonViewer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ManifestPage() {
  const { data } = useRunData();
  if (!data) return null;

  const { manifest, validation } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Deterministic Proof of Execution */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Deterministic Proof of Execution
        </h2>
        <p className="text-sm text-muted-foreground">
          This run can be independently replayed using the published engine and identical configuration.
          All hashes below are deterministically derived from the input data, engine rules, and configuration state.
        </p>
      </div>

      {/* Execution Parameters */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {manifest.run_id && (
          <KPICard label="Run ID" value={manifest.run_id} />
        )}
        {manifest.country_code && (
          <KPICard label="Country" value={manifest.country_code} />
        )}
        {manifest.engine_version && (
          <KPICard label="Engine Version" value={manifest.engine_version} />
        )}
        {manifest.schema_version && (
          <KPICard label="Schema Version" value={manifest.schema_version} />
        )}
        <KPICard
          label="Timestamp"
          value={manifest.ran_at_utc || "N/A"}
        />
        <KPICard
          label="Rows"
          value={`${manifest.rows_in} in / ${manifest.rows_out} out`}
        />
        {manifest.input_file && (
          <KPICard
            label="Input File"
            value={manifest.input_file ?? "N/A"}
          />
        )}
      </div>

      {/* Execution Outcome */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Outcome</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col items-center p-3 rounded-lg bg-emerald-50">
              <dt className="text-emerald-700 font-medium">OK</dt>
              <dd className="text-2xl font-bold text-emerald-800">
                {manifest.status_counts.OK.toLocaleString()}
              </dd>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-amber-50">
              <dt className="text-amber-700 font-medium">REVIEW</dt>
              <dd className="text-2xl font-bold text-amber-800">
                {manifest.status_counts.REVIEW.toLocaleString()}
              </dd>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-red-50">
              <dt className="text-red-700 font-medium">INVALID</dt>
              <dd className="text-2xl font-bold text-red-800">
                {manifest.status_counts.INVALID.toLocaleString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Cryptographic Integrity Proof */}
      <Card>
        <CardHeader>
          <CardTitle>Cryptographic Integrity Proof</CardTitle>
          <p className="text-sm text-muted-foreground">
            Each hash uniquely identifies an immutable artifact in the execution chain.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {manifest.input_sha256 && (
            <HashDisplay label="Input SHA-256" hash={manifest.input_sha256} />
          )}
          {manifest.config_hash_full && (
            <HashDisplay
              label="Config Hash"
              hash={manifest.config_hash_full}
            />
          )}
          {manifest.output_sha256 && (
            <HashDisplay
              label="Output SHA-256"
              hash={manifest.output_sha256}
            />
          )}
          {manifest.flags_summary_sha256 && (
            <HashDisplay
              label="Flags Summary SHA-256"
              hash={manifest.flags_summary_sha256}
            />
          )}
        </CardContent>
      </Card>

      {/* Deterministic Rules Configuration */}
      {manifest.rules_snapshot && (
        <Card>
          <CardHeader>
            <CardTitle>Deterministic Rules Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Frozen rule parameters applied at execution time.
            </p>
          </CardHeader>
          <CardContent>
            <RulesSnapshotDisplay
              snapshot={manifest.rules_snapshot!}
            />
          </CardContent>
        </Card>
      )}

      {/* Additional Manifest Fields */}
      {(manifest.ruleset_id ||
        manifest.source_dataset_name ||
        manifest.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Info</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {manifest.ruleset_id && (
                <>
                  <dt className="text-muted-foreground">Ruleset ID</dt>
                  <dd className="text-foreground">
                    {manifest.ruleset_id}
                  </dd>
                </>
              )}
              {manifest.source_dataset_name && (
                <>
                  <dt className="text-muted-foreground">Source Dataset</dt>
                  <dd className="text-foreground">
                    {manifest.source_dataset_name}
                  </dd>
                </>
              )}
              {manifest.notes && (
                <>
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="text-foreground">
                    {manifest.notes}
                  </dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Raw JSON */}
      <JsonViewer data={manifest} title="Raw Manifest JSON" />
    </div>
  );
}

function RulesSnapshotDisplay({
  snapshot,
}: {
  snapshot: Record<string, unknown>;
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {Object.entries(snapshot).map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{formatRuleKey(key)}</dt>
          <dd className="font-mono text-foreground break-all">
            {typeof value === "object" && value !== null ? (
              <div className="flex flex-col gap-1">
                {Object.entries(value as Record<string, unknown>).map(
                  ([k, v]) => (
                    <span key={k}>
                      {formatRuleKey(k)}: {String(v)}
                    </span>
                  )
                )}
              </div>
            ) : (
              String(value)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function formatRuleKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
