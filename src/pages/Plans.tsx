import { useLocation, useRoute } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PreservationProcedures from "./PreservationProcedures";
import MaintenancePlans from "./MaintenancePlans";
import PlanAssignments from "./PlanAssignments";

type Tab = "procedures" | "plans" | "assignments";

function pathFor(tab: Tab) {
  if (tab === "procedures") return "/plans/procedures";
  if (tab === "assignments") return "/plans/assignments";
  return "/plans";
}

export default function Plans() {
  const [, params] = useRoute("/plans/:tab?");
  const [, navigate] = useLocation();
  const tab: Tab =
    params?.tab === "procedures" ? "procedures" : params?.tab === "assignments" ? "assignments" : "plans";

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Preservation procedures, maintenance plans, and their assignment to inventory units."
      />
      <Tabs value={tab} onValueChange={value => navigate(pathFor(value as Tab))}>
        <TabsList>
          <TabsTrigger value="procedures">Preservation Procedures</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="assignments">Plan Assignments</TabsTrigger>
        </TabsList>
        <TabsContent value="procedures">
          <PreservationProcedures />
        </TabsContent>
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
