import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../server/routers";
import type { ChecklistResultStep, WorkOrderChecklistResult } from "../../drizzle/schema";

type WorkOrder = inferRouterOutputs<AppRouter>["workOrders"]["list"][number];

const ALL = "all";

const RESULT_LABEL: Record<"pass" | "fail" | "flag", string> = {
  pass: "Pass",
  fail: "Fail",
  flag: "Flag",
};

const RESULT_VARIANT: Record<"pass" | "fail" | "flag", "green" | "destructive" | "amber"> = {
  pass: "green",
  fail: "destructive",
  flag: "amber",
};

function formatIsoDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function checklistSummary(steps: ChecklistResultStep[]) {
  const passed = steps.filter(s => s.actualResult === "pass").length;
  const failed = steps.filter(s => s.actualResult === "fail").length;
  const flagged = steps.filter(s => s.actualResult === "flag").length;
  const parts = [`${passed}/${steps.length} passed`];
  if (flagged > 0) parts.push(`${flagged} flagged`);
  if (failed > 0) parts.push(`${failed} failed`);
  return parts.join(", ");
}

export default function WorkOrdersHistory() {
  const { data: workOrders = [] } = trpc.workOrders.list.useQuery();
  const { data: maintenancePlans = [] } = trpc.maintenancePlans.list.useQuery();
  const { data: inventoryUnits = [] } = trpc.inventoryUnits.list.useQuery();
  const { data: equipmentTypes = [] } = trpc.equipmentTypes.list.useQuery();
  const { data: materials = [] } = trpc.materials.list.useQuery();

  const [unitFilter, setUnitFilter] = useState(ALL);
  const [materialFilter, setMaterialFilter] = useState(ALL);
  const [planFilter, setPlanFilter] = useState(ALL);
  const [detailsItem, setDetailsItem] = useState<WorkOrder | null>(null);

  function planLabel(id: number) {
    const plan = maintenancePlans.find(p => p.id === id);
    if (!plan) return `#${id}`;
    const equipmentType = equipmentTypes.find(e => e.id === plan.equipmentTypeId);
    return `Plan #${plan.id} — ${equipmentType?.name ?? `Type #${plan.equipmentTypeId}`}`;
  }

  function inventoryUnitLabel(id: number) {
    const unit = inventoryUnits.find(u => u.id === id);
    if (!unit) return `#${id}`;
    const material = materials.find(m => m.id === unit.materialId);
    return `${unit.serial} — ${material?.name ?? `Material #${unit.materialId}`}`;
  }

  const completed = workOrders
    .filter(w => w.status === "completed")
    .filter(w => unitFilter === ALL || w.inventoryUnitId === Number(unitFilter))
    .filter(w => planFilter === ALL || w.planId === Number(planFilter))
    .filter(w => {
      if (materialFilter === ALL) return true;
      const unit = inventoryUnits.find(u => u.id === w.inventoryUnitId);
      return unit?.materialId === Number(materialFilter);
    })
    .sort((a, b) => new Date(b.closedAt ?? 0).getTime() - new Date(a.closedAt ?? 0).getTime());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Select value={unitFilter} onValueChange={setUnitFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All inventory units" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All inventory units</SelectItem>
            {inventoryUnits.map(unit => (
              <SelectItem key={unit.id} value={String(unit.id)}>
                {inventoryUnitLabel(unit.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={materialFilter} onValueChange={setMaterialFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All materials" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All materials</SelectItem>
            {materials.map(material => (
              <SelectItem key={material.id} value={String(material.id)}>
                {material.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All plans</SelectItem>
            {maintenancePlans.map(plan => (
              <SelectItem key={plan.id} value={String(plan.id)}>
                {planLabel(plan.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Maintenance Plan</TableHead>
                <TableHead>Inventory Unit</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Closed At</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completed.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No completed work orders match this filter.
                  </TableCell>
                </TableRow>
              )}
              {completed.map(item => {
                const result = (item.checklistResult ?? null) as WorkOrderChecklistResult | null;
                const steps = result?.steps ?? [];
                return (
                  <TableRow
                    key={item.id}
                    onClick={() => setDetailsItem(item)}
                    className="cursor-pointer hover:bg-primary/5"
                  >
                    <TableCell className="font-medium">{planLabel(item.planId)}</TableCell>
                    <TableCell>{inventoryUnitLabel(item.inventoryUnitId)}</TableCell>
                    <TableCell>{item.dueDate ? formatIsoDate(item.dueDate) : "—"}</TableCell>
                    <TableCell>
                      {item.closedAt ? new Date(item.closedAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {result?.note ? (
                        result.note
                      ) : steps.length > 0 ? (
                        <span>{checklistSummary(steps)}</span>
                      ) : (
                        <Badge variant="secondary">Manual completion</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailsItem !== null} onOpenChange={open => !open && setDetailsItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checklist Results</DialogTitle>
          </DialogHeader>
          {detailsItem && (
            <p className="text-sm text-muted-foreground">
              {planLabel(detailsItem.planId)} — {inventoryUnitLabel(detailsItem.inventoryUnitId)}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {((detailsItem?.checklistResult as WorkOrderChecklistResult | null)?.steps ?? []).map(step => (
              <div key={step.stepNumber} className="flex items-start gap-2 rounded-md border p-2">
                <span className="mt-0.5 w-6 shrink-0 text-center text-sm text-muted-foreground">
                  {step.stepNumber}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-sm">{step.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Expected: {RESULT_LABEL[step.expectedResult]}
                    {step.expectedValue ? ` (${step.expectedValue})` : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={RESULT_VARIANT[step.actualResult]}>Actual: {RESULT_LABEL[step.actualResult]}</Badge>
                    {step.actualValue && <span className="text-xs text-muted-foreground">{step.actualValue}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
