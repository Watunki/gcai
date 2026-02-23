import type {
  CanonicalRecord,
  StatusCounts,
  EmissionsSummary,
  GroupByField,
  GroupBucket,
  FlagsSummaryRow,
} from "@/types";

// ---- Status counts ----

export function computeStatusCounts(records: CanonicalRecord[]): StatusCounts {
  const counts: StatusCounts = { OK: 0, REVIEW: 0, INVALID: 0 };
  for (const r of records) {
    if (r.status in counts) {
      counts[r.status]++;
    }
  }
  return counts;
}

// ---- Emissions summary ----

export function computeEmissionsSummary(
  records: CanonicalRecord[]
): EmissionsSummary {
  const count = records.length;
  if (count === 0) {
    return { total: 0, average: 0, count: 0, flaggedCount: 0, flaggedRate: 0 };
  }
  let total = 0;
  let flaggedCount = 0;
  for (const r of records) {
    total += r.estimated_emissions;
    if (r.fraud_flag) flaggedCount++;
  }
  return {
    total,
    average: total / count,
    count,
    flaggedCount,
    flaggedRate: count > 0 ? flaggedCount / count : 0,
  };
}

// ---- Flags summary fallback ----

export function computeFlagsSummaryFallback(
  records: CanonicalRecord[]
): FlagsSummaryRow[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const reason = r.reason_codes || "none";
    const key = `${r.status}|${reason}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, count]) => {
      const [status, reason] = key.split("|");
      return { status, reason, count };
    })
    .sort((a, b) => b.count - a.count);
}

// ---- Group by field ----

export function computeGroupBy(
  records: CanonicalRecord[],
  field: GroupByField
): GroupBucket[] {
  const map = new Map<
    string,
    { count: number; totalEmissions: number; flaggedCount: number }
  >();

  for (const r of records) {
    const key = String(r[field] ?? "N/A");
    const existing = map.get(key) ?? {
      count: 0,
      totalEmissions: 0,
      flaggedCount: 0,
    };
    existing.count++;
    existing.totalEmissions += r.estimated_emissions;
    if (r.fraud_flag) existing.flaggedCount++;
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .map(([key, data]) => ({
      key,
      count: data.count,
      totalEmissions: data.totalEmissions,
      averageEmissions: data.count > 0 ? data.totalEmissions / data.count : 0,
      flaggedCount: data.flaggedCount,
    }))
    .sort((a, b) => b.count - a.count);
}
