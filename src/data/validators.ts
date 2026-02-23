import type { ValidationReport } from "@/types";
import {
  REQUIRED_CSV_COLUMNS,
  REQUIRED_MANIFEST_FIELDS_STRICT,
  REQUIRED_MANIFEST_FIELDS_LENIENT,
  SUPPORTED_SCHEMA_VERSIONS,
} from "./constants";

/**
 * Validate that all required CSV columns exist in the normalized headers.
 */
export function validateColumns(
  headers: string[],
  legacyApplied: boolean
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const headerSet = new Set(headers);

  const missing = REQUIRED_CSV_COLUMNS.filter((col) => !headerSet.has(col));
  if (missing.length > 0) {
    if (legacyApplied) {
      // Schema v0 data: treat missing required as warnings, not errors
      warnings.push(
        `After schema normalisation, columns defaulting to N/A: ${missing.join(", ")}`
      );
    } else {
      errors.push(`Missing required columns: ${missing.join(", ")}`);
    }
  }

  // Check for ts (recommended)
  if (!headerSet.has("ts")) {
    warnings.push('Column "ts" not found; timestamps will show as N/A.');
  }

  // Check optional but recommended
  if (!headerSet.has("vehicle_class")) {
    warnings.push('Column "vehicle_class" not found; will display as "N/A".');
  }
  if (!headerSet.has("fuel_type")) {
    warnings.push('Column "fuel_type" not found; will display as "N/A".');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    legacyMappingApplied: legacyApplied,
  };
}

/**
 * Validate a raw (already-normalized) manifest object.
 * Uses lenient validation when legacy mapping was applied.
 */
export function validateManifest(
  manifest: Record<string, unknown>,
  legacyApplied: boolean
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredFields = legacyApplied
    ? REQUIRED_MANIFEST_FIELDS_LENIENT
    : REQUIRED_MANIFEST_FIELDS_STRICT;

  // Check required fields
  const missing = requiredFields.filter(
    (field) =>
      manifest[field] === undefined ||
      manifest[field] === null ||
      manifest[field] === ""
  );
  if (missing.length > 0) {
    errors.push(`Missing required manifest fields: ${missing.join(", ")}`);
  }

  // For legacy, also warn about strict fields that are absent
  if (legacyApplied) {
    const lenientSet: Set<string> = new Set(requiredFields);
    const missingStrict = REQUIRED_MANIFEST_FIELDS_STRICT.filter(
      (field) =>
        !lenientSet.has(field) &&
        (manifest[field] === undefined ||
          manifest[field] === null ||
          manifest[field] === "")
    );
    if (missingStrict.length > 0) {
      warnings.push(
        `Schema v0 manifest: optional fields defaulting to empty: ${missingStrict.join(", ")}`
      );
    }
  }

  // Check schema version (only if present)
  const sv = String(manifest.schema_version ?? manifest.engine_version ?? "");
  if (
    sv &&
    !(SUPPORTED_SCHEMA_VERSIONS as readonly string[]).includes(sv)
  ) {
    warnings.push(
      `Schema/engine version "${sv}" is not in the supported list. Dashboard will still attempt to display the data.`
    );
  }

  // Check status_counts shape
  if (manifest.status_counts) {
    const sc = manifest.status_counts as Record<string, unknown>;
    if (typeof sc.OK !== "number" && typeof sc.REVIEW !== "number") {
      warnings.push(
        "status_counts has unexpected shape; some counts may default to 0."
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    legacyMappingApplied: legacyApplied,
  };
}

/**
 * Merge multiple validation reports into one.
 */
export function mergeValidationReports(
  ...reports: ValidationReport[]
): ValidationReport {
  return {
    valid: reports.every((r) => r.valid),
    errors: reports.flatMap((r) => r.errors),
    warnings: reports.flatMap((r) => r.warnings),
    legacyMappingApplied: reports.some((r) => r.legacyMappingApplied),
  };
}
