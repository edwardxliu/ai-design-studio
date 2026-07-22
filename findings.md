# 发现与决策：美的海外产品营销 AI assistant 演示平台

## 输入材料
- `需求/【赛道B】Midea Overseas Product Marketing AI assistant Platform 07-02.pdf`：赛道 B 演示任务要求(任务一/二/三 + 平台五大能力),优先级最高。
- `需求/【赛B】品牌与产品资料清单.pdf`：品牌 VI、SPACE Master 冰箱与 MEGA 烤箱资料、POP/PDP 模板样式、素材图。
- `需求/ai_assistant brief.pdf`：项目 brief(总体目标与业务背景)。
- `需求/赛道A.pdf`：仅背景参考,不在演示范围。

## 关键需求发现
- 任务一:6 张白底多角度、手机照转棚拍标准图、SKU 颜色变体、场景延展。
- 任务二:3 种风格迁移、3 组 POP 模板应用(写实贴装)、动态 PDP 长图(卖点可排序/增删/换图)、视频方向。
- 任务三:烤箱新品类基础物料复用验证。
- 平台能力:结构化输入承接、国家/语言本地化、输出可标注(产品/国家/语言/模板/版本)、资源消耗可解释、素材不限品类(用户上传)。

## 品牌/素材发现
- 品牌蓝取 #005EB8 近似,VI 页已提取(`public/demo-assets/midea-brand-vi.png`)。
- PDP 长图模板骨架:Brand 头 → KV → 卖点段(黑标题条+窄灰文字条+大图)× N → More Features 圆形图标区 → Specification 表 → 品牌尾。参考图 `public/demo-assets/pdp-template-reference.png`。
- 产品图已从 PDF 提取入库:冰箱正面/开门/手机实拍(贴便签)、烤箱正面/开门 45°、门店实拍;微信 4096px 高清渲染图压缩至 2048px。

## 技术决策
| 决策 | 理由 |
|------|------|
| Next.js 单机 BS 架构,本地文件存储(public/ + data/ JSON) | 现场仅一台可联网笔记本,无云服务器;评委浏览器访问 localhost |
| 图像模型 gpt-image-1,fetch 直连(弃用 openai SDK),支持 `OPENAI_BASE_URL` 中转 | 国内网络需中转;规避 SDK 版本对 images/edits 多图序列化的兼容风险 |
| 有参考图走 `images/edits`(产品图 + POP 平面稿),无参考图走 `generations` | 生成结果必须与用户上传的产品一致,这是赛题核心要求 |
| POP/PDP 平面稿用本地 SVG 模板引擎确定性渲染,0 模型调用 | 可控、可复现、可解释消耗;只有写实场景图消耗模型调用 |
| POP 平面稿由前端 canvas 栅格化成 PNG 再送模型 | OpenAI edits 不接受 SVG;免服务端原生依赖(sharp/resvg) |
| `/generated`、`/uploads` 用路由处理器服务运行时文件 | `next start` 只服务构建时已存在的 public 文件,否则生产模式演示全 404 |
| 台账页 `force-dynamic` | 静态预渲染会冻结现场生成记录 |
| manifest 写入用 promise 队列串行化 | 并发上传时读-改-写竞态会丢记录 |

## 已知风险与对策
- **演示前必须用真实 OPENAI_API_KEY 实测一次全链路**(gpt-image-1 需组织验证;不可用时换模型或配置中转)。
- `openai` npm 包已不再引用,但 pnpm store 版本不匹配暂未从 package.json 移除(无害)。
- 现场断网/配额异常:勾选 Mock 保底即可继续演示,降级原因会显示在界面上。

## 资源
- 工作目录:`E:\workspace\nato-studio\AI设计赛道`
- 运行手册:`docs/demo-runbook.md`

## 2026-07-14 PDP 画布交互重构
- 当前 `PdpEditor` 在画布上方用逐行表单完成排序、启停、新增和配图，下方仅展示服务端导出的 SVG 图片；这不满足“直接在下方交互”的要求。
- 参考图表达的是横向树结构：第一列 Brand，第二列 KV，第三列 2 个 SP1，第四列 3 个 SP2，后续列容量递增；所有列顶部对齐。
- 卖点优先级由左到右递减，因此默认块尺寸也应逐列递减。拖动后需要保存自由坐标，而不只是交换数组顺序。
- 画布内需要完成块选择、文字编辑、启停/删除、配图替换和新增卖点；产品、国家、语言等文档级设置可保留为紧凑工具栏。
- 最终导出必须复用画布布局状态，而不是再次按服务端固定规则重排。
- 画布采用固定逻辑尺寸并按容器缩放显示，拖动坐标在逻辑坐标系中保存；这样桌面、移动端和最终 SVG 使用同一套坐标，不会因 CSS 缩放产生导出偏差。
- Canvas 负责高频选择与拖动，所选块的文本和图片属性放在紧邻画布的检查器中；这仍属于“在下方直接交互”，同时避免在位文本输入破坏 Canvas 的拖拽手势。
- 服务端只接受经过 `parsePdpCanvasLayout` 清洗的布局数据，未知块、越界尺寸和非法坐标会被规范化后再渲染，避免客户端请求直接污染导出 SVG。

