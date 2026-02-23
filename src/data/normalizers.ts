import {
  CANONICAL_HEADER_MAP,
  LEGACY_COLUMN_MAP,
  LEGACY_MANIFEST_FIELD_MAP,
  VALID_STATUSES,
} from "./constants";
import type { RunManifest } from "@/types";

// ---- Header normalization ----

/**
 * Normalize CSV headers to canonical column names.
 * Steps: lowercase -> canonical map -> legacy map -> passthrough
 * Returns [normalizedHeaders, legacyMappingApplied]
 */
export function normalizeHeaders(
  rawHeaders: string[]
): [string[], boolean] {
  let legacyApplied = false;
  const normalized = rawHeaders.map((h) => {
    const lower = h.trim().toLowerCase();
    // Direct canonical match
    if (CANONICAL_HEADER_MAP[lower]) {
      return CANONICAL_HEADER_MAP[lower];
    }
    // Legacy compatibility match
    if (LEGACY_COLUMN_MAP[lower]) {
      legacyApplied = true;
      return LEGACY_COLUMN_MAP[lower];
    }
    // Passthrough as extension field
    return lower;
  });
  return [normalized, legacyApplied];
}

// ---- Boolean normalization ----

const TRUE_VALUES = new Set(["true", "1", "yes"]);
const FALSE_VALUES = new Set(["false", "0", "no"]);

export function normalizeBoolean(
  value: unknown
): { valid: boolean; result: boolean } {
  if (typeof value === "boolean") return { valid: true, result: value };
  const str = String(value).trim().toLowerCase();
  if (TRUE_VALUES.has(str)) return { valid: true, result: true };
  if (FALSE_VALUES.has(str)) return { valid: true, result: false };
  return { valid: false, result: false };
}

// ---- Number normalization ----

export function normalizeNumber(
  value: unknown
): { valid: boolean; result: number } {
  if (typeof value === "number" && !isNaN(value)) {
    return { valid: true, result: value };
  }
  const str = String(value).trim();
  if (str === "" || str === "null" || str === "undefined") {
    return { valid: false, result: 0 };
  }
  const num = Number(str);
  if (isNaN(num)) return { valid: false, result: 0 };
  return { valid: true, result: num };
}

// ---- Status normalization ----

export function normalizeStatus(
  value: unknown
): { valid: boolean; result: "OK" | "REVIEW" | "INVALID" } {
  const str = String(value).trim().toUpperCase();
  if ((VALID_STATUSES as readonly string[]).includes(str)) {
    return { valid: true, result: str as "OK" | "REVIEW" | "INVALID" };
  }
  return { valid: false, result: "INVALID" };
}

// ---- Timestamp normalization ----

export function normalizeTimestamp(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (str === "" || str.toLowerCase() === "null" || str.toLowerCase() === "n/a") {
    return null;
  }
  return str;
}

// ---- Manifest normalization ----

/**
 * Normalize a raw manifest object, mapping legacy field names to canonical.
 * Returns [normalizedManifest, legacyMappingApplied]
 */
export function normalizeManifest(
  raw: Record<string, unknown>
): [Record<string, unknown>, boolean] {
  let legacyApplied = false;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    const lowerKey = key.toLowerCase();
    if (LEGACY_MANIFEST_FIELD_MAP[lowerKey]) {
      legacyApplied = true;
      result[LEGACY_MANIFEST_FIELD_MAP[lowerKey]] = value;
    } else {
      result[key] = value;
    }
  }

  // Ensure status_counts exists and has the right shape
  if (result.status_counts && typeof result.status_counts === "object") {
    const sc = result.status_counts as Record<string, unknown>;
    result.status_counts = {
      OK: Number(sc.OK ?? sc.ok ?? 0),
      REVIEW: Number(sc.REVIEW ?? sc.review ?? 0),
      INVALID: Number(sc.INVALID ?? sc.invalid ?? 0),
    };
  }

  return [result, legacyApplied];
}

// ---- Derive fraud_flag from status for legacy data ----

export function deriveFraudFlag(status: string): boolean {
  return status === "REVIEW" || status === "INVALID";
}

// ---- Row normalization ----

export interface NormalizedRow {
  record: Record<string, unknown>;
  warnings: string[];
}

/**
 * Normalize a single parsed CSV row (already with canonical headers)
 * into typed values, collecting warnings for invalid parses.
 */
