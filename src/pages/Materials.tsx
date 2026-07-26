import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
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
import type { Material } from "../../drizzle/schema";

type FormState = {
  materialId: string;
  name: string;
  description: string;
  quantity: string;
  equipmentTypeId: string;
  defaultLocation: string;
  receivedDate: string;
  active: boolean;
};

const emptyForm: FormState = {
  materialId: "",
  name: "",
  description: "",
  quantity: "0",
  equipmentTypeId: "",
  defaultLocation: "",
  receivedDate: "",
  active: true,
};

export default function Materials() {
  const utils = trpc.useUtils();
  const { data: materials = [], isLoading } = trpc.materials.list.useQuery();
  const { data: equipmentTypes = [] } = trpc.equipmentTypes.list.useQuery();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const invalidate = () => {
    utils.materials.list.invalidate();
    utils.inventoryUnits.list.invalidate();
  };

  const createMutation = trpc.materials.create.useMutation({
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
    onError: error => alert(error.message),
  });
  const updateMutation = trpc.materials.update.useMutation({
    onSuccess: () => {
      invalidate();
      setOpen(false);
    },
    onError: error => alert(error.message),
  });
  const deleteMutation = trpc.materials.delete.useMutation({
    onSuccess: () => invalidate(),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item: Material) {
    setEditing(item);
    setForm({
      materialId: item.materialId,
      name: item.name,
      description: item.description ?? "",
      quantity: String(item.quantity),
      equipmentTypeId: String(item.equipmentTypeId),
      defaultLocation: item.defaultLocation ?? "",
      receivedDate: item.receivedDate ?? "",
      active: item.active,
    });
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      materialId: form.materialId,
      name: form.name,
      description: form.description || null,
      quantity: Number(form.quantity),
      equipmentTypeId: Number(form.equipmentTypeId),
      defaultLocation: form.defaultLocation || null,
      receivedDate: form.receivedDate || null,
      active: form.active,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(item: Material) {
    if (confirm(`Delete material "${item.name}"?`)) {
      deleteMutation.mutate({ id: item.id });
    }
  }

  function equipmentType(id: number) {
    return equipmentTypes.find(e => e.id === id);
  }

  function equipmentTypeName(id: number) {
    return equipmentType(id)?.name ?? `#${id}`;
  }

  const selectedEquipmentType = form.equipmentTypeId ? equipmentType(Number(form.equipmentTypeId)) : undefined;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus /> New Material
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Equipment Type</TableHead>
                <TableHead>Qty.</TableHead>
                <TableHead>Storage Bin</TableHead>
                <TableHead>Preservable</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && materials.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No materials registered.
                  </TableCell>
                </TableRow>
              )}
              {materials.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.materialId}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{equipmentTypeName(item.equipmentTypeId)}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.defaultLocation ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.defaultLocation}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
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
            <DialogTitle>{editing ? "Edit Material" : "New Material"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="materialId">Code</Label>
              <Input
                id="materialId"
                value={form.materialId}
                onChange={e => setForm({ ...form, materialId: e.target.value })}
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
              <Label>Preservable</Label>
              <div>
                <Badge variant={selectedEquipmentType?.preservable ? "cyan" : "secondary"}>
                  {selectedEquipmentType ? (selectedEquipmentType.preservable ? "Yes" : "No") : "—"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Inherited from the selected equipment type.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="defaultLocation">Storage Bin</Label>
              <Input
                id="defaultLocation"
                value={form.defaultLocation}
                onChange={e => setForm({ ...form, defaultLocation: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receivedDate">GR Date</Label>
              <Input
                id="receivedDate"
                type="date"
                value={form.receivedDate}
                onChange={e => setForm({ ...form, receivedDate: e.target.value })}
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
