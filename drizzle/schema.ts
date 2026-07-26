import {
  boolean,
  date,
  foreignKey,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const equipmentTypes = mysqlTable("equipment_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  preservable: boolean("preservable").notNull().default(false),
  description: text("description"),
  // Substring-matched (case-insensitive) against an imported material's name + description
  // to auto-suggest an Equipment Type during Material import (see TP#12).
  keywords: json("keywords").$type<string[]>(),
  active: boolean("active").notNull().default(true),
});

export type EquipmentType = typeof equipmentTypes.$inferSelect;
export type InsertEquipmentType = typeof equipmentTypes.$inferInsert;

export const preservationProcedures = mysqlTable("preservation_procedures", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  checklist: json("checklist").$type<ChecklistStep[]>(),
  description: text("description"),
  equipmentTypeId: int("equipment_type_id")
    .notNull()
    .references(() => equipmentTypes.id),
  active: boolean("active").notNull().default(true),
});

export type PreservationProcedure = typeof preservationProcedures.$inferSelect;
export type InsertPreservationProcedure = typeof preservationProcedures.$inferInsert;

// A single checklist step defined on a Preservation Procedure. expectedResult is the
// pass/fail/flag outcome the technician should expect when the step is executed correctly.
// expectedValue is an optional freeform reading the step expects (e.g. "more than 2mbar").
export type ChecklistStep = {
  stepNumber: number;
  description: string;
  expectedResult: "pass" | "fail" | "flag";
  expectedValue?: string;
};

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
  defaultLocation: varchar("default_location", { length: 255 }),
  receivedDate: date("received_date", { mode: "string" }),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

export const inventoryUnits = mysqlTable(
  "inventory_units",
  {
    id: int("id").autoincrement().primaryKey(),
    materialId: int("material_id")
      .notNull()
      .references(() => materials.id),
    // Sequential per material (see buildInventoryUnitRows in server/db.ts), not globally
    // unique, so uniqueness is enforced as the (materialId, serial) pair below.
    serial: varchar("serial", { length: 255 }).notNull(),
    status: mysqlEnum("status", ["available", "reserved", "consumed"]).notNull().default("available"),
    location: varchar("location", { length: 255 }),
    receivedDate: date("received_date", { mode: "string" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  table => [uniqueIndex("inventory_units_material_serial_unique").on(table.materialId, table.serial)]
);

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
  checklistResult: json("checklist_result").$type<WorkOrderChecklistResult>(),
  dueDate: date("due_date", { mode: "string" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = typeof workOrders.$inferInsert;

// Result of executing a Work Order's checklist. `note` covers freeform/automatic closure
// messages (e.g. "closed automatically - unit consumed"); `steps` mirrors the linked
// Procedure's checklist with the technician's actual pass/fail/flag and reading per step.
export type ChecklistResultStep = ChecklistStep & { actualResult: "pass" | "fail" | "flag"; actualValue?: string };
export type WorkOrderChecklistResult = {
  note?: string;
  steps?: ChecklistResultStep[];
};

export const unitPlanAssignments = mysqlTable(
  "unit_plan_assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    inventoryUnitId: int("inventory_unit_id").notNull(),
    planId: int("plan_id").notNull(),
    source: mysqlEnum("source", ["auto", "manual"]).notNull(),
    active: boolean("active").notNull().default(true),
    changedBy: varchar("changed_by", { length: 255 }),
    changedAt: timestamp("changed_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  table => [
    // Explicit short names: the auto-generated FK names would exceed MySQL/TiDB's
    // 64-char identifier limit once there are two FKs on this table.
    foreignKey({
      columns: [table.inventoryUnitId],
      foreignColumns: [inventoryUnits.id],
      name: "upa_unit_fk",
    }),
    foreignKey({
      columns: [table.planId],
      foreignColumns: [maintenancePlans.id],
      name: "upa_plan_fk",
    }),
  ],
);

export type UnitPlanAssignment = typeof unitPlanAssignments.$inferSelect;
export type InsertUnitPlanAssignment = typeof unitPlanAssignments.$inferInsert;
