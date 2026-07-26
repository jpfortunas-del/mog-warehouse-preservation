import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { EquipmentTypeFormDialog } from "@/components/EquipmentTypeFormDialog";
import type { EquipmentType } from "../../drizzle/schema";

export default function EquipmentTypes() {
  const utils = trpc.useUtils();
  const { data: equipmentTypes = [], isLoading } = trpc.equipmentTypes.list.useQuery();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentType | null>(null);

  const deleteMutation = trpc.equipmentTypes.delete.useMutation({
    onSuccess: () => {
      utils.equipmentTypes.list.invalidate();
      setOpen(false);
    },
  });

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: EquipmentType) {
    setEditing(item);
    setOpen(true);
  }

  function handleDelete(item: EquipmentType) {
    if (confirm(`Delete equipment type "${item.name}"?`)) {
      deleteMutation.mutate({ id: item.id });
    }
  }

  return (
    <div>
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
                <TableHead>Keywords</TableHead>
                <TableHead>Preservable</TableHead>
                <TableHead>Status</TableHead>
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
                <TableRow
                  key={item.id}
                  onClick={() => openEdit(item)}
                  className="cursor-pointer hover:bg-primary/5"
                >
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.description || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {Array.isArray(item.keywords) && item.keywords.length > 0 ? item.keywords.join(", ") : "—"}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EquipmentTypeFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onDelete={handleDelete}
      />
    </div>
  );
}
