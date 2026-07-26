import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  equipmentTypes,
  preservationProcedures,
  maintenancePlans,
  materials,
  inventoryUnits,
  workOrders,
} from "../drizzle/schema";
import type {
  EquipmentType,
  InsertEquipmentType,
  PreservationProcedure,
  InsertPreservationProcedure,
  MaintenancePlan,
  InsertMaintenancePlan,
  Material,
  InsertMaterial,
  InventoryUnit,
  InsertInventoryUnit,
  WorkOrder,
  InsertWorkOrder,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required");
    }
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

// Preservation activation/closure (PRD section 5): entering stock opens a Work Order
// per active plan for the unit's equipment type; leaving stock closes any open ones.

async function activateEnteringInventoryUnits(tx: Tx, equipmentTypeId: number, unitIds: number[]) {
  if (unitIds.length === 0) return;

  const activePlans = await tx
    .select()
    .from(maintenancePlans)
    .where(and(eq(maintenancePlans.equipmentTypeId, equipmentTypeId), eq(maintenancePlans.active, true)));

  if (activePlans.length === 0) return;

  await tx.insert(workOrders).values(
    unitIds.flatMap(inventoryUnitId =>
      activePlans.map(plan => ({ planId: plan.id, inventoryUnitId, status: "open" as const }))
    )
  );
}

async function closeOpenWorkOrdersForUnit(tx: Tx, inventoryUnitId: number) {
  await tx
    .update(workOrders)
    .set({
      status: "completed",
      closedAt: new Date(),
      checklistResult: { note: "Automatically closed because the inventory unit left stock." },
    })
    .where(
      and(eq(workOrders.inventoryUnitId, inventoryUnitId), inArray(workOrders.status, ["open", "in_progress"]))
    );
}

// Equipment Types

export async function getEquipmentTypes(): Promise<EquipmentType[]> {
  return getDb().select().from(equipmentTypes).orderBy(equipmentTypes.id);
}

