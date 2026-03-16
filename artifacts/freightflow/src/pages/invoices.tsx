import { useState } from "react";
import { 
  useListInvoices, 
  useCreateInvoice, 
  useDeleteInvoice,
  useListVendors,
  InvoiceStatus,
  CreateInvoiceRequest
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { Plus, Trash2, Eye, Filter, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Required"),
  vendorId: z.coerce.number().min(1, "Vendor required"),
  amount: z.coerce.number().min(0, "Must be positive"),
  invoiceDate: z.string().min(1, "Required"),
  dueDate: z.string().min(1, "Required"),
  freightCharges: z.coerce.number().min(0),
  fuelSurcharge: z.coerce.number().optional(),
  otherCharges: z.coerce.number().optional(),
  gstAmount: z.coerce.number().optional(),
  description: z.string().optional()
});

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: response, isLoading } = useListInvoices(
    statusFilter ? { status: statusFilter } : undefined
  );
  const { data: vendors } = useListVendors();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateInvoice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
        setIsCreateOpen(false);
        toast({ title: "Invoice created successfully" });
      }
    }
  });

  const deleteMutation = useDeleteInvoice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
        toast({ title: "Invoice deleted" });
      }
    }
  });

  const { register, handleSubmit, formState: { errors } } = useForm<CreateInvoiceRequest>({
    resolver: zodResolver(invoiceSchema)
  });

  const onSubmit = (data: CreateInvoiceRequest) => {
    createMutation.mutate({ data });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage and track your freight invoices.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              className="pl-10 pr-8 py-2.5 bg-card border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus)}
            >
              <option value="">All Statuses</option>
              {Object.values(InvoiceStatus).map(s => (
                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
            <Filter className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          </div>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading invoices...
                  </td>
                </tr>
              ) : response?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                response?.data.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-foreground">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4">{invoice.vendorName}</td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(invoice.amount)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Inv:</span> {formatDate(invoice.invoiceDate)}<br/>
                        <span className="text-muted-foreground">Due:</span> <span className="font-medium text-foreground">{formatDate(invoice.dueDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Are you sure you want to delete this invoice?')) {
                              deleteMutation.mutate({ id: invoice.id });
                            }
                          }}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)}
        title="Create New Invoice"
        description="Enter the details of the freight invoice manually."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Invoice Number</label>
              <input {...register("invoiceNumber")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="e.g. INV-2023-001" />
              {errors.invoiceNumber && <p className="text-xs text-destructive">{errors.invoiceNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Vendor</label>
              <select {...register("vendorId")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                <option value="">Select a vendor...</option>
                {vendors?.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              {errors.vendorId && <p className="text-xs text-destructive">{errors.vendorId.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Total Amount (₹)</label>
              <input type="number" step="0.01" {...register("amount")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="0.00" />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Freight Charges (₹)</label>
              <input type="number" step="0.01" {...register("freightCharges")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Invoice Date</label>
              <input type="date" {...register("invoiceDate")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Due Date</label>
              <input type="date" {...register("dueDate")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Fuel Surcharge (₹)</label>
              <input type="number" step="0.01" {...register("fuelSurcharge")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">GST Amount (₹)</label>
              <input type="number" step="0.01" {...register("gstAmount")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="0.00" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Description / Notes</label>
            <textarea {...register("description")} rows={3} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" placeholder="Additional details..." />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Save Invoice"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
