import { Badge } from "@/components/ui/badge";

interface FraudBadgeProps {
  flagged: boolean;
}

export function FraudBadge({ flagged }: FraudBadgeProps) {
  if (flagged) {
    return <Badge variant="fraud">Flagged</Badge>;
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      Clear
    </Badge>
  );
}
