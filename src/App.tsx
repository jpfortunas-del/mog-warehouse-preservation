import { Redirect, Route, Switch } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import EquipmentTypes from "@/pages/EquipmentTypes";
import PreservationProcedures from "@/pages/PreservationProcedures";
import MaintenancePlans from "@/pages/MaintenancePlans";
import Materials from "@/pages/Materials";
import InventoryUnits from "@/pages/InventoryUnits";
import WorkOrders from "@/pages/WorkOrders";
import PlansOverview from "@/pages/PlansOverview";

function App() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/equipment-types" component={EquipmentTypes} />
        <Route path="/preservation-procedures" component={PreservationProcedures} />
        <Route path="/maintenance-plans" component={MaintenancePlans} />
        <Route path="/materials" component={Materials} />
        <Route path="/inventory-units" component={InventoryUnits} />
        <Route path="/work-orders" component={WorkOrders} />
        <Route path="/plans-overview" component={PlansOverview} />
        <Route path="/">
          <Redirect to="/equipment-types" />
        </Route>
        <Route>
          <div className="text-center text-muted-foreground py-20">Page not found.</div>
        </Route>
      </Switch>
    </DashboardLayout>
  );
}

export default App;
