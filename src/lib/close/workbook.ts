import { parseTable } from "./table";

export interface LoadedTable {
  fileName: string;
  rows: string[][];
  readable: boolean;
  detail?: string;
}

export async function tablesFromBuffer(data: ArrayBuffer | Buffer, fileName: string): Promise<LoadedTable[]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(data, { type: "array" });
  const tables: LoadedTable[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    }) as unknown[][];
    const rows = matrix
      .map((row) => row.map((cell) => String(cell ?? "").trim()))
      .filter((row) => row.some((cell) => cell !== ""));
    if (rows.length < 2) continue;
    const name = workbook.SheetNames.length > 1 ? `${fileName} · ${sheetName}` : fileName;
    tables.push({ fileName: name, rows, readable: true });
  }
  if (!tables.length) {
    return [
      {
        fileName,
        rows: [],
        readable: false,
        detail: `${fileName} had no readable rows. Amounts stay Missing.`,
      },
    ];
  }
  return tables;
}

export async function tablesFromFile(file: File): Promise<LoadedTable[]> {
  if (/\.(xlsx|xls)$/i.test(file.name)) {
    return tablesFromBuffer(await file.arrayBuffer(), file.name);
  }
  const textLike = /\.(csv|tsv|txt)$/i.test(file.name) || /csv|text|tab-separated/.test(file.type);
  if (textLike) {
    return [{ fileName: file.name, rows: parseTable(await file.text()), readable: true }];
  }
  const kind = /\.pdf$/i.test(file.name) ? "PDF" : "photo";
  return [
    {
      fileName: file.name,
      rows: [],
      readable: false,
      detail: `${file.name} is a ${kind}. Amounts stay Missing until the rows are CSV or Excel.`,
    },
  ];
}
