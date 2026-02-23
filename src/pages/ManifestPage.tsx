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
      {validation.legacyMappingApplied && (
        <ErrorBanner
          type="info"
          title="Legacy compatibility"
          messages={[
            "This manifest was loaded using field name compatibility mapping. Some legacy field names were automatically converted to canonical names.",
          ]}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Run ID" value={manifest.run_id} />
        <KPICard label="Country" value={manifest.country_code} />
        <KPICard
          label="Schema Version"
          value={manifest.schema_version}
        />
        <KPICard
          label="Engine Version"
          value={manifest.engine_version}
        />
        <KPICard
          label="Timestamp"
          value={manifest.ran_at_utc || "N/A"}
        />
        <KPICard
          label="Rows"
          value={`${manifest.rows_in} in / ${manifest.rows_out} out`}
        />
      </div>

      {/* Status Counts */}
      <Card>
        <CardHeader>
          <CardTitle>Status Counts</CardTitle>
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

      {/* Hashes */}
      <Card>
        <CardHeader>
          <CardTitle>Integrity Hashes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <HashDisplay label="Input SHA-256" hash={manifest.input_sha256} />
          <HashDisplay label="Config Hash" hash={manifest.config_hash_full} />
          <HashDisplay label="Output SHA-256" hash={manifest.output_sha256} />
          {manifest.flags_summary_sha256 && (
            <HashDisplay
              label="Flags Summary SHA-256"
              hash={String(manifest.flags_summary_sha256)}
            />
          )}
        </CardContent>
      </Card>

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
                  <dd className="text-foreground">{String(manifest.ruleset_id)}</dd>
                </>
              )}
              {manifest.source_dataset_name && (
                <>
                  <dt className="text-muted-foreground">Source Dataset</dt>
                  <dd className="text-foreground">{String(manifest.source_dataset_name)}</dd>
                </>
              )}
              {manifest.notes && (
                <>
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="text-foreground">{String(manifest.notes)}</dd>
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
