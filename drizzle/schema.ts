import { boolean, foreignKey, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const equipmentTypes = mysqlTable("equipment_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  preservable: boolean("preservable").notNull().default(false),
  description: text("description"),
  active: boolean("active").notNull().default(true),
});

export type EquipmentType = typeof equipmentTypes.$inferSelect;
export type InsertEquipmentType = typeof equipmentTypes.$inferInsert;

export const preservationProcedures = mysqlTable("preservation_procedures", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  checklist: json("checklist"),
  description: text("description"),
  equipmentTypeId: int("equipment_type_id")
    .notNull()
    .references(() => equipmentTypes.id),
  active: boolean("active").notNull().default(true),
});

export type PreservationProcedure = typeof preservationProcedures.$inferSelect;
export type InsertPreservationProcedure = typeof preservationProcedures.$inferInsert;

export const maintenancePlans = mysqlTable(
  "maintenance_plans",
  {
    id: int("id").autoincrement().primaryKey(),
    equipmentTypeId: int("equipment_type_id")
      .notNull()
      .references(() => equipmentTypes.id),
    preservationProcedureId: int("preservation_procedure_id").notNull(),
    interval: int("interval").notNull(),
    active: boolean("active").notNull().default(true),
  },
  (table) => [
    // Explicit short name: the auto-generated FK name exceeds MySQL/TiDB's 64-char identifier limit.
    foreignKey({
      columns: [table.preservationProcedureId],
      foreignColumns: [preservationProcedures.id],
      name: "maintenance_plans_procedure_fk",
    }),
  ],
);

export type MaintenancePlan = typeof maintenancePlans.$inferSelect;
export type InsertMaintenancePlan = typeof maintenancePlans.$inferInsert;

export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  materialId: varchar("material_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  quantity: int("quantity").notNull().default(0),
  equipmentTypeId: int("equipment_type_id")
    .notNull()
    .references(() => equipmentTypes.id),
  preservable: boolean("preservable").notNull().default(false),
  active: boolean("active").notNull().default(true),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

export const inventoryUnits = mysqlTable("inventory_units", {
  id: int("id").autoincrement().primaryKey(),
  materialId: int("material_id")
    .notNull()
    .references(() => materials.id),
  serial: varchar("serial", { length: 255 }).notNull().unique(),
  status: mysqlEnum("status", ["available", "reserved", "consumed"]).notNull().default("available"),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type InventoryUnit = typeof inventoryUnits.$inferSelect;
export type InsertInventoryUnit = typeof inventoryUnits.$inferInsert;

export const workOrders = mysqlTable("work_orders", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("plan_id")
    .notNull()
    .references(() => maintenancePlans.id),
  inventoryUnitId: int("inventory_unit_id")
    .notNull()
    .references(() => inventoryUnits.id),
  status: mysqlEnum("status", ["open", "in_progress", "completed"]).notNull().default("open"),
  checklistResult: json("checklist_result"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = typeof workOrders.$inferInsert;