export async function getEquipmentTypeById(id: number): Promise<EquipmentType | null> {
  const result = await getDb().select().from(equipmentTypes).where(eq(equipmentTypes.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createEquipmentType(data: InsertEquipmentType): Promise<EquipmentType> {
  const result = await getDb().insert(equipmentTypes).values(data).$returningId();
  const created = await getEquipmentTypeById(result[0].id);
  if (!created) throw new Error("Failed to create equipment type");
  return created;
}

export async function updateEquipmentType(
  id: number,
  data: Partial<InsertEquipmentType>
): Promise<EquipmentType> {
  await getDb().update(equipmentTypes).set(data).where(eq(equipmentTypes.id, id));
  const updated = await getEquipmentTypeById(id);
  if (!updated) throw new Error("Equipment type not found");
  return updated;
}

export async function deleteEquipmentType(id: number): Promise<void> {
  await getDb().delete(equipmentTypes).where(eq(equipmentTypes.id, id));
}

// Preservation Procedures

export async function getPreservationProcedures(): Promise<PreservationProcedure[]> {
  return getDb().select().from(preservationProcedures).orderBy(preservationProcedures.id);
}

export async function getPreservationProcedureById(id: number): Promise<PreservationProcedure | null> {
  const result = await getDb()
    .select()
    .from(preservationProcedures)
    .where(eq(preservationProcedures.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createPreservationProcedure(
  data: InsertPreservationProcedure
): Promise<PreservationProcedure> {
  const result = await getDb().insert(preservationProcedures).values(data).$returningId();
  const created = await getPreservationProcedureById(result[0].id);
  if (!created) throw new Error("Failed to create preservation procedure");
  return created;
}

export async function updatePreservationProcedure(
  id: number,
  data: Partial<InsertPreservationProcedure>
): Promise<PreservationProcedure> {
  await getDb().update(preservationProcedures).set(data).where(eq(preservationProcedures.id, id));
  const updated = await getPreservationProcedureById(id);
  if (!updated) throw new Error("Preservation procedure not found");
  return updated;
}

export async function deletePreservationProcedure(id: number): Promise<void> {
  await getDb().delete(preservationProcedures).where(eq(preservationProcedures.id, id));
}

// Maintenance Plans

export async function getMaintenancePlans(): Promise<MaintenancePlan[]> {
  return getDb().select().from(maintenancePlans).orderBy(maintenancePlans.id);
}

export async function getMaintenancePlanById(id: number): Promise<MaintenancePlan | null> {
  const result = await getDb().select().from(maintenancePlans).where(eq(maintenancePlans.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createMaintenancePlan(data: InsertMaintenancePlan): Promise<MaintenancePlan> {
  const result = await getDb().insert(maintenancePlans).values(data).$returningId();
  const created = await getMaintenancePlanById(result[0].id);
  if (!created) throw new Error("Failed to create maintenance plan");
  return created;
}

export async function updateMaintenancePlan(
  id: number,
  data: Partial<InsertMaintenancePlan>
): Promise<MaintenancePlan> {
  await getDb().update(maintenancePlans).set(data).where(eq(maintenancePlans.id, id));
  const updated = await getMaintenancePlanById(id);
  if (!updated) throw new Error("Maintenance plan not found");
  return updated;
}

export async function deleteMaintenancePlan(id: number): Promise<void> {
  await getDb().delete(maintenancePlans).where(eq(maintenancePlans.id, id));
}

// Materials

export async function getMaterials(): Promise<Material[]> {
  return getDb().select().from(materials).orderBy(materials.id);
}

export async function getMaterialById(id: number): Promise<Material | null> {
  const result = await getDb().select().from(materials).where(eq(materials.id, id)).limit(1);
  return result[0] ?? null;
}

// Serials are seeded off the material's DB id (globally unique) rather than its
// user-entered business code, since inventoryUnits.serial has a unique constraint
// and the business code has no such guarantee. New units inherit the material's
// default storage bin and received date.
function buildInventoryUnitRows(
  materialId: number,
  count: number,
  startSeq: number,
  location: string | null,
  receivedDate: string | null
): InsertInventoryUnit[] {
  return Array.from({ length: count }, (_, i) => ({
    materialId,
    serial: `MAT-${materialId}-${String(startSeq + i).padStart(3, "0")}`,
    status: "available",
    location,
    receivedDate,
  }));
}

// preservable is never trusted from the client: it always mirrors the linked
// Equipment Type's preservable flag, resolved fresh on every write.
async function getEquipmentTypeOrThrow(tx: Tx, id: number): Promise<EquipmentType> {
  const rows = await tx.select().from(equipmentTypes).where(eq(equipmentTypes.id, id)).limit(1);
  const equipmentType = rows[0];
  if (!equipmentType) throw new Error("Equipment type not found");
  return equipmentType;
}

export async function createMaterial(data: InsertMaterial): Promise<Material> {
  return getDb().transaction(async tx => {
    const equipmentType = await getEquipmentTypeOrThrow(tx, data.equipmentTypeId);

    const result = await tx
      .insert(materials)
      .values({ ...data, preservable: equipmentType.preservable })
      .$returningId();
    const materialId = result[0].id;

    const quantity = data.quantity ?? 0;
    if (quantity > 0) {
      const insertedUnits = await tx
        .insert(inventoryUnits)
        .values(
          buildInventoryUnitRows(materialId, quantity, 1, data.defaultLocation ?? null, data.receivedDate ?? null)
        )
        .$returningId();
      await activateEnteringInventoryUnits(
        tx,
        data.equipmentTypeId,
        insertedUnits.map(u => u.id)
      );
    }

    const createdRows = await tx.select().from(materials).where(eq(materials.id, materialId)).limit(1);
    const created = createdRows[0];
    if (!created) throw new Error("Failed to create material");
    return created;
  });
}

export async function updateMaterial(id: number, data: Partial<InsertMaterial>): Promise<Material> {
  return getDb().transaction(async tx => {
    const existingRows = await tx.select().from(materials).where(eq(materials.id, id)).limit(1);
    const existingMaterial = existingRows[0];
    if (!existingMaterial) throw new Error("Material not found");

    const equipmentType = await getEquipmentTypeOrThrow(
      tx,
      data.equipmentTypeId ?? existingMaterial.equipmentTypeId
    );

    let existingCount = 0;
    if (data.quantity !== undefined) {
      const existingUnits = await tx
        .select({ id: inventoryUnits.id })
        .from(inventoryUnits)
        .where(eq(inventoryUnits.materialId, id));
      existingCount = existingUnits.length;
      if (data.quantity < existingCount) {
        throw new Error(
          `Cannot reduce quantity to ${data.quantity}: ${existingCount} inventory unit(s) already exist for this material. Remove units manually before reducing the quantity.`
        );
      }
    }

    await tx
      .update(materials)
      .set({ ...data, preservable: equipmentType.preservable })
      .where(eq(materials.id, id));

    const updatedRows = await tx.select().from(materials).where(eq(materials.id, id)).limit(1);
    const updated = updatedRows[0];
    if (!updated) throw new Error("Material not found");

    if (data.quantity !== undefined) {
      const toCreate = data.quantity - existingCount;
      if (toCreate > 0) {
        const insertedUnits = await tx
          .insert(inventoryUnits)
          .values(
            buildInventoryUnitRows(id, toCreate, existingCount + 1, updated.defaultLocation, updated.receivedDate)
          )
          .$returningId();
        await activateEnteringInventoryUnits(
          tx,
          updated.equipmentTypeId,
          insertedUnits.map(u => u.id)
        );
      }
    }

    return updated;
  });
}

export async function deleteMaterial(id: number): Promise<void> {
  await getDb().delete(materials).where(eq(materials.id, id));
}

// Inventory Units

export async function getInventoryUnits(): Promise<InventoryUnit[]> {
  return getDb().select().from(inventoryUnits).orderBy(inventoryUnits.id);
}

export async function getInventoryUnitById(id: number): Promise<InventoryUnit | null> {
  const result = await getDb().select().from(inventoryUnits).where(eq(inventoryUnits.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createInventoryUnit(data: InsertInventoryUnit): Promise<InventoryUnit> {
  return getDb().transaction(async tx => {
    const result = await tx.insert(inventoryUnits).values(data).$returningId();
    const unitId = result[0].id;

    if (data.status === "available") {
      const materialRows = await tx.select().from(materials).where(eq(materials.id, data.materialId)).limit(1);
      const material = materialRows[0];
      if (material) {
        await activateEnteringInventoryUnits(tx, material.equipmentTypeId, [unitId]);
      }
    }

    const createdRows = await tx.select().from(inventoryUnits).where(eq(inventoryUnits.id, unitId)).limit(1);
    const created = createdRows[0];
    if (!created) throw new Error("Failed to create inventory unit");
    return created;
  });
}

export async function updateInventoryUnit(
  id: number,
  data: Partial<InsertInventoryUnit>
): Promise<InventoryUnit> {
  return getDb().transaction(async tx => {
    const previousRows = await tx.select().from(inventoryUnits).where(eq(inventoryUnits.id, id)).limit(1);
    const previous = previousRows[0];
    if (!previous) throw new Error("Inventory unit not found");

    await tx.update(inventoryUnits).set(data).where(eq(inventoryUnits.id, id));

    if (data.status !== undefined && data.status !== previous.status) {
      if (data.status === "available") {
        const materialId = data.materialId ?? previous.materialId;
        const materialRows = await tx.select().from(materials).where(eq(materials.id, materialId)).limit(1);
        const material = materialRows[0];
        if (material) {
          await activateEnteringInventoryUnits(tx, material.equipmentTypeId, [id]);
        }
      } else if (data.status === "reserved" || data.status === "consumed") {
        await closeOpenWorkOrdersForUnit(tx, id);
      }
    }

    const updatedRows = await tx.select().from(inventoryUnits).where(eq(inventoryUnits.id, id)).limit(1);
    const updated = updatedRows[0];
    if (!updated) throw new Error("Inventory unit not found");
    return updated;
  });
}

export async function deleteInventoryUnit(id: number): Promise<void> {
  await getDb().delete(inventoryUnits).where(eq(inventoryUnits.id, id));
}

// Work Orders

export async function getWorkOrders(): Promise<WorkOrder[]> {
  return getDb().select().from(workOrders).orderBy(workOrders.id);
}

export async function getWorkOrderById(id: number): Promise<WorkOrder | null> {
  const result = await getDb().select().from(workOrders).where(eq(workOrders.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createWorkOrder(data: InsertWorkOrder): Promise<WorkOrder> {
  const result = await getDb().insert(workOrders).values(data).$returningId();
  const created = await getWorkOrderById(result[0].id);
  if (!created) throw new Error("Failed to create work order");
  return created;
}

export async function updateWorkOrder(id: number, data: Partial<InsertWorkOrder>): Promise<WorkOrder> {
  // Manual completion (via the Work Orders CRUD) needs closedAt populated too, since
  // Plans Overview classification relies on it — mirrors the automatic closure path.
  const patch = { ...data };
  if (patch.status === "completed" && patch.closedAt === undefined) {
    patch.closedAt = new Date();
  }

  await getDb().update(workOrders).set(patch).where(eq(workOrders.id, id));
  const updated = await getWorkOrderById(id);
  if (!updated) throw new Error("Work order not found");
  return updated;
}

export async function deleteWorkOrder(id: number): Promise<void> {
  await getDb().delete(workOrders).where(eq(workOrders.id, id));
}
