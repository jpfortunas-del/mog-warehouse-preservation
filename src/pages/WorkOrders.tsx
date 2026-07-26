import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import { PageHeader } from "@/components/PageHeader";
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

type WorkOrder = inferRouterOutputs<AppRouter>["workOrders"]["list"][number];
type Status = WorkOrder["status"];

const STATUS_LABEL: Record<Status, string> = {
  open: "Aberta",
  in_progress: "Em Andamento",
  completed: "Concluída",
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

export default function WorkOrders() {
  const utils = trpc.useUtils();
  const { data: workOrders = [], isLoading } = trpc.workOrders.list.useQuery();
  const { data: maintenancePlans = [] } = trpc.maintenancePlans.list.useQuery();
  const { data: inventoryUnits = [] } = trpc.inventoryUnits.list.useQuery();
  const { data: equipmentTypes = [] } = trpc.equipmentTypes.list.useQuery();
  const { data: materials = [] } = trpc.materials.list.useQuery();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

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
    if (confirm(`Excluir esta ordem de serviço?`)) {
      deleteMutation.mutate({ id: item.id });
    }
  }

  function planLabel(id: number) {
    const plan = maintenancePlans.find(p => p.id === id);
    if (!plan) return `#${id}`;
    const equipmentType = equipmentTypes.find(e => e.id === plan.equipmentTypeId);
    return `Plano #${plan.id} — ${equipmentType?.name ?? `Tipo #${plan.equipmentTypeId}`}`;
  }

  function inventoryUnitLabel(id: number) {
    const unit = inventoryUnits.find(u => u.id === id);
    if (!unit) return `#${id}`;
    const material = materials.find(m => m.id === unit.materialId);
    return `${unit.serial} — ${material?.name ?? `Material #${unit.materialId}`}`;
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Work Orders"
        description="Ordens de serviço de preservação, manutenção preventiva e corretiva."
      />
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus /> Nova Ordem de Serviço
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano de Manutenção</TableHead>
                <TableHead>Unidade de Inventário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && workOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhuma ordem de serviço cadastrada.
                  </TableCell>
                </TableRow>
              )}
              {workOrders.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{planLabel(item.planId)}</TableCell>
                  <TableCell>{inventoryUnitLabel(item.inventoryUnitId)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
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
            <DialogTitle>{editing ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="planId">Plano de Manutenção</Label>
              <Select
                value={form.planId}
                onValueChange={value => setForm({ ...form, planId: value })}
              >
                <SelectTrigger id="planId" className="w-full">
                  <SelectValue placeholder="Selecione um plano de manutenção" />
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
              <Label htmlFor="inventoryUnitId">Unidade de Inventário</Label>
              <Select
                value={form.inventoryUnitId}
                onValueChange={value => setForm({ ...form, inventoryUnitId: value })}
              >
                <SelectTrigger id="inventoryUnitId" className="w-full">
                  <SelectValue placeholder="Selecione uma unidade de inventário" />
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
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !form.planId || !form.inventoryUnitId}
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
