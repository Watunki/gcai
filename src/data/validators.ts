import type { ValidationReport } from "@/types";
import {
  REQUIRED_CSV_COLUMNS,
  REQUIRED_MANIFEST_FIELDS,
  SUPPORTED_SCHEMA_VERSIONS,
} from "./constants";

/**
 * Validate that all required CSV columns exist in the normalized headers.
 */
export function validateColumns(headers: string[]): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const headerSet = new Set(headers);

  const missing = REQUIRED_CSV_COLUMNS.filter((col) => !headerSet.has(col));
  if (missing.length > 0) {
    errors.push(`Missing required columns: ${missing.join(", ")}`);
  }

  // Check for ts (recommended)
  if (!headerSet.has("ts")) {
    warnings.push('Column "ts" not found; timestamps will show as N/A.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    legacyMappingApplied: false,
  };
}

/**
 * Validate a raw (already-normalized) manifest object.
 */
export function validateManifest(
  manifest: Record<string, unknown>
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  const missing = REQUIRED_MANIFEST_FIELDS.filter(
    (field) => manifest[field] === undefined || manifest[field] === null || manifest[field] === ""
  );
  if (missing.length > 0) {
    errors.push(`Missing required manifest fields: ${missing.join(", ")}`);
  }

  // Check schema version
  const sv = String(manifest.schema_version ?? "");
  if (sv && !(SUPPORTED_SCHEMA_VERSIONS as readonly string[]).includes(sv)) {
    errors.push(
      `Unsupported schema version "${sv}". Supported: ${SUPPORTED_SCHEMA_VERSIONS.join(", ")}`
    );
  }

  // Check status_counts shape
  if (manifest.status_counts) {
    const sc = manifest.status_counts as Record<string, unknown>;
    if (
      typeof sc.OK !== "number" ||
      typeof sc.REVIEW !== "number" ||
      typeof sc.INVALID !== "number"
    ) {
      warnings.push(
        "status_counts has unexpected shape; some counts may default to 0."
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    legacyMappingApplied: false,
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
