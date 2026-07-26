import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
    if (confirm(`Delete this maintenance plan?`)) {
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
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus /> New Plan
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment Type</TableHead>
                <TableHead>Procedure</TableHead>
                <TableHead>Interval</TableHead>
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
              {!isLoading && plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No maintenance plans registered.
                  </TableCell>
                </TableRow>
              )}
              {plans.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{equipmentTypeName(item.equipmentTypeId)}</TableCell>
                  <TableCell>{procedureName(item.preservationProcedureId)}</TableCell>
                  <TableCell>every {item.interval} days</TableCell>
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
            <DialogTitle>{editing ? "Edit Maintenance Plan" : "New Maintenance Plan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="equipmentTypeId">Equipment Type</Label>
              <Select
                value={form.equipmentTypeId}
                onValueChange={value =>
                  setForm({ ...form, equipmentTypeId: value, preservationProcedureId: "" })
                }
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
              <Label htmlFor="preservationProcedureId">Preservation Procedure</Label>
              <Select
                value={form.preservationProcedureId}
                onValueChange={value => setForm({ ...form, preservationProcedureId: value })}
                disabled={!form.equipmentTypeId}
              >
                <SelectTrigger id="preservationProcedureId" className="w-full">
                  <SelectValue placeholder="Select a procedure" />
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
                  No procedures registered for this equipment type.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="interval">Interval (days)</Label>
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
              <Label htmlFor="active">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !form.equipmentTypeId || !form.preservationProcedureId}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
