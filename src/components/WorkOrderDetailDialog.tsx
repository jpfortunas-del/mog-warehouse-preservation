import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../server/routers";
import type { ChecklistResultStep, ChecklistStep, WorkOrderChecklistResult } from "../../drizzle/schema";

type WorkOrder = inferRouterOutputs<AppRouter>["workOrders"]["list"][number];

const STATUS_LABEL: Record<WorkOrder["status"], string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANT: Record<WorkOrder["status"], "secondary" | "amber" | "green" | "navy"> = {
  open: "secondary",
  in_progress: "amber",
  completed: "green",
  cancelled: "navy",
};

const EXPECTED_RESULT_LABEL: Record<"pass" | "fail" | "flag", string> = {
  pass: "Pass",
  fail: "Fail",
  flag: "Flag",
};

function formatIsoDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function resultButtonClass(selected: boolean, kind: "pass" | "fail" | "flag") {
  const base = "h-11 flex-1 rounded-[10px] text-sm font-bold transition-colors";
  if (!selected) return `${base} bg-white text-muted-foreground hover:bg-white/70`;
  if (kind === "pass") return `${base} bg-emerald-600 text-white`;
  if (kind === "fail") return `${base} bg-destructive text-white`;
  return `${base} bg-amber-500 text-white`;
}

