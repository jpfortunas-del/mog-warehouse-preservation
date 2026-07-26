import { useLocation, useRoute } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Materials from "./Materials";
import InventoryUnits from "./InventoryUnits";

export default function Parts() {
  const [, params] = useRoute("/parts/:tab?");
  const [, navigate] = useLocation();
  const tab = params?.tab === "inventory-units" ? "inventory-units" : "materials";

  return (
    <div>
      <PageHeader
        title="Parts"
        description="Materials catalog and individually tracked inventory units."
      />
      <Tabs
        value={tab}
        onValueChange={value => navigate(value === "inventory-units" ? "/parts/inventory-units" : "/parts")}
      >
        <TabsList>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="inventory-units">Inventory Units</TabsTrigger>
        </TabsList>
        <TabsContent value="materials">
          <Materials />
        </TabsContent>
        <TabsContent value="inventory-units">
          <InventoryUnits />
        </TabsContent>
      </Tabs>
    </div>
  );
}
