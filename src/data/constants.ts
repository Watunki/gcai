// ---- Supported schema versions ----
export const SUPPORTED_SCHEMA_VERSIONS = ["1.0", "1.1", "GCaI_v0.1"] as const;

// ---- Default run ID ----
export const DEFAULT_RUN_ID = "demo";

// ---- Pagination ----
export const DEFAULT_PAGE_SIZE = 25;

// ---- Required CSV columns (canonical schema) ----
// For legacy data, these are derived via LEGACY_COLUMN_MAP
export const REQUIRED_CSV_COLUMNS = [
  "driver_id",
  "city",
  "distance_km",
  "emission_factor_used",
  "estimated_emissions",
  "status",
  "output_hash",
] as const;

// Optional columns that are strongly recommended
export const RECOMMENDED_CSV_COLUMNS = [
  "vehicle_class",
  "fuel_type",
  "ts",
  "country_code",
  "run_id",
  "reason_codes",
  "config_hash_full",
  "schema_version",
  "prev_record_hash",
  "engine_version",
  "fraud_flag",
] as const;

// ---- Required manifest fields (strict) ----
// For legacy manifests, many of these will be absent and validation is relaxed
export const REQUIRED_MANIFEST_FIELDS_STRICT = [
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

// Fields that MUST be present even in legacy manifests
export const REQUIRED_MANIFEST_FIELDS_LENIENT = [
  "rows_in",
  "rows_out",
  "status_counts",
  "config_hash_full",
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
  // Core field renames
  driver: "driver_id",
  distance_km_week: "distance_km",
  ef_kgco2e_per_l: "emission_factor_used",
  adjusted_kgco2e: "estimated_emissions",
  record_hash_full: "output_hash",
  // Additional Ghana fields that map to canonical
  gcai_version: "engine_version",
};

// ---- Legacy manifest field mapping ----
export const LEGACY_MANIFEST_FIELD_MAP: Record<string, string> = {
  ran_at_local: "ran_at_utc",
  gcai_output_sha256: "output_sha256",
  gcai_version: "engine_version",
};

// ---- Valid status values ----
export const VALID_STATUSES = ["OK", "REVIEW", "INVALID"] as const;

// ---- Flags summary columns ----
export const FLAGS_SUMMARY_COLUMNS = ["status", "reason", "count"] as const;
