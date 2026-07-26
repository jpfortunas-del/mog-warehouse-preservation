import { Route, Switch } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Plans from "@/pages/Plans";
import Materials from "@/pages/Materials";
import InventoryUnits from "@/pages/InventoryUnits";
import WorkOrders from "@/pages/WorkOrders";

function App() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/settings/:tab?" component={Settings} />
        <Route path="/plans/:tab?" component={Plans} />
        <Route path="/materials" component={Materials} />
        <Route path="/inventory-units" component={InventoryUnits} />
        <Route path="/work-orders/:tab?" component={WorkOrders} />
        <Route>
          <div className="text-center text-muted-foreground py-20">Page not found.</div>
        </Route>
      </Switch>
    </DashboardLayout>
  );
}

export default App;
