import { useGetVendorPerformanceReport } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Loader2, Star } from "lucide-react";

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500";
  const label = score >= 75 ? "Excellent" : score >= 50 ? "Good" : "Poor";
  const labelColor = score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600";
  return (
    <div className="flex items-center gap-3 min-w-[160px]">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold w-16 ${labelColor}`}>{score}/100</span>
      <span className={`text-xs font-medium ${labelColor} hidden xl:block`}>{label}</span>
    </div>
  );
}

export default function VendorPerformance() {
  const { data: vendors, isLoading } = useGetVendorPerformanceReport();

  const sorted = [...(vendors || [])].sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Vendor Performance</h1>
        <p className="text-muted-foreground mt-1">Scorecards for all your carriers and freight vendors.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !sorted.length ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <TrendingUp className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-semibold">No vendor data available</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {sorted.slice(0, 3).map((v, i) => (
              <div key={v.vendorId} className={`bg-card rounded-2xl p-6 border shadow-sm ${i === 0 ? "border-amber-200 bg-gradient-to-br from-amber-50/50 to-card" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {i === 0 && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">#{i + 1} Ranked</span>
                    </div>
                    <p className="font-display font-bold text-xl mt-1">{v.vendorName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{v.category?.replace("_", " ")}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-display font-bold ${v.performanceScore! >= 75 ? "text-emerald-600" : v.performanceScore! >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                      {v.performanceScore}
                    </p>
                    <p className="text-xs text-muted-foreground">/ 100</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">On-time Rate</p>
                    <p className="font-semibold">{((v.onTimeDeliveryRate || 0) * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Dispute Rate</p>
                    <p className="font-semibold">{((v.disputeRate || 0) * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total Invoiced</p>
                    <p className="font-semibold">{formatCurrency(v.totalAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Avg Delay</p>
                    <p className="font-semibold">{(v.avgDelayDays || 0).toFixed(1)} days</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-display font-bold">All Vendor Scores</h3>
                <span className="text-xs text-muted-foreground ml-auto">{sorted.length} vendors</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="text-left px-6 py-3.5 font-semibold text-muted-foreground w-8">Rank</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-muted-foreground">Vendor</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-muted-foreground">Category</th>
                    <th className="text-center px-6 py-3.5 font-semibold text-muted-foreground">Score</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-muted-foreground">Invoices</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-muted-foreground">On-Time %</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-muted-foreground">Dispute %</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-muted-foreground">Total Amount</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-muted-foreground">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {sorted.map((v, i) => (
                    <tr key={v.vendorId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-muted-foreground text-center">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </td>
                      <td className="px-6 py-3.5 font-semibold">{v.vendorName}</td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs bg-muted px-2.5 py-1 rounded-full capitalize">{v.category?.replace("_", " ")}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <ScoreBar score={v.performanceScore || 0} />
                      </td>
                      <td className="px-6 py-3.5 text-right">{v.totalInvoices}</td>
                      <td className="px-6 py-3.5 text-right font-medium text-emerald-600">{((v.onTimeDeliveryRate || 0) * 100).toFixed(0)}%</td>
                      <td className="px-6 py-3.5 text-right font-medium text-rose-600">{((v.disputeRate || 0) * 100).toFixed(1)}%</td>
                      <td className="px-6 py-3.5 text-right">{formatCurrency(v.totalAmount || 0)}</td>
                      <td className="px-6 py-3.5 text-right text-amber-600">{formatCurrency(v.overdueAmount || 0)}</td>
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
