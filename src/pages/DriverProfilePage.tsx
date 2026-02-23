import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useRunData } from "@/context/RunContext";
import { StatusBadge } from "@/components/StatusBadge";
import { FraudBadge } from "@/components/FraudBadge";
import { HashDisplay } from "@/components/HashDisplay";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { REQUIRED_CSV_COLUMNS, RECOMMENDED_CSV_COLUMNS } from "@/data/constants";

const CORE_FIELDS = new Set([
  ...REQUIRED_CSV_COLUMNS,
  ...RECOMMENDED_CSV_COLUMNS,
]);

export function DriverProfilePage() {
  const { driverId } = useParams<{ driverId: string }>();
  const { data } = useRunData();

  const records = useMemo(() => {
    if (!data || !driverId) return [];
    return data.records.filter(
      (r) => r.driver_id === decodeURIComponent(driverId)
    );
  }, [data, driverId]);

  const extensionFields = useMemo(() => {
    if (records.length === 0) return [];
    const firstRecord = records[0];
    return Object.keys(firstRecord).filter(
      (k) => !CORE_FIELDS.has(k) && firstRecord[k] !== undefined && firstRecord[k] !== ""
    );
  }, [records]);

  if (!data) return null;

  if (records.length === 0) {
    return (
      <div>
        <Link to="/drivers">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drivers
          </Button>
        </Link>
        <EmptyState
          title="Driver not found"
          description={`No records found for driver ID "${driverId}".`}
        />
      </div>
    );
  }

  const primary = records[0];
  const hasMultiple = records.length > 1;

  // Compute totals for multi-record
  const totalEmissions = records.reduce(
    (sum, r) => sum + r.estimated_emissions,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link to="/drivers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drivers
          </Button>
        </Link>
        <h1 className="text-xl font-semibold text-foreground text-balance">
          {decodeURIComponent(driverId || "")}
        </h1>
        {hasMultiple && (
          <Badge variant="secondary" className="text-xs">
            {records.length} records
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Input Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Driver ID</dt>
              <dd className="font-mono text-foreground">{primary.driver_id}</dd>
              <dt className="text-muted-foreground">City</dt>
              <dd className="text-foreground">{primary.city}</dd>
              <dt className="text-muted-foreground">Vehicle Class</dt>
              <dd className="text-foreground">{primary.vehicle_class}</dd>
              <dt className="text-muted-foreground">Fuel Type</dt>
              <dd className="text-foreground">{primary.fuel_type}</dd>
              <dt className="text-muted-foreground">Distance (km)</dt>
              <dd className="font-mono text-foreground">{formatNumber(primary.distance_km)}</dd>
              <dt className="text-muted-foreground">Timestamp</dt>
              <dd className="text-foreground">{primary.ts ?? "N/A"}</dd>
            </dl>
          </CardContent>
        </Card>

        {/* Computed Output */}
        <Card>
          <CardHeader>
            <CardTitle>Computed Output</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Emission Factor</dt>
              <dd className="font-mono text-foreground">
                {formatNumber(primary.emission_factor_used, 4)}
              </dd>
              <dt className="text-muted-foreground">Estimated Emissions</dt>
              <dd className="font-mono text-foreground">
                {formatNumber(primary.estimated_emissions)}
              </dd>
              <dt className="text-muted-foreground">Fraud Flag</dt>
              <dd>
                <FraudBadge flagged={primary.fraud_flag} />
              </dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <StatusBadge status={primary.status} />
              </dd>
              <dt className="text-muted-foreground">Output Hash</dt>
              <dd className="flex items-center gap-1">
                <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded break-all text-foreground">
                  {primary.output_hash}
                </code>
                <CopyButton text={primary.output_hash} label="Copy hash" />
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Multiple Records Section */}
      {hasMultiple && (
        <Card>
          <CardHeader>
            <CardTitle>
              All Records ({records.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Emissions: </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatNumber(totalEmissions)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Record Count: </span>
                <span className="font-semibold text-foreground">{records.length}</span>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead>Vehicle Class</TableHead>
                  <TableHead className="text-right">Distance</TableHead>
                  <TableHead className="text-right">Emissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r, i) => (
                  <TableRow key={`${r.output_hash}-${i}`}>
                    <TableCell className="text-foreground">{r.city}</TableCell>
                    <TableCell className="text-foreground">{r.vehicle_class}</TableCell>
                    <TableCell className="text-right font-mono text-foreground">
                      {formatNumber(r.distance_km)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-foreground">
                      {formatNumber(r.estimated_emissions)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-foreground">{r.ts ?? "N/A"}</TableCell>
                    <TableCell>
                      <code className="text-xs font-mono text-muted-foreground">
                        {r.output_hash.slice(0, 12)}...
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Hash/Integrity Panel */}
      {(primary.prev_record_hash ||
        primary.config_hash_full ||
        primary.run_id ||
        primary.schema_version) && (
        <Card>
          <CardHeader>
            <CardTitle>Integrity Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {primary.prev_record_hash && (
              <HashDisplay
                label="Prev Record Hash"
                hash={primary.prev_record_hash}
              />
            )}
            {primary.config_hash_full && (
              <HashDisplay
                label="Config Hash"
                hash={primary.config_hash_full}
              />
            )}
            {primary.run_id && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">Run ID</span>
                <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground">
                  {primary.run_id}
                </code>
              </div>
            )}
            {primary.schema_version && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">
                  Schema Version
                </span>
                <span className="text-sm text-foreground">{primary.schema_version}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Fields */}
      {extensionFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {extensionFields.map((field) => (
                <div key={field} className="contents">
                  <dt className="text-muted-foreground">{field}</dt>
                  <dd className="font-mono text-foreground break-all">
                    {String(primary[field] ?? "N/A")}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
