import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "./CopyButton";

interface JsonViewerProps {
  data: unknown;
  title?: string;
  defaultOpen?: boolean;
}

export function JsonViewer({
  data,
  title = "Raw JSON",
  defaultOpen = false,
}: JsonViewerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(!open)}
          className="p-0 h-auto font-medium text-sm hover:bg-transparent"
        >
          {open ? (
            <ChevronDown className="h-4 w-4 mr-2" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-2" />
          )}
          {title}
        </Button>
        <CopyButton text={jsonString} label="Copy JSON" />
      </div>
      {open && (
        <pre className="p-4 text-xs font-mono overflow-auto max-h-96 bg-card text-foreground">
          {jsonString}
        </pre>
      )}
    </div>
  );
}
