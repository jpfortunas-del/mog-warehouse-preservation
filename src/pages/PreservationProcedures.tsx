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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

type FormState = {
  name: string;
  equipmentTypeId: string;
  description: string;
  checklist: string;
  active: boolean;
};

const emptyForm: FormState = { name: "", equipmentTypeId: "", description: "", checklist: "", active: true };

export default function PreservationProcedures() {
  const utils = trpc.useUtils();
  const { data: procedures = [], isLoading } = trpc.preservationProcedures.list.useQuery();
  const { data: equipmentTypes = [] } = trpc.equipmentTypes.list.useQuery();
  type ProcedureRow = (typeof procedures)[number];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProcedureRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const invalidate = () => utils.preservationProcedures.list.invalidate();

  const createMutation = trpc.preservationProcedures.create.useMutation({
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
  });
  const updateMutation = trpc.preservationProcedures.update.useMutation({
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
  });
  const deleteMutation = trpc.preservationProcedures.delete.useMutation({
    onSuccess: () => invalidate(),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item: ProcedureRow) {
    setEditing(item);
    setForm({
      name: item.name,
      equipmentTypeId: String(item.equipmentTypeId),
      description: item.description ?? "",
      checklist: Array.isArray(item.checklist) ? (item.checklist as string[]).join("\n") : "",
      active: item.active,
    });
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const checklist = form.checklist
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);
    const payload = {
      name: form.name,
      equipmentTypeId: Number(form.equipmentTypeId),
      description: form.description || null,
      checklist: checklist.length > 0 ? checklist : null,
      active: form.active,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(item: ProcedureRow) {
    if (confirm(`Excluir o procedimento "${item.name}"?`)) {
      deleteMutation.mutate({ id: item.id });
    }
  }

  function equipmentTypeName(id: number) {
    return equipmentTypes.find(e => e.id === id)?.name ?? `#${id}`;
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Preservation Procedures"
        description="Procedimentos padronizados de preservação por tipo de equipamento."
      />
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus /> Novo Procedimento
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Procedimento</TableHead>
                <TableHead>Tipo de Equipamento</TableHead>
                <TableHead>Checklist</TableHead>
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
              {!isLoading && procedures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum procedimento cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {procedures.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{equipmentTypeName(item.equipmentTypeId)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {Array.isArray(item.checklist) ? `${item.checklist.length} itens` : "—"}
                  </TableCell>
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
            <DialogTitle>{editing ? "Editar Procedimento" : "Novo Procedimento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="equipmentTypeId">Tipo de Equipamento</Label>
              <Select
                value={form.equipmentTypeId}
                onValueChange={value => setForm({ ...form, equipmentTypeId: value })}
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
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checklist">Checklist (um item por linha)</Label>
              <Textarea
                id="checklist"
                value={form.checklist}
                onChange={e => setForm({ ...form, checklist: e.target.value })}
                placeholder={"Verificar vedação\nAplicar filme VCI"}
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
              <Button type="submit" disabled={isSaving || !form.equipmentTypeId}>
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
