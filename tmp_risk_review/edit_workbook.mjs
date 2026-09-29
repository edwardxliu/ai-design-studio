import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "C:/Users/edward/Downloads/赛道B_AI视觉生成平台功能矩阵_含评审意见.xlsx";
const outputDir = "E:/workspace/nato-studio/AI设计赛道/outputs/20260916_track_b_risk_review";
const outputPath = `${outputDir}/赛道B_AI视觉生成平台功能矩阵_含评审意见与风险.xlsx`;
const previewPath = "E:/workspace/nato-studio/AI设计赛道/tmp_risk_review/previews_after/Sheet1.png";

const risks = [
  "主要风险是透明、反光、细线和复杂边缘容易漏抠或吃掉主体；不同分辨率下结果波动会造成大量人工返修，若批量误判还会污染后续全部素材。",
  "AI 自动优化可能改变产品真实颜色和材质，导致 SKU 与实物不一致；不同屏幕、色彩空间和批次间也可能产生偏色，影响品牌与电商合规。",
  "自动裁剪可能截断 Logo、卖点或接口，生成式扩图可能出现重复纹理和错误背景；平台规格更新后模板失效会导致批量返工。",
  "重绘区域可能生成不存在的结构、模糊纹理或误删铭牌；遮罩边界和大面积修补稳定性不足，若无版本回退，错误难以恢复。",
  "变体生成容易发生结构、配色、Logo 和文字漂移，形成不存在的 SKU 或误导性产品图；批量一致性差时审核成本会快速上升。",
  "单图无法真实还原背面和侧面，模型会臆造不可见结构；拍摄视角、距离、镜头畸变和分辨率不一致会进一步放大多角度结构漂移。",
  "历史效果已显示小贴纸、内部表面、反光和透视位置不稳定；即使换用 Image-2，仍存在文字失真、边缘融合失败和新版本回归风险，需要重新基准测试。",
  "自动适配可能破坏视觉层级、遮挡核心卖点或造成文字溢出；不同平台安全区和规范持续变化，模板维护不到位会批量产出不合规素材。",
  "单张低质图重建容易虚构结构和材质，重打光也可能改变产品真实外观；高保真模式对输入和算力要求高，交付时长及人工复核可能失控。",
  "素材库若缺少版权、有效期、版本和标签治理，会出现误用、重复、过期或无法追溯；本地存储还面临容量、备份和多人编辑冲突。",
  "产品与场景的尺度、透视、遮挡、光向和接触阴影可能不一致；参考图质量差或场景过于复杂时，产品结构及品牌元素也可能被模型改写。",
  "需求和建议仍未定义完整，缺少目标产品、替换范围和验收口径；继续开发容易造成范围蔓延、估期失真及最终结果无法验收。",
  "自动透视可能扭曲产品比例或接口位置，细节增强可能凭空添加结构；与光影合成功能边界不清还会造成重复建设和责任不明确。",
  "光源估计和材质反射判断不准会让产品更假；评分阈值尚未标定且属于新能力，可能出现高分假图、低分好图和反复返修。",
  "风格迁移可能同时改变产品颜色、结构、Logo 和文案，迁移强度难以跨图一致；参考风格可能涉及版权，模型升级也会导致结果不可复现。",
  "风格档案的描述具有主观性，跨品类复用时可能失真；参考图授权、模型版本变化和提示词漂移会使同一档案无法稳定重现。",
  "品牌调性区间若定义不清，会把正常差异误判为问题；批量清洗可能改变产品真实色和材质，一次错误规则会大规模污染存量素材。",
  "审美指标难以完全量化，聚类和阈值容易产生误报或漏报；自动返修可能把离群但正确的创意改坏，并造成审核责任不清。",
  "与风格迁移功能重复会造成入口、数据和规则冲突；视觉 DNA 缺少可验证定义，若直接训练或沉淀参考图还存在版权和敏感品牌资产泄露风险。",
  "未经审批或已过期的风格包可能被继续使用，造成品牌不一致；权限、版本、适用品类和回滚管理不足时，很难追溯具体产出所用标准。",
  "缺少 3D/CAD 时，PBR 承诺难以兑现；材质学习可能把金属、玻璃等质感做错，且渲染成本、延迟和硬件依赖可能超出演示及量产预算。",
  "人物属性替换涉及偏见、刻板印象、肖像权和授权范围等高敏感风险；还可能出现面部、手部、肤色和遮挡错误，带来品牌与合规事故。",
  "OCR、翻译和图片内文字重绘均可能出错，尤其是阿拉伯语等 RTL 语言；字体授权、法律文案和版式溢出问题可能让素材无法直接发布。",
  "地域风格包可能强化刻板印象或触犯当地文化禁忌；场景变化也可能破坏品牌调性和产品真实性，且每个市场都需额外审核维护。",
  "生成的气流、热传导等技术表现可能不符合真实原理，形成虚假宣传；层级素材不足时还会出现结构漂移、路径错误和文字不准确。",
  "视频扩散对复杂开门、抽拉等动作容易出现时序漂移、部件穿模和标识变形；定制成本高、生成耗时不稳定，现场演示失败概率较高。",
  "单图或少量视图生成环绕视频会臆造背面结构，并出现闪烁、Logo 漂移和材质变化；多角度输入不足时很难达到商品展示标准。",
  "光照变化可能连带改变场景几何和产品外观，视频中易出现闪烁和不连续；为非核心能力投入较多算力和调试时间，可能挤占主链路资源。",
  "逐帧跟踪在遮挡、快速运动和镜头切换时容易失效，造成闪烁、穿帮和身份漂移；算力、时长、肖像授权和人工修正成本都很高。",
  "参数来源、单位或映射规则错误会生成不真实卖点，形成误导宣传；参数版本不同步或模型过度解释还会导致同一 SKU 输出不一致。",
  "竞品数据可能过期、口径不一或未经授权，自动对比容易形成虚假或贬损性宣传；模板和数据无人负责会导致长期维护失效和法务风险。",
  "业务语言存在歧义，系统可能误解对象、范围或市场要求；模型升级后指令转换结果会漂移，若缺少确认与审计，错误任务可能被批量执行。",
  "卖点文案、图片和数据源匹配错误会形成错误宣传，模板组合也可能出现溢出或低质排版；二期纯描述生成的事实幻觉风险更高。",
  "阈值和评分未校准会造成误放行或误拦截；自动返修循环可能越修越差、增加成本，并让最终质量责任和人工放行边界不清。",
  "语义排版可能产生不可预测布局、错配素材或漏放必需信息；品牌规则、准确文字与自由生成冲突时，跨尺寸输出容易失控且难以稳定复现。",
];

