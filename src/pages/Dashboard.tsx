import { Link } from "wouter";
import { AlertTriangle, Boxes, ClipboardList, Layers } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

function formatIsoDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// KPI tile: tinted background (~6-8% of the accent color) + a small solid icon tile above the
// number, per the "Field Ops" design direction (design_handoff_mog_warehouse).
function KpiTile({
  icon: Icon,
  tint,
  iconBg,
  value,
  valueClassName,
  label,
  labelClassName,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  iconBg: string;
  value: React.ReactNode;
  valueClassName?: string;
  label: string;
  labelClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg p-4.5" style={{ background: tint }}>
      <div
        className="mb-3.5 flex h-8.5 w-8.5 items-center justify-center rounded-[9px]"
        style={{ background: iconBg }}
      >
        <Icon className="h-4.5 w-4.5 text-white" />
      </div>
      <div className={`text-[30px] leading-none font-bold ${valueClassName ?? "text-modec-navy"}`}>{value}</div>
      <div className={`mt-1.5 text-xs font-medium ${labelClassName ?? "text-muted-foreground"}`}>{label}</div>
      {children}
    </div>
  );
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
    const openCount = openWorkOrders.filter(w => planEquipmentTypeById.get(w.planId) === et.id).length;
    const overdueCount = overdueWorkOrders.filter(w => planEquipmentTypeById.get(w.planId) === et.id).length;
    return { equipmentType: et, materialCount, unitCount, openCount, overdueCount };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Overview of materials, inventory units, and work orders."
        badge={<Badge variant="cyan">{formatIsoDate(today)}</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          icon={Boxes}
          tint="rgba(13,54,146,0.06)"
          iconBg="#0D3692"
          value={activeMaterials}
          label="Active Materials"
        />
        <KpiTile
          icon={Layers}
          tint="rgba(31,150,207,0.08)"
          iconBg="#1F96CF"
          value={inventoryUnits.length}
          label="Inventory Units"
        >
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Badge variant="cyan">{unitsByStatus.available} available</Badge>
            <Badge>{unitsByStatus.reserved} reserved</Badge>
            <Badge variant="secondary">{unitsByStatus.consumed} consumed</Badge>
          </div>
        </KpiTile>
        <KpiTile
          icon={ClipboardList}
          tint="#F4F5F7"
          iconBg="#5B6472"
          value={openWorkOrders.length}
          label="Open Work Orders"
        />
        <KpiTile
          icon={AlertTriangle}
          tint="rgba(252,25,33,0.07)"
          iconBg="#FC1921"
          value={overdueWorkOrders.length}
          valueClassName="text-destructive"
          label="Overdue Work Orders"
          labelClassName="text-destructive/80"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overdue Work Orders</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-0 p-1.5">
          {overdueWorkOrders.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No overdue work orders.</p>
          )}
          {overdueWorkOrders.map(item => (
            <Link
              key={item.id}
              href="/work-orders"
              className="flex items-center justify-between gap-3 rounded-md px-3 py-3 transition-colors last:border-0 hover:bg-primary/5 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-[#F4F5F7]"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="shrink-0 text-sm font-bold text-modec-navy">{planLabel(item.planId)}</span>
                <span className="truncate text-sm text-muted-foreground">{inventoryUnitLabel(item.inventoryUnitId)}</span>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="text-xs font-semibold text-destructive">
                  Due {item.dueDate ? formatIsoDate(item.dueDate) : "—"}
                </span>
                <Badge variant="destructive">Overdue</Badge>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Equipment Type</CardTitle>
        </CardHeader>
        <CardContent>
          {equipmentTypeRows.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No equipment types registered.</p>
          )}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {equipmentTypeRows.map(row => (
              <div key={row.equipmentType.id} className="rounded-lg bg-[#F4F5F7] p-4">
                <div className="text-sm font-bold text-modec-navy">{row.equipmentType.name}</div>
                <div className="mt-2.5 text-[11px] text-muted-foreground">
                  {row.materialCount} mat · {row.unitCount} un
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{row.openCount} open</Badge>
                  {row.overdueCount > 0 && <Badge variant="destructive">{row.overdueCount} overdue</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
