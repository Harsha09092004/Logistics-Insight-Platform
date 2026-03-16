import { useState } from "react";
import { 
  useListPayments, 
  useCreatePayment,
  useListInvoices,
  useListVendors
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Plus, CreditCard, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  upi: "UPI",
  rtgs: "RTGS",
  neft: "NEFT",
  cash: "Cash",
};

const METHOD_COLORS: Record<string, string> = {
  bank_transfer: "bg-blue-50 text-blue-700",
  cheque: "bg-amber-50 text-amber-700",
  upi: "bg-violet-50 text-violet-700",
  rtgs: "bg-emerald-50 text-emerald-700",
  neft: "bg-cyan-50 text-cyan-700",
  cash: "bg-gray-50 text-gray-700",
};

export default function Payments() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: payments, isLoading } = useListPayments();
  const { data: invoices } = useListInvoices();
  const { data: vendors } = useListVendors();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const createMutation = useCreatePayment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
        setIsCreateOpen(false);
        reset();
        toast({ title: "Payment recorded successfully" });
      },
      onError: () => {
        toast({ title: "Failed to record payment", variant: "destructive" });
      }
    }
  });

  const onSubmit = (data: any) => {
    createMutation.mutate({ 
      data: { 
        ...data, 
        invoiceId: parseInt(data.invoiceId),
        vendorId: parseInt(data.vendorId),
        amount: parseFloat(data.amount),
        tdsDeducted: data.tdsDeducted ? parseFloat(data.tdsDeducted) : undefined,
      } 
    });
  };

  const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const totalTds = payments?.reduce((sum, p) => sum + (p.tdsDeducted || 0), 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1">Track and record payments made to carriers and vendors.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
          <p className="text-3xl font-display font-bold mt-2">{payments?.length || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">All time records</p>
        </div>
        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Amount Paid</p>
          <p className="text-3xl font-display font-bold mt-2 text-emerald-600">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-muted-foreground mt-1">All currencies in INR</p>
        </div>
        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total TDS Deducted</p>
          <p className="text-3xl font-display font-bold mt-2 text-amber-600">{formatCurrency(totalTds)}</p>
          <p className="text-xs text-muted-foreground mt-1">Under Section 194C</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !payments?.length ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <CreditCard className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-semibold text-foreground">No payments recorded yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start by recording your first payment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Date</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Invoice</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Vendor</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Method</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Reference</th>
                  <th className="text-right px-6 py-4 font-semibold text-muted-foreground">TDS Deducted</th>
                  <th className="text-right px-6 py-4 font-semibold text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(p.paymentDate)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-primary font-semibold">{p.invoiceNumber || `#${p.invoiceId}`}</td>
                    <td className="px-6 py-4 font-medium">{p.vendorName || `Vendor #${p.vendorId}`}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${METHOD_COLORS[p.paymentMethod] || "bg-gray-50 text-gray-700"}`}>
                        {METHOD_LABELS[p.paymentMethod] || p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{p.referenceNumber || "—"}</td>
                    <td className="px-6 py-4 text-right text-amber-600 font-medium">{formatCurrency(p.tdsDeducted || 0)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-600">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); reset(); }} title="Record Payment">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-semibold">Invoice</label>
              <select {...register("invoiceId", { required: "Required" })} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="">Select invoice...</option>
                {invoices?.data?.map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.invoiceNumber} — {inv.vendorName}</option>
                ))}
              </select>
              {errors.invoiceId && <p className="text-xs text-destructive">{String(errors.invoiceId.message)}</p>}
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-semibold">Vendor</label>
              <select {...register("vendorId", { required: "Required" })} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="">Select vendor...</option>
                {vendors?.data?.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              {errors.vendorId && <p className="text-xs text-destructive">{String(errors.vendorId.message)}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Amount (₹)</label>
              <input type="number" step="0.01" {...register("amount", { required: "Required" })} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0.00" />
              {errors.amount && <p className="text-xs text-destructive">{String(errors.amount.message)}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">TDS Deducted (₹)</label>
              <input type="number" step="0.01" {...register("tdsDeducted")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Payment Date</label>
              <input type="date" {...register("paymentDate", { required: "Required" })} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" />
              {errors.paymentDate && <p className="text-xs text-destructive">{String(errors.paymentDate.message)}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Payment Method</label>
              <select {...register("paymentMethod", { required: "Required" })} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none">
                <option value="">Select method...</option>
                {Object.entries(METHOD_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-semibold">Reference Number</label>
              <input type="text" {...register("referenceNumber")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" placeholder="UTR / Cheque No / Transaction ID" />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-semibold">Notes</label>
              <textarea {...register("notes")} rows={2} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none resize-none" placeholder="Optional notes..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button type="button" onClick={() => { setIsCreateOpen(false); reset(); }} className="px-5 py-2.5 rounded-xl font-medium text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 transition-all disabled:opacity-50">
              {createMutation.isPending ? "Saving..." : "Record Payment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
