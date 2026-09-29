import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "E:/workspace/nato-studio/副本【new】AI视觉生成平台功能矩阵_中(1).xlsx";
const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("Sheet1");
const table = sheet.tables.getItemAt(0);
console.log(JSON.stringify({
  name: table?.name,
  range: table?.range?.address ?? null,
  style: table?.style,
  showHeaders: table?.showHeaders,
  showTotals: table?.showTotals,
  showBandedColumns: table?.showBandedColumns,
  showFilterButton: table?.showFilterButton,
}));
console.log(workbook.help("table resize range", { search: "table|resize|column", include: "index,examples,notes", maxChars: 7000 }).ndjson);
