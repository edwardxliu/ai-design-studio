import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "E:/workspace/nato-studio/副本【new】AI视觉生成平台功能矩阵_中(1).xlsx";
const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);
const result = await workbook.inspect({
  kind: "computedStyle",
  sheetId: "Sheet1",
  range: "E1:E36",
  maxChars: 30000,
});
console.log(result.ndjson);
