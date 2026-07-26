import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import type { MaintenancePlan } from "../../drizzle/schema";

type FormState = {
  equipmentTypeId: string;
  preservationProcedureId: string;
  interval: string;
  active: boolean;
};

const emptyForm: FormState = { equipmentTypeId: "", preservationProcedureId: "", interval: "", active: true };

export default function MaintenancePlans() {
  const utils = trpc.useUtils();
  const { data: plans = [], isLoading } = trpc.maintenancePlans.list.useQuery();
  const { data: equipmentTypes = [] } = trpc.equipmentTypes.list.useQuery();
  const { data: procedures = [] } = trpc.preservationProcedures.list.useQuery();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenancePlan | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const invalidate = () => utils.maintenancePlans.list.invalidate();

  const createMutation = trpc.maintenancePlans.create.useMutation({
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
  });
  const updateMutation = trpc.maintenancePlans.update.useMutation({
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
  });
  const deleteMutation = trpc.maintenancePlans.delete.useMutation({
    onSuccess: () => invalidate(),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item: MaintenancePlan) {
    setEditing(item);
    setForm({
      equipmentTypeId: String(item.equipmentTypeId),
      preservationProcedureId: String(item.preservationProcedureId),
      interval: String(item.interval),
      active: item.active,
    });
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      equipmentTypeId: Number(form.equipmentTypeId),
      preservationProcedureId: Number(form.preservationProcedureId),
      interval: Number(form.interval),
      active: form.active,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(item: MaintenancePlan) {
    if (confirm(`Excluir este plano de manutenção?`)) {
      deleteMutation.mutate({ id: item.id });
    }
  }

  function equipmentTypeName(id: number) {
    return equipmentTypes.find(e => e.id === id)?.name ?? `#${id}`;
  }

  function procedureName(id: number) {
    return procedures.find(p => p.id === id)?.name ?? `#${id}`;
  }

  const availableProcedures = form.equipmentTypeId
    ? procedures.filter(p => p.equipmentTypeId === Number(form.equipmentTypeId))
    : procedures;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Maintenance Plans"
        description="Planos de manutenção que agrupam procedimentos e periodicidade por equipamento."
      />
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus /> Novo Plano
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Equipamento</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Intervalo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum plano de manutenção cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {plans.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{equipmentTypeName(item.equipmentTypeId)}</TableCell>
                  <TableCell>{procedureName(item.preservationProcedureId)}</TableCell>
                  <TableCell>a cada {item.interval} dias</TableCell>
                  <TableCell>
                    <Badge variant={item.active ? "cyan" : "destructive"}>
                      {item.active ? "Ativo" : "Inativo"}
                    </Badge>
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
            <DialogTitle>{editing ? "Editar Plano de Manutenção" : "Novo Plano de Manutenção"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="equipmentTypeId">Tipo de Equipamento</Label>
              <Select
                value={form.equipmentTypeId}
                onValueChange={value =>
                  setForm({ ...form, equipmentTypeId: value, preservationProcedureId: "" })
                }
              >
                <SelectTrigger id="equipmentTypeId" className="w-full">
                  <SelectValue placeholder="Selecione um tipo de equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map(et => (
                    <SelectItem key={et.id} value={String(et.id)}>
                      {et.code} — {et.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="preservationProcedureId">Procedimento de Preservação</Label>
              <Select
                value={form.preservationProcedureId}
                onValueChange={value => setForm({ ...form, preservationProcedureId: value })}
                disabled={!form.equipmentTypeId}
              >
                <SelectTrigger id="preservationProcedureId" className="w-full">
                  <SelectValue placeholder="Selecione um procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {availableProcedures.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.equipmentTypeId && availableProcedures.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum procedimento cadastrado para este tipo de equipamento.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="interval">Intervalo (dias)</Label>
              <Input
                id="interval"
                type="number"
                min={1}
                value={form.interval}
                onChange={e => setForm({ ...form, interval: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="active"
                checked={form.active}
                onCheckedChange={checked => setForm({ ...form, active: checked === true })}
              />
              <Label htmlFor="active">Ativo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !form.equipmentTypeId || !form.preservationProcedureId}
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
