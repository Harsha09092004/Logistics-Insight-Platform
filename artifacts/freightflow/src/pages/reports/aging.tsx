import { useGetAgingReport } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Clock, Loader2, AlertTriangle } from "lucide-react";

const BUCKETS = [
  { key: "current", label: "Current (Not Overdue)", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  { key: "days30", label: "1–30 Days Overdue", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  { key: "days60", label: "31–60 Days Overdue", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  { key: "days90", label: "61–90 Days Overdue", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  { key: "over90", label: "> 90 Days Overdue", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
] as const;

const BUCKET_BADGE: Record<string, string> = {
  current: "bg-emerald-50 text-emerald-700",
  "1-30": "bg-amber-50 text-amber-700",
  "31-60": "bg-orange-50 text-orange-700",
  "61-90": "bg-red-50 text-red-700",
  "90+": "bg-rose-50 text-rose-700",
};

export default function AgingReport() {
  const { data: report, isLoading } = useGetAgingReport();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Aging Report</h1>
          <p className="text-muted-foreground mt-1">Outstanding invoices grouped by overdue period.</p>
        </div>
        {report && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
            <p className="text-2xl font-display font-bold text-rose-600">{formatCurrency(report.totalOutstanding)}</p>
          </div>
        )}
      </div>

      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {BUCKETS.map(bucket => {
              const data = report[bucket.key as keyof typeof report] as any;
              return (
                <div key={bucket.key} className={`rounded-2xl p-5 border ${bucket.bg}`}>
                  <p className={`text-xs font-bold uppercase tracking-wide ${bucket.color}`}>{bucket.label}</p>
                  <p className={`text-2xl font-display font-bold mt-2 ${bucket.color}`}>{formatCurrency(data.amount)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{data.count} invoice{data.count !== 1 ? "s" : ""}</p>
                  <div className="mt-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bucket.color.replace("text-", "bg-")}`}
                      style={{ width: `${Math.min(100, data.percentage)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{data.percentage.toFixed(1)}% of total</p>
                </div>
              );
            })}
          </div>

          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-display font-bold text-foreground">Invoice Details</h3>
                <span className="text-xs text-muted-foreground ml-auto">{report.details.length} invoices</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="text-left px-6 py-3.5 font-semibold text-muted-foreground">Invoice #</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-muted-foreground">Vendor</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-muted-foreground">Due Date</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-muted-foreground">Bucket</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-muted-foreground">Days Overdue</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {report.details.map(d => (
                    <tr key={d.invoiceId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs font-semibold text-primary">{d.invoiceNumber}</td>
                      <td className="px-6 py-3.5 font-medium">{d.vendorName}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{formatDate(d.dueDate)}</td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BUCKET_BADGE[d.bucket] || "bg-gray-50 text-gray-700"}`}>
                          {d.bucket}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {d.daysOverdue > 0 ? (
                          <span className="text-rose-600 font-semibold">{d.daysOverdue}d</span>
                        ) : (
                          <span className="text-emerald-600">On time</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold">{formatCurrency(d.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
