import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "E:/workspace/nato-studio/副本【new】AI视觉生成平台功能矩阵_中(1).xlsx";
const outputDir = "E:/workspace/nato-studio/AI设计赛道/outputs/20260915_track_b_matrix_review";
const outputPath = `${outputDir}/赛道B_AI视觉生成平台功能矩阵_含评审意见.xlsx`;
const previewPath = "E:/workspace/nato-studio/AI设计赛道/tmp_spreadsheet_review/previews_after/Sheet1.png";

const opinions = [
  "需求合理，是基础必备能力。现有方案可行，但 SAM 只能完成初始分割，建议补充头发、玻璃、镀铬和半透明边缘专项策略，并以边缘残留、主体缺损和人工修补耗时作为验收指标。",
  "需求合理，但属于基础能力，差异化有限。建议保留可撤销的自动优化结果和参数记录，加入品牌色保护、色彩空间管理及批量一致性校正，避免一键优化改变产品真实颜色。",
  "需求必要。建议明确区分裁剪、缩放和生成式扩图，平台模板需包含安全区、最小文字尺寸和焦点锁定；批量适配应先预览再导出，防止主体或关键信息被裁掉。",
  "需求合理，局部重绘方向正确。建议把遮罩编辑、修补历史和版本回退纳入流程，并对纹理连续性、Logo/铭牌保护及大面积修补设限，复杂情况保留人工精修入口。",
  "业务价值高，但不能简单承诺一键准确生成。建议要求颜色板、替换部位或版本参考图，锁定结构、Logo、文字和接口位置；输出必须经过 SKU 一致性检查和人工确认。",
  "这是赛道核心需求，但仅凭单张图无法可靠还原不可见结构。建议优先接收多视图、结构图或 CAD，单图模式标注推断区域和风险；以不少于 6 个规定角度及结构一致性作为验收标准。",
  "需求明确且适合批量化。现有方案应补充可编辑遮罩、目标组件参考图和批量变量表，并校验边缘、反射、透视、序列号及合规文字，避免替换后产品身份信息漂移。",
  "需求合理且容易形成稳定能力。建议优先采用模板约束和确定性排版，AI 负责焦点与文案重排；需覆盖平台安全区、长短文案、横竖版和批量导出，不建议让模型重新生成关键文字。",
  "需求价值高，也是赛道重点。现有建议中的几何和材质重建对单张手机图要求偏高，建议拆为基础增强与高保真重建两档；高保真档要求多视图或结构参考，并校验轮廓、材质、文字和尺寸比例。",
  "素材库是支撑能力，不能只做挑选、编辑和下载。建议补充资产 ID、产品/SKU/市场/语言标签、版权与使用期限、版本、搜索、派生关系和审核状态；Demo 阶段可先做本地库与可追溯引用。",
  "需求合理，是场景生成的核心入口。ControlNet 只是实现选项，不宜写死；功能上应提供产品位置、尺寸、遮挡和保留区控制，并以结构保真、透视、接地、光向和分辨率为验收维度。",
  "本行需求定义不完整：功能名称和说明为空，场景描述重复，建议中仍有占位符。建议补为‘指定场景图产品替换’，明确源产品、目标产品、替换区域以及人物、构图和背景保持不变的验收条件。",
  "需求合理，但与接地和光影一致性能力存在交叉。建议本项聚焦透视、尺度和局部细节，提供水平线、消失点及手动锚点；自动调整不得改变产品结构，失败时应允许回退。",
  "需求很关键，现有方向正确。光影一致性评分只有经过样本标定才有意义，建议同时输出可编辑的阴影/反射层、问题定位和人工调节，并用漂浮感、光向偏差及边缘融合度验收。",
  "需求合理且与比赛要求直接相关。建议限定迁移对象为光影、色调、材质和镜头语言，锁定产品结构、颜色、Logo 与文案；迁移强度应可控，并支持一次生成至少 3 个可比较版本。",
  "方向有价值，可作为品牌风格资产化能力。仅保存文字描述不足以稳定复现，建议同时保存参考图集、结构化参数、模型/提示词版本和预览样张，并验证同一风格在不同品类上的一致性。",
  "需求适合批量治理。‘品牌调性区间’必须由审核样张和量化阈值定义，清洗时要保护产品真实色、材质和标签；建议输出前后对比、偏差原因及批量回退能力。",
  "需求明确，适合作为出街前终审。建议把组内离群检测与单图缺陷质检分开，逐项解释色温、饱和度、光向和质感偏差；阈值需可配置，并保留人工确认，避免自动返修误伤。",
  "与‘风格迁移’和‘摄影风格提取’重复度较高。建议将本项定义为受审核的品牌风格档案及调用机制，而不是再做一套生成能力；生成入口复用风格迁移，品牌引擎负责治理和约束。",
  "需求必要，是规模化使用的治理基础。建议把所谓风格模型扩展为可版本化的风格包，包含参考图、参数、适用品类/市场、审核人、发布时间和回滚记录；不必为每种风格单独训练模型。",
  "目标合理，但 PBR 在缺少 3D/CAD 时落地成本高。建议一期采用参考图驱动的重打光、材质保护和接触阴影，二期在有结构数据时引入 PBR；验收重点是产品材质不失真和跨场景稳定。",
  "需求存在真实本地化价值，但‘人种预设库’表述过于粗糙且有合规风险。建议使用经授权的市场化模特资产及可审查属性，记录授权范围，保持姿势、遮挡和背景，并设置人工审核。",
  "这是核心需求。OCR 加图片内重绘不足以保证文字准确，建议先提取为可编辑文字层，再完成翻译、术语审核、RTL 排版、字体授权和确定性渲染；至少验证 3 种语言及长文本溢出。",
  "需求有价值，但范围很大且容易产生地域刻板化。建议使用经过本地团队审核的市场规则包，锁定产品和主构图，只调整允许的陈设、材质、色彩和光照，并增加文化及合规复核。",
  "需求合理，但白底图与结构图未必足以表达技术原理。建议优先使用结构化图层、路径和动画模板，AI 辅助脚本与分镜；生成式视频作为补充，并对技术逻辑、产品结构和文字准确性验收。",
  "可作为演示亮点，但自由文本生成动作的稳定性不足。建议先限定开门、抽拉、旋转等动作模板，支持首尾帧、时长和镜头控制；需检查结构连续性、手部交互和产品标识漂移。",
  "需求明确，且多角度白底图可成为稳定输入。建议用规定角度作为关键帧并采用运镜模板；只有单图时需限制展示范围，避免虚构背面结构，并以轮廓、Logo 和材质的时序稳定性验收。",
  "需求可实现，但相较核心赛题优先级较低。建议采用可控的光照关键帧或分层合成，不必首先依赖视频扩散；应锁定场景几何和产品外观，并提供时间段、色温与变化强度预设。",
  "价值较高但技术风险、成本和审核压力都大，建议放入后续阶段。先限制短镜头、固定机位和单一替换对象，加入跟踪失败提示、逐帧抽检和人工修正，避免承诺任意视频无损替换。",
  "需求方向正确，是从产品数据到内容生产的关键。映射库需包含参数来源、单位、可用证据、表达规则和禁用说法；生成结果应能追溯到具体参数，并在发布前由业务人员确认卖点。",
  "业务价值明确，但存在竞品数据和广告合规风险。建议只使用已核验并带来源和日期的数据，禁止 AI 自行推断竞品结论；模板应支持证据标注、口径一致性检查和法务审核。",
  "需求必要，但产品能力不应停留在生成一段不可控 Prompt。建议输出结构化任务参数，包括操作类型、产品/素材版本、市场、语言、模板和约束，提交前让用户确认，并通过品牌与安全规则校验。",
  "与赛道核心 POP/PDP 生产链路高度一致，分期思路合理。一期应坚持素材组合和确定性文字排版，卖点、图片和来源均可编辑、可追溯；二期纯描述生成仍需回到相同模板和质检流程。",
  "需求必要，可形成生产闭环。评分阈值需用标注样本校准，区分硬规则和模型判断；建议限制自动返修次数，记录每次问题、区域、参数和版本，并保留人工放行与回退。",
  "方向合理，但完全自由的语义排版容易不稳定。建议采用‘语义槽位加确定性约束’：AI 负责素材匹配和布局建议，模板引擎负责准确文字、品牌规则和最终渲染；缺失必需素材时应明确阻断或提示。",
];

