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
});

export type AppRouter = typeof appRouter;