## 2026-07-14 POP 产品类型 Canvas 重构
- 冰箱模板固定为 4 组：Main Sticker - USP（2 个变体）、Main Sticker - Feature（2 个变体）、Inner Sticker & Display（3 个变体）、Side Sticker（1 个变体）。
- 烤箱模板固定为 6 组：Main Sticker（2 个变体）、Corner Sticker（2 个变体）、Inner Display（1 个变体）、Wobbler（1 个变体）、Body Sticker（3 个变体）、Top Sticker（1 个变体）。
- 参考图中的蓝色区域是可编辑文字区，灰色区域是用户图片槽；它们属于 Sticker 内部内容，不是可自由拖动的独立块。
- Canvas 应展示当前产品类型的完整模板总览并维持资料中的固定分组布局；点击某个具体变体后，只编辑该变体。
- AI 写实贴装调用必须使用当前选中的单个变体平面稿，而不是把整张模板总览或同组所有候选方案送入模型。

## 2026-07-15 烤箱 POP 参考图决策
- Corner Sticker 是一个双面工程结构，不是两个互斥方案；因此产品选择器只暴露一个 Corner 模板。
- Main B 底部三段 bullet 不能用三个普通胶囊；第 2/3 段的左缘必须用凹圆弧贴合前一段的右圆头。
- Body B 的蓝弹与灰图等高并从图片右边缘开始；Body C 的蓝弹从图片右边缘开始且垂直居中。
- Wobbler 是两段连续竖排内容，每段都有 Headline Space 和 Subheading Space；Top 的文字弹与灰图顶部对齐。

## 2026-07-15 烤箱 POP 第二轮几何决策
- Main Sticker 参考图是横向约 3:2，不是 4:5 竖版；模板元数据、SVG viewBox 和 Canvas 预览框必须同步修改。
- Wobbler 的蓝条是图片底部覆盖层，不是排在图片之后的独立行。
- Inner Display 蓝条必须从灰图左边开始，宽度约为灰图 60%，且不能覆盖到图片底边。
- Body B/C 的整体长宽比会直接影响 Canvas 预览，不能只调内部坐标而保留过高的 SVG 画布。

## 2026-07-16 Seedream 图像与 Seedance 2.0 Fast 接口确认
- Seedream 图像统一使用火山方舟 `POST /api/v3/images/generations`；默认模型为 `doubao-seedream-5-0-lite-260128`，支持文生图、参考图编辑和多图输入。
- 图片生成接口的 `image` 字段支持 URL 或 Base64，因此本地素材无需部署公网文件服务器即可传入 Seedream 图像模型。
- 产品视频使用 `doubao-seedance-2-0-fast-260128`；通过 `POST /api/v3/contents/generations/tasks` 创建异步任务，并通过 `GET /api/v3/contents/generations/tasks/{id}` 轮询。
- Seedance 成功响应在 `content.video_url` 返回成片地址；任务状态为 `queued`、`running`、`succeeded`、`failed` 或 `cancelled`。
- 产品视频固定 15 秒、16:9、720p；提示词以用户给出的 Hero Product Film 文案作为单份可编辑默认值，产品参考图作为唯一 `reference_image` 输入。
- 方舟统一使用 `ARK_API_KEY` 与 `ARK_BASE_URL`；图像和视频模型 ID 均允许通过环境变量覆盖，便于账号实际开通的模型版本不同。
## 2026-07-17 Seedance 1.5 Pro 与 SKU 局部替换约束
- 火山引擎公开资料给出的 Seedance 1.5 Pro 模型 ID 为 `doubao-seedance-1-5-pro-251215`；该版本支持 2–12 秒，因此产品 Hero Film 的接口时长改为 12 秒，创意提示词仍保留完整三镜头叙事目标。
- SKU 功能必须保持上传驱动、产品类型无关；空气炸锅、控制面板、把手和包边只作为默认提示词示例，不能写成固定业务枚举。
- 参考部件替换要求产品图和部件图缺一不可，二者按 image 1 / image 2 顺序送入图像编辑模型。
- 颜色与样式替换共用区域选择器：画笔、橡皮、清空和基于像素连通性的点击智能选区；选区必须导出真实 PNG alpha 蒙版并传入服务端。
- OpenAI 图像编辑使用原生 multipart `mask` 字段；Seedream 当前接口无独立 mask 字段，因此将蒙版作为额外参考图，并在提示词中明确蒙版语义。
## 2026-07-17 SKU Canvas 长宽比问题
- 当前 SKU 产品图 `图片1.png` 的原始尺寸为 355×334，宽高比约 1.063。
- `.canvasStage` 同时使用 `width: 100%`、动态 `aspect-ratio` 和固定 `max-height: 680px`；容器宽度大于按比例允许的宽度时，高度被单独截断，CSS 最终尺寸不再遵循原图比例。
- 修复方式是按图像比例计算“680px 高度对应的最大宽度”，让画布缩小并水平居中；底图仅在尺寸分析完成后与 Canvas 同步渲染。
# 2026-07-17 Icon Design VI 模板应用

