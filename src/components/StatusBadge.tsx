import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "OK" | "REVIEW" | "INVALID" | string;
}

const statusVariantMap: Record<string, "ok" | "review" | "invalid"> = {
  OK: "ok",
  REVIEW: "review",
  INVALID: "invalid",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = statusVariantMap[status] ?? "outline";
  return (
    <Badge variant={variant as "ok" | "review" | "invalid" | "outline"}>
      {status}
    </Badge>
  );
}
