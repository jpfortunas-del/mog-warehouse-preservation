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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import type { EquipmentType } from "../../drizzle/schema";

type FormState = {
  name: string;
  code: string;
  preservable: boolean;
  description: string;
  active: boolean;
};

const emptyForm: FormState = { name: "", code: "", preservable: false, description: "", active: true };

export default function EquipmentTypes() {
  const utils = trpc.useUtils();
  const { data: equipmentTypes = [], isLoading } = trpc.equipmentTypes.list.useQuery();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentType | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const invalidate = () => utils.equipmentTypes.list.invalidate();

  const createMutation = trpc.equipmentTypes.create.useMutation({
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
  });
  const updateMutation = trpc.equipmentTypes.update.useMutation({
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
  });
  const deleteMutation = trpc.equipmentTypes.delete.useMutation({
    onSuccess: () => invalidate(),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item: EquipmentType) {
    setEditing(item);
    setForm({
      name: item.name,
      code: item.code,
      preservable: item.preservable,
      description: item.description ?? "",
      active: item.active,
    });
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      code: form.code,
      preservable: form.preservable,
      description: form.description || null,
      active: form.active,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(item: EquipmentType) {
    if (confirm(`Delete equipment type "${item.name}"?`)) {
      deleteMutation.mutate({ id: item.id });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Equipment Types"
        description="Equipment categories monitored in the warehouse preservation process."
      />
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus /> New Equipment Type
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Preservable</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && equipmentTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No equipment types registered.
                  </TableCell>
                </TableRow>
              )}
              {equipmentTypes.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.description || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={item.preservable ? "cyan" : "secondary"}>
                      {item.preservable ? "Yes" : "No"}
                    </Badge>
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
            <DialogTitle>{editing ? "Edit Equipment Type" : "New Equipment Type"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                required
              />
            </div>
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="preservable"
                checked={form.preservable}
                onCheckedChange={checked => setForm({ ...form, preservable: checked === true })}
              />
              <Label htmlFor="preservable">Preservable</Label>
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
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
