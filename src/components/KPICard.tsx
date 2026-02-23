import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export function KPICard({ label, value, subtitle }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
