import { Redirect, Route, Switch } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import EquipmentTypes from "@/pages/EquipmentTypes";
import PreservationProcedures from "@/pages/PreservationProcedures";
import Plans from "@/pages/Plans";
import Materials from "@/pages/Materials";
import InventoryUnits from "@/pages/InventoryUnits";
import WorkOrders from "@/pages/WorkOrders";

function App() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/equipment-types" component={EquipmentTypes} />
        <Route path="/preservation-procedures" component={PreservationProcedures} />
        <Route path="/plans/:tab?" component={Plans} />
        <Route path="/materials" component={Materials} />
        <Route path="/inventory-units" component={InventoryUnits} />
        <Route path="/work-orders/:tab?" component={WorkOrders} />
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
