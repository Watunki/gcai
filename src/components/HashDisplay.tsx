import { truncateHash } from "@/lib/utils";
import { CopyButton } from "./CopyButton";

interface HashDisplayProps {
  label: string;
  hash: string;
}

export function HashDisplay({ label, hash }: HashDisplayProps) {
  if (!hash) {
    return (
      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">N/A</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground" title={hash}>
          {truncateHash(hash)}
        </code>
        <CopyButton text={hash} label={`Copy ${label}`} />
      </div>
    </div>
  );
}
