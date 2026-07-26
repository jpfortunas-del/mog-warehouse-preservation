export type EquipmentTypeMatchStatus = "auto" | "ambiguous" | "none";

export type EquipmentTypeMatchResult = {
  matchedIds: number[];
  status: EquipmentTypeMatchStatus;
};

// Suggests an Equipment Type for an imported material by checking whether any of an active
// Equipment Type's keywords appear (case-insensitive substring) in the material's name or
// description — the only two free-text fields available on an imported row (see TP#12).
export function matchEquipmentTypes(
  material: { name: string; description: string | null },
  equipmentTypes: { id: number; active: boolean; keywords: unknown }[]
): EquipmentTypeMatchResult {
  const haystack = `${material.name} ${material.description ?? ""}`.toLowerCase();

  const matchedIds = equipmentTypes
    .filter(et => {
      if (!et.active || !Array.isArray(et.keywords)) return false;
      return (et.keywords as unknown[]).some(
        keyword => typeof keyword === "string" && keyword.trim() !== "" && haystack.includes(keyword.toLowerCase())
      );
    })
    .map(et => et.id);

  if (matchedIds.length === 0) return { matchedIds, status: "none" };
  if (matchedIds.length === 1) return { matchedIds, status: "auto" };
  return { matchedIds, status: "ambiguous" };
}
