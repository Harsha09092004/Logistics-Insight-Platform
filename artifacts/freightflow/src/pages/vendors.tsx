import { useState } from "react";
import { 
  useListVendors, 
  useCreateVendor,
  VendorCategory,
  CreateVendorRequest
} from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Plus, Users, Mail, Phone, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["road", "rail", "air", "sea", "multimodal"]),
  gstin: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  paymentTermsDays: z.coerce.number().min(0).default(30),
});

export default function Vendors() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: vendors, isLoading } = useListVendors();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateVendor({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
        setIsCreateOpen(false);
        toast({ title: "Vendor created successfully" });
      }
    }
  });

  const { register, handleSubmit, formState: { errors } } = useForm<CreateVendorRequest>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      category: "road",
      paymentTermsDays: 30
    }
  });

  const onSubmit = (data: CreateVendorRequest) => {
    // filter out empty strings for optional fields
    const payload = {
      ...data,
      contactEmail: data.contactEmail || undefined,
      gstin: data.gstin || undefined,
    };
    createMutation.mutate({ data: payload });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Vendors & Carriers</h1>
          <p className="text-muted-foreground mt-1">Manage your transportation partners and their payment terms.</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse"></div>)
        ) : vendors?.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-card rounded-2xl border border-dashed border-border text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No vendors found. Add your first vendor to get started.</p>
          </div>
        ) : (
          vendors?.map(vendor => (
            <div key={vendor.id} className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">{vendor.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
                      {vendor.category}
                    </span>
                    {vendor.gstin && (
                      <span className="text-xs text-muted-foreground font-mono bg-slate-50 px-1.5 py-0.5 rounded">
                        GST: {vendor.gstin}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                {vendor.contactEmail && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{vendor.contactEmail}</span>
                  </div>
                )}
                {vendor.contactPhone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{vendor.contactPhone}</span>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{vendor.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Payment Terms</p>
                  <p className="font-semibold">{vendor.paymentTermsDays} Days</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Amount Due</p>
                  <p className="font-bold text-rose-600">{formatCurrency(vendor.totalAmountDue)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)}
        title="Add New Vendor"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Vendor Name</label>
            <input {...register("name")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g. VRL Logistics" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Category</label>
              <select {...register("category")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none">
                <option value="road">Road</option>
                <option value="rail">Rail</option>
                <option value="air">Air</option>
                <option value="sea">Sea</option>
                <option value="multimodal">Multimodal</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Payment Terms (Days)</label>
              <input type="number" {...register("paymentTermsDays")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">GSTIN</label>
            <input {...register("gstin")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm" placeholder="22AAAAA0000A1Z5" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <input type="email" {...register("contactEmail")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" placeholder="contact@vendor.com" />
              {errors.contactEmail && <p className="text-xs text-destructive">{errors.contactEmail.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Phone</label>
              <input {...register("contactPhone")} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none" placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Address</label>
            <textarea {...register("address")} rows={2} className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none resize-none" placeholder="Full address..." />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {createMutation.isPending ? "Saving..." : "Add Vendor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
