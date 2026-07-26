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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../server/routers";

type InventoryUnit = inferRouterOutputs<AppRouter>["inventoryUnits"]["list"][number];
type Status = InventoryUnit["status"];

const STATUS_LABEL: Record<Status, string> = {
  available: "Disponível",
  reserved: "Reservado",
  consumed: "Consumido",
};

const STATUS_VARIANT: Record<Status, "cyan" | "default" | "destructive"> = {
  available: "cyan",
  reserved: "default",
  consumed: "destructive",
};

type FormState = {
  materialId: string;
  serial: string;
  status: Status;
  location: string;
};

const emptyForm: FormState = { materialId: "", serial: "", status: "available", location: "" };

export default function InventoryUnits() {
  const utils = trpc.useUtils();
  const { data: inventoryUnits = [], isLoading } = trpc.inventoryUnits.list.useQuery();
  const { data: materials = [] } = trpc.materials.list.useQuery();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryUnit | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const invalidate = () => utils.inventoryUnits.list.invalidate();

  const createMutation = trpc.inventoryUnits.create.useMutation({
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
  });
  const updateMutation = trpc.inventoryUnits.update.useMutation({
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
  });
  const deleteMutation = trpc.inventoryUnits.delete.useMutation({
    onSuccess: () => invalidate(),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item: InventoryUnit) {
    setEditing(item);
    setForm({
      materialId: String(item.materialId),
      serial: item.serial,
      status: item.status,
      location: item.location ?? "",
    });
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      materialId: Number(form.materialId),
      serial: form.serial,
      status: form.status,
      location: form.location || null,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(item: InventoryUnit) {
    if (confirm(`Excluir a unidade de inventário "${item.serial}"?`)) {
      deleteMutation.mutate({ id: item.id });
    }
  }

  function materialName(id: number) {
    const material = materials.find(m => m.id === id);
    return material ? `${material.materialId} — ${material.name}` : `#${id}`;
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Inventory Units"
        description="Unidades individuais rastreadas por número de série, localização e status de preservação."
      />
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus /> Nova Unidade
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número de Série</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Localização</TableHead>
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
              {!isLoading && inventoryUnits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma unidade de inventário cadastrada.
                  </TableCell>
                </TableRow>
              )}
              {inventoryUnits.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.serial}</TableCell>
                  <TableCell>{materialName(item.materialId)}</TableCell>
                  <TableCell className="text-muted-foreground">{item.location || "—"}</TableCell>
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
            <DialogTitle>{editing ? "Editar Unidade de Inventário" : "Nova Unidade de Inventário"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="materialId">Material</Label>
              <Select
                value={form.materialId}
                onValueChange={value => setForm({ ...form, materialId: value })}
              >
                <SelectTrigger id="materialId" className="w-full">
                  <SelectValue placeholder="Selecione um material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.materialId} — {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="serial">Número de Série</Label>
              <Input
                id="serial"
                value={form.serial}
                onChange={e => setForm({ ...form, serial: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
              />
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
              <Button type="submit" disabled={isSaving || !form.materialId}>
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
