import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "C:/Users/edward/Downloads/赛道B_AI视觉生成平台功能矩阵_含评审意见.xlsx";
const previewDir = "E:/workspace/nato-studio/AI设计赛道/tmp_risk_review/previews_before";

await fs.mkdir(previewDir, { recursive: true });
const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);
const summary = await workbook.inspect({
  kind: "workbook,sheet,table,drawing,definedName",
  maxChars: 30000,
  tableMaxRows: 80,
  tableMaxCols: 10,
  tableMaxCellChars: 240,
});
console.log(summary.ndjson);

for (const sheet of workbook.worksheets.items) {
  const preview = await workbook.render({
    sheetName: sheet.name,
    autoCrop: "all",
    scale: 1.1,
    format: "png",
  });
  const safeName = sheet.name.replace(/[\\/:*?"<>|]/g, "_");
  await fs.writeFile(`${previewDir}/${safeName}.png`, new Uint8Array(await preview.arrayBuffer()));
}
