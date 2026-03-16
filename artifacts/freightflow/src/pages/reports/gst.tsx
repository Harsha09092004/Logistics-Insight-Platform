import { useState } from "react";
import { useGetGstReport } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Receipt, Loader2, Download } from "lucide-react";

export default function GstReport() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const { data: report, isLoading } = useGetGstReport({ month });

  const handleExport = () => {
    if (!report) return;
    const rows = [
      ["Vendor", "GSTIN", "Invoices", "Taxable Amount", "GST Collected", "TDS Deducted"],
      ...(report.gstBreakdown || []).map((r: any) => [
        r.vendorName, r.gstin || "N/A", r.invoiceCount,
        r.taxableAmount, r.gstAmount, r.tdsDeducted
      ])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gst-report-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">GST Reconciliation</h1>
          <p className="text-muted-foreground mt-1">GSTR-2B reconciliation and vendor-wise GST breakdown.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
          />
          <button
            onClick={handleExport}
            disabled={!report}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-card rounded-2xl p-5 border shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Total Invoices</p>
              <p className="text-3xl font-display font-bold mt-2">{report.invoiceCount}</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Taxable Amount</p>
              <p className="text-3xl font-display font-bold mt-2 text-foreground">{formatCurrency(report.totalTaxableAmount)}</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">GST Collected</p>
              <p className="text-3xl font-display font-bold mt-2 text-violet-600">{formatCurrency(report.totalGstCollected)}</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">TDS Deducted</p>
              <p className="text-3xl font-display font-bold mt-2 text-amber-600">{formatCurrency(report.totalTdsDeducted)}</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-violet-500" />
                <h3 className="font-display font-bold">Vendor-wise GST Breakdown</h3>
                <span className="text-xs text-muted-foreground ml-auto">{report.gstBreakdown?.length || 0} vendors</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="text-left px-6 py-3.5 font-semibold text-muted-foreground">Vendor</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-muted-foreground">GSTIN</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-muted-foreground">Invoices</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-muted-foreground">Taxable Amount</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-muted-foreground">GST Amount</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-muted-foreground">TDS Deducted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(report.gstBreakdown || []).map((v: any) => (
                    <tr key={v.vendorId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3.5 font-semibold">{v.vendorName}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">
                        {v.gstin || <span className="text-amber-500">Not registered</span>}
                      </td>
                      <td className="px-6 py-3.5 text-right">{v.invoiceCount}</td>
                      <td className="px-6 py-3.5 text-right">{formatCurrency(v.taxableAmount)}</td>
                      <td className="px-6 py-3.5 text-right text-violet-600 font-medium">{formatCurrency(v.gstAmount)}</td>
                      <td className="px-6 py-3.5 text-right text-amber-600 font-medium">{formatCurrency(v.tdsDeducted)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
