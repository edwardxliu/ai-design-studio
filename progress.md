# 进度日志

## 会话:2026-07-15(下午)——冰箱 POP 模板版式微调

用户手调模板后提出 6 处对齐问题,全部修复(25 文件 / 126 测试全绿,含 6 个新数值断言;无头 Chrome 渲染逐一目检):
1. USP 方案A:蓝条底边对齐灰图底边(bandY 720→810);
2. USP 方案B(Overlay):蓝条下移(610→700),底部仍露出灰图;
3. Feature 方案A/B:新增 nestedBulletPath(src/domain/pop-svg-primitives.ts)——首个子弹左直角,后续子弹左侧为凹弧贴合前一子弹右圆弧,留 6px 白缝;
4. Inner 方案A:蓝条底边对齐灰图底边(430→472);
5. Inner 方案C:蓝条左边对齐灰图右边(x=548)、底边对齐灰图底边(y=416);
6. Side Sticker:两灰块间距 4→16px。


## 会话:2026-07-15——平台化第二轮(工作室拆分/去示例/去Mock/本地化中心)

### 需求(用户五点)
1. 工作室各能力拆为独立侧边栏页,删除 /studio 与"一键生成全部";POP/PDP 已有入口不重复;
2. 删除 SPACE/MEGA 示例产品;3. 删除 Mock(系统必须联网);
4. 国家/语言只在本地化页设置(系统级);5. 本地化页支持批量转换图像文字语言(系统代用户翻译)。

### 已完成(25 文件 / 116 测试通过,typecheck/build 全绿,生产冒烟通过)
1. **能力页拆分**:/white-background、/phone-standardize、/sku-variants、/style-transfer、/motion 五页(共用 CapabilityRunner:选产品→并行生成→进度条→逐张出图);删除 /studio、CompetitionTaskRunner、一键全部;POP/PDP 模板能力从领域清单移除(专页已覆盖)。
2. **示例产品移除**:注册表仅列用户产品;原种子数据降级为纯测试夹具(src/domain/test-fixtures.ts);无产品时各页引导先去素材库建品。
3. **Mock 全删**:image-provider/extractor 失败直接抛错并透出到 UI;无 OPENAI_API_KEY 明确报错;DEMO_USE_MOCK 配置删除;台账不再有演示基线行。
4. **系统语言设置**(data/settings.json + /api/settings):POP/PDP/能力页不再各自选国家/语言,输出标注统一取系统设置;PDP 画布编辑器展示系统语言(只读)。
5. **本地化中心**:系统语言设置 + 批量转换(多选缩略图 + 目标市场,3 路并发,逐张进度/结果对照);提示词保持产品与构图不变、仅翻译图内全部文字。
6. 附带修复:PopTemplateCanvas 点击选择 Sticker 绑定 onPointerDown(此前仅 onClick,画布点选测试失败)。


## 会话：2026-07-14——PDP Canvas 编辑器

### 用户要求
1. 删除 PDP 上方逐条卖点表单，改为在下方画布直接交互。
2. 每个卖点是可拖动块，用户可自行调整布局。
3. 默认布局为 Brand、KV、2 个 SP1、3 个 SP2、4 个 SP3……的横向树结构，全部顶部对齐。
4. 优先级越高越靠左，块尺寸越大。

### 当前进度
- 已核对 `PdpEditor`、`pdp.ts`、`pdp-export.ts` 与导出 API；确认现有预览是静态 SVG，表单状态与导出固定布局耦合。
- 正在建立统一的画布布局数据模型，随后实现 Canvas 拖拽与所见即所得导出。

## 会话:2026-07-10(下午)——PDF 卖点提取 + PDP 横向树形模板

### 需求(用户两点)
1. 卖点以 PDF 形式由用户上传(格式不固定),用大模型提取;
2. PDP 改为横向树形动态模板(参考草图:Brand/KV/SP*N/More Features & Icon/Specification 列式排布),长宽随卖点数量增长;窄黑/灰条=卖点文字,宽灰大块=用户替换图片。

### 已完成(TDD,23 文件 / 116 测试通过)
1. **LLM 卖点提取**(`src/services/selling-point-extractor.ts`):PDF 以 base64 file part 直传 chat/completions(JSON mode),`OPENAI_TEXT_MODEL` 默认 gpt-4o-mini,复用代理配置;字段名容错归一化、markdown 代码块剥离;mock/失败回退带原因。注册表 `recognizeSellingPoints` 对 .pdf 走提取器(txt/json 保留规则解析),返回 model/isFallback;recognize 路由记入台账(LLM 1 单位)。
2. **PDP 横向树形模板 pdp-tree-v3**(`src/domain/pdp-export.ts` 重写):列式布局 Brand(蓝块+名称条+图标格)→ KV(大图+黑条+灰条)→ SP 列 × N(每列 2 个卖点:黑条+窄灰条+300px 高大图块)→ More Features(每卖点一个编号圆形图标)→ Specification(斑马表);画布宽=列数×380+间距,高=最高列;卖点无上限(buildPdpDocument 去掉 5 个截断)。
3. **真实端到端验证**(生产模式,真 Key + 代理):上传 `冰箱卖点.pdf` → gpt-4o-mini 提取 7 条卖点(SPACE Master™/Instant Ice/Peaceful Living/Remote Management/Energy Saving/Sleek Design/Smart Features,含技术佐证)→ 导出 7 段落横向 PDP(3316×1020,6 卖点时为 2908 宽,证实动态增长)→ 删除测试产品。
4. 无头 Chrome 渲染比对草图版式一致;PdpEditor 结果区改横向滚动展示宽图。

