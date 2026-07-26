export type EquipmentType = {
  id: string;
  code: string;
  name: string;
  category: string;
  criticality: "Baixa" | "Média" | "Alta" | "Crítica";
};

export const equipmentTypes: EquipmentType[] = [
  { id: "ET-001", code: "ET-001", name: "Bomba Centrífuga", category: "Mecânico", criticality: "Alta" },
  { id: "ET-002", code: "ET-002", name: "Motor Elétrico Trifásico", category: "Elétrico", criticality: "Média" },
  { id: "ET-003", code: "ET-003", name: "Válvula de Segurança", category: "Instrumentação", criticality: "Crítica" },
  { id: "ET-004", code: "ET-004", name: "Painel de Controle", category: "Elétrico", criticality: "Alta" },
  { id: "ET-005", code: "ET-005", name: "Compressor de Ar", category: "Mecânico", criticality: "Média" },
  { id: "ET-006", code: "ET-006", name: "Sensor de Nível", category: "Instrumentação", criticality: "Baixa" },
];

export type PreservationProcedure = {
  id: string;
  code: string;
  name: string;
  equipmentType: string;
  method: string;
  frequencyDays: number;
};

export const preservationProcedures: PreservationProcedure[] = [
  { id: "PP-001", code: "PP-001", name: "Rotação de eixo e lubrificação", equipmentType: "Bomba Centrífuga", method: "Preservação dinâmica", frequencyDays: 30 },
  { id: "PP-002", code: "PP-002", name: "Megagem de isolamento", equipmentType: "Motor Elétrico Trifásico", method: "Inspeção elétrica", frequencyDays: 60 },
  { id: "PP-003", code: "PP-003", name: "Teste de acionamento", equipmentType: "Válvula de Segurança", method: "Preservação funcional", frequencyDays: 90 },
  { id: "PP-004", code: "PP-004", name: "Inspeção visual e limpeza de contatos", equipmentType: "Painel de Controle", method: "Preservação estática", frequencyDays: 45 },
  { id: "PP-005", code: "PP-005", name: "Verificação de pressão interna", equipmentType: "Compressor de Ar", method: "Preservação dinâmica", frequencyDays: 30 },
];

export type MaintenancePlan = {
  id: string;
  code: string;
  name: string;
  equipmentType: string;
  procedure: string;
  periodicity: string;
  status: "Ativo" | "Em revisão" | "Suspenso";
};

export const maintenancePlans: MaintenancePlan[] = [
  { id: "MP-001", code: "MP-001", name: "Plano Bombas Área Norte", equipmentType: "Bomba Centrífuga", procedure: "Rotação de eixo e lubrificação", periodicity: "Mensal", status: "Ativo" },
  { id: "MP-002", code: "MP-002", name: "Plano Motores Elétricos", equipmentType: "Motor Elétrico Trifásico", procedure: "Megagem de isolamento", periodicity: "Bimestral", status: "Ativo" },
  { id: "MP-003", code: "MP-003", name: "Plano Válvulas Críticas", equipmentType: "Válvula de Segurança", procedure: "Teste de acionamento", periodicity: "Trimestral", status: "Em revisão" },
  { id: "MP-004", code: "MP-004", name: "Plano Painéis Elétricos", equipmentType: "Painel de Controle", procedure: "Inspeção visual e limpeza de contatos", periodicity: "Mensal", status: "Suspenso" },
  { id: "MP-005", code: "MP-005", name: "Plano Compressores", equipmentType: "Compressor de Ar", procedure: "Verificação de pressão interna", periodicity: "Mensal", status: "Ativo" },
];

export type Material = {
  id: string;
  code: string;
  description: string;
  unit: string;
  stockQty: number;
};

export const materials: Material[] = [
  { id: "MAT-1001", code: "MAT-1001", description: "Graxa industrial NLGI 2", unit: "KG", stockQty: 120 },
  { id: "MAT-1002", code: "MAT-1002", description: "Óleo lubrificante ISO VG 68", unit: "L", stockQty: 340 },
  { id: "MAT-1003", code: "MAT-1003", description: "Rolamento SKF 6205", unit: "UN", stockQty: 18 },
  { id: "MAT-1004", code: "MAT-1004", description: "Junta de vedação viton", unit: "UN", stockQty: 56 },
  { id: "MAT-1005", code: "MAT-1005", description: "Filme VCI anticorrosivo", unit: "M", stockQty: 210 },
  { id: "MAT-1006", code: "MAT-1006", description: "Sílica gel desumidificante", unit: "KG", stockQty: 75 },
];

export type InventoryUnit = {
  id: string;
  serialNumber: string;
  material: string;
  location: string;
  status: "Preservado" | "Em uso" | "Vencido" | "Quarentena";
};

export const inventoryUnits: InventoryUnit[] = [
  { id: "IU-2001", serialNumber: "SN-88213", material: "Rolamento SKF 6205", location: "Warehouse A - Rack 12", status: "Preservado" },
  { id: "IU-2002", serialNumber: "SN-88214", material: "Rolamento SKF 6205", location: "Warehouse A - Rack 12", status: "Vencido" },
  { id: "IU-2003", serialNumber: "SN-77102", material: "Junta de vedação viton", location: "Warehouse B - Rack 03", status: "Em uso" },
  { id: "IU-2004", serialNumber: "SN-91045", material: "Filme VCI anticorrosivo", location: "Warehouse A - Rack 05", status: "Preservado" },
  { id: "IU-2005", serialNumber: "SN-65120", material: "Sílica gel desumidificante", location: "Warehouse C - Rack 01", status: "Quarentena" },
];

export type WorkOrder = {
  id: string;
  code: string;
  title: string;
  type: "Preventiva" | "Preservação" | "Corretiva";
  responsible: string;
  dueDate: string;
  status: "Agendada" | "Em andamento" | "Concluída" | "Atrasada";
};

export const workOrders: WorkOrder[] = [
  { id: "WO-3001", code: "WO-3001", title: "Preservação mensal - Bombas Área Norte", type: "Preservação", responsible: "Carlos Andrade", dueDate: "2026-08-05", status: "Agendada" },
  { id: "WO-3002", code: "WO-3002", title: "Inspeção elétrica - Motor M-114", type: "Preventiva", responsible: "Fernanda Lima", dueDate: "2026-07-20", status: "Atrasada" },
  { id: "WO-3003", code: "WO-3003", title: "Teste de válvula de alívio PSV-22", type: "Preventiva", responsible: "Marcos Vieira", dueDate: "2026-07-28", status: "Em andamento" },
  { id: "WO-3004", code: "WO-3004", title: "Troca de sílica gel - Warehouse C", type: "Preservação", responsible: "Juliana Reis", dueDate: "2026-07-15", status: "Concluída" },
  { id: "WO-3005", code: "WO-3005", title: "Reparo corretivo - Compressor CP-08", type: "Corretiva", responsible: "Carlos Andrade", dueDate: "2026-08-01", status: "Agendada" },
];
