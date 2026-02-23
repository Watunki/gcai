// ---- Supported schema versions ----
export const SUPPORTED_SCHEMA_VERSIONS = ["1.0", "1.1"] as const;

// ---- Default run ID ----
export const DEFAULT_RUN_ID = "demo";

// ---- Pagination ----
export const DEFAULT_PAGE_SIZE = 25;

// ---- Required CSV columns ----
export const REQUIRED_CSV_COLUMNS = [
  "driver_id",
  "city",
  "vehicle_class",
  "fuel_type",
  "distance_km",
  "emission_factor_used",
  "estimated_emissions",
  "fraud_flag",
  "status",
  "output_hash",
] as const;

// Optional columns that are strongly recommended
export const RECOMMENDED_CSV_COLUMNS = [
  "ts",
  "country_code",
  "run_id",
  "reason_codes",
  "config_hash_full",
  "schema_version",
  "prev_record_hash",
  "engine_version",
] as const;

// ---- Required manifest fields ----
export const REQUIRED_MANIFEST_FIELDS = [
  "schema_version",
  "run_id",
  "ran_at_utc",
  "engine_version",
  "country_code",
  "rows_in",
  "rows_out",
  "status_counts",
  "input_sha256",
  "config_hash_full",
  "output_sha256",
] as const;

// ---- Canonical header mapping (case-insensitive) ----
// Maps lowercase variants to canonical column names
export const CANONICAL_HEADER_MAP: Record<string, string> = {
  driver_id: "driver_id",
  city: "city",
  vehicle_class: "vehicle_class",
  fuel_type: "fuel_type",
  distance_km: "distance_km",
  ts: "ts",
  emission_factor_used: "emission_factor_used",
  estimated_emissions: "estimated_emissions",
  fraud_flag: "fraud_flag",
  status: "status",
  output_hash: "output_hash",
  country_code: "country_code",
  run_id: "run_id",
  reason_codes: "reason_codes",
  config_hash_full: "config_hash_full",
  schema_version: "schema_version",
  prev_record_hash: "prev_record_hash",
  engine_version: "engine_version",
};

// ---- Legacy Ghana compatibility mapping ----
// Maps legacy column names -> canonical names
// Isolated here for easy removal once Ghana outputs are migrated
export const LEGACY_COLUMN_MAP: Record<string, string> = {
  driver: "driver_id",
  distance_km_week: "distance_km",
  ef_kgco2e_per_l: "emission_factor_used",
  adjusted_kgco2e: "estimated_emissions",
  record_hash_full: "output_hash",
};

// ---- Legacy manifest field mapping ----
export const LEGACY_MANIFEST_FIELD_MAP: Record<string, string> = {
  ran_at_local: "ran_at_utc",
  gcai_output_sha256: "output_sha256",
};

// ---- Valid status values ----
export const VALID_STATUSES = ["OK", "REVIEW", "INVALID"] as const;

// ---- Flags summary columns ----
export const FLAGS_SUMMARY_COLUMNS = ["status", "reason", "count"] as const;