- 现有图像服务已支持按顺序传入多张参考图，适合固定约定为：image 1 色彩 VI、image 2 Icon VI、image 3 源 Icon。
- VI 解析属于视觉语言理解，不应由前端拼接固定文案冒充识别；新增独立视觉解析 API，并保留默认模板与人工编辑能力。
- 六类输出应拆成独立图片：四种颜色版本为方形 Icon 资产，两种图文版式分别为方形上下排版和横向左右排版。
- Icon Design 与具体产品档案无关，使用独立工作区资产 ID 持久化，不在页面重复国家与语言控件。
- 生产构建确认 `/icon-design` 为静态页面，两个 Icon Design API 为动态路由；本地生产服务上的页面与参数校验均正常。
- 未在没有用户 VI 与源 Icon 的情况下触发付费模型调用；真实图片生成需要在页面上传三张参考图后执行。
## 2026-07-18 PPT Keywords 风格迁移资料
- 图像范围固定为 7 套关键词模板：拉美热带现代、Lab 建筑实验室、高端通用、北欧编辑感、北欧家居、日式暗场展陈、日式明场展陈。
- 明确排除视频内容：拉美/Lab/高端资料中的 TVC、VIDEO 和产品视频页；北欧第 6 页起的视频脚本与静帧工作流；日式第 16 页起的视频工作流。
- 拉美关键词页为热带现代主义场景拼图，核心视觉是暖米色、森林绿、藕粉、胡桃木、自然采光和真实人物互动。
- Lab 关键词页为黑白灰建筑厨房拼图，核心视觉是纯白发光空间、石墨灰体块、黑色金属、实验室秩序和精密工业设计。
- 风格参考不应使用带大段文字的整页截图；每套从关键词页提取 3 张代表性原图，与用户产品图按固定顺序作为多图参考输入。
- 生成规则：用户输入或选择 Keywords，系统匹配/确认风格模板；每个选定风格固定产生 3 张互有构图变化的图像，产品外观与结构必须保持一致。- 高端通用关键词页以建筑化开放厨房、不锈钢中岛、木色/米白/暖棕与下午侧后方阳光为主，整体低饱和、沉稳、电影感，适合作为通用高端生活场景。
- 北欧编辑感关键词页不是完整厨房，而是雾蓝、淡粉橘、香槟色的柔和渐变和轻盈时尚编辑构图；参考图强调空气感、梦幻感和人物/产品局部关系。- 北欧家居关键词页强调现代丹麦高端住宅、浅色天然橡木、暖白/米色、倾斜屋顶、冬季雪景漫反射和舒适真实的生活尺度。
- 日式暗场展陈关键词页是纯黑无边空间、三面暖白推拉门式发光墙、深色反射地面和中轴展陈构图；人物与道具必须极少，产品保持唯一视觉核心。
- 日式明场展陈不是暗场的提亮版本：它使用明亮无边空间、推拉木门式墙体、正面近对称构图与大量留白，应作为独立风格模板。
- 北欧住宅关键词页只有 2 张独立有效参考图，日式明场有 4 张；模型输入保留 PPT 实际有效资产数量，不复制图片凑数。
- 生成服务的参考顺序必须可追溯：用户产品素材 ID 在前，`style-reference:*` 资产 ID 在后；成本台账同步记录两类来源。
- 用户 Keywords 优先于预设默认词，匹配词只负责选择底层 PPT 风格系统，不覆盖用户输入。
## 2026-07-21 首页紧凑玻璃工作台
- 参考图的主窗比例约为视口宽 72%、高 76%，桌面端采用 72vw × 76dvh，并分别限制最大 1180×720px。
- 指定的绿色、橙色和浅蓝视觉图已作为项目静态资产，分别用于前两个主功能卡和日期/天气卡。
- 顺德天气由服务端 /api/weather 调用 Open-Meteo，坐标为 22.8057, 113.2934，前端每 10 分钟刷新且失败时显示 Unavailable。
- 底部十个工具卡使用原生横向滚动；黑色 range 滑点和滚动位置双向同步。
- 所有卡片继续继承首页玻璃颜色、透明度、模糊和饱和度 CSS 变量。
## 2026-07-21 全站紧凑玻璃外壳
- 首页和功能页现在共用 72vw × 76dvh、最大 1180×720px 的桌面工作台，以及 190px 的侧栏尺寸。
- 子页导航根据 usePathname 高亮当前入口，品牌上标统一为 9px 常规字重，导航统一为 11px。
- 两条窄线性流光沿左上至右下轨迹循环，错开半个周期；减少动态效果偏好下停止动画。
- 子页文字元素上限统一为 11px，表单和按钮为 10px；网格与表单采用 16px 列距和 18px 行距。
- 普通玻璃按钮改为鼠尾草半透明底和深色文字；主操作、删除和选中状态分别使用深绿、浅红和暖色规则，避免浅灰底白字。

