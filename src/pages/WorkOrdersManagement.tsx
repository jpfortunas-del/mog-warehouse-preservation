import { useState } from "react";
import { Plus } from "lucide-react";
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
import { WorkOrderDetailDialog } from "@/components/WorkOrderDetailDialog";
import type { AppRouter } from "../../server/routers";

type WorkOrder = inferRouterOutputs<AppRouter>["workOrders"]["list"][number];
type Status = WorkOrder["status"];

function formatIsoDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function isOverdue(wo: WorkOrder) {
  if (wo.status === "completed" || wo.status === "cancelled" || !wo.dueDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return wo.dueDate < today;
}

const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANT: Record<Status, "secondary" | "amber" | "green" | "navy"> = {
  open: "secondary",
  in_progress: "amber",
  completed: "green",
  cancelled: "navy",
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

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [detailItem, setDetailItem] = useState<WorkOrder | null>(null);

  const invalidate = () => utils.workOrders.list.invalidate();

  const createMutation = trpc.workOrders.create.useMutation({
    onSuccess: () => {
      invalidate();
      setCreateOpen(false);
    },
  });

  function openCreate() {
    setForm(emptyForm);
    setCreateOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      planId: Number(form.planId),
      inventoryUnitId: Number(form.inventoryUnitId),
      status: form.status,
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

  // "Management" covers everything that hasn't been fully closed out yet: pending work
  // (open/in_progress) plus cancelled orders, which still need a supervisor's attention
  // (e.g. rescheduling) even though the technician is done with them. Only completed orders
  // move exclusively to History; cancelled ones show in both, for follow-up and audit.
  const visibleWorkOrders = workOrders.filter(w => w.status !== "completed");

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
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
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
              {!isLoading && visibleWorkOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No work orders to show. Completed work orders are available in History.
                  </TableCell>
                </TableRow>
              )}
              {visibleWorkOrders.map(item => (
                <TableRow
                  key={item.id}
                  onClick={() => setDetailItem(item)}
                  className="cursor-pointer hover:bg-primary/5"
                >
                  <TableCell className="font-medium">{planLabel(item.planId)}</TableCell>
                  <TableCell>{inventoryUnitLabel(item.inventoryUnitId)}</TableCell>
                  <TableCell>{item.scheduledDate ? formatIsoDate(item.scheduledDate) : "—"}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Work Order</DialogTitle>
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
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !form.planId || !form.inventoryUnitId}>
                {createMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <WorkOrderDetailDialog
        open={detailItem !== null}
        onOpenChange={open => !open && setDetailItem(null)}
        workOrder={detailItem}
        onDeleted={() => setDetailItem(null)}
      />
    </div>
  );
}
