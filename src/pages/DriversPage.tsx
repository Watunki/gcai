import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRunData } from "@/context/RunContext";
import { StatusBadge } from "@/components/StatusBadge";
import { FraudBadge } from "@/components/FraudBadge";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { truncateHash, formatNumber } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/data/constants";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { CanonicalRecord } from "@/types";

type SortField =
  | "driver_id"
  | "city"
  | "distance_km"
  | "estimated_emissions"
  | "status";
type SortDir = "asc" | "desc";

interface Filters {
  search: string;
  status: string;
  fraudFlag: string;
  city: string;
  vehicleClass: string;
  fuelType: string;
}

const ALL = "__all__";

export function DriversPage() {
  const { data } = useRunData();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: ALL,
    fraudFlag: ALL,
    city: ALL,
    vehicleClass: ALL,
    fuelType: ALL,
  });
  const [sortField, setSortField] = useState<SortField>("driver_id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);

  // Check if vehicle_class/fuel_type columns have real data
  const hasVehicleClasses = useMemo(() => {
    if (!data) return false;
    return data.records.some(
      (r) => r.vehicle_class && r.vehicle_class !== "N/A"
    );
  }, [data]);

  const hasFuelTypes = useMemo(() => {
    if (!data) return false;
    return data.records.some((r) => r.fuel_type && r.fuel_type !== "N/A");
  }, [data]);

  // Derive unique filter options
  const filterOptions = useMemo(() => {
    if (!data) return { cities: [], vehicleClasses: [], fuelTypes: [] };
    const cities = [...new Set(data.records.map((r) => r.city))].sort();
    const vehicleClasses = hasVehicleClasses
      ? [
          ...new Set(
            data.records
              .map((r) => r.vehicle_class)
              .filter((v) => v && v !== "N/A")
          ),
        ].sort()
      : [];
    const fuelTypes = hasFuelTypes
      ? [
          ...new Set(
            data.records
              .map((r) => r.fuel_type)
              .filter((v) => v && v !== "N/A")
          ),
        ].sort()
      : [];
    return { cities, vehicleClasses, fuelTypes };
  }, [data, hasVehicleClasses, hasFuelTypes]);

  // Filter records
  const filtered = useMemo(() => {
    if (!data) return [];
    let result = data.records;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.driver_id.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.output_hash.toLowerCase().includes(q) ||
          (r.reason_codes && r.reason_codes.toLowerCase().includes(q))
      );
    }
    if (filters.status !== ALL) {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters.fraudFlag !== ALL) {
      const flagVal = filters.fraudFlag === "true";
      result = result.filter((r) => r.fraud_flag === flagVal);
    }
    if (filters.city !== ALL) {
      result = result.filter((r) => r.city === filters.city);
    }
    if (filters.vehicleClass !== ALL) {
      result = result.filter((r) => r.vehicle_class === filters.vehicleClass);
    }
    if (filters.fuelType !== ALL) {
      result = result.filter((r) => r.fuel_type === filters.fuelType);
    }

    return result;
  }, [data, filters]);

  // Sort records
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "driver_id":
          cmp = a.driver_id.localeCompare(b.driver_id, undefined, {
            numeric: true,
          });
          break;
        case "city":
          cmp = a.city.localeCompare(b.city);
          break;
        case "distance_km":
          cmp = a.distance_km - b.distance_km;
          break;
        case "estimated_emissions":
          cmp = a.estimated_emissions - b.estimated_emissions;
          break;
        case "status": {
          const order = { OK: 0, REVIEW: 1, INVALID: 2 };
          cmp =
            (order[a.status as keyof typeof order] ?? 3) -
            (order[b.status as keyof typeof order] ?? 3);
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortField, sortDir]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / DEFAULT_PAGE_SIZE);
  const paginated = sorted.slice(
    page * DEFAULT_PAGE_SIZE,
    (page + 1) * DEFAULT_PAGE_SIZE
  );

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
      setPage(0);
    },
    [sortField]
  );

  const updateFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters((f) => ({ ...f, [key]: value }));
      setPage(0);
    },
    []
  );

  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search driver ID, city, reason, or hash..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Status"
            value={filters.status}
            options={["OK", "REVIEW", "INVALID"]}
            onChange={(v) => updateFilter("status", v)}
          />
          <FilterSelect
            label="Fraud Flag"
            value={filters.fraudFlag}
            options={["true", "false"]}
            optionLabels={{ true: "Flagged", false: "Not Flagged" }}
            onChange={(v) => updateFilter("fraudFlag", v)}
          />
          <FilterSelect
            label="City"
            value={filters.city}
            options={filterOptions.cities}
            onChange={(v) => updateFilter("city", v)}
          />
          {hasVehicleClasses && (
            <FilterSelect
              label="Vehicle Class"
              value={filters.vehicleClass}
              options={filterOptions.vehicleClasses}
              onChange={(v) => updateFilter("vehicleClass", v)}
            />
          )}
          {hasFuelTypes && (
            <FilterSelect
              label="Fuel Type"
              value={filters.fuelType}
              options={filterOptions.fuelTypes}
              onChange={(v) => updateFilter("fuelType", v)}
            />
          )}
          {Object.values(filters).some((v) => v !== "" && v !== ALL) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setFilters({
                  search: "",
                  status: ALL,
                  fraudFlag: ALL,
                  city: ALL,
                  vehicleClass: ALL,
                  fuelType: ALL,
                })
              }
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length.toLocaleString()} records
        {filtered.length !== data.records.length &&
          ` (of ${data.records.length.toLocaleString()} total)`}
      </p>

      {/* Table */}
      {paginated.length === 0 ? (
        <EmptyState
          title="No matching records"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead
                  field="driver_id"
                  label="Driver ID"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHead
                  field="city"
                  label="City"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                {hasVehicleClasses && <TableHead>Vehicle Class</TableHead>}
                {hasFuelTypes && <TableHead>Fuel Type</TableHead>}
                <SortableHead
                  field="distance_km"
                  label="Distance (km)"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="text-right"
                />
                <SortableHead
                  field="estimated_emissions"
                  label="Emissions (kgCO2e)"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="text-right"
                />
                <TableHead>Fraud</TableHead>
                <SortableHead
                  field="status"
                  label="Status"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <TableHead>Reason</TableHead>
                <TableHead>Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((record, i) => (
                <TableRow
                  key={`${record.driver_id}-${record.output_hash}-${i}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    navigate(
                      `/drivers/${encodeURIComponent(record.driver_id)}`
                    )
                  }
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      navigate(
                        `/drivers/${encodeURIComponent(record.driver_id)}`
                      );
                    }
                  }}
                >
                  <TableCell className="font-medium text-foreground">
                    {record.driver_id}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {record.city}
                  </TableCell>
                  {hasVehicleClasses && (
                    <TableCell className="text-foreground">
                      {record.vehicle_class}
                    </TableCell>
                  )}
                  {hasFuelTypes && (
                    <TableCell className="text-foreground">
                      {record.fuel_type}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-mono text-foreground">
                    {formatNumber(record.distance_km)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {formatNumber(record.estimated_emissions)}
                  </TableCell>
                  <TableCell>
                    <FraudBadge flagged={record.fraud_flag} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                    {record.reason_codes || "-"}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono text-muted-foreground">
                      {truncateHash(record.output_hash, 8)}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={page === totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Helper components ----

function FilterSelect({
  label,
  value,
  options,
  optionLabels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  optionLabels?: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[150px] h-9 text-sm">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {optionLabels?.[opt] ?? opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SortableHead({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  className = "",
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  className?: string;
}) {
  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-0.5 font-medium hover:text-foreground transition-colors"
      >
        {label}
        {sortField === field ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3 ml-1" />
          ) : (
            <ArrowDown className="h-3 w-3 ml-1" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}
