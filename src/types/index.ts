// ---- Canonical Record (from verified_output.csv) ----

export interface CanonicalRecord {
  driver_id: string;
  city: string;
  vehicle_class: string;
  fuel_type: string;
  distance_km: number;
  ts: string | null;
  emission_factor_used: number;
  estimated_emissions: number;
  fraud_flag: boolean;
  status: "OK" | "REVIEW" | "INVALID";
  output_hash: string;
  // Strongly recommended optional
  country_code?: string;
  run_id?: string;
  reason_codes?: string;
  config_hash_full?: string;
  schema_version?: string;
  prev_record_hash?: string;
  engine_version?: string;
  // Extension fields
  [key: string]: unknown;
}

// ---- Run Manifest ----

export interface RunManifest {
  schema_version: string;
  run_id: string;
  ran_at_utc: string;
  engine_version: string;
  country_code: string;
  rows_in: number;
  rows_out: number;
  status_counts: {
    OK: number;
    REVIEW: number;
    INVALID: number;
  };
  input_sha256: string;
  config_hash_full: string;
  output_sha256: string;
  // Recommended optional
  ruleset_id?: string;
  rules_snapshot?: unknown;
  json_key_ordering?: string[];
  flags_summary_sha256?: string;
  notes?: string;
  source_dataset_name?: string;
  // Extension fields
  [key: string]: unknown;
}

// ---- Flags Summary ----

export interface FlagsSummaryRow {
  status: string;
  reason: string;
  count: number;
}

// ---- Validation ----

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  legacyMappingApplied: boolean;
}

// ---- App-level aggregated state ----

export interface RunData {
  manifest: RunManifest;
  records: CanonicalRecord[];
  flagsSummary: FlagsSummaryRow[] | null;
  validation: ValidationReport;
  rawExtensionFields: string[];
}

export interface StatusCounts {
  OK: number;
  REVIEW: number;
  INVALID: number;
}

export interface EmissionsSummary {
  total: number;
  average: number;
  count: number;
  flaggedCount: number;
  flaggedRate: number;
}

export type GroupByField = "city" | "vehicle_class" | "fuel_type" | "status";

export interface GroupBucket {
  key: string;
  count: number;
  totalEmissions: number;
  averageEmissions: number;
  flaggedCount: number;
}

export type LoadStatus = "idle" | "loading" | "ready" | "error";
