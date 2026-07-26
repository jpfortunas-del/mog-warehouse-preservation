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
    if (confirm(`Delete procedure "${item.name}"?`)) {
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
        description="Standardized preservation procedures by equipment type."
      />
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus /> New Procedure
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Procedure</TableHead>
                <TableHead>Equipment Type</TableHead>
                <TableHead>Checklist</TableHead>
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
              {!isLoading && procedures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No procedures registered.
                  </TableCell>
                </TableRow>
              )}
              {procedures.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{equipmentTypeName(item.equipmentTypeId)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {Array.isArray(item.checklist) ? `${item.checklist.length} items` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.active ? "cyan" : "destructive"}>
                      {item.active ? "Active" : "Inactive"}
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
            <DialogTitle>{editing ? "Edit Procedure" : "New Procedure"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="equipmentTypeId">Equipment Type</Label>
              <Select
                value={form.equipmentTypeId}
                onValueChange={value => setForm({ ...form, equipmentTypeId: value })}
              >
                <SelectTrigger id="equipmentTypeId" className="w-full">
                  <SelectValue placeholder="Select an equipment type" />
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checklist">Checklist (one item per line)</Label>
              <Textarea
                id="checklist"
                value={form.checklist}
                onChange={e => setForm({ ...form, checklist: e.target.value })}
                placeholder={"Check sealing\nApply VCI film"}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="active"
                checked={form.active}
                onCheckedChange={checked => setForm({ ...form, active: checked === true })}
              />
              <Label htmlFor="active">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !form.equipmentTypeId}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
