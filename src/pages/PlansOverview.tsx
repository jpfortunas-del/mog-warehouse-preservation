import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

type Classification = "green" | "yellow" | "red";

const CLASSIFICATION_ICON: Record<Classification, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
};

const CLASSIFICATION_LABEL: Record<Classification, string> = {
  green: "Up to date",
  yellow: "Pending",
  red: "Overdue",
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function PlansOverview() {
  const { data: plans = [], isLoading } = trpc.maintenancePlans.list.useQuery();
  const { data: equipmentTypes = [] } = trpc.equipmentTypes.list.useQuery();
  const { data: procedures = [] } = trpc.preservationProcedures.list.useQuery();
  const { data: materials = [] } = trpc.materials.list.useQuery();
  const { data: inventoryUnits = [] } = trpc.inventoryUnits.list.useQuery();
  const { data: workOrders = [] } = trpc.workOrders.list.useQuery();

  // A unit is "under" a plan when it shares the plan's equipment type and is currently
  // in stock (available) — mirrors the TP#6 activation rule.
  function unitsUnderPlan(equipmentTypeId: number) {
    return inventoryUnits.filter(unit => {
      if (unit.status !== "available") return false;
      const material = materials.find(m => m.id === unit.materialId);
      return material?.equipmentTypeId === equipmentTypeId;
    });
  }

  function classifyUnit(planId: number, unitId: number, intervalDays: number): Classification {
    const relevantOrders = workOrders.filter(w => w.planId === planId && w.inventoryUnitId === unitId);

    if (relevantOrders.some(w => w.status === "open" || w.status === "in_progress")) {
      return "yellow";
    }

    const now = Date.now();
    const hasRecentCompletion = relevantOrders.some(w => {
      if (w.status !== "completed" || !w.closedAt) return false;
      const daysSinceClosed = (now - new Date(w.closedAt).getTime()) / MS_PER_DAY;
      return daysSinceClosed <= intervalDays;
    });

    return hasRecentCompletion ? "green" : "red";
  }

  return (
    <div>
      <PageHeader
        title="Plans Overview"
        description="Consolidated view of maintenance plan coverage across inventory units. Read-only — manage plans on the Maintenance Plans page."
      />
      <div className="flex flex-col gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && plans.length === 0 && (
          <p className="text-sm text-muted-foreground">No maintenance plans registered.</p>
        )}
        {plans.map(plan => {
          const equipmentType = equipmentTypes.find(e => e.id === plan.equipmentTypeId);
          const procedure = procedures.find(p => p.id === plan.preservationProcedureId);
          const units = unitsUnderPlan(plan.equipmentTypeId);

          return (
            <Card key={plan.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="font-semibold text-modec-navy">
                      {equipmentType?.name ?? `Equipment Type #${plan.equipmentTypeId}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {procedure?.name ?? `Procedure #${plan.preservationProcedureId}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-muted-foreground">every {plan.interval} days</span>
                    <Badge variant={plan.active ? "cyan" : "destructive"}>
                      {plan.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {units.length} inventory unit(s) currently under this plan
                </p>
                {units.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Coverage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {units.map(unit => {
                        const classification = classifyUnit(plan.id, unit.id, plan.interval);
                        return (
                          <TableRow key={unit.id}>
                            <TableCell className="font-medium">{unit.serial}</TableCell>
                            <TableCell>
                              {CLASSIFICATION_ICON[classification]} {CLASSIFICATION_LABEL[classification]}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
