import { useLocation, useRoute } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MaintenancePlans from "./MaintenancePlans";
import PlanAssignments from "./PlanAssignments";

export default function Plans() {
  const [, params] = useRoute("/plans/:tab?");
  const [, navigate] = useLocation();
  const tab = params?.tab === "assignments" ? "assignments" : "plans";

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Maintenance plans and their assignment to inventory units."
      />
      <Tabs value={tab} onValueChange={value => navigate(value === "assignments" ? "/plans/assignments" : "/plans")}>
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="assignments">Plan Assignments</TabsTrigger>
        </TabsList>
        <TabsContent value="plans">
          <MaintenancePlans />
        </TabsContent>
        <TabsContent value="assignments">
          <PlanAssignments />
        </TabsContent>
      </Tabs>
    </div>
  );
}
