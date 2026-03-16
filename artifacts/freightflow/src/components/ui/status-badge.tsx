import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = (s: string) => {
    switch (s.toLowerCase()) {
      // Invoices
      case "matched":
      case "paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "disputed":
      case "overdue":
        return "bg-rose-100 text-rose-800 border-rose-200";
      
      // Shipments
      case "in_transit":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "delayed":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "cancelled":
        return "bg-zinc-100 text-zinc-800 border-zinc-200";

      // Discrepancies
      case "open":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "resolved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "escalated":
        return "bg-purple-100 text-purple-800 border-purple-200";
      
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const formatStatus = (s: string) => {
    return s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm",
        getStatusStyles(status),
        className
      )}
    >
      {formatStatus(status)}
    </span>
  );
}