if (risks.length !== 35) {
  throw new Error(`Expected 35 risk descriptions, received ${risks.length}`);
}

const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("Sheet1");
const originalValues = JSON.stringify(sheet.getRange("A1:F36").values);
const originalFormulas = JSON.stringify(sheet.getRange("A1:F36").formulas);

const riskRange = sheet.getRange("G1:G36");
riskRange.values = [["风险分析（技术/业务/合规）"], ...risks.map((risk) => [risk])];
riskRange.format = {
  font: { name: "微软雅黑", size: 10, color: "#000000" },
  borders: { preset: "all", style: "thin", color: "#000000" },
  wrapText: true,
  verticalAlignment: "center",
  horizontalAlignment: "left",
};

const fillRows = (startRow, endRow, color) => {
  sheet.getRange(`G${startRow}:G${endRow}`).format.fill = color;
};
fillRows(2, 6, "#00FF00");
fillRows(7, 9, "#0000FF");
fillRows(10, 10, "#FFFF00");
fillRows(11, 11, "#0000FF");
fillRows(12, 14, "#FFFF00");
fillRows(15, 15, "#00FFFF");
fillRows(16, 17, "#800000");
fillRows(18, 19, "#008000");
fillRows(20, 22, "#000080");
fillRows(23, 24, "#808000");
fillRows(25, 25, "#800080");
fillRows(26, 27, "#008080");
fillRows(28, 30, "#C0C0C0");
fillRows(31, 34, "#808080");
fillRows(35, 35, "#9999FF");
fillRows(36, 36, "#A83279");
sheet.getRange("G7:G9").format.font.color = "#FFFFFF";
sheet.getRange("G11:G11").format.font.color = "#FFFFFF";
sheet.getRange("G16:G27").format.font.color = "#FFFFFF";
sheet.getRange("G31:G34").format.font.color = "#FFFFFF";
sheet.getRange("G36:G36").format.font.color = "#FFFFFF";
sheet.getRange("G1").format = {
  fill: "#FF0000",
  font: { name: "微软雅黑", size: 12, bold: true, color: "#FFFFFF" },
  borders: { preset: "all", style: "thin", color: "#000000" },
  wrapText: true,
  verticalAlignment: "center",
  horizontalAlignment: "center",
};
riskRange.format.columnWidthPx = 480;
riskRange.format.autofitRows();

if (JSON.stringify(sheet.getRange("A1:F36").values) !== originalValues) {
  throw new Error("Original values in A1:F36 changed unexpectedly");
}
if (JSON.stringify(sheet.getRange("A1:F36").formulas) !== originalFormulas) {
  throw new Error("Original formulas in A1:F36 changed unexpectedly");
}

workbook.recalculate();
const check = await workbook.inspect({
  kind: "table",
  range: "Sheet1!A1:G36",
  include: "values,formulas",
  tableMaxRows: 36,
  tableMaxCols: 7,
  tableMaxCellChars: 180,
  maxChars: 30000,
});
console.log("=== FINAL TABLE CHECK ===");
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 300 },
});
console.log("=== FORMULA ERROR SCAN ===");
console.log(errors.ndjson);

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(new URL("./previews_after/", import.meta.url), { recursive: true });
const preview = await workbook.render({
  sheetName: "Sheet1",
  autoCrop: "all",
  scale: 1.0,
  format: "png",
});
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(JSON.stringify({ outputPath, previewPath, riskRows: risks.length }));