export function normalizeRow(
  row: Record<string, string>,
  _index: number
): NormalizedRow {
  const warnings: string[] = [];
  const record: Record<string, unknown> = { ...row };

  // distance_km
  const dist = normalizeNumber(row.distance_km);
  if (!dist.valid && row.distance_km !== undefined && row.distance_km !== "") {
    warnings.push(`Invalid distance_km: "${row.distance_km}"`);
  }
  record.distance_km = dist.result;

  // emission_factor_used
  const ef = normalizeNumber(row.emission_factor_used);
  if (!ef.valid && row.emission_factor_used !== undefined && row.emission_factor_used !== "") {
    warnings.push(`Invalid emission_factor_used: "${row.emission_factor_used}"`);
  }
  record.emission_factor_used = ef.result;

  // estimated_emissions
  const ee = normalizeNumber(row.estimated_emissions);
  if (!ee.valid && row.estimated_emissions !== undefined && row.estimated_emissions !== "") {
    warnings.push(`Invalid estimated_emissions: "${row.estimated_emissions}"`);
  }
  record.estimated_emissions = ee.result;

  // status
  const st = normalizeStatus(row.status);
  if (!st.valid) {
    warnings.push(`Invalid status: "${row.status}", defaulting to INVALID`);
  }
  record.status = st.result;

  // fraud_flag
  if (row.fraud_flag !== undefined && row.fraud_flag !== "") {
    const ff = normalizeBoolean(row.fraud_flag);
    if (!ff.valid) {
      warnings.push(`Invalid fraud_flag: "${row.fraud_flag}", deriving from status`);
      record.fraud_flag = deriveFraudFlag(st.result);
    } else {
      record.fraud_flag = ff.result;
    }
  } else {
    // Missing fraud_flag: derive from status
    record.fraud_flag = deriveFraudFlag(st.result);
  }

  // ts
  record.ts = normalizeTimestamp(row.ts);

  // Ensure string fields have defaults
  record.driver_id = String(row.driver_id ?? "").trim();
  record.city = String(row.city ?? "").trim();
  record.vehicle_class = String(row.vehicle_class ?? "N/A").trim() || "N/A";
  record.fuel_type = String(row.fuel_type ?? "N/A").trim() || "N/A";
  record.output_hash = String(row.output_hash ?? "").trim();

  return { record, warnings };
}

// ---- Type guard for RunManifest shape ----

export function coerceManifest(normalized: Record<string, unknown>): RunManifest {
  const CORE_KEYS = new Set([
    "schema_version", "run_id", "ran_at_utc", "engine_version",
    "country_code", "rows_in", "rows_out", "status_counts",
    "input_sha256", "config_hash_full", "output_sha256",
    "input_file", "ruleset_id", "rules_snapshot",
    "json_key_ordering", "flags_summary_sha256",
    "notes", "source_dataset_name",
  ]);

  // Collect extension fields
  const ext: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(normalized)) {
    if (!CORE_KEYS.has(k)) {
      ext[k] = v;
    }
  }

  return {
    schema_version: String(normalized.schema_version ?? ""),
    run_id: String(normalized.run_id ?? ""),
    ran_at_utc: String(normalized.ran_at_utc ?? ""),
    engine_version: String(normalized.engine_version ?? ""),
    country_code: String(normalized.country_code ?? ""),
    rows_in: Number(normalized.rows_in ?? 0),
    rows_out: Number(normalized.rows_out ?? 0),
    status_counts: (normalized.status_counts as RunManifest["status_counts"]) ?? {
      OK: 0,
      REVIEW: 0,
      INVALID: 0,
    },
    input_sha256: String(normalized.input_sha256 ?? ""),
    config_hash_full: String(normalized.config_hash_full ?? ""),
    output_sha256: String(normalized.output_sha256 ?? ""),
    // Known optional fields
    input_file: normalized.input_file ? String(normalized.input_file) : undefined,
    ruleset_id: normalized.ruleset_id ? String(normalized.ruleset_id) : undefined,
    rules_snapshot: normalized.rules_snapshot as Record<string, unknown> | undefined,
    json_key_ordering: normalized.json_key_ordering as string[] | undefined,
    flags_summary_sha256: normalized.flags_summary_sha256
      ? String(normalized.flags_summary_sha256)
      : undefined,
    notes: normalized.notes ? String(normalized.notes) : undefined,
    source_dataset_name: normalized.source_dataset_name
      ? String(normalized.source_dataset_name)
      : undefined,
    // Extension fields
    _ext: Object.keys(ext).length > 0 ? ext : undefined,
  };
}
