import Papa from "papaparse";
import type {
  CanonicalRecord,
  FlagsSummaryRow,
  RunData,
  ValidationReport,
} from "@/types";
import { REQUIRED_CSV_COLUMNS, RECOMMENDED_CSV_COLUMNS } from "./constants";
import {
  normalizeHeaders,
  normalizeManifest,
  normalizeRow,
  coerceManifest,
} from "./normalizers";
import {
  validateColumns,
  validateManifest,
  mergeValidationReports,
} from "./validators";

// ---- Fetch helpers ----

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ---- CSV parsing ----

function parseCsv(
  text: string,
  fileName: string
): { headers: string[]; rows: Record<string, string>[] } {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    const errorMessages = result.errors
      .slice(0, 5)
      .map((e) => `Row ${e.row}: ${e.message}`)
      .join("; ");
    throw new Error(`CSV parse error in ${fileName}: ${errorMessages}`);
  }

  const headers = result.meta.fields ?? [];
  return { headers, rows: result.data };
}

// ---- Main loader ----

export async function loadRunArtifacts(runId: string): Promise<RunData> {
  const basePath = `/runs/${runId}`;
  const validationReports: ValidationReport[] = [];

  // 1. Load required files
  let csvText: string;
  let rawManifest: Record<string, unknown>;

  try {
    csvText = await fetchText(`${basePath}/verified_output.csv`);
  } catch {
    throw new Error(
      `Required file not found: verified_output.csv\nExpected at: ${basePath}/verified_output.csv`
    );
  }

  try {
    rawManifest = (await fetchJson(`${basePath}/run_manifest.json`)) as Record<
      string,
      unknown
    >;
  } catch {
    throw new Error(
      `Required file not found: run_manifest.json\nExpected at: ${basePath}/run_manifest.json`
    );
  }

  // 2. Parse CSV
  const { headers: rawHeaders, rows } = parseCsv(
    csvText,
    "verified_output.csv"
  );

  // 3. Normalize headers
  const [normalizedHeaders, csvLegacyApplied] = normalizeHeaders(rawHeaders);

  // 4. Validate columns (pass legacy flag for lenient mode)
  const columnValidation = validateColumns(normalizedHeaders, csvLegacyApplied);
  if (csvLegacyApplied) {
    columnValidation.warnings.push(
      "Legacy column names were mapped to canonical names."
    );
  }
  validationReports.push(columnValidation);

  if (!columnValidation.valid) {
    throw new Error(
      `Schema validation failed:\n${columnValidation.errors.join("\n")}`
    );
  }

  // 5. Normalize manifest
  const [normalizedManifestRaw, manifestLegacyApplied] =
    normalizeManifest(rawManifest);

  const manifestValidation = validateManifest(
    normalizedManifestRaw,
    manifestLegacyApplied
  );
  if (manifestLegacyApplied) {
    manifestValidation.warnings.push(
      "Legacy manifest field names were mapped to canonical names."
    );
  }
  validationReports.push(manifestValidation);

  if (!manifestValidation.valid) {
    throw new Error(
      `Manifest validation failed:\n${manifestValidation.errors.join("\n")}`
    );
  }

  const manifest = coerceManifest(normalizedManifestRaw);

  // 6. Normalize rows
  const allWarnings: string[] = [];
  const records: CanonicalRecord[] = rows.map((rawRow, idx) => {
    // Remap raw row keys to normalized headers
    const remappedRow: Record<string, string> = {};
    const rawKeys = Object.keys(rawRow);
    for (let i = 0; i < rawKeys.length; i++) {
      const normalizedKey =
        normalizedHeaders[i] ?? rawKeys[i].trim().toLowerCase();
      remappedRow[normalizedKey] = rawRow[rawKeys[i]];
    }

    const { record, warnings } = normalizeRow(remappedRow, idx);
    if (warnings.length > 0) {
      allWarnings.push(`Row ${idx + 1}: ${warnings.join("; ")}`);
    }
    return record as unknown as CanonicalRecord;
  });

  if (allWarnings.length > 0) {
    const rowWarningReport: ValidationReport = {
      valid: true,
      errors: [],
      warnings:
        allWarnings.length > 10
          ? [
              ...allWarnings.slice(0, 10),
              `...and ${allWarnings.length - 10} more row warnings`,
            ]
          : allWarnings,
      legacyMappingApplied: false,
    };
    validationReports.push(rowWarningReport);
  }

  // 7. Identify extension fields
  const coreFields = new Set([
    ...REQUIRED_CSV_COLUMNS,
    ...RECOMMENDED_CSV_COLUMNS,
  ]);
  const rawExtensionFields = normalizedHeaders.filter(
    (h) => !coreFields.has(h)
  );

  // 8. Load optional flags_summary.csv
  let flagsSummary: FlagsSummaryRow[] | null = null;
  try {
    const flagsText = await fetchText(`${basePath}/flags_summary.csv`);
    const { headers: flagHeaders, rows: flagRows } = parseCsv(
      flagsText,
      "flags_summary.csv"
    );
    // Case-insensitive mapping
    const flagHeaderMap: Record<string, string> = {};
    for (const h of flagHeaders) {
      flagHeaderMap[h.toLowerCase()] = h;
    }

    flagsSummary = flagRows.map((row) => ({
      status: String(
        row[flagHeaderMap["status"] ?? "status"] ?? ""
      ).trim(),
      reason: String(
        row[flagHeaderMap["reason"] ?? "reason"] ?? ""
      ).trim(),
      count: Number(row[flagHeaderMap["count"] ?? "count"] ?? 0),
    }));
  } catch {
    // flags_summary.csv is optional; we'll use fallback
    const fallbackReport: ValidationReport = {
      valid: true,
      errors: [],
      warnings: [
        "flags_summary.csv not found; flags summary will be derived from verified_output.csv.",
      ],
      legacyMappingApplied: false,
    };
    validationReports.push(fallbackReport);
  }

  // 9. Merge validation
  const validation = mergeValidationReports(...validationReports);

  return {
    manifest,
    records,
    flagsSummary,
    validation,
    rawExtensionFields,
  };
}
