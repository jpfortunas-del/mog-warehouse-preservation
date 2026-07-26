import { useState } from "react";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
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
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../server/routers";
import type { ChecklistResultStep, ChecklistStep } from "../../drizzle/schema";

type WorkOrder = inferRouterOutputs<AppRouter>["workOrders"]["list"][number];
type Status = WorkOrder["status"];

function formatIsoDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function isOverdue(wo: WorkOrder) {
  if (wo.status === "completed" || !wo.dueDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return wo.dueDate < today;
}

const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_VARIANT: Record<Status, "secondary" | "cyan" | "default"> = {
  open: "secondary",
  in_progress: "cyan",
  completed: "default",
};

type FormState = {
  planId: string;
  inventoryUnitId: string;
  status: Status;
};

const emptyForm: FormState = { planId: "", inventoryUnitId: "", status: "open" };

export default function WorkOrdersManagement() {
  const utils = trpc.useUtils();
  const { data: workOrders = [], isLoading } = trpc.workOrders.list.useQuery();
  const { data: maintenancePlans = [] } = trpc.maintenancePlans.list.useQuery();
  const { data: inventoryUnits = [] } = trpc.inventoryUnits.list.useQuery();
  const { data: equipmentTypes = [] } = trpc.equipmentTypes.list.useQuery();
  const { data: materials = [] } = trpc.materials.list.useQuery();
  const { data: procedures = [] } = trpc.preservationProcedures.list.useQuery();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completing, setCompleting] = useState<WorkOrder | null>(null);
  const [stepResults, setStepResults] = useState<ChecklistResultStep[]>([]);

  const invalidate = () => utils.workOrders.list.invalidate();

  const createMutation = trpc.workOrders.create.useMutation({
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
  });
  const updateMutation = trpc.workOrders.update.useMutation({
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
  });
  const deleteMutation = trpc.workOrders.delete.useMutation({
    onSuccess: () => invalidate(),
  });
  const completeMutation = trpc.workOrders.update.useMutation({
    onSuccess: () => {
      invalidate();
      setCompleteOpen(false);
      setCompleting(null);
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item: WorkOrder) {
    setEditing(item);
    setForm({
      planId: String(item.planId),
      inventoryUnitId: String(item.inventoryUnitId),
      status: item.status,
    });
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      planId: Number(form.planId),
      inventoryUnitId: Number(form.inventoryUnitId),
      status: form.status,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(item: WorkOrder) {
    if (confirm(`Delete this work order?`)) {
      deleteMutation.mutate({ id: item.id });
    }
  }

  function checklistForWorkOrder(item: WorkOrder): ChecklistStep[] {
    const plan = maintenancePlans.find(p => p.id === item.planId);
    if (!plan) return [];
    const procedure = procedures.find(p => p.id === plan.preservationProcedureId);
    return Array.isArray(procedure?.checklist) ? (procedure.checklist as ChecklistStep[]) : [];
  }

  function openComplete(item: WorkOrder) {
    const checklist = checklistForWorkOrder(item);
    setCompleting(item);
    setStepResults(checklist.map(step => ({ ...step, actualResult: step.expectedResult })));
    setCompleteOpen(true);
  }

  function updateStepResult(index: number, actualResult: "pass" | "fail") {
    setStepResults(results => results.map((r, i) => (i === index ? { ...r, actualResult } : r)));
  }

  function handleCompleteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!completing) return;
    completeMutation.mutate({
      id: completing.id,
      status: "completed",
      checklistResult: stepResults.length > 0 ? { steps: stepResults } : null,
    });
  }

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

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const activeWorkOrders = workOrders.filter(w => w.status === "open" || w.status === "in_progress");

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus /> New Work Order
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Maintenance Plan</TableHead>
                <TableHead>Inventory Unit</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && activeWorkOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No open work orders. Completed work orders are available in History.
                  </TableCell>
                </TableRow>
              )}
              {activeWorkOrders.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{planLabel(item.planId)}</TableCell>
                  <TableCell>{inventoryUnitLabel(item.inventoryUnitId)}</TableCell>
                  <TableCell>
                    {item.dueDate ? (
                      <div className="flex items-center gap-2">
                        <span className={isOverdue(item) ? "font-medium text-destructive" : ""}>
                          {formatIsoDate(item.dueDate)}
                        </span>
                        {isOverdue(item) && <Badge variant="destructive">Overdue</Badge>}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" title="Complete" onClick={() => openComplete(item)}>
                      <CheckCircle2 />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Work Order" : "New Work Order"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="planId">Maintenance Plan</Label>
              <Select
                value={form.planId}
                onValueChange={value => setForm({ ...form, planId: value })}
              >
                <SelectTrigger id="planId" className="w-full">
                  <SelectValue placeholder="Select a maintenance plan" />
                </SelectTrigger>
                <SelectContent>
                  {maintenancePlans.map(plan => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {planLabel(plan.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inventoryUnitId">Inventory Unit</Label>
              <Select
                value={form.inventoryUnitId}
                onValueChange={value => setForm({ ...form, inventoryUnitId: value })}
              >
                <SelectTrigger id="inventoryUnitId" className="w-full">
                  <SelectValue placeholder="Select an inventory unit" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryUnits.map(unit => (
                    <SelectItem key={unit.id} value={String(unit.id)}>
                      {inventoryUnitLabel(unit.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={value => setForm({ ...form, status: value as Status })}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as Status[]).map(status => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABEL[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !form.planId || !form.inventoryUnitId}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Work Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCompleteSubmit} className="flex flex-col gap-4">
            {completing && (
              <p className="text-sm text-muted-foreground">
                {planLabel(completing.planId)} — {inventoryUnitLabel(completing.inventoryUnitId)}
              </p>
            )}
            {stepResults.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No checklist defined for this procedure. You can mark this work order as completed directly.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {stepResults.map((step, index) => (
                <div key={index} className="flex items-start gap-2 rounded-md border p-2">
                  <span className="mt-2 w-6 shrink-0 text-center text-sm text-muted-foreground">
                    {step.stepNumber}
                  </span>
                  <div className="flex flex-1 flex-col gap-2">
                    <p className="text-sm">{step.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Expected: {step.expectedResult === "pass" ? "Pass" : "Fail"}
                    </p>
                    <Select
                      value={step.actualResult}
                      onValueChange={value => updateStepResult(index, value as "pass" | "fail")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">Actual: Pass</SelectItem>
                        <SelectItem value="fail">Actual: Fail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCompleteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={completeMutation.isPending}>
                {completeMutation.isPending ? "Saving..." : "Mark as Completed"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
