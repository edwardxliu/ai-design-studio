import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "E:/workspace/nato-studio/副本【new】AI视觉生成平台功能矩阵_中(1).xlsx";
const outputPath = "E:/workspace/nato-studio/AI设计赛道/outputs/20260915_track_b_matrix_review/赛道B_AI视觉生成平台功能矩阵_含评审意见.xlsx";
const reopenedPreviewPath = "E:/workspace/nato-studio/AI设计赛道/tmp_spreadsheet_review/previews_after/Sheet1_reopened.png";

const [sourceBlob, outputBlob] = await Promise.all([
  FileBlob.load(sourcePath),
  FileBlob.load(outputPath),
]);
const [sourceWorkbook, outputWorkbook] = await Promise.all([
  SpreadsheetFile.importXlsx(sourceBlob),
  SpreadsheetFile.importXlsx(outputBlob),
]);

const sourceSheet = sourceWorkbook.worksheets.getItem("Sheet1");
const outputSheet = outputWorkbook.worksheets.getItem("Sheet1");
const sourceValues = sourceSheet.getRange("A1:E36").values;
const outputOriginalValues = outputSheet.getRange("A1:E36").values;
const sourceFormulas = sourceSheet.getRange("A1:E36").formulas;
const outputOriginalFormulas = outputSheet.getRange("A1:E36").formulas;
const reviewValues = outputSheet.getRange("F1:F36").values;

if (JSON.stringify(sourceValues) !== JSON.stringify(outputOriginalValues)) {
  throw new Error("Reopened output does not preserve original A1:E36 values");
}
if (JSON.stringify(sourceFormulas) !== JSON.stringify(outputOriginalFormulas)) {
  throw new Error("Reopened output does not preserve original A1:E36 formulas");
}
if (reviewValues[0]?.[0] !== "评审意见（需求与设计建议）") {
  throw new Error("Review column header is missing or incorrect");
}
const comments = reviewValues.slice(1).map((row) => row?.[0]);
if (comments.length !== 35 || comments.some((value) => typeof value !== "string" || value.trim().length < 30)) {
  throw new Error("Review column does not contain 35 substantive comments");
}

const summary = await outputWorkbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 6000,
  tableMaxRows: 4,
  tableMaxCols: 6,
  tableMaxCellChars: 80,
});
console.log("=== REOPENED SUMMARY ===");
console.log(summary.ndjson);

const styleCheck = await outputWorkbook.inspect({
  kind: "computedStyle",
  sheetId: "Sheet1",
  range: "F1:F36",
  maxChars: 30000,
});
console.log("=== REVIEW COLUMN STYLE CHECK ===");
console.log(styleCheck.ndjson);

const errors = await outputWorkbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 300 },
});
console.log("=== REOPENED FORMULA ERROR SCAN ===");
console.log(errors.ndjson);
if (!errors.ndjson.includes("matched 0 entries")) {
  throw new Error("Formula error scan returned unexpected matches");
}

const preview = await outputWorkbook.render({
  sheetName: "Sheet1",
  autoCrop: "all",
  scale: 1.1,
  format: "png",
});
await fs.writeFile(reopenedPreviewPath, new Uint8Array(await preview.arrayBuffer()));

console.log(JSON.stringify({
  outputPath,
  reopenedPreviewPath,
  preservedOriginalCells: 180,
  reviewRows: comments.length,
  minCommentLength: Math.min(...comments.map((value) => value.length)),
  maxCommentLength: Math.max(...comments.map((value) => value.length)),
}));
