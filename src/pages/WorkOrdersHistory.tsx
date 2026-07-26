import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import type { WorkOrderChecklistResult } from "../../drizzle/schema";

const ALL = "all";

function formatIsoDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
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
                  <TableRow key={item.id}>
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
                        <span>
                          {steps.filter(s => s.actualResult === "pass").length}/{steps.length} steps passed
                        </span>
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
    </div>
  );
}
