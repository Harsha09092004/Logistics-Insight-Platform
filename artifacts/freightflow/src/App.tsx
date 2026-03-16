import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";

import Dashboard from "@/pages/dashboard";
import Invoices from "@/pages/invoices";
import Vendors from "@/pages/vendors";
import Shipments from "@/pages/shipments";
import Reconciliation from "@/pages/reconciliation";
import Payments from "@/pages/payments";
import AgingReport from "@/pages/reports/aging";
import GstReport from "@/pages/reports/gst";
import VendorPerformance from "@/pages/reports/vendor-performance";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/vendors" component={Vendors} />
        <Route path="/shipments" component={Shipments} />
        <Route path="/reconciliation" component={Reconciliation} />
        <Route path="/payments" component={Payments} />
        <Route path="/reports/aging" component={AgingReport} />
        <Route path="/reports/gst" component={GstReport} />
        <Route path="/reports/vendor-performance" component={VendorPerformance} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
