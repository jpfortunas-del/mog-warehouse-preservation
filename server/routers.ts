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
} from "./db";

// Note: booleans intentionally have no zod .default() — with .partial() applied for
// update inputs, a default would overwrite the existing DB value whenever the client
// omits the field, instead of leaving it untouched.
const equipmentTypeInput = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  code: z.string().min(1, "Código é obrigatório"),
  preservable: z.boolean(),
  description: z.string().optional().nullable(),
  active: z.boolean(),
});

const preservationProcedureInput = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  checklist: z.array(z.string()).nullish(),
  description: z.string().optional().nullable(),
  equipmentTypeId: z.number().int().positive("Tipo de equipamento é obrigatório"),
  active: z.boolean(),
});

const maintenancePlanInput = z.object({
  equipmentTypeId: z.number().int().positive("Tipo de equipamento é obrigatório"),
  preservationProcedureId: z.number().int().positive("Procedimento é obrigatório"),
  interval: z.number().int().positive("Intervalo deve ser maior que zero"),
  active: z.boolean(),
});

const materialInput = z.object({
  materialId: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional().nullable(),
  quantity: z.number().int().nonnegative("Quantidade não pode ser negativa"),
  equipmentTypeId: z.number().int().positive("Tipo de equipamento é obrigatório"),
  preservable: z.boolean(),
  active: z.boolean(),
});

const inventoryUnitInput = z.object({
  materialId: z.number().int().positive("Material é obrigatório"),
  serial: z.string().min(1, "Número de série é obrigatório"),
  status: z.enum(["available", "reserved", "consumed"]),
  location: z.string().optional().nullable(),
});

const workOrderInput = z.object({
  planId: z.number().int().positive("Plano de manutenção é obrigatório"),
  inventoryUnitId: z.number().int().positive("Unidade de inventário é obrigatória"),
  status: z.enum(["open", "in_progress", "completed"]),
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
});

export type AppRouter = typeof appRouter;
