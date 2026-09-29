import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "E:/workspace/nato-studio/副本【new】AI视觉生成平台功能矩阵_中(1).xlsx";
const previewDir = "E:/workspace/nato-studio/AI设计赛道/tmp_spreadsheet_review/previews_before";

await fs.mkdir(previewDir, { recursive: true });
const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table,drawing,definedName",
  maxChars: 12000,
  tableMaxRows: 8,
  tableMaxCols: 12,
  tableMaxCellChars: 120,
});
console.log("=== SUMMARY ===");
console.log(summary.ndjson);

const sheets = workbook.worksheets.items;
console.log("=== SHEETS ===");
for (const sheet of sheets) {
  const used = sheet.getUsedRange();
  console.log(JSON.stringify({
    name: sheet.name,
    sheetId: sheet.sheetId,
    usedAddress: used?.address ?? null,
    rowCount: used?.rowCount ?? null,
    columnCount: used?.columnCount ?? null,
  }));

  if (used) {
    const region = await workbook.inspect({
      kind: "region",
      sheetId: sheet.name,
      range: used.address,
      maxChars: 16000,
      tableMaxRows: 80,
      tableMaxCols: 20,
      tableMaxCellChars: 200,
    });
    console.log(`=== REGION ${sheet.name} ===`);
    console.log(region.ndjson);
  }

  const preview = await workbook.render({
    sheetName: sheet.name,
    autoCrop: "all",
    scale: 1.25,
    format: "png",
  });
  const safeName = sheet.name.replace(/[\\/:*?"<>|]/g, "_");
  await fs.writeFile(`${previewDir}/${safeName}.png`, new Uint8Array(await preview.arrayBuffer()));
}