export function WorkOrderDetailDialog({
  open,
  onOpenChange,
  workOrder,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder | null;
  onDeleted?: () => void;
}) {
  const utils = trpc.useUtils();
  const { data: maintenancePlans = [] } = trpc.maintenancePlans.list.useQuery();
  const { data: procedures = [] } = trpc.preservationProcedures.list.useQuery();
  const { data: equipmentTypes = [] } = trpc.equipmentTypes.list.useQuery();
  const { data: inventoryUnits = [] } = trpc.inventoryUnits.list.useQuery();
  const { data: materials = [] } = trpc.materials.list.useQuery();

  const [scheduledDate, setScheduledDate] = useState("");
  const [comments, setComments] = useState("");
  const [stepResults, setStepResults] = useState<ChecklistResultStep[]>([]);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReasonText, setCancelReasonText] = useState("");
  const [pendingAction, setPendingAction] = useState<"save" | "complete" | "cancel" | null>(null);

  const plan = workOrder ? maintenancePlans.find(p => p.id === workOrder.planId) : undefined;
  const equipmentType = plan ? equipmentTypes.find(e => e.id === plan.equipmentTypeId) : undefined;
  const procedure = plan ? procedures.find(p => p.id === plan.preservationProcedureId) : undefined;
  const unit = workOrder ? inventoryUnits.find(u => u.id === workOrder.inventoryUnitId) : undefined;
  const material = unit ? materials.find(m => m.id === unit.materialId) : undefined;
  const checklistTemplate: ChecklistStep[] = Array.isArray(procedure?.checklist)
    ? (procedure.checklist as ChecklistStep[])
    : [];

  // Re-seed local form state whenever a (different) work order is opened. Every action below
  // closes the dialog on success, so this never needs to re-run mid-edit due to a background
  // refetch changing the `workOrder` reference.
  useEffect(() => {
    if (!open || !workOrder) return;
    setScheduledDate(workOrder.scheduledDate ?? "");
    setComments(workOrder.comments ?? "");
    const existingSteps = (workOrder.checklistResult as WorkOrderChecklistResult | null)?.steps;
    if (existingSteps && existingSteps.length > 0) {
      setStepResults(existingSteps);
    } else {
      setStepResults(
        checklistTemplate.map(step => ({ ...step, actualResult: step.expectedResult, actualValue: "" }))
      );
    }
    setShowCancelForm(false);
    setCancelReasonText("");
    setPendingAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workOrder?.id]);

  const updateMutation = trpc.workOrders.update.useMutation();
  const deleteMutation = trpc.workOrders.delete.useMutation({
    onSuccess: () => {
      utils.workOrders.list.invalidate();
      onDeleted?.();
      onOpenChange(false);
    },
  });

  function updateStepResult(index: number, actualResult: "pass" | "fail" | "flag") {
    setStepResults(results => results.map((r, i) => (i === index ? { ...r, actualResult } : r)));
  }

  function updateStepValue(index: number, actualValue: string) {
    setStepResults(results => results.map((r, i) => (i === index ? { ...r, actualValue } : r)));
  }

  function currentChecklistResult(): WorkOrderChecklistResult | null {
    return stepResults.length > 0
      ? { steps: stepResults.map(step => ({ ...step, actualValue: step.actualValue || undefined })) }
      : null;
  }

  function handleSave() {
    if (!workOrder) return;
    setPendingAction("save");
    updateMutation.mutate(
      {
        id: workOrder.id,
        scheduledDate: scheduledDate || null,
        comments: comments || null,
        checklistResult: currentChecklistResult(),
      },
      {
        onSuccess: () => {
          utils.workOrders.list.invalidate();
          onOpenChange(false);
        },
        onSettled: () => setPendingAction(null),
      }
    );
  }

  function handleComplete() {
    if (!workOrder) return;
    setPendingAction("complete");
    updateMutation.mutate(
      {
        id: workOrder.id,
        status: "completed",
        scheduledDate: scheduledDate || null,
        comments: comments || null,
        checklistResult: currentChecklistResult(),
      },
      {
        onSuccess: () => {
          utils.workOrders.list.invalidate();
          onOpenChange(false);
        },
        onSettled: () => setPendingAction(null),
      }
    );
  }

  function handleConfirmCancel() {
    if (!workOrder || !cancelReasonText.trim()) return;
    setPendingAction("cancel");
    updateMutation.mutate(
      {
        id: workOrder.id,
        status: "cancelled",
        cancelReason: cancelReasonText.trim(),
        scheduledDate: scheduledDate || null,
        comments: comments || null,
      },
      {
        onSuccess: () => {
          utils.workOrders.list.invalidate();
          onOpenChange(false);
        },
        onSettled: () => setPendingAction(null),
      }
    );
  }

  function handleDelete() {
    if (!workOrder) return;
    if (confirm("Delete this work order?")) {
      deleteMutation.mutate({ id: workOrder.id });
    }
  }

  const busy = pendingAction !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-4 overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Work Order</DialogTitle>
        </DialogHeader>

        {workOrder && (
          <>
            {/* Context — read-only identification of what's being preserved */}
            <div className="flex flex-col gap-2.5 rounded-[14px] bg-muted p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-lg font-bold text-modec-navy">
                  {equipmentType?.name ?? "Unknown Equipment Type"}
                </p>
                <Badge variant={STATUS_VARIANT[workOrder.status]}>{STATUS_LABEL[workOrder.status]}</Badge>
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Material</span>
                  <span className="font-semibold text-modec-navy">
                    {material ? `${material.materialId} — ${material.name}` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Inventory Unit</span>
                  <span className="font-semibold text-modec-navy">{unit?.serial ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Maintenance Plan</span>
                  <span className="font-semibold text-modec-navy">
                    {plan ? `Plan #${plan.id} — every ${plan.interval} days` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="font-bold text-destructive">
                    {workOrder.dueDate ? formatIsoDate(workOrder.dueDate) : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="flex flex-col gap-2 rounded-[14px] border border-primary/20 bg-primary/5 p-4">
              <Label htmlFor="scheduledDate" className="font-bold text-primary">
                Scheduled Date
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                className="h-12 rounded-[10px] border-none bg-white text-base"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
              />
            </div>

            {/* Checklist */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Checklist · {stepResults.length} steps
              </Label>
              {stepResults.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No checklist defined for this procedure. You can mark this work order as completed directly.
                </p>
              )}
              <div className="flex flex-col gap-3">
                {stepResults.map((step, index) => (
                  <div key={index} className="flex flex-col gap-2.5 rounded-[14px] bg-muted p-4">
                    <p className="text-sm font-semibold text-modec-navy">
                      {step.stepNumber}. {step.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expected: {EXPECTED_RESULT_LABEL[step.expectedResult]}
                      {step.expectedValue ? ` (${step.expectedValue})` : ""}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={resultButtonClass(step.actualResult === "pass", "pass")}
                        onClick={() => updateStepResult(index, "pass")}
                      >
                        Pass
                      </button>
                      <button
                        type="button"
                        className={resultButtonClass(step.actualResult === "fail", "fail")}
                        onClick={() => updateStepResult(index, "fail")}
                      >
                        Fail
                      </button>
                      <button
                        type="button"
                        className={resultButtonClass(step.actualResult === "flag", "flag")}
                        onClick={() => updateStepResult(index, "flag")}
                      >
                        Flag
                      </button>
                    </div>
                    <Input
                      placeholder="Actual value (optional)"
                      className="h-11 rounded-[10px] border-none bg-white text-base"
                      value={step.actualValue ?? ""}
                      onChange={e => updateStepValue(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="grid gap-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                className="min-h-24 rounded-xl border-none bg-muted text-base"
                placeholder="Notes about this preservation execution..."
                value={comments}
                onChange={e => setComments(e.target.value)}
              />
            </div>

            {/* Cancel Work Order — inline reveal, requires a justification */}
            {showCancelForm && (
              <div className="flex flex-col gap-2 rounded-[14px] border border-destructive/30 bg-destructive/5 p-4">
                <Label htmlFor="cancelReason" className="font-bold text-destructive">
                  Cancellation Reason (required)
                </Label>
                <Textarea
                  id="cancelReason"
                  className="min-h-20 rounded-xl border-none bg-white text-base"
                  placeholder="Why is this work order being cancelled?"
                  value={cancelReasonText}
                  onChange={e => setCancelReasonText(e.target.value)}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1 rounded-xl"
                    onClick={() => setShowCancelForm(false)}
                    disabled={busy}
                  >
                    Never mind
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-11 flex-1 rounded-xl"
                    onClick={handleConfirmCancel}
                    disabled={busy || !cancelReasonText.trim()}
                  >
                    {pendingAction === "cancel" ? "Cancelling..." : "Confirm Cancellation"}
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 border-t border-[#EAECF1] pt-4">
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  className="h-[52px] w-full rounded-xl border-[1.5px] border-destructive px-2 text-sm font-bold text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={() => setShowCancelForm(true)}
                  disabled={busy || showCancelForm}
                >
                  Cancel Work Order
                </Button>
                <Button
                  type="button"
                  className="h-[52px] w-full rounded-xl bg-primary px-2 text-sm font-bold hover:bg-primary/90"
                  onClick={handleComplete}
                  disabled={busy}
                >
                  {pendingAction === "complete" ? "Saving..." : "Mark as Completed"}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl text-base"
                onClick={handleSave}
                disabled={busy}
              >
                {pendingAction === "save" ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 self-center text-muted-foreground"
                onClick={handleDelete}
                disabled={busy}
              >
                <Trash2 /> Delete Work Order
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
