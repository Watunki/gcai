import { AlertTriangle, XCircle, Info } from "lucide-react";

interface ErrorBannerProps {
  type: "error" | "warning" | "info";
  title?: string;
  messages: string[];
}

const iconMap = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styleMap = {
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export function ErrorBanner({ type, title, messages }: ErrorBannerProps) {
  const Icon = iconMap[type];

  return (
    <div
      className={`rounded-lg border p-4 ${styleMap[type]}`}
      role={type === "error" ? "alert" : "status"}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {title && <p className="font-semibold text-sm mb-1">{title}</p>}
          <ul className="text-sm list-disc list-inside">
            {messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
