import * as XLSX from "xlsx";

// A single row extracted from an uploaded Material import file (CSV or .xlsx), before any
// Equipment Type suggestion or user review — see TP#12. Column headers are matched
// case-insensitively against the aliases below, so minor header variations still parse.
export type ParsedMaterialRow = {
  material: string;
  description: string;
  storageBin: string | null;
  quantity: number;
  receivedDate: string | null;
};

const COLUMN_ALIASES = {
  material: ["material"],
  description: ["material description", "description"],
  storageBin: ["storage bin"],
  quantity: ["available stock", "quantity"],
  receivedDate: ["gr date", "received date"],
} as const;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

// Converts an Excel serial date (days since 1899-12-30) to an ISO YYYY-MM-DD string. Only hit
// when a date cell wasn't already resolved to a JS Date by `cellDates: true` (e.g. a numeric
// value pasted into a text-formatted cell).
function excelSerialToIso(serial: number): string {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().slice(0, 10);
}

function parseDateValue(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  if (typeof raw === "number") return excelSerialToIso(raw);

  const value = String(raw).trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const dmyMatch = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(value);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}

function findValue(byHeader: Map<string, unknown>, field: keyof typeof COLUMN_ALIASES): unknown {
  for (const alias of COLUMN_ALIASES[field]) {
    if (byHeader.has(alias)) return byHeader.get(alias);
  }
  return null;
}

// Parses an uploaded CSV or .xlsx file (base64-encoded, since there's no multipart upload
// middleware in this app) into raw material rows. XLSX.read auto-detects plain delimited text
// vs. the zip-based .xlsx format, so both extensions go through the same code path.
export function parseMaterialImportFile(base64Content: string): ParsedMaterialRow[] {
  const buffer = Buffer.from(base64Content, "base64");
  // `raw: true` stops SheetJS from "guessing" CSV date strings into (sometimes ambiguously
  // parsed, e.g. DD.MM vs MM.DD) Date objects — we want the exact original text so
  // parseDateValue's own DD.MM.YYYY/ISO rules are the only ones in play. Real .xlsx date cells
  // are unambiguous (stored as numeric serials with cell formatting) and still come through as
  // JS Date objects because of `cellDates: true`.
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true, raw: true });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  return rawRows
    .map(row => {
      const byHeader = new Map<string, unknown>();
      for (const [key, value] of Object.entries(row)) {
        byHeader.set(normalizeHeader(key), value);
      }

      const materialValue = findValue(byHeader, "material");
      const storageBinValue = findValue(byHeader, "storageBin");
      const quantityValue = findValue(byHeader, "quantity");

      return {
        material: materialValue !== null ? String(materialValue).trim() : "",
        description: (() => {
          const value = findValue(byHeader, "description");
          return value !== null ? String(value).trim() : "";
        })(),
        storageBin: storageBinValue !== null && storageBinValue !== "" ? String(storageBinValue).trim() : null,
        quantity: quantityValue !== null && quantityValue !== "" ? Math.max(0, Math.round(Number(quantityValue))) : 0,
        receivedDate: parseDateValue(findValue(byHeader, "receivedDate")),
      };
    })
    .filter(row => row.material !== "");
}
