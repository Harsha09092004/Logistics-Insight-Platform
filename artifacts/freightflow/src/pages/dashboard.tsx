import { useGetDashboardStats, useGetFreightTrends } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { 
  FileText, AlertCircle, Clock, Truck, 
  ArrowUpRight, GitCompare, Activity, CheckCircle2, TrendingDown
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";

function StatCard({ title, value, subValue, icon: Icon, trend, className }: any) {
  return (
    <div className={`bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-display font-bold mt-2 text-foreground">{value}</h3>
          {subValue && (
            <p className="text-sm mt-1 text-muted-foreground font-medium">{subValue}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              {trend}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${className.includes('primary') ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: trends, isLoading: trendsLoading } = useGetFreightTrends({ period: "month" });

  if (statsLoading || trendsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-2xl"></div>)}
        </div>
        <div className="h-[400px] bg-muted rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard overview</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your freight operations today.</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Pending Amount" 
            value={formatCurrency(stats.totalAmountPending)} 
            subValue={`${stats.pendingInvoices} invoices`}
            icon={FileText} 
            className="border-primary/20 primary"
          />
          <StatCard 
            title="Disputed Amount" 
            value={formatCurrency(stats.totalAmountDisputed)} 
            subValue={`${stats.disputedInvoices} invoices`}
            icon={AlertCircle} 
            className="border-rose-200"
          />
          <StatCard 
            title="Reconciliation Rate" 
            value={`${stats.reconciliationRate}%`} 
            subValue={`${stats.openDiscrepancies} open discrepancies`}
            icon={GitCompare} 
            trend="+2.4% this month"
            className=""
          />
          <StatCard 
            title="Active Shipments" 
            value={stats.activeShipments} 
            subValue={`${stats.delayedShipments} delayed`}
            icon={Truck} 
            className=""
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">Freight Cost Trends</h3>
              <p className="text-sm text-muted-foreground">Total freight expenditure over time</p>
            </div>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="period" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                  dy={10}
                />
                <YAxis 
                  tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), "Total Cost"]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalFreightCost" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCost)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">Dispute Rate</h3>
              <p className="text-sm text-muted-foreground">Percentage of invoices disputed</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="period" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                  dy={10}
                />
                <YAxis 
                  tickFormatter={(val) => `${val}%`} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  formatter={(value: number) => [`${value}%`, "Dispute Rate"]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="disputeRate" 
                  fill="hsl(var(--destructive))" 
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
