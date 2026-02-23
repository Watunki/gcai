import { useMemo } from "react";
import { useRunData } from "@/context/RunContext";
import { KPICard } from "@/components/KPICard";
import { StatusBadge } from "@/components/StatusBadge";
import { HashDisplay } from "@/components/HashDisplay";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";
import {
  computeEmissionsSummary,
  computeStatusCounts,
  computeFlagsSummaryFallback,
  computeGroupBy,
} from "@/data/aggregations";
import type { GroupByField } from "@/types";

const GROUP_TABS: { value: GroupByField; label: string }[] = [
  { value: "city", label: "By City" },
  { value: "vehicle_class", label: "By Vehicle Class" },
  { value: "fuel_type", label: "By Fuel Type" },
  { value: "status", label: "By Status" },
];

export function OverviewPage() {
  const { data } = useRunData();
  if (!data) return null;

  const { manifest, records, flagsSummary, validation } = data;

  const emissions = useMemo(
    () => computeEmissionsSummary(records),
    [records]
  );
  const statusCounts = useMemo(
    () => computeStatusCounts(records),
    [records]
  );
  const derivedFlags = useMemo(
    () => (flagsSummary ? null : computeFlagsSummaryFallback(records)),
    [flagsSummary, records]
  );

  const flagsData = flagsSummary ?? derivedFlags ?? [];

  const groupData = useMemo(() => {
    const result: Record<GroupByField, ReturnType<typeof computeGroupBy>> = {
      city: computeGroupBy(records, "city"),
      vehicle_class: computeGroupBy(records, "vehicle_class"),
      fuel_type: computeGroupBy(records, "fuel_type"),
      status: computeGroupBy(records, "status"),
    };
    return result;
  }, [records]);

  return (
    <div className="flex flex-col gap-6">
      {/* Validation warnings */}
      {validation.warnings.length > 0 && (
        <ErrorBanner
          type="warning"
          title="Data warnings"
          messages={validation.warnings}
        />
      )}
      {validation.legacyMappingApplied && (
        <ErrorBanner
          type="info"
          title="Legacy compatibility"
          messages={[
            "This run was loaded using legacy column/field name mapping. Some field names were automatically converted to the canonical schema.",
          ]}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Records"
          value={emissions.count.toLocaleString()}
          subtitle={`${manifest.rows_in.toLocaleString()} in / ${manifest.rows_out.toLocaleString()} out`}
        />
        <KPICard
          label="Total Emissions"
          value={formatNumber(emissions.total)}
          subtitle="kgCO2e"
        />
        <KPICard
          label="Flagged Records"
          value={emissions.flaggedCount.toLocaleString()}
          subtitle={`${(emissions.flaggedRate * 100).toFixed(1)}% of total`}
        />
        <KPICard
          label="Avg Emissions"
          value={formatNumber(emissions.average)}
          subtitle="kgCO2e per record"
        />
      </div>

      {/* Run Metadata + Hashes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Run Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Run ID</dt>
              <dd className="font-mono text-foreground">{manifest.run_id}</dd>
              <dt className="text-muted-foreground">Country</dt>
              <dd className="text-foreground">{manifest.country_code}</dd>
              <dt className="text-muted-foreground">Schema Version</dt>
              <dd className="text-foreground">{manifest.schema_version}</dd>
              <dt className="text-muted-foreground">Engine Version</dt>
              <dd className="text-foreground">{manifest.engine_version}</dd>
              <dt className="text-muted-foreground">Timestamp</dt>
              <dd className="text-foreground">{manifest.ran_at_utc || "N/A"}</dd>
              <dt className="text-muted-foreground">Rows In / Out</dt>
              <dd className="text-foreground">
                {manifest.rows_in.toLocaleString()} / {manifest.rows_out.toLocaleString()}
              </dd>
            </dl>
          </CardContent>
        </Card>

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
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {(["OK", "REVIEW", "INVALID"] as const).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <StatusBadge status={s} />
                <span className="text-lg font-semibold text-foreground">
                  {statusCounts[s].toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          {/* Visual bar */}
          <div className="flex h-3 rounded-full overflow-hidden mt-4">
            {statusCounts.OK > 0 && (
              <div
                className="bg-emerald-500"
                style={{
                  width: `${(statusCounts.OK / records.length) * 100}%`,
                }}
                title={`OK: ${statusCounts.OK}`}
              />
            )}
            {statusCounts.REVIEW > 0 && (
              <div
                className="bg-amber-500"
                style={{
                  width: `${(statusCounts.REVIEW / records.length) * 100}%`,
                }}
                title={`REVIEW: ${statusCounts.REVIEW}`}
              />
            )}
            {statusCounts.INVALID > 0 && (
              <div
                className="bg-red-500"
                style={{
                  width: `${(statusCounts.INVALID / records.length) * 100}%`,
                }}
                title={`INVALID: ${statusCounts.INVALID}`}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flags Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Flags Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {!flagsSummary && derivedFlags && (
            <ErrorBanner
              type="info"
              title="Derived from records"
              messages={[
                "flags_summary.csv was not found. This summary is derived from verified_output.csv.",
              ]}
            />
          )}
          {flagsData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flagsData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-foreground">{row.reason || "N/A"}</TableCell>
                    <TableCell className="text-right font-mono text-foreground">
                      {row.count.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No flags data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Grouping Summaries */}
      <Card>
        <CardHeader>
          <CardTitle>Grouping Summaries</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="city">
            <TabsList>
              {GROUP_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {GROUP_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tab.label.replace("By ", "")}</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Total Emissions</TableHead>
                      <TableHead className="text-right">Avg Emissions</TableHead>
                      <TableHead className="text-right">Flagged</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupData[tab.value].map((bucket) => (
                      <TableRow key={bucket.key}>
                        <TableCell className="font-medium text-foreground">{bucket.key}</TableCell>
                        <TableCell className="text-right text-foreground">
                          {bucket.count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-foreground">
                          {formatNumber(bucket.totalEmissions)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-foreground">
                          {formatNumber(bucket.averageEmissions)}
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          {bucket.flaggedCount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
