import { useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, HelpCircle, Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { matchEquipmentTypes, type EquipmentTypeMatchStatus } from "@/lib/materialImportMatch";
import { EquipmentTypeFormDialog } from "@/components/EquipmentTypeFormDialog";
import type { ParsedMaterialRow } from "../../server/materialImport";

type ReviewRow = ParsedMaterialRow & {
  key: number;
  equipmentTypeId: string;
  matchStatus: EquipmentTypeMatchStatus;
  matchedIds: number[];
  include: boolean;
};

const MATCH_BADGE: Record<EquipmentTypeMatchStatus, { label: string; variant: "cyan" | "amber" | "secondary" }> = {
  auto: { label: "Auto-matched", variant: "cyan" },
  ambiguous: { label: "Ambiguous", variant: "amber" },
  none: { label: "No suggestion", variant: "secondary" },
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(arrayBufferToBase64(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export default function MaterialImport() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: equipmentTypes = [] } = trpc.equipmentTypes.list.useQuery();

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [newEquipmentTypeOpen, setNewEquipmentTypeOpen] = useState(false);

  const parseMutation = trpc.materialImport.parseFile.useMutation();
  const createMaterialMutation = trpc.materials.create.useMutation();

  function buildReviewRows(parsed: ParsedMaterialRow[]): ReviewRow[] {
    return parsed.map((row, index) => {
      const { matchedIds, status } = matchEquipmentTypes(
        { name: row.description, description: row.description },
        equipmentTypes
      );
      return {
        ...row,
        key: index,
        equipmentTypeId: matchedIds.length > 0 ? String(matchedIds[0]) : "",
        matchStatus: status,
        matchedIds,
        include: true,
      };
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileName(file.name);
    const content = await readFileAsBase64(file);
    parseMutation.mutate(
      { content },
      {
        onSuccess: parsed => setRows(buildReviewRows(parsed)),
        onError: error => alert(error.message),
      }
    );
  }

  function updateRow(key: number, patch: Partial<ReviewRow>) {
    setRows(current => current.map(row => (row.key === key ? { ...row, ...patch } : row)));
  }

  function equipmentTypeName(id: number) {
    return equipmentTypes.find(et => et.id === id)?.name ?? `#${id}`;
  }

  const includedRows = rows.filter(row => row.include);
  const missingEquipmentType = includedRows.some(row => !row.equipmentTypeId);

  async function handleConfirmImport() {
    setIsImporting(true);
    const errors: string[] = [];
    let importedCount = 0;

    for (const row of includedRows) {
      if (!row.equipmentTypeId) continue;
      try {
        await createMaterialMutation.mutateAsync({
          materialId: row.material,
          name: row.description,
          description: row.description,
          quantity: row.quantity,
          equipmentTypeId: Number(row.equipmentTypeId),
          defaultLocation: row.storageBin,
          receivedDate: row.receivedDate,
          active: true,
        });
        importedCount += 1;
      } catch (error) {
        errors.push(`${row.material}: ${error instanceof Error ? error.message : "Failed to import"}`);
      }
    }

    setIsImporting(false);
    utils.materials.list.invalidate();
    utils.inventoryUnits.list.invalidate();

    if (errors.length > 0) {
      alert(`Imported ${importedCount} of ${includedRows.length} material(s). Errors:\n${errors.join("\n")}`);
    } else {
      alert(`Successfully imported ${importedCount} material(s).`);
      navigate("/parts");
    }
  }

  return (
    <div>
      <PageHeader
        title="Import Materials"
        description="Upload a CSV or Excel file to bulk-create materials, with automatic Equipment Type suggestions."
      />

      <Card className="mb-6">
        <CardContent className="flex items-center gap-4">
          <Button asChild variant="outline">
            <label className="cursor-pointer">
              <Upload /> Choose File
              <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileChange} />
            </label>
          </Button>
          <span className="text-sm text-muted-foreground">
            {fileName || "No file selected. Expected columns: Material, Material Description, Storage Bin, Available stock, GR Date."}
          </span>
          {parseMutation.isPending && <span className="text-sm text-muted-foreground">Parsing...</span>}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {rows.length} material(s) found. {includedRows.length} selected for import.
            </p>
            <Button variant="outline" size="sm" onClick={() => setNewEquipmentTypeOpen(true)}>
              <Plus /> New Equipment Type
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Storage Bin</TableHead>
                    <TableHead>Qty.</TableHead>
                    <TableHead>GR Date</TableHead>
                    <TableHead>Equipment Type</TableHead>
                    <TableHead>Match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(row => {
                    const badge = MATCH_BADGE[row.matchStatus];
                    return (
                      <TableRow key={row.key} className={row.include ? undefined : "opacity-50"}>
                        <TableCell>
                          <Checkbox
                            checked={row.include}
                            onCheckedChange={checked => updateRow(row.key, { include: checked === true })}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{row.material}</TableCell>
                        <TableCell className="text-muted-foreground">{row.description || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{row.storageBin || "—"}</TableCell>
                        <TableCell>{row.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{row.receivedDate || "—"}</TableCell>
                        <TableCell>
                          <Select
                            value={row.equipmentTypeId}
                            onValueChange={value => updateRow(row.key, { equipmentTypeId: value })}
                          >
                            <SelectTrigger className="w-[220px]">
                              <SelectValue placeholder="Select an equipment type" />
                            </SelectTrigger>
                            <SelectContent>
                              {equipmentTypes
                                .filter(et => et.active)
                                .map(et => (
                                  <SelectItem key={et.id} value={String(et.id)}>
                                    {et.code} — {et.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={badge.variant} className="w-fit">
                              {row.matchStatus === "auto" && <CheckCircle2 />}
                              {row.matchStatus === "ambiguous" && <HelpCircle />}
                              {badge.label}
                            </Badge>
                            {row.matchStatus === "ambiguous" && (
                              <span className="text-xs text-muted-foreground">
                                Also matched: {row.matchedIds.slice(1).map(equipmentTypeName).join(", ")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mt-6 flex items-center justify-end gap-3">
            {missingEquipmentType && (
              <span className="text-sm text-destructive">
                Select an Equipment Type for every material marked for import.
              </span>
            )}
            <Button variant="outline" onClick={() => navigate("/parts")}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={isImporting || includedRows.length === 0 || missingEquipmentType}
            >
              {isImporting ? "Importing..." : `Confirm Import (${includedRows.length})`}
            </Button>
          </div>
        </>
      )}

      <EquipmentTypeFormDialog open={newEquipmentTypeOpen} onOpenChange={setNewEquipmentTypeOpen} editing={null} />
    </div>
  );
}
