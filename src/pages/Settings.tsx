import { useLocation, useRoute } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EquipmentTypes from "./EquipmentTypes";
import PreservationProcedures from "./PreservationProcedures";

export default function Settings() {
  const [, params] = useRoute("/settings/:tab?");
  const [, navigate] = useLocation();
  const tab = params?.tab === "procedures" ? "procedures" : "equipment-types";

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Equipment types and preservation procedures configuration."
      />
      <Tabs
        value={tab}
        onValueChange={value => navigate(value === "procedures" ? "/settings/procedures" : "/settings")}
      >
        <TabsList>
          <TabsTrigger value="equipment-types">Equipment Types</TabsTrigger>
          <TabsTrigger value="procedures">Preservation Procedures</TabsTrigger>
        </TabsList>
        <TabsContent value="equipment-types">
          <EquipmentTypes />
        </TabsContent>
        <TabsContent value="procedures">
          <PreservationProcedures />
        </TabsContent>
      </Tabs>
    </div>
  );
}
