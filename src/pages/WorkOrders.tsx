import { useLocation, useRoute } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkOrdersManagement from "./WorkOrdersManagement";
import WorkOrdersHistory from "./WorkOrdersHistory";

export default function WorkOrders() {
  const [, params] = useRoute("/work-orders/:tab?");
  const [, navigate] = useLocation();
  const tab = params?.tab === "history" ? "history" : "management";

  return (
    <div>
      <PageHeader
        title="Work Orders"
        description="Preservation, preventive, and corrective maintenance work orders."
      />
      <Tabs value={tab} onValueChange={value => navigate(value === "history" ? "/work-orders/history" : "/work-orders")}>
        <TabsList>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="management">
          <WorkOrdersManagement />
        </TabsContent>
        <TabsContent value="history">
          <WorkOrdersHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
