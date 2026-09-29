import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "C:/Users/edward/Downloads/赛道B_AI视觉生成平台功能矩阵_含评审意见.xlsx";
const outputPath = "E:/workspace/nato-studio/AI设计赛道/outputs/20260916_track_b_risk_review/赛道B_AI视觉生成平台功能矩阵_含评审意见与风险.xlsx";
const reopenedPreviewPath = "E:/workspace/nato-studio/AI设计赛道/tmp_risk_review/previews_after/Sheet1_reopened.png";

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
if (JSON.stringify(sourceSheet.getRange("A1:F36").values) !== JSON.stringify(outputSheet.getRange("A1:F36").values)) {
  throw new Error("Reopened output does not preserve source values in A1:F36");
}
if (JSON.stringify(sourceSheet.getRange("A1:F36").formulas) !== JSON.stringify(outputSheet.getRange("A1:F36").formulas)) {
  throw new Error("Reopened output does not preserve source formulas in A1:F36");
}

const riskValues = outputSheet.getRange("G1:G36").values;
if (riskValues[0]?.[0] !== "风险分析（技术/业务/合规）") {
  throw new Error("Risk column header is missing or incorrect");
}
const risks = riskValues.slice(1).map((row) => row?.[0]);
if (risks.length !== 35 || risks.some((value) => typeof value !== "string" || value.trim().length < 40)) {
  throw new Error("Risk column does not contain 35 substantive descriptions");
}

const summary = await outputWorkbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 6000,
  tableMaxRows: 4,
  tableMaxCols: 7,
  tableMaxCellChars: 90,
});
console.log("=== REOPENED SUMMARY ===");
console.log(summary.ndjson);

const styleCheck = await outputWorkbook.inspect({
  kind: "computedStyle",
  sheetId: "Sheet1",
  range: "G1:G36",
  maxChars: 30000,
});
console.log("=== RISK COLUMN STYLE CHECK ===");
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
  scale: 1.0,
  format: "png",
});
await fs.writeFile(reopenedPreviewPath, new Uint8Array(await preview.arrayBuffer()));

console.log(JSON.stringify({
  outputPath,
  reopenedPreviewPath,
  preservedSourceCells: 216,
  riskRows: risks.length,
  minRiskLength: Math.min(...risks.map((value) => value.length)),
  maxRiskLength: Math.max(...risks.map((value) => value.length)),
}));
