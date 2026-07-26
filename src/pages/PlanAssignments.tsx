import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../server/routers";
import type { inferRouterOutputs } from "@trpc/server";

type Assignment = inferRouterOutputs<AppRouter>["unitPlanAssignments"]["list"][number];

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

const CLASSIFICATION_VARIANT: Record<Classification, "green" | "amber" | "destructive"> = {
  green: "green",
  yellow: "amber",
  red: "destructive",
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function PlanAssignments() {
  const utils = trpc.useUtils();
  const { data: assignments = [] } = trpc.unitPlanAssignments.list.useQuery();
  const { data: plans = [] } = trpc.maintenancePlans.list.useQuery();
  const { data: equipmentTypes = [] } = trpc.equipmentTypes.list.useQuery();
  const { data: procedures = [] } = trpc.preservationProcedures.list.useQuery();
  const { data: materials = [] } = trpc.materials.list.useQuery();
  const { data: inventoryUnits = [] } = trpc.inventoryUnits.list.useQuery();
  const { data: workOrders = [] } = trpc.workOrders.list.useQuery();

  const [addingForUnit, setAddingForUnit] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState<Assignment | null>(null);
  const [checkingRemoval, setCheckingRemoval] = useState<number | null>(null);

  const invalidateAssignments = () => {
    utils.unitPlanAssignments.list.invalidate();
    utils.workOrders.list.invalidate();
  };

  const createMutation = trpc.unitPlanAssignments.create.useMutation({
    onSuccess: () => {
      invalidateAssignments();
      setAddingForUnit(null);
      setSelectedPlanId("");
    },
  });

  const deactivateMutation = trpc.unitPlanAssignments.deactivate.useMutation({
    onSuccess: () => {
      invalidateAssignments();
      setPendingRemoval(null);
    },
  });

  function planLabel(planId: number) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return `#${planId}`;
    const equipmentType = equipmentTypes.find(e => e.id === plan.equipmentTypeId);
    const procedure = procedures.find(p => p.id === plan.preservationProcedureId);
    return `${equipmentType?.name ?? `Type #${plan.equipmentTypeId}`} — ${procedure?.name ?? `Procedure #${plan.preservationProcedureId}`}`;
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

  const availableUnits = inventoryUnits.filter(u => u.status === "available");
  const activeAssignments = assignments.filter(a => a.active);
  const activePlans = plans.filter(p => p.active);

  async function handleRemoveClick(assignment: Assignment) {
    setCheckingRemoval(assignment.id);
    try {
      const hasOpen = await utils.client.unitPlanAssignments.hasOpenWorkOrder.query({
        inventoryUnitId: assignment.inventoryUnitId,
        planId: assignment.planId,
      });
      if (hasOpen) {
        setPendingRemoval(assignment);
      } else {
        deactivateMutation.mutate({ id: assignment.id, cancelOpenWorkOrder: false });
      }
    } finally {
      setCheckingRemoval(null);
    }
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (addingForUnit === null || !selectedPlanId) return;
    createMutation.mutate({ inventoryUnitId: addingForUnit, planId: Number(selectedPlanId) });
  }

  return (
    <div className="flex flex-col gap-4">
      {availableUnits.length === 0 && (
        <p className="text-sm text-muted-foreground">No inventory units currently in stock.</p>
      )}
      {availableUnits.map(unit => {
        const material = materials.find(m => m.id === unit.materialId);
        const unitAssignments = activeAssignments.filter(a => a.inventoryUnitId === unit.id);

        return (
          <Card key={unit.id}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-modec-navy">{unit.serial}</p>
                  <p className="text-sm text-muted-foreground">
                    {material?.name ?? `Material #${unit.materialId}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setAddingForUnit(unit.id);
                    setSelectedPlanId("");
                  }}
                >
                  <Plus /> Add Plan
                </Button>
              </div>
              {unitAssignments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No plans assigned to this unit.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted underline-offset-4">
                              Status
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex flex-col gap-0.5">
                              <span>🟢 Up to date</span>
                              <span>🟡 Pending</span>
                              <span>🔴 Overdue</span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unitAssignments.map(assignment => {
                      const plan = plans.find(p => p.id === assignment.planId);
                      const classification = classifyUnit(assignment.planId, unit.id, plan?.interval ?? 0);
                      return (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">{planLabel(assignment.planId)}</TableCell>
                          <TableCell>
                            <Badge variant={assignment.source === "auto" ? "cyan" : "navy"}>
                              {assignment.source}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={CLASSIFICATION_VARIANT[classification]}>
                              {CLASSIFICATION_ICON[classification]} {CLASSIFICATION_LABEL[classification]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={checkingRemoval === assignment.id}
                              onClick={() => handleRemoveClick(assignment)}
                            >
                              <Trash2 />
                            </Button>
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

      <Dialog open={addingForUnit !== null} onOpenChange={open => !open && setAddingForUnit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Plan Assignment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="assignPlan">Maintenance Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger id="assignPlan" className="w-full">
                  <SelectValue placeholder="Select a maintenance plan" />
                </SelectTrigger>
                <SelectContent>
                  {activePlans.map(plan => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {planLabel(plan.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddingForUnit(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !selectedPlanId}>
                {createMutation.isPending ? "Saving..." : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingRemoval !== null} onOpenChange={open => !open && setPendingRemoval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open Work Order Found</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This unit has an open Work Order for this plan. Do you want to cancel that Work Order, or keep it
            open? Keeping it open leaves it visible in Work Orders History, but it will no longer count toward
            this unit's active plan coverage.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deactivateMutation.isPending}
              onClick={() =>
                pendingRemoval &&
                deactivateMutation.mutate({ id: pendingRemoval.id, cancelOpenWorkOrder: false })
              }
            >
              Keep Work Order Open
            </Button>
            <Button
              variant="destructive"
              disabled={deactivateMutation.isPending}
              onClick={() =>
                pendingRemoval &&
                deactivateMutation.mutate({ id: pendingRemoval.id, cancelOpenWorkOrder: true })
              }
            >
              Cancel Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
