import { Link } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

function formatIsoDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function Dashboard() {
  const { data: materials = [] } = trpc.materials.list.useQuery();
  const { data: inventoryUnits = [] } = trpc.inventoryUnits.list.useQuery();
  const { data: workOrders = [] } = trpc.workOrders.list.useQuery();
  const { data: equipmentTypes = [] } = trpc.equipmentTypes.list.useQuery();
  const { data: maintenancePlans = [] } = trpc.maintenancePlans.list.useQuery();

  const materialsById = new Map(materials.map(m => [m.id, m]));
  const planEquipmentTypeById = new Map(maintenancePlans.map(p => [p.id, p.equipmentTypeId]));
  const today = new Date().toISOString().slice(0, 10);

  const activeMaterials = materials.filter(m => m.active).length;

  const unitsByStatus = {
    available: inventoryUnits.filter(u => u.status === "available").length,
    reserved: inventoryUnits.filter(u => u.status === "reserved").length,
    consumed: inventoryUnits.filter(u => u.status === "consumed").length,
  };

  const openWorkOrders = workOrders.filter(w => w.status === "open" || w.status === "in_progress");
  const overdueWorkOrders = openWorkOrders
    .filter(w => w.dueDate && w.dueDate < today)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

  function inventoryUnitLabel(id: number) {
    const unit = inventoryUnits.find(u => u.id === id);
    if (!unit) return `#${id}`;
    const material = materialsById.get(unit.materialId);
    return `${unit.serial} — ${material?.name ?? `Material #${unit.materialId}`}`;
  }

  function planLabel(id: number) {
    const plan = maintenancePlans.find(p => p.id === id);
    if (!plan) return `#${id}`;
    const equipmentType = equipmentTypes.find(e => e.id === plan.equipmentTypeId);
    return `Plan #${plan.id} — ${equipmentType?.name ?? `Type #${plan.equipmentTypeId}`}`;
  }

  const equipmentTypeRows = equipmentTypes.map(et => {
    const materialCount = materials.filter(m => m.equipmentTypeId === et.id).length;
    const unitCount = inventoryUnits.filter(u => materialsById.get(u.materialId)?.equipmentTypeId === et.id).length;
    const openWorkOrderCount = openWorkOrders.filter(
      w => planEquipmentTypeById.get(w.planId) === et.id
    ).length;
    return { equipmentType: et, materialCount, unitCount, openWorkOrderCount };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Overview of materials, inventory units, and work orders."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Active Materials</CardDescription>
            <CardTitle className="text-3xl">{activeMaterials}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Inventory Units</CardDescription>
            <CardTitle className="text-3xl">{inventoryUnits.length}</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 pt-0 text-xs text-muted-foreground">
            <span>{unitsByStatus.available} available</span>
            <span>·</span>
            <span>{unitsByStatus.reserved} reserved</span>
            <span>·</span>
            <span>{unitsByStatus.consumed} consumed</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Open Work Orders</CardDescription>
            <CardTitle className="text-3xl">{openWorkOrders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Overdue Work Orders</CardDescription>
            <CardTitle className="text-3xl text-destructive">{overdueWorkOrders.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overdue Work Orders</CardTitle>
          <CardDescription>Open work orders past their due date, most overdue first.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Maintenance Plan</TableHead>
                <TableHead>Inventory Unit</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueWorkOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No overdue work orders.
                  </TableCell>
                </TableRow>
              )}
              {overdueWorkOrders.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{planLabel(item.planId)}</TableCell>
                  <TableCell>{inventoryUnitLabel(item.inventoryUnitId)}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{item.dueDate ? formatIsoDate(item.dueDate) : "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href="/work-orders" className="text-sm text-primary underline-offset-4 hover:underline">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Equipment Type</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment Type</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead>Inventory Units</TableHead>
                <TableHead>Open Work Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipmentTypeRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No equipment types registered.
                  </TableCell>
                </TableRow>
              )}
              {equipmentTypeRows.map(row => (
                <TableRow key={row.equipmentType.id}>
                  <TableCell className="font-medium">{row.equipmentType.name}</TableCell>
                  <TableCell>{row.materialCount}</TableCell>
                  <TableCell>{row.unitCount}</TableCell>
                  <TableCell>{row.openWorkOrderCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
