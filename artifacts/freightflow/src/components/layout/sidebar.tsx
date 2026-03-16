import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Truck, 
  Users, 
  GitCompare, 
  LogOut,
  Boxes,
  CreditCard,
  BarChart3,
  Clock,
  Receipt,
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/reconciliation", label: "Reconciliation", icon: GitCompare },
  { href: "/shipments", label: "Shipments", icon: Truck },
  { href: "/vendors", label: "Vendors & Carriers", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
];

const REPORT_ITEMS = [
  { href: "/reports/aging", label: "Aging Report", icon: Clock },
  { href: "/reports/gst", label: "GST Reconciliation", icon: Receipt },
  { href: "/reports/vendor-performance", label: "Vendor Scores", icon: TrendingUp },
];

export function Sidebar() {
  const [location] = useLocation();
  const [reportsOpen, setReportsOpen] = useState(location.startsWith("/reports"));

  return (
    <div className="w-64 h-screen flex flex-col bg-card border-r border-border shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Boxes className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl tracking-tight text-foreground">FreightFlow</h1>
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">SME Logistics</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto pb-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-1">
          <button
            onClick={() => setReportsOpen(!reportsOpen)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group",
              location.startsWith("/reports") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <BarChart3 className={cn("w-5 h-5", location.startsWith("/reports") ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            <span className="flex-1 text-left">Reports</span>
            <ChevronRight className={cn("w-4 h-4 transition-transform duration-200", reportsOpen && "rotate-90")} />
          </button>

          {reportsOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l border-border/60 pl-3">
              {REPORT_ITEMS.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">Admin</p>
          </div>
          <button className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
