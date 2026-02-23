import { Badge } from "@/components/ui/badge";

interface FraudBadgeProps {
  flagged: boolean;
  reason?: string;
}

export function FraudBadge({ flagged, reason }: FraudBadgeProps) {
  if (flagged) {
    return (
      <Badge variant="fraud" title={reason ? `Enforcement Trigger: ${reason}` : undefined}>
        Triggered
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      Clear
    </Badge>
  );
}
