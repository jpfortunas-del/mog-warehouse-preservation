import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import type { EquipmentType } from "../../drizzle/schema";

type FormState = {
  name: string;
  code: string;
  preservable: boolean;
  description: string;
  keywords: string[];
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  code: "",
  preservable: false,
  description: "",
  keywords: [],
  active: true,
};

export function EquipmentTypeFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: EquipmentType | null;
  onSaved?: (equipmentType: EquipmentType) => void;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        code: editing.code,
        preservable: editing.preservable,
        description: editing.description ?? "",
        keywords: Array.isArray(editing.keywords) ? editing.keywords : [],
        active: editing.active,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, editing]);

  const invalidate = () => utils.equipmentTypes.list.invalidate();

  const createMutation = trpc.equipmentTypes.create.useMutation({
    onSuccess: equipmentType => {
      invalidate();
      onOpenChange(false);
      onSaved?.(equipmentType);
    },
  });
  const updateMutation = trpc.equipmentTypes.update.useMutation({
    onSuccess: equipmentType => {
      invalidate();
      onOpenChange(false);
      onSaved?.(equipmentType);
    },
  });

  function addKeyword() {
    setForm(f => ({ ...f, keywords: [...f.keywords, ""] }));
  }

  function removeKeyword(index: number) {
    setForm(f => ({ ...f, keywords: f.keywords.filter((_, i) => i !== index) }));
  }

  function updateKeyword(index: number, value: string) {
    setForm(f => ({ ...f, keywords: f.keywords.map((k, i) => (i === index ? value : k)) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const keywords = form.keywords.map(k => k.trim()).filter(k => k.length > 0);
    const payload = {
      name: form.name,
      code: form.code,
      preservable: form.preservable,
      description: form.description || null,
      keywords: keywords.length > 0 ? keywords : null,
      active: form.active,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Equipment Type" : "New Equipment Type"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
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
              <Label className="text-primary font-semibold">Keywords</Label>
              <Button type="button" variant="outline" size="sm" onClick={addKeyword}>
                <Plus /> Add Keyword
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used to auto-suggest this Equipment Type when importing materials, by matching against the material's
              name and description.
            </p>
            {form.keywords.length === 0 && <p className="text-sm text-muted-foreground">No keywords added yet.</p>}
            <div className="flex flex-col gap-2">
              {form.keywords.map((keyword, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Keyword"
                    value={keyword}
                    onChange={e => updateKeyword(index, e.target.value)}
                    required
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeKeyword(index)}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
