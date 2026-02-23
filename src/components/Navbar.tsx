import { NavLink } from "react-router-dom";
import { useRunData } from "@/context/RunContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

const navLinks = [
  { to: "/", label: "Overview", end: true },
  { to: "/drivers", label: "Drivers" },
  { to: "/manifest", label: "Execution Proof" },
];

export function Navbar() {
  const { data, loadStatus } = useRunData();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-foreground" />
              <span className="font-semibold text-foreground text-base">
                GCaI Public Replay Console
              </span>
            </div>
            <nav className="flex items-center gap-1" aria-label="Main navigation">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {loadStatus === "ready" && data && (
            <div className="flex items-center gap-2">
              {data.manifest.engine_version && (
                <Badge variant="outline" className="font-mono text-xs">
                  {data.manifest.engine_version}
                </Badge>
              )}
              {data.manifest.run_id && (
                <Badge variant="outline" className="font-mono text-xs">
                  {data.manifest.run_id}
                </Badge>
              )}
              {data.manifest.country_code && (
                <Badge variant="secondary" className="text-xs">
                  {data.manifest.country_code}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