## 阶段 16 定位补充（2026-07-21）
- 风格迁移末项误选来自 `matchStyleTransferPreset` 的关键词计分：两个日式预设共享词较多，显式点击后仍可能按排序回到较早的暗场预设。
- 风格迁移的 `minmax(680px, ...)`、七列最小宽度和三列工作区最小宽度按浏览器宽度响应，而不是按 AppShell 内容宽度响应，导致壳层缩小后内部横向溢出。
- POP Canvas 每次内容变化会重新生成并加载全部方案的 SVG 预览；图片替换还会预取所有方案素材，这是整块画布卡顿的直接原因。
- PDP Canvas 已采用居中裁切绘制，导出仍保留横向树布局；需把交互布局与纵向导出布局分离。
- 共享图片编辑器可在上传前输出已居中裁切的 PNG，使 POP/PDP 后续渲染只消费处理后的文件。
- 定位时曾使用与 PowerShell `Invoke-History` 冲突的 `R` 函数名，并误查不存在的 `PdpCanvasEditor.module.css`；现已改用实际的 `PdpEditor.module.css` 与 `PdpEditor.test.tsx`。
## 2026-07-21 阶段 16 实现结论
- AppShell 对所有 source/result/output/preview 图像卡统一拉伸和内部行轨道，上传图与三视角结果不再因内容高度不同而错位；全部 `select` 被约束在父容器内并使用左侧垂直居中、单行省略。
- 风格迁移显式点击预设时以预设 ID 为准，只有用户手工修改 Keywords 后才重新匹配，避免“日式明亮展厅”被共享关键词回退为暗场。
- POP 预览改用按模板 ID 和内容签名缓存，只重建当前选中且内容变化的方案；其他方案沿用缓存图，避免替换图片时整板重绘。
- POP/PDP 共用上传前裁切弹窗：默认居中 cover，支持拖动、缩放、重置和按目标灰框比例输出 PNG。
- PDP 交互画布品牌块固定使用 `public/pdp/midea-brand-no1.png`，品牌说明在检查器中可编辑；服务端导出将品牌、KV、卖点、More Features 和 Specification 统一转为 920px 宽的纵向长图。
- Icon Design 仅保留两张紧凑 VI 预览，提示词模板继续内部使用但不再向用户开放编辑。
## 2026-07-22 新一轮界面与 POP 调整
- 用户要求恢复中性文字色，蓝色仅保留在生成按钮的实心视觉层次中。
- 外框默认边框改为灰白三段渐变，主窗与当前菜单分别使用用户给定的透明度、角度、宽度和白色流光。
- 首页临时玻璃/边框参数入口需要隐藏，但底层设置与持久化能力保留。
- POP 不再调用 AI 生成写实贴装图；改为在指定冰箱产品图上直接叠加当前 Sticker，并让用户拖动与缩放后导出。
- 按既有要求，本轮不打开或控制本地浏览器。
## 2026-07-22 Stage 17 live findings
- Homepage still renders GlassTuner and EdgeTuner in the top-right action row; hide both triggers while preserving the shared settings hook/CSS variables.
- Homepage structure already separates hero, three feature cards, and quick-tool scroller, so requested 4:3 and 3:4 geometry can be handled in CSS without changing navigation data.
- SKU generation overflow is caused by the top control band keeping the model select and long generation button in one rigid row; use a shrinkable grid/minmax layout and cap the action width.
- POP still submits to /api/pop/generate-scene; replace that result flow with an in-browser refrigerator sticker compositor and PNG export.
- Existing edge defaults are blue and stored under the original localStorage key; use the requested neutral defaults and a versioned key so old blue defaults do not override them.
