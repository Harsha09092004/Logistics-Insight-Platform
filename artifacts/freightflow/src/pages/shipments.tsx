import { useState } from "react";
import { 
  useListShipments, 
  useCreateShipment,
  useListVendors,
  CreateShipmentRequest
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { Plus, PackageSearch, Loader2, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const shipmentSchema = z.object({
  shipmentNumber: z.string().min(1, "Required"),
  vendorId: z.coerce.number().min(1, "Vendor required"),
  origin: z.string().min(1, "Required"),
  destination: z.string().min(1, "Required"),
  agreedFreightCost: z.coerce.number().min(0, "Must be positive"),
  scheduledDelivery: z.string().optional(),
  weightKg: z.coerce.number().optional(),
  description: z.string().optional()
});

export default function Shipments() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: shipments, isLoading } = useListShipments();
  const { data: vendors } = useListVendors();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateShipment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
        setIsCreateOpen(false);
        toast({ title: "Shipment created successfully" });
      }
    }
  });

  const { register, handleSubmit, formState: { errors } } = useForm<CreateShipmentRequest>({
    resolver: zodResolver(shipmentSchema)
  });

  const onSubmit = (data: CreateShipmentRequest) => {
    createMutation.mutate({ data });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Shipments</h1>
          <p className="text-muted-foreground mt-1">Track physical goods movement and agreed costs.</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          New Shipment
        </button>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-6 py-4">Shipment #</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Carrier</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Est. Delivery</th>
                <th className="px-6 py-4 text-right">Agreed Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading shipments...
                  </td>
                </tr>
              ) : shipments?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <PackageSearch className="w-6 h-6 text-muted-foreground" />
                    </div>
                    No shipments found.
                  </td>
                </tr>
              ) : (
                shipments?.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">{shipment.shipmentNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{shipment.origin}</span>
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{shipment.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{shipment.vendorName}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={shipment.status} />
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(shipment.scheduledDelivery)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatCurrency(shipment.agreedFreightCost)}
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
        title="Create Shipment Record"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Shipment/LR Number</label>
              <input {...register("shipmentNumber")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" placeholder="LR-12345" />
              {errors.shipmentNumber && <p className="text-xs text-destructive">{errors.shipmentNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Carrier/Vendor</label>
              <select {...register("vendorId")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none">
                <option value="">Select a carrier...</option>
                {vendors?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              {errors.vendorId && <p className="text-xs text-destructive">{errors.vendorId.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-foreground">Origin</label>
              <input {...register("origin")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g. Mumbai" />
              {errors.origin && <p className="text-xs text-destructive">{errors.origin.message}</p>}
            </div>
            <div className="mt-8">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-foreground">Destination</label>
              <input {...register("destination")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g. Delhi" />
              {errors.destination && <p className="text-xs text-destructive">{errors.destination.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Agreed Freight Cost (₹)</label>
              <input type="number" step="0.01" {...register("agreedFreightCost")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0.00" />
              {errors.agreedFreightCost && <p className="text-xs text-destructive">{errors.agreedFreightCost.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Total Weight (Kg)</label>
              <input type="number" {...register("weightKg")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Scheduled Delivery Date</label>
            <input type="date" {...register("scheduledDelivery")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Save Shipment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
