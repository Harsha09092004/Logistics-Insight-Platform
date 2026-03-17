import { useState, useRef } from "react";
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
import { Plus, Trash2, Eye, Filter, Loader2, Download, Upload, CheckSquare, Square, X, ChevronDown } from "lucide-react";
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

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const [isBulkActing, setIsBulkActing] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: response, isLoading } = useListInvoices(
    statusFilter ? { status: statusFilter } : undefined
  );
  const { data: vendors } = useListVendors();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invoices = response?.data || [];
  const allIds = invoices.map(i => i.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  const someSelected = selectedIds.size > 0 && !allSelected;

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

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateInvoiceRequest>({
    resolver: zodResolver(invoiceSchema)
  });

  const onSubmit = (data: CreateInvoiceRequest) => {
    createMutation.mutate({ data });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  };

  const doBulkAction = async (action: string) => {
    setIsBulkActing(true);
    setIsBulkMenuOpen(false);
    try {
      const resp = await fetch(`${BASE_URL}/api/invoices/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceIds: Array.from(selectedIds), action }),
      });
      const result = await resp.json();
      toast({ title: result.message || "Bulk action completed" });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    } catch {
      toast({ title: "Bulk action failed", variant: "destructive" });
    } finally {
      setIsBulkActing(false);
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    window.open(`${BASE_URL}/api/reports/export/invoices?${params}`, "_blank");
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, ""));
    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const row: any = {};
      headers.forEach((h, idx) => row[h] = values[idx]);
      try {
        const vendorMatch = vendors?.find(v => v.name.toLowerCase().includes((row.vendor || "").toLowerCase()));
        await fetch(`${BASE_URL}/api/invoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceNumber: row.invoice_number || row.invoicenumber || `IMPORT-${Date.now()}-${i}`,
            vendorId: vendorMatch?.id || parseInt(row.vendor_id) || 1,
            amount: parseFloat(row.amount) || 0,
            freightCharges: parseFloat(row.freight_charges) || parseFloat(row.amount) || 0,
            gstAmount: parseFloat(row.gst_amount) || 0,
            invoiceDate: row.invoice_date || row.invoicedate || new Date().toISOString().slice(0, 10),
            dueDate: row.due_date || row.duedate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            description: row.description || row.notes || "",
          })
        });
        imported++;
      } catch { /* skip malformed rows */ }
    }
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    toast({ title: `Imported ${imported} invoices successfully` });
    setIsImportOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage and track your freight invoices.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select
              className="pl-10 pr-8 py-2.5 bg-card border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as InvoiceStatus); setSelectedIds(new Set()); }}
            >
              <option value="">All Statuses</option>
              {Object.values(InvoiceStatus).map(s => (
                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
            <Filter className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-sm font-medium rounded-xl hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-sm font-medium rounded-xl hover:bg-muted transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button 
            onClick={() => { setIsCreateOpen(true); reset(); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-primary/5 border border-primary/20 rounded-2xl animate-in slide-in-from-top-2 duration-200">
          <CheckSquare className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-primary">{selectedIds.size} invoice{selectedIds.size > 1 ? "s" : ""} selected</span>
          <div className="flex-1" />
          <div className="relative">
            <button
              onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
              disabled={isBulkActing}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isBulkActing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Bulk Action
              <ChevronDown className="w-4 h-4" />
            </button>
            {isBulkMenuOpen && (
              <div className="absolute right-0 top-10 z-20 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                {[
                  { label: "Mark as Paid", action: "mark_paid" },
                  { label: "Mark as Overdue", action: "mark_overdue" },
                  { label: "Mark as Disputed", action: "mark_disputed" },
                  { label: "Delete Selected", action: "delete" },
                ].map(item => (
                  <button
                    key={item.action}
                    onClick={() => doBulkAction(item.action)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${item.action === "delete" ? "text-destructive" : "text-foreground"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-4 py-4 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : someSelected ? (
                      <div className="w-4 h-4 rounded border-2 border-primary bg-primary/20 flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-primary" />
                      </div>
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-4">Invoice #</th>
                <th className="px-4 py-4">Vendor</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Dates</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Filter className="w-6 h-6 text-muted-foreground" />
                    </div>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className={`hover:bg-muted/30 transition-colors group ${selectedIds.has(invoice.id) ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-4">
                      <button onClick={() => toggleSelect(invoice.id)} className="text-muted-foreground hover:text-primary transition-colors">
                        {selectedIds.has(invoice.id) ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 font-semibold text-foreground font-mono text-xs">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-4">{invoice.vendorName}</td>
                    <td className="px-4 py-4 font-medium">{formatCurrency(invoice.amount)}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Inv:</span> {formatDate(invoice.invoiceDate)}<br/>
                        <span className="text-muted-foreground">Due:</span> <span className="font-medium text-foreground">{formatDate(invoice.dueDate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Delete this invoice?')) {
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
        {invoices.length > 0 && (
          <div className="px-6 py-3 border-t border-border/50 text-xs text-muted-foreground bg-muted/20 flex items-center justify-between">
            <span>{invoices.length} invoice{invoices.length !== 1 ? "s" : ""} · Total: {formatCurrency(invoices.reduce((s, i) => s + (i.amount || 0), 0))}</span>
            <span>{selectedIds.size > 0 ? `${selectedIds.size} selected` : "Click row checkbox to select"}</span>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isCreateOpen} 
        onClose={() => { setIsCreateOpen(false); reset(); }}
        title="Create New Invoice"
        description="Enter the details of the freight invoice manually."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Invoice Number</label>
              <input {...register("invoiceNumber")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="e.g. INV-2024-001" />
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
            <button type="button" onClick={() => { setIsCreateOpen(false); reset(); }} className="px-5 py-2.5 rounded-xl font-medium text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50">
              {createMutation.isPending ? "Creating..." : "Save Invoice"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Invoices via CSV"
        description="Upload a CSV file with columns: invoice_number, vendor, amount, invoice_date, due_date, description"
      >
        <div className="space-y-4 mt-4">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">Drop your CSV file here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl cursor-pointer hover:bg-primary/90 transition-colors"
            >
              Select CSV File
            </label>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground mb-2">CSV Format Example:</p>
            <code className="block font-mono">invoice_number,vendor,amount,invoice_date,due_date</code>
            <code className="block font-mono">INV-001,BlueDart Logistics,45000,2024-01-15,2024-02-15</code>
            <code className="block font-mono">INV-002,DTDC Express,28000,2024-01-18,2024-02-18</code>
          </div>
        </div>
      </Modal>
    </div>
  );
}
