import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import {
  getEquipmentTypes,
  createEquipmentType,
  updateEquipmentType,
  deleteEquipmentType,
  getPreservationProcedures,
  createPreservationProcedure,
  updatePreservationProcedure,
  deletePreservationProcedure,
  getMaintenancePlans,
  createMaintenancePlan,
  updateMaintenancePlan,
  deleteMaintenancePlan,
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getInventoryUnits,
  createInventoryUnit,
  updateInventoryUnit,
  deleteInventoryUnit,
  getWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  getUnitPlanAssignments,
  createManualAssignment,
  deactivateAssignment,
  hasOpenWorkOrderForAssignment,
} from "./db";

// Note: booleans intentionally have no zod .default() — with .partial() applied for
// update inputs, a default would overwrite the existing DB value whenever the client
// omits the field, instead of leaving it untouched.
const equipmentTypeInput = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  preservable: z.boolean(),
  description: z.string().optional().nullable(),
  active: z.boolean(),
});

const checklistStepInput = z.object({
  stepNumber: z.number().int().positive(),
  description: z.string().min(1, "Step description is required"),
  expectedResult: z.enum(["pass", "fail", "flag"]),
  expectedValue: z.string().optional(),
});

const preservationProcedureInput = z.object({
  name: z.string().min(1, "Name is required"),
  checklist: z.array(checklistStepInput).nullish(),
  description: z.string().optional().nullable(),
  equipmentTypeId: z.number().int().positive("Equipment type is required"),
  active: z.boolean(),
});

const maintenancePlanInput = z.object({
  equipmentTypeId: z.number().int().positive("Equipment type is required"),
  preservationProcedureId: z.number().int().positive("Procedure is required"),
  interval: z.number().int().positive("Interval must be greater than zero"),
  active: z.boolean(),
});

// preservable is intentionally not accepted from the client here: it's always
// derived from the linked Equipment Type (see createMaterial/updateMaterial).
const materialInput = z.object({
  materialId: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  quantity: z.number().int().nonnegative("Quantity cannot be negative"),
  equipmentTypeId: z.number().int().positive("Equipment type is required"),
  defaultLocation: z.string().optional().nullable(),
  receivedDate: z.string().optional().nullable(),
  active: z.boolean(),
});

const inventoryUnitInput = z.object({
  materialId: z.number().int().positive("Material is required"),
  serial: z.string().min(1, "Serial number is required"),
  status: z.enum(["available", "reserved", "consumed"]),
  location: z.string().optional().nullable(),
});

const checklistResultStepInput = checklistStepInput.extend({
  actualResult: z.enum(["pass", "fail", "flag"]),
  actualValue: z.string().optional(),
});

const checklistResultInput = z.object({
  note: z.string().optional(),
  steps: z.array(checklistResultStepInput).optional(),
});

const workOrderInput = z.object({
  planId: z.number().int().positive("Maintenance plan is required"),
  inventoryUnitId: z.number().int().positive("Inventory unit is required"),
  status: z.enum(["open", "in_progress", "completed"]),
  checklistResult: checklistResultInput.nullish(),
});

const createAssignmentInput = z.object({
  inventoryUnitId: z.number().int().positive("Inventory unit is required"),
  planId: z.number().int().positive("Maintenance plan is required"),
});

const deactivateAssignmentInput = z.object({
  id: z.number().int().positive(),
  cancelOpenWorkOrder: z.boolean(),
});

const assignmentLookupInput = z.object({
  inventoryUnitId: z.number().int().positive(),
  planId: z.number().int().positive(),
});

export const appRouter = router({
  equipmentTypes: router({
    list: publicProcedure.query(() => getEquipmentTypes()),

    create: publicProcedure.input(equipmentTypeInput).mutation(({ input }) => createEquipmentType(input)),

    update: publicProcedure
      .input(equipmentTypeInput.partial().extend({ id: z.number().int().positive() }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateEquipmentType(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => deleteEquipmentType(input.id)),
  }),

  preservationProcedures: router({
    list: publicProcedure.query(() => getPreservationProcedures()),

    create: publicProcedure
      .input(preservationProcedureInput)
      .mutation(({ input }) => createPreservationProcedure(input)),

    update: publicProcedure
      .input(preservationProcedureInput.partial().extend({ id: z.number().int().positive() }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updatePreservationProcedure(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => deletePreservationProcedure(input.id)),
  }),

  maintenancePlans: router({
    list: publicProcedure.query(() => getMaintenancePlans()),

    create: publicProcedure.input(maintenancePlanInput).mutation(({ input }) => createMaintenancePlan(input)),

    update: publicProcedure
      .input(maintenancePlanInput.partial().extend({ id: z.number().int().positive() }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateMaintenancePlan(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => deleteMaintenancePlan(input.id)),
  }),

  materials: router({
    list: publicProcedure.query(() => getMaterials()),

    create: publicProcedure.input(materialInput).mutation(({ input }) => createMaterial(input)),

    update: publicProcedure
      .input(materialInput.partial().extend({ id: z.number().int().positive() }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateMaterial(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => deleteMaterial(input.id)),
  }),

  inventoryUnits: router({
    list: publicProcedure.query(() => getInventoryUnits()),

    create: publicProcedure.input(inventoryUnitInput).mutation(({ input }) => createInventoryUnit(input)),

    update: publicProcedure
      .input(inventoryUnitInput.partial().extend({ id: z.number().int().positive() }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateInventoryUnit(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => deleteInventoryUnit(input.id)),
  }),

  workOrders: router({
    list: publicProcedure.query(() => getWorkOrders()),

    create: publicProcedure.input(workOrderInput).mutation(({ input }) => createWorkOrder(input)),

    update: publicProcedure
      .input(workOrderInput.partial().extend({ id: z.number().int().positive() }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateWorkOrder(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => deleteWorkOrder(input.id)),
  }),

  unitPlanAssignments: router({
    list: publicProcedure.query(() => getUnitPlanAssignments()),

    create: publicProcedure
      .input(createAssignmentInput)
      .mutation(({ input }) => createManualAssignment(input.inventoryUnitId, input.planId)),

    deactivate: publicProcedure
      .input(deactivateAssignmentInput)
      .mutation(({ input }) => deactivateAssignment(input.id, input.cancelOpenWorkOrder)),

    hasOpenWorkOrder: publicProcedure
      .input(assignmentLookupInput)
      .query(({ input }) => hasOpenWorkOrderForAssignment(input.inventoryUnitId, input.planId)),
  }),
});

export type AppRouter = typeof appRouter;
