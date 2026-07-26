import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
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
import type { ChecklistStep } from "../../drizzle/schema";

type StepFormState = {
  description: string;
  expectedResult: "pass" | "fail" | "flag";
  expectedValue: string;
};

type FormState = {
  name: string;
  equipmentTypeId: string;
  description: string;
  steps: StepFormState[];
  active: boolean;
};

const emptyForm: FormState = { name: "", equipmentTypeId: "", description: "", steps: [], active: true };

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
    const checklist = Array.isArray(item.checklist) ? (item.checklist as ChecklistStep[]) : [];
    setForm({
      name: item.name,
      equipmentTypeId: String(item.equipmentTypeId),
      description: item.description ?? "",
      steps: checklist
        .slice()
        .sort((a, b) => a.stepNumber - b.stepNumber)
        .map(step => ({
          description: step.description,
          expectedResult: step.expectedResult,
          expectedValue: step.expectedValue ?? "",
        })),
      active: item.active,
    });
    setOpen(true);
  }

  function addStep() {
    setForm(f => ({
      ...f,
      steps: [...f.steps, { description: "", expectedResult: "pass", expectedValue: "" }],
    }));
  }

  function removeStep(index: number) {
    setForm(f => ({ ...f, steps: f.steps.filter((_, i) => i !== index) }));
  }

  function moveStep(index: number, direction: -1 | 1) {
    setForm(f => {
      const target = index + direction;
      if (target < 0 || target >= f.steps.length) return f;
      const steps = f.steps.slice();
      [steps[index], steps[target]] = [steps[target], steps[index]];
      return { ...f, steps };
    });
  }

  function updateStep(index: number, patch: Partial<StepFormState>) {
    setForm(f => ({
      ...f,
      steps: f.steps.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const checklist: ChecklistStep[] = form.steps.map((step, i) => ({
      stepNumber: i + 1,
      description: step.description,
      expectedResult: step.expectedResult,
      expectedValue: step.expectedValue || undefined,
    }));
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
              <div className="flex items-center justify-between">
                <Label>Checklist Steps</Label>
                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                  <Plus /> Add Step
                </Button>
              </div>
              {form.steps.length === 0 && (
                <p className="text-sm text-muted-foreground">No steps added yet.</p>
              )}
              <div className="flex flex-col gap-2">
                {form.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2 rounded-md border p-2">
                    <span className="mt-2 w-6 shrink-0 text-center text-sm text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="flex flex-1 flex-col gap-2">
                      <Input
                        placeholder="Step description"
                        value={step.description}
                        onChange={e => updateStep(index, { description: e.target.value })}
                        required
                      />
                      <div className="flex gap-2">
                        <Select
                          value={step.expectedResult}
                          onValueChange={value =>
                            updateStep(index, { expectedResult: value as "pass" | "fail" | "flag" })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pass">Expected: Pass</SelectItem>
                            <SelectItem value="fail">Expected: Fail</SelectItem>
                            <SelectItem value="flag">Expected: Flag</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Expected value (optional)"
                          value={step.expectedValue}
                          onChange={e => updateStep(index, { expectedValue: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => moveStep(index, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === form.steps.length - 1}
                        onClick={() => moveStep(index, 1)}
                      >
                        <ArrowDown />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(index)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
