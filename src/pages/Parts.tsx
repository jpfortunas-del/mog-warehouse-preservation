import { useLocation, useRoute } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import Materials from "./Materials";
import InventoryUnits from "./InventoryUnits";

export default function Parts() {
  const [, params] = useRoute("/parts/:tab?");
  const [, navigate] = useLocation();
  const tab = params?.tab === "inventory-units" ? "inventory-units" : "materials";
  const { data: materials = [] } = trpc.materials.list.useQuery();

  return (
    <div>
      <PageHeader
        title="Parts"
        description="Materials catalog and individually tracked inventory units."
        badge={<Badge variant="secondary">{materials.length} materials</Badge>}
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