if (opinions.length !== 35) {
  throw new Error(`Expected 35 opinions, received ${opinions.length}`);
}

const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("Sheet1");
const originalValues = JSON.stringify(sheet.getRange("A1:E36").values);
const originalFormulas = JSON.stringify(sheet.getRange("A1:E36").formulas);

const reviewRange = sheet.getRange("F1:F36");
reviewRange.values = [["评审意见（需求与设计建议）"], ...opinions.map((opinion) => [opinion])];
reviewRange.format = {
  font: { name: "微软雅黑", size: 10, color: "#000000" },
  borders: { preset: "all", style: "thin", color: "#000000" },
  wrapText: true,
  verticalAlignment: "center",
  horizontalAlignment: "left",
};
const fillRows = (startRow, endRow, color) => {
  sheet.getRange(`F${startRow}:F${endRow}`).format.fill = color;
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
sheet.getRange("F7:F9").format.font.color = "#FFFFFF";
sheet.getRange("F11:F11").format.font.color = "#FFFFFF";
sheet.getRange("F16:F27").format.font.color = "#FFFFFF";
sheet.getRange("F31:F34").format.font.color = "#FFFFFF";
sheet.getRange("F36:F36").format.font.color = "#FFFFFF";
sheet.getRange("F1").format = {
  fill: "#FF0000",
  font: { name: "微软雅黑", size: 12, bold: true, color: "#FFFFFF" },
  borders: { preset: "all", style: "thin", color: "#000000" },
  wrapText: true,
  verticalAlignment: "center",
  horizontalAlignment: "center",
};
reviewRange.format.columnWidthPx = 520;
reviewRange.format.autofitRows();

if (JSON.stringify(sheet.getRange("A1:E36").values) !== originalValues) {
  throw new Error("Original values in A1:E36 changed unexpectedly");
}
if (JSON.stringify(sheet.getRange("A1:E36").formulas) !== originalFormulas) {
  throw new Error("Original formulas in A1:E36 changed unexpectedly");
}

workbook.recalculate();

const check = await workbook.inspect({
  kind: "table",
  range: "Sheet1!A1:F36",
  include: "values,formulas",
  tableMaxRows: 36,
  tableMaxCols: 6,
  tableMaxCellChars: 180,
  maxChars: 30000,
});
console.log("=== FINAL TABLE CHECK ===");
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log("=== FORMULA ERROR SCAN ===");
console.log(errors.ndjson);

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(new URL("./previews_after/", import.meta.url), { recursive: true });
const preview = await workbook.render({
  sheetName: "Sheet1",
  autoCrop: "all",
  scale: 1.1,
  format: "png",
});
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(JSON.stringify({ outputPath, previewPath, rowsReviewed: opinions.length }));
