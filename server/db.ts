import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { equipmentTypes, preservationProcedures, maintenancePlans } from "../drizzle/schema";
import type {
  EquipmentType,
  InsertEquipmentType,
  PreservationProcedure,
  InsertPreservationProcedure,
  MaintenancePlan,
  InsertMaintenancePlan,
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
