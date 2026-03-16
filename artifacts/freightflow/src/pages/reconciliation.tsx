import { useState } from "react";
import { 
  useListDiscrepancies, 
  useRunReconciliation,
  useResolveDiscrepancy,
  useListInvoices
} from "@workspace/api-client-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { Play, ShieldAlert, CheckCircle2, Search, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Reconciliation() {
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionStatus, setResolutionStatus] = useState<"resolved" | "escalated">("resolved");
  
  const { data: discrepancies, isLoading } = useListDiscrepancies();
  const { data: pendingInvoices } = useListInvoices({ status: "pending" });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const runMutation = useRunReconciliation({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["/api/reconciliation/discrepancies"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        toast({ 
          title: "Reconciliation Complete", 
          description: `Processed ${data.processed} invoices. Found ${data.discrepanciesFound} issues.` 
        });
      }
    }
  });

  const resolveMutation = useResolveDiscrepancy({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/reconciliation/discrepancies"] });
        setIsResolveOpen(false);
        setResolutionNotes("");
        toast({ title: "Discrepancy updated" });
      }
    }
  });

  const handleRunRecon = () => {
    if (!pendingInvoices?.data || pendingInvoices.data.length === 0) {
      toast({ title: "No pending invoices to reconcile", variant: "destructive" });
      return;
    }
    const ids = pendingInvoices.data.map(i => i.id);
    runMutation.mutate({ data: { invoiceIds: ids } });
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    resolveMutation.mutate({
      id: selectedId,
      data: { status: resolutionStatus, resolution: resolutionNotes }
    });
  };

  const openResolveModal = (id: number) => {
    setSelectedId(id);
    setIsResolveOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/20">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Auto-Reconciliation Engine</h1>
          <p className="text-muted-foreground mt-1">Match pending invoices against shipment records to detect rate deviations.</p>
        </div>
        <button 
          onClick={handleRunRecon}
          disabled={runMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
        >
          {runMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Search className="w-5 h-5 animate-pulse" /> Processing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-5 h-5 fill-current" /> Run Reconciliation
            </span>
          )}
        </button>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            Detected Discrepancies
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Issue Type</th>
                <th className="px-6 py-4">Variance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : discrepancies?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-50" />
                    All clear! No discrepancies found.
                  </td>
                </tr>
              ) : (
                discrepancies?.map((disc) => (
                  <tr key={disc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">{disc.invoiceNumber}</td>
                    <td className="px-6 py-4">{disc.vendorName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground capitalize">
                        {disc.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="line-through text-muted-foreground text-xs">{formatCurrency(disc.expectedAmount)}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className={cn("font-bold", disc.varianceAmount > 0 ? "text-rose-600" : "text-emerald-600")}>
                          {formatCurrency(disc.invoicedAmount)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Diff: <span className={disc.varianceAmount > 0 ? "text-rose-600 font-medium" : ""}>{formatCurrency(disc.varianceAmount)}</span>
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={disc.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {disc.status === 'open' ? (
                        <button 
                          onClick={() => openResolveModal(disc.id)}
                          className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/10"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isResolveOpen} 
        onClose={() => setIsResolveOpen(false)}
        title="Resolve Discrepancy"
        description="Review and process this invoice discrepancy."
      >
        <form onSubmit={handleResolveSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Action</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={cn(
                "border rounded-xl p-4 cursor-pointer transition-all",
                resolutionStatus === 'resolved' ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200" : "hover:bg-muted"
              )}>
                <input type="radio" name="status" value="resolved" className="hidden" checked={resolutionStatus === 'resolved'} onChange={() => setResolutionStatus('resolved')} />
                <div className="font-semibold text-emerald-800">Approve & Resolve</div>
                <div className="text-xs text-emerald-600/80 mt-1">Accept variation and mark invoice ready for payment</div>
              </label>
              
              <label className={cn(
                "border rounded-xl p-4 cursor-pointer transition-all",
                resolutionStatus === 'escalated' ? "border-rose-500 bg-rose-50 ring-2 ring-rose-200" : "hover:bg-muted"
              )}>
                <input type="radio" name="status" value="escalated" className="hidden" checked={resolutionStatus === 'escalated'} onChange={() => setResolutionStatus('escalated')} />
                <div className="font-semibold text-rose-800">Escalate Dispute</div>
                <div className="text-xs text-rose-600/80 mt-1">Flag to vendor operations team for clarification</div>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Resolution Notes / Reason</label>
            <textarea 
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              required
              rows={3} 
              className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none resize-none" 
              placeholder="Explain why this decision was made..." 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsResolveOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={resolveMutation.isPending}
              className={cn(
                "px-6 py-2.5 text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50",
                resolutionStatus === 'resolved' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
              )}
            >
              {resolveMutation.isPending ? "Saving..." : "Confirm Action"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