## 会话:2026-07-10——POP 模板定稿 + 并行生成与进度

## 会话:2026-07-10——POP 模板定稿 + 并行生成与进度

### 需求(用户三点)
1. POP 暂时固定为品牌资料里的 4 款模板(蓝色块=用户输入产品特点文字,灰色块=用户上传图片);
2. 图片生成改多线程并行;3. 生成过程加进度提示。

### 已完成(TDD,22 文件 / 108 测试通过;4 款模板已用无头 Chrome 渲染比对资料版式)
1. **POP 四款固定模板 v2.0**(`src/domain/pop.ts` 按模板分版式渲染,蓝渐变 #1B5FAA→#2EA7E0):
   - Main Sticker - USP(4:5 竖版):大图 + 底部蓝渐变条(Headline 粗体白字 + Subheading);
   - Main Sticker - Feature(16:9):浅蓝边框 + "Main Feature" 居中标题带两侧横线 + 3 图 3 蓝色胶囊标题条;
   - Inner Sticker & Display(16:9):整幅大图 + 左下角覆盖式蓝条(左方右圆);
   - Side Sticker(5:2 横条):左图 + 右蓝色胶囊 Headline。
   移除烤箱模板集与 SVG 内标注栏(标注移到预览下方,避免烙进贴装图)。
2. **并行生成**:`mapWithConcurrency`(src/lib/concurrency.ts);runCompetitionTask 服务端 4 路并发;新增 `runCompetitionOutput` + `/api/competition/run-output` 单输出接口;前端每个输出独立请求、4 路并发,"一键全部"改为能力间也并行。
3. **进度提示**:工作室卡片实时进度条("并行生成中 k/n"),结果逐张追加;POP 面板阶段文案(1/3 栅格化 → 2/3 调模型 → 3/3 完成)。

## 会话:2026-07-09(下午)——工作室精简与本地化独立

## 会话:2026-07-09(下午)——工作室精简与本地化独立

### 需求(用户四点)
1. 素材库支持产品删除;2. 移除"输入资料结构化包"(冗余);3. 工作室只选产品、不选源素材;本地化(国家/语言)独立成"对已生成图做文字替换";4. 移除跨品类验证(冗余)。

### 已完成(TDD,21 文件 / 102 测试通过)
1. **产品删除**:registry.deleteProduct(仅用户产品,连带删除其上传素材)+ DELETE /api/products + 素材库"删除产品"按钮。
2. **工作室精简**:能力从 12 → 7(白底多角度/手机图标准化/SKU 替换/风格迁移/POP 应用/动态 PDP/视频方向),移除结构化包、多语言替换、市场版本、跨品类验证×2;分组改为"基础图像生产/营销物料生成";移除每卡"源素材"下拉——选定产品后自动用其素材,手机图标准化优先取 phone-shot 类素材。
3. **本地化独立页 `/localize`**:GET /api/outputs 列出 public/generated 全部历史输出(缩略图,新→旧);选图 + 国家/语言 → localizeGeneratedImage 以原图为参考图、提示词仅要求替换文字保持其余不变;SVG 源不送模型(mock 可用);原图/结果对照展示;计入台账。
4. 导航与首页加入"本地化"环节(素材库 → 产品档案 → 生成与模板 → 本地化 → 资源台账)。

### 生产模式冒烟
8 页面 200;新建"Smoke 空调"→白底 6 角度(prompt 含纯白硬约束,产品标注正确)→ /api/outputs 列出 60 条 → 本地化(葡语,原图/结果对照)→ 删除产品 200。

## 会话:2026-07-09——平台化重构(四项调整)

## 会话:2026-07-09——平台化重构(四项调整)

### 需求
1. 冰箱/烤箱只是示例,系统按用户上传素材驱动全部功能;
2. UI 不按任务一/二/三组织,按正规 AI 设计平台组织并串起功能链路;
3. 素材管理:产品信息/品牌规范/模板资料/样例素材四类,决定后续输入;
4. 白底 6 角度输出强制白底。

### 已完成(TDD,20 个测试文件 / 95 个测试通过)
1. **产品注册表**(`src/services/product-registry.ts` + `/api/products*`):用户可新建任意品类产品(data/products.json);卖点可从上传的「产品信息」文档识别(JSON 数组或`标题|短标签|说明|佐证`行格式),可手工修正;冰箱/烤箱降级为内置示例。
2. **素材库 `/assets`**(取代 /intake):四类资料分组上传/预览/删除(`LocalAssetStore.removeAsset` + `DELETE /api/assets`);页面内直接新建产品。
3. **产品档案 `/products`**:卖点识别/编辑/保存界面,档案统一驱动 PDP、POP 默认文案与生成提示词。
4. **图像工作室 `/studio`**(取代 /tasks,旧路径 307 跳转):能力功能化命名(白底多角度/手机图标准化/SKU 替换/风格迁移/多语言替换/市场版本/跨品类验证),分组为基础图像生产/营销物料与本地化/跨品类扩展验证;顶部全局"目标产品"选择器,任何能力可跑用户新建产品(runner productOverride,源图自动取该产品照片)。
5. **白底硬约束**:所有 white-background 输出的提示词强制"pure white seamless background (#FFFFFF)"。
6. **信息架构**:导航=工作台/素材库/产品档案/图像工作室/POP 设计/PDP 构建/资源消耗;首页改为平台工作流视图;全站无"任务一二三"字样;POP/PDP 页产品列表来自注册表(force-dynamic)。
7. **安全**:.env.example 中的真实 API Key 已移回占位符(真实配置在 .env.local,git 已忽略)。

### 生产模式端到端冒烟(127.0.0.1:3111)
新建"SmartWash 洗衣机"→上传卖点 txt→识别出 3 条卖点→上传照片→白底 6 角度(prompt 含白底硬约束、源图为洗衣机照片、标注为洗衣机)→PDP 长图含 3 个洗衣机卖点段;全部页面 200,/tasks 307→/studio;冒烟数据已清理。

## 会话:2026-07-07(下午)——代码审查后的整改(第一轮)

## 会话:2026-07-07(下午)——代码审查后的整改

### 已完成(全部 TDD,70 个测试通过)
1. **素材落地**:从品牌资料 PDF 提取冰箱(正面/开门/手机拍摄)、烤箱(正面/开门45°)、品牌 VI、PDP 模板参考图到 `public/demo-assets/`;微信高清渲染图压缩为 2048px 入库。
2. **真实生成链路**:`LocalAssetStore.readAssetBytes` 按资产 ID 解析文件;`image-provider` 支持参考图走 OpenAI `images/edits`(fetch 直连,支持 `OPENAI_BASE_URL` 中转),失败原因透出到 UI;默认模型改为 `gpt-image-1`;manifest 并发写入用队列串行化。
3. **POP**:`renderPopFlatSvg` 把用户编辑的模板渲染成真实平面稿(含标注栏);新增烤箱 6 款模板集;`/pop` 支持模板选择/文字编辑/图片替换/实时预览;前端 canvas 栅格化平面稿为 PNG,与产品图一起作为参考图生成写实贴装场景。
4. **PDP**:`renderPdpSvg` 对齐模板骨架(Brand/KV/SP×N/More Features/Specification/标注栏),嵌入真实图片;`/pdp` 编辑器支持卖点排序/启停/新增、每卖点配图、调整记录展示;导出按当前编辑状态合成长图。
5. **任务中心**:12 个赛题任务全部对接新链路;图片任务可选现场上传的源素材;降级原因直接显示。
6. **台账**:`/costs` force-dynamic(修复静态预渲染导致现场记录不可见),新增按任务/国家/语言/模式聚合与"减少重复调用"机制说明。
7. **生产模式文件服务**(冒烟测试中发现的关键问题):`next start` 只服务构建时已存在的 public 文件,运行时生成/上传的文件全部 404;已为 `/generated`、`/uploads` 添加路由处理器(`src/services/runtime-files.ts` + `app/generated|uploads/[...path]/route.ts`)。

### 端到端冒烟验证(生产构建,127.0.0.1:3111)
- 全部页面 200;上传 → manifest → 文件可访问;PDP 导出 SVG 嵌入 5 张真实图片含 Specification 与标注栏;POP 模板场景返回平面稿 SVG/PNG + 场景图,参考图为产品图+平面稿;任务中心源素材覆盖生效(6 张输出全部使用指定手机图);/costs 聚合与新记录即时可见。

### 遗留事项
- `openai` npm 包已不再引用,但因 pnpm store 版本不匹配未从 package.json 移除(无害)。
- 演示前需用真实 OPENAI_API_KEY 实测一次全链路(见 docs/demo-runbook.md)。

## 验证记录
| 验证 | 结果 |
|------|------|
| `pnpm vitest run` | 16 文件 / 70 测试全部通过 |
| `pnpm typecheck` | 通过 |
| `pnpm build` | 通过(/costs 转 dynamic,/generated、/uploads 路由注册) |
| 生产模式端到端冒烟 | 上传/POP/PDP/任务中心/台账全链路实测通过 |

## 会话：2026-07-14——PDP Canvas 交互重构

### 已完成
1. 新增真实 `<canvas>` 编辑器，移除画布上方逐行卖点表单；选中块后在右侧检查器直接编辑标题、标签、说明、技术佐证、启停状态和配图。
2. 默认树形布局按 Brand、KV、2 个 SP1、3 个 SP2、4 个 SP3 依次分列并顶部对齐；优先级越高的列越靠左、块尺寸越大。
3. 每个卖点块支持指针拖动和键盘微调，画布坐标、尺寸、层级随导出请求提交，服务端 SVG 按同一布局渲染。
4. 桌面端采用画布加右侧检查器，移动端检查器自动下移；AppShell 导航同步适配窄屏。

### 验证记录
| 验证 | 结果 |
|------|------|
| `pnpm test` | 24 个测试文件 / 123 个测试全部通过 |
| `pnpm typecheck` | 通过 |
| `pnpm build` | 通过，Next.js 15.5.20 正常构建 `/pdp` 与 `/api/pdp/export` |
| Playwright 桌面端 | Canvas 非空；拖动坐标由 `(644, 62)` 变为 `(762, 121)`；导出接口 200，SVG 保留新坐标 |
| Playwright 移动端 | 390 x 844 下无页面横向溢出，Canvas 区内部滚动，检查器位于画布下方 |

## 会话：2026-07-14——POP 产品类型模板 Canvas 重构

已确认重构方向：冰箱与烤箱各自绑定固定 Sticker 组和布局，Canvas 负责选择与预览，紧邻检查器负责当前 Sticker 的文字和图片内容，AI 每次只接收一个明确选中的 Sticker 平面稿。

领域层已完成第一步：新增冰箱/烤箱固定模板集、14 个新增变体渲染器，并通过兼容注册表接入原有 4 个冰箱模板；pnpm typecheck 通过。

POP 定向验证通过：src/domain/pop.test.ts、pop-template-sets.test.ts、旧 PopTemplateStudio 回归测试和新 PopCanvasStudio 测试共 26 个测试全部通过；Canvas 点击单选、直接上传和单模板生成请求均已覆盖。

## 会话：2026-07-15——烤箱 POP 模板精确校正

### 已完成
1. Main Hero A/B 的蓝色文字弹与灰色图片同边对齐；B 底部第 2/3 段采用凹接左边和右圆弧。
2. Corner 从 A/B 两个候选合并为唯一固定方案，包含蓝色品牌面和可替换图片的灰色设计面。
3. Body 三案、Wobbler 和 Top 全部按参考图重画，灰色图片槽与蓝色文字区均使用固定几何。
4. 按用户要求未打开本地浏览器，仅使用测试、构建和 HTTP 状态验证。

### 验证记录
| 验证 | 结果 |
|------|------|
| POP 定向测试 | 3 个测试文件 / 32 个测试全部通过 |
| 全量 `pnpm test` | 25 个测试文件 / 127 个测试全部通过 |
| `pnpm typecheck` | 通过 |
| `pnpm build` | 通过，Next.js 15.5.20 成功构建 `/pop` |
| 生产服务 | `http://127.0.0.1:3000/pop` 返回 200 |

## 会话：2026-07-15——烤箱 POP 第二轮细节修正
- Main 两案的源 SVG 与 Canvas 预览框统一为 3:2；Main B 主蓝条支持 Headline/Subheading 两行。
- Body A 蓝条坐标从 y=500 上移至 y=470，宽度从 460 缩至 365。
- Body B 源 SVG 改为 1000x126，蓝边框与文字弹共用 y=13/113 边线；Body C 源 SVG 改为 1000x250，灰图:84dd条宽度为 490:430。
- Inner Display 蓝条为 x=20, y=420, 460x96，灰图底部保留 24px。
- Wobbler 蓝条分别覆盖在图片 y=300..412 与 y=700..812 的底部区域。
- 本轮未打开或控制本地浏览器。

| 验证 | 结果 |
|------|------|
| POP 定向测试 | 3 文件 / 32 测试通过 |
| 全量 `pnpm test` | 25 文件 / 127 测试通过 |
| `pnpm typecheck` | 通过 |
| `pnpm build` | 通过 |
| `http://127.0.0.1:3000/pop` | HTTP 200 |

## 2026-07-16

- 完成 OpenAI GPT Image / Seedream 5.0 Lite 双模型选择与服务端透传。
- 完成即梦 Seedance 2.0 Fast 产品视频异步生成链路，成片成功后缓存到 `public/generated/`。
- 方舟配置统一使用 `ARK_API_KEY`；图片与视频模型 ID 可分别通过环境变量覆盖。
- 验证：`pnpm typecheck` 通过；`pnpm test` 30 个测试文件、139 项测试通过；`pnpm build` 通过；首页、`/product-video` 与 API 参数校验均通过 HTTP 冒烟测试。
- 生产服务运行于 `http://127.0.0.1:3001`；3000 端口存在短暂旧进程争用，因此未复用。
## 2026-07-17
- 开始将产品视频从 Seedance 2.0 Fast 切换到 Seedance 1.5 Pro。
- 开始实现 SKU 三类局部替换：双图部件替换、蒙版颜色替换、蒙版样式替换。
- 已核对方舟公开模型 ID `doubao-seedance-1-5-pro-251215` 与 2–12 秒时长约束。- 已确认现有 SKU 页面仅调用通用 `CapabilityRunner`；现有 `generateDemoImage` 可复用成本记录和供应商选择，但需增加 `maskAssetId`。
- 已确认 OpenAI 编辑请求由手写 multipart 构建，适合增加原生 `mask` 文件字段；Seedream 请求可将蒙版追加到参考图数组。- 已将视频默认模型改为 `doubao-seedance-1-5-pro-251215`，展示名改为 Seedance 1.5 Pro，接口时长改为 12 秒。
- 已新增 `sku-replacement` 提示词领域模块、像素连通智能选区/画笔蒙版算法和 `/api/sku-replacement`。
- 已扩展图像供应商输入：OpenAI 使用 multipart `mask`，Seedream 将同一蒙版追加为参考图。- SKU 定向测试：10 个文件 / 36 项通过。
- 全量测试：37 个文件 / 163 项通过；`pnpm typecheck` 通过。
- `pnpm build` 通过，构建包含 `/sku-variants` 与 `/api/sku-replacement`。
- 无浏览器 HTTP 冒烟通过：首页、SKU 页面、产品视频页均返回 200；缺部件图与缺蒙版分别返回预期 400。
- 生产服务已启动在 `http://127.0.0.1:3000`。- 最终补充 SKU 整机图/部件图的磁盘文件与 MIME 校验，防止参考图缺失时退化为文生图。
- 补充后再次完成类型检查与生产构建；生产服务重启为 PID 49020，`/sku-variants` 返回 HTTP 200。
## 2026-07-17 SKU Canvas 比例修复
- 原图 355×334，旧画布因 `width: 100%` 与 `max-height: 680px` 冲突被显示成约 1.59:1。
- 画布现按原图比例计算最大显示宽度并水平居中，底图使用 `object-fit: contain`；图片尺寸读取完成前不创建可编辑覆盖层。
- 定向测试 2 文件 / 6 项通过，类型检查与生产构建通过。
- 生产服务已重启，`http://127.0.0.1:3000/sku-variants` 返回 200。
# 2026-07-17 Icon Design VI 模板应用

- 已确认复用现有 OpenAI / Seedream 多参考图生成链路和本地资产存储。
- 正在建立六类输出规则、VI 视觉解析服务和独立工作区。
## Icon Design VI 模板应用完成

- 新增 `/icon-design` 独立工作区与侧边栏、首页入口。
- 新增品牌色彩 VI、Icon 设计 VI、源 Icon 三类持久化素材槽。
- 新增 OpenAI 视觉模型 VI 解析 API，输出保留 `{{FEATURE_TITLE}}` 的可编辑模板。
- 新增 4 种颜色资产和 2 种图文版式的 OpenAI / Seedream 批量生成 API。
- 40 个测试文件、171 项测试通过；TypeScript 类型检查和 Next.js 生产构建通过。
- HTTP 冒烟通过：`/icon-design` 返回 200，两个 API 在缺少必填素材时均返回预期 400。
- 生产服务已在 `http://127.0.0.1:3000` 后台运行。
## 2026-07-18 风格迁移重构
- 已解析 3 份 PPT，共 70 页，建立每页文本和图片关系索引。
- 已识别 7 套图像关键词模板并排除所有视频相关页。
- 已通过后台 PowerPoint 导出 7 张关键词页，完成拉美与 Lab 页的视觉核对。
- 正在提取每套 3 张参考图并建立专用风格迁移领域模型。
## 2026-07-18 风格迁移工作台完成

- 从 3 份 PPT 中建立 7 套静态图像风格：拉美温暖极简、建筑实验室、高端通用、北欧时尚编辑、北欧丹麦住宅、日式暗场展厅、日式明亮展厅。
- 正式提取 21 张 PPT 原始参考图；产品图固定为 Image 1，参考图固定为 Image 2+ 且只提供风格信息。
- 新增 Keywords 自动匹配、预设选择、产品参考图选择和 OpenAI / Seedream 模型选择。
- 每次并发生成 3 张静态图片：产品主视觉、建筑空间、生活方式；提示词明确排除视频、分镜、拼图和参考图中的其他产品。
- 定向测试 4 个文件 / 7 项通过；全量测试 44 个文件 / 181 项通过；`pnpm typecheck` 与 `pnpm build` 通过。
- 无浏览器 HTTP 验证通过：`/style-transfer` 返回 200，API 缺少参数返回预期 400；未触发付费生图。
- 开发服务运行于 `http://127.0.0.1:3000`。
## 2026-07-21 首页紧凑玻璃工作台完成
- 主工作台缩小为参考图比例，顶部改为 Gotham 英文问候并新增当天日期和顺德天气。
- 中部改为三个等宽玻璃卡，前两张使用用户指定图片并增加缓慢流动动画。
- 底部扩展为十个小型工具块，黑色滑点可控制横向位置；侧栏增加循环流动底光。
- 新增 /api/weather 与 WMO 天气码映射，Node 实测 Open-Meteo 返回 200。
- 验证：定向测试 2 文件 / 7 项通过；npm run typecheck 通过；npm run build 通过；首页和天气 API 均返回 HTTP 200。
- 按用户既有要求未打开本地浏览器；生产预览在命令存续期间验证首页与天气 API 均为 HTTP 200，后台进程随后被 Codex 执行环境回收。
## 2026-07-21 全站紧凑玻璃外壳完成
- 首页与全部功能页已统一工作台和侧栏尺寸，功能页当前路由会按首页样式高亮。
- 首页和子页侧栏均使用两条左上至右下循环流光；Midea Overseas 为同尺寸常规字重。
- 共享外壳已统一浅灰按钮对比度、子页字号上限、行距和框间距。
- 验证：定向测试 3 文件 / 8 项通过；全量测试 45 文件 / 189 项通过；npm run typecheck 通过；Node 24.13.0 下 next build 通过。
- 按用户要求未打开本地浏览器。

## 2026-07-21（阶段 16）
- 已完成 8 项新增修改的代码定位：共享图框/下拉框、风格迁移预设状态、Icon Design、POP 全量重绘、PDP Canvas 与导出链路。
- 当前正在实现共享图片裁切编辑器与各页面宽度/视觉修复。
## 2026-07-21 全站视觉细节与 POP/PDP 图片工作流完成
- 两条侧栏流光扩展为 440×132px 的高亮斜向光带；首页玻璃滑点与工具卡间距增大。
- 全局统一图像卡内部轨道和下拉框溢出规则；风格迁移工作区已压缩且日式明亮展厅状态/参考图切换已修复。
- Icon Design VI 图片缩为两张 92px 预览并隐藏提示词编辑区。
- 新增 POP/PDP 共用图片裁切编辑器；POP 使用模板预览缓存实现选中方案局部更新。
- PDP 使用指定 Midea Brand 图、可编辑品牌文案，并按单列纵向拼接导出长图。
- 验证：TypeScript `--noEmit` 通过；完整 Vitest 46 文件 / 194 项通过；Next.js 15.5.20 生产构建通过。
- 遵照用户要求，未打开或控制本地浏览器。
## 2026-07-22 阶段 17 开始
- 已读取现有计划、发现和进度记录，并确认当前分支为 `codex/glass-homepage`。
- 工作区已有 `app/page.test.tsx` 与 `src/components/GlassTuner.tsx` 两处上一轮未提交修改，后续将在其基础上继续，不回退。
- 已将 13 项需求按全局外壳、首页、子页性能、POP 本地贴装和验证五组拆解。

## 2026-07-22 封面页迁移开始
- 已创建并切换到 `codex/cover-page`。
- 已确认源页面为独立 Next.js 项目，后续只迁移组件、样式与 `public/midea-ai` 必要素材。
- 按用户要求不打开本地浏览器，验证使用 npm 类型检查、测试和构建。

- 已确认当前分支为 `codex/cover-page`，并完成现有路由清单核对。

## 2026-07-22 CreativeStudio AI 封面页迁移完成
- 根路由 `/` 改为完整滚动封面：视频首屏、品牌视觉拼贴、工作流和末尾入口。
- 原毛玻璃工作台迁移到 `/studio-home`，全站“工作台”导航与激活态同步更新。
- `Start now`、顶部 `Enter` 和拼贴区入口均使用 Next.js 客户端导航进入 `/studio-home`。
- 复制 20 个必要素材，共 57,961,374 字节；逐文件 SHA-256 与源项目一致。
- 验证：`npm run typecheck` 通过；3 个定向测试文件共 9 项通过；`npm run build` 通过。
- 命令行 HTTP 验证：`/`、`/studio-home`、封面 MP4 均返回 200；未打开本地浏览器。
- 构建仍报告 POP Canvas CSS 中两处 `end` 对齐兼容性警告，与本次封面迁移无关。
## 2026-07-22 封面边界 AI 聊天入口完成
- 在视频蓝色结尾与白色品牌拼贴页之间加入零高度锚定的 Luma 风格聊天面板；继续滚动时随文档自然离场。
- 底部提供 POP、PDP、风格迁移、产品视频 4 个直达入口和 1 个圆形省略号占位按钮。
- 新增 `/api/cover-chat`：动作意图优先映射到系统白名单路由，普通对话复用 OpenAI 文本模型与现有代理配置。
- 前端支持会话记录、Enter 发送、等待/错误状态、模型回复展示和 Next.js 自动路由跳转。
- 验证：`npm run typecheck` 通过；6 个定向测试文件共 16 项通过；干净 `npm run build` 通过。
- 真实联网验证：`gpt-4o-mini` 普通聊天返回 `CHAT_OK`；根页、`/studio-home` 和导航聊天 API 均返回 200。
- 开发服务器使用 npm 隐藏启动并保持在 `http://127.0.0.1:3000/`；未打开浏览器。

## 2026-07-22 Stage 20 complete
- Added `BrandSourceSection` with the requested English headline, copy, CTA, and looping inline hero video.
- Replaced the cover workflow section and added warm Brand.ai-inspired styling.
- Copied the source MP4 with matching SHA-256 hashes.
- `npm run typecheck`: passed.
- `npm test -- app/page.test.tsx`: 1 file / 1 test passed.
- Runtime checks: `/`, `/studio-home`, and the MP4 returned HTTP 200; no browser was opened.

## 2026-07-22 Stage 21 complete
- Added `ExecutionShowcaseSection` and inserted it between the Brand video and final city sections.
- Added three 4:3 looping, muted, inline demo videos with the supplied headlines and body copy.
- Added alternating responsive layout and a dotted Luma-inspired visual treatment.
- `npm run typecheck`: passed.
- `npm test -- app/page.test.tsx`: 1 file / 1 test passed.
- Runtime checks: root HTML order valid; all three MP4 resources returned HTTP 200 with `video/mp4`.
## 2026-07-22 Stage 22 complete
- POP flat SVGs and generated PNG inputs now retain transparent backgrounds.
- The studio-home subtitle was removed and the top-right controls stack below the heading when the content panel becomes narrow.
- npm run typecheck: passed.
- Focused tests: 2 files / 14 tests passed.
- Runtime checks: /studio-home and /pop both returned HTTP 200; no browser was opened.
- A broader PopCanvasStudio run exposed one pre-existing stale test for the removed image-model selector; the remaining 19 tests in that run passed.

## 2026-09-26 Demo brief assessment started
- Read supplied brief, relevant memory pointers, current page routes, AppShell, and the style-transfer UI/API/preset implementation.
- Read PDF, planning-with-files, and verification workflow instructions; planning session recovery returned no pending report.
- Preserved all business code. App branch is `codex/cover-page`; pre-existing untracked outputs and review folders remain untouched.
- PDF PNG display failed twice despite a valid PNG; a smaller PDF-rendered JPEG displayed successfully.
- Next: inspect workflow crops, compare remaining modules, and run baseline checks.
- Inspected all four readable PDF workflow crops and compared style transfer, white-background, localization, POP templates/editor, homepage personalization, and API contracts.
- Confirmed this is a UI/workflow consolidation plus real feature additions, not a visual-only reskin. No browser or paid AI request was initiated.
- Completed read-only implementation assessment. TypeScript check passed; local targeted test run completed with 41 passes / 1 failure across 12 files. The failure reproduces the existing POP test/UI mismatch.
- Vitest first hit sandbox `spawn EPERM`; an approved elevated run resolved startup. No code fix was attempted during the evaluation phase.
- Final assessment prioritizes navigation/settings and preset-style transfer, separates undefined style learning from preset selection, and calls out white-angle fidelity, bundle/base-image relationships, and deterministic POP output.
- Only assessment notes in task_plan.md, findings.md, and progress.md were modified; business code was left untouched. PDF renders are organized under tmp/pdfs/brief-assessment.

## 2026-09-26 Approved implementation started
- User explicitly approved navigation/settings and one-click style-transfer implementation after the assessment.
- Read current components, API payloads, test fixtures, and relevant design/TDD/verification guidance. Continue in the existing checkout; retain unrelated untracked artifacts.
- Current wallpaper upload is homepage-only and temporary; settings migration will unify it without changing other task inputs. Existing glass settings will be passed from each shell as one state owner.
- Added 12 behavior tests and observed all 12 fail against the previous UI, then implemented shared grouped navigation, a modal settings panel, persistent custom backgrounds, material selection/upload, count-controlled generation, frozen request snapshots, and failure-only retries.
- Initial implementation typecheck passed. Focused tests: 22/23 passed; the remaining failure waited for the system-settings heading deliberately moved out of LocalizePanel. Updated only that readiness assertion to the unchanged localization section.
- Tooling notes: one patch was rejected because delete/add targeted the same file; switched to atomic update patches. Playwright CLI lookup through system npm hit an unwritable Program Files cache; checking the workspace cache next.
- Full regression after fixes: 53 files, 223 tests; 218 passed and 5 failed. Reproduced exactly those 5 failures in an untouched HEAD archive using the same dependencies: cover-page chat placement, legacy POP model selector, Icon Design reference wording, PDP brand message, and PDP warranty export. No new test failures.
- A read-only review identified four integration issues. Restored shared navigation edge/glow CSS variables, protected selected count/preset and generation-button styling from legacy global overrides, synchronized saved market settings to the live PDP without discarding edits, and kept market-load retry independent from appearance messages. Two added regression tests were observed failing before fixes and passing afterward. Reviewer rechecked all four fixes and approved the bounded changes.
- Browser QA used a separate Playwright session at 1440x1000, 1024x768, and 390x844. Verified grouped navigation, six-preset gallery, product library and new-product upload form, settings modal/focus return, active menu border controls, background sharing across navigation, and default-market/PDP-draft synchronization. No horizontal page overflow or broken images were found at the checked widths; shorter desktop workspaces scroll internally.
- Generation QA intercepted all style-transfer POSTs: three simulated outputs with one failure, followed by exactly one retry using the original product, asset, style and model. Two successful outputs remained and three download links appeared after retry. No paid generation or real server-settings write occurred in browser QA.
- Visual evidence is under output/playwright/. Settings screenshots were retaken after image decoding; an initial background-sharing read ran before route completion, then passed after waiting for the destination page and restored theme. A strict label lookup timed out in the upload check; using the observed combobox role completed it without a product-code change.
- Tooling: the installed CLI runs reliably through the bundled Node runtime with consistent permissions. An archived baseline under tmp was briefly included in a focused test discovery; moved the exact generated directory into node_modules/.cache, then reran the final suite with the normal 53-file scope. No original user artifacts were moved or deleted.
- Final production build passed, including the build's type validation. Only existing POP CSS `end`/`flex-end` compatibility warnings remain. All 30 tests across the six directly affected UI test files passed. The production preview is available on 127.0.0.1:3101; no commit or deployment was made.

## 2026-09-26 OpenAI multipart error investigation
- User reports `invalid_multipart_form_data` from actual generation. Local production logs confirm all three premium-universal variants and subsequent retries fail with that same upstream 400. The UI-to-local-API JSON layer is not where this error originates.
- The unchanged shared image provider manually serializes multipart files and sends a Buffer through native fetch or undici with an HTTP proxy. Existing tests checked only the presence of boundary and filename strings, not actual server-side parsing of Unicode/multiple files.
- Investigating without generating paid images. Read systematic-debugging and OpenAI Docs guidance; current official image-edit examples use repeated `image[]` fields, so do not blindly rename that supported field.
- Local serializer inspection initially hit esbuild sandbox spawn EPERM; switched the throwaway inspection script to TypeScript's in-process transpiler. The local parser accepted both ASCII and Unicode multipart headers.
- Non-generation probes used synthetic 1-pixel PNGs and an explicitly nonexistent model. Some requests reached OpenAI model validation; others failed TLS setup through the configured proxy. This does not yet prove the reported multipart cause.
- The real-file A/B probe was rejected before execution; user permission has been requested. The diagnostic script now rejects the real-fixture flag and supports only generated synthetic images. No production code or stored image was changed.
- User explicitly authorized transmitting the current product and style references to the configured OpenAI endpoint for format validation only, using an invalid model and no generation. Re-enabled that bounded fixture probe after authorization.
- Large synthetic-image multipart bodies (14.5 MB encoded; larger than the actual request) reached model validation with both serializers. This does not establish valid-model image generation, and no generation was invoked.
- All three authorized real-material format probes reached the deliberately invalid model error (manual Unicode, standard Unicode, manual ASCII); no real generation occurred.
- Added a throwaway loopback-only Next.js harness. It reproduced malformed multipart in the production bundle without transmitting materials externally or writing product/cost records.
- Located the source-versus-build difference: SWC optimized the file-header CRLF array/join into LF-only template lines. Added a production-minification regression test and observed its expected `Failed to parse body as FormData / expected CRLF` failure before changing the provider.
- Replaced the file-header join with explicit CRLF framing. Focused regression, full test/build, and rebuilt runtime validation are pending.
- Focused tests passed: 2 files / 8 tests, including production minification and the existing provider behavior. Read-only scoped review approved the fix and regression coverage without required changes.
- First full test run overlapped the production build and ended with 207 passes / 17 failures: the five known baseline failures, eleven 5-second UI timeouts, and one style-transfer selection assertion following a timed-out test. A fresh low-concurrency full run is in progress to verify whether those additional failures persist; no UI code was changed for them.
- Production build completed successfully with type validation. The existing two POP CSS alignment warnings remain. The old preview process was stopped before rebuilding; rebuilt runtime format validation and preview restart follow.
- Rebuilt Next.js runtime verification passed on both local direct and HTTP-proxy paths, including exact byte hashes for all four actual images. One authorized upstream invalid-model probe using the rebuilt request reached model validation rather than multipart failure. Harness exit 0; data manifests/settings/cost JSON files unchanged; no real generation was initiated.
- Fresh low-concurrency full suite completed: 54 files / 224 tests, 219 passed and exactly the five previously reproduced baseline failures remained. All eleven additional timeouts and the subsequent selection assertion failure from the parallel build/test run disappeared without UI changes.
- Remaining baseline failures by name: `Cover HomePage > presents the cover story and enters the existing studio homepage`; `PopCanvasStudio > submits only the currently selected Sticker to the AI scene route`; `Icon Design VI rules > builds a single-variant prompt with reference order and the feature title`; `renderPdpSvg (vertical long image) > uses the supplied brand image and editable brand statement`; `demo API helpers > exports an edited PDP with reordered points, custom points, and embedded images`.
- Local preview restarted with normal configured settings on 127.0.0.1:3101. `/style-transfer` returned HTTP 200 and the expected page title. No credential/configuration, stored data, other provider behavior, commit, or deployment changed. The actual valid-model image-generation/quality boundary remains untested as authorized.
