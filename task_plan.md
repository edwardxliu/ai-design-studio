# 任务计划：美的海外产品营销 AI assistant 演示平台

## 目标
基于赛道 B 演示任务材料，分析并实现一个可演示的 AI 广告设计/海外产品营销 assistant 平台，覆盖任务要求中的核心功能、素材约束与演示流程。

## 当前阶段
阶段 6：PDP 可视化画布编辑器重构

## 各阶段

### 阶段 1：材料解析与需求建模
- [x] 确认工作目录和输入材料
- [ ] 抽取赛道 B 演示任务要求
- [ ] 抽取品牌、产品、素材约束
- [ ] 对比 brief 与赛道 A，识别可复用背景和非本赛道范围
- [ ] 将发现记录到 findings.md
- **状态：** completed

### 阶段 2：演示范围与功能规格
- [ ] 将任务要求拆成演示用户流程
- [ ] 定义必须实现、可模拟、可降级的功能边界
- [ ] 明确数据模型、页面结构、交互和输出物
- [ ] 形成可执行规格并等待确认
- **状态：** pending

### 阶段 3：实现方案与工程搭建
- [ ] 检查是否已有项目框架
- [ ] 选择技术栈和本地运行方式
- [ ] 建立或补齐演示应用结构
- [ ] 准备静态数据、素材索引和 mock AI 流程
- **状态：** pending

### 阶段 4：功能实现
- [ ] 实现产品/场景/市场输入工作流
- [ ] 实现营销内容生成与编辑流程
- [ ] 实现广告视觉生成/版式预览/多渠道导出流程
- [ ] 实现演示任务要求中的评估、复盘或协作相关功能
- **状态：** pending

### 阶段 5：验证与演示交付
- [ ] 本地运行并完成浏览器验证
- [ ] 检查移动端和桌面端布局
- [ ] 记录已满足的需求矩阵
- [ ] 给出运行地址、演示脚本和后续建议
- **状态：** pending

## 关键问题
1. 赛道 B PDF 中的硬性演示任务、评分点和提交物分别是什么？
2. 演示平台是需要纯前端 mock，还是要接入真实 AI API？默认先按可本地稳定演示的 mock/可替换接口设计。
3. 是否已有品牌素材可直接使用，还是需要从 PDF 中抽取并做静态资产索引？

## 已做决策
| 决策 | 理由 |
|------|------|
| 先分析 PDF 并建立需求矩阵，再进入设计和实现 | 用户要求先开始分析，且材料多、范围大，直接编码容易遗漏赛道要求 |
| 使用本地 Markdown 文件持续记录计划、发现和进度 | 任务会跨多轮、多文件、多阶段，防止需求和素材约束丢失 |

## 遇到的错误
| 错误 | 尝试次数 | 解决方案 |
|------|---------|---------|

| `apply_patch` 工具在 Windows 受限沙箱中无法执行 | 3 | 改用 unified diff 通过 `git apply` 写入工作区 |
| PowerShell 默认管道编码导致中文补丁无法匹配 | 2 | 显式将 `$OutputEncoding` 设置为无 BOM UTF-8 |
| 开发服务器运行期间执行 `next build` 导致共享 `.next` 缓存失效 | 1 | 删除生成缓存并重启 `next dev`，构建验证与开发服务不再并行运行 |
| 受限沙箱启动 Next.js 子进程时报 `spawn EPERM` | 2 | 经授权在沙箱外以隐藏后台进程启动开发服务器 |
| Windows 工作区对手写多 hunk 补丁和反斜杠路径解析不一致 | 5 | 由完整目标文件生成 git diff --no-index，规范化补丁头后再应用 |

### 阶段 6：PDP 可视化画布编辑器重构
- [x] 核对当前 PdpEditor、PDP 数据模型、SVG 导出链路与用户截图
- [x] 建立优先级树形布局模型：Brand、KV、2 个 SP1、3 个 SP2、4 个 SP3，以此类推
- [x] 将上方卖点表单替换为真实 Canvas 交互区，支持选择、拖动、直接编辑和配图
- [x] 将画布坐标、尺寸与层级传入服务端导出，保证编辑结果与最终文件一致
- [x] 更新单元测试、类型检查与构建验证
- [x] 用真实浏览器验证拖拽、编辑、响应式布局和导出流程
- **状态：** completed

## 阶段 6 决策
| 决策 | 理由 |
|------|------|
| 画布编辑状态作为 PDP 导出的唯一布局数据源 | 防止页面预览与导出结果不一致 |
| Brand 与 KV 为固定语义块，卖点为可拖动内容块 | 符合参考图的树形层级，并保留用户自由排版能力 |
| 卖点按优先级分列，列容量依次为 2、3、4……，越靠左块越大 | 对应用户明确要求，优先级可直接从视觉尺寸和位置识别 |

### 阶段 7：POP 产品类型模板 Canvas 重构
- [x] 核对冰箱/烤箱参考图、当前 POP 模板模型、平面稿与 AI 写实贴装链路
- [x] 建立产品类型、Sticker 组与固定变体的数据模型
- [x] 用真实 Canvas 展示产品对应的完整固定模板版面
- [x] 支持 Canvas 单选 Sticker、蓝色文字编辑与灰色图片区替换
- [x] 将当前选中的单个 Sticker 平面稿接入 AI 写实贴装生成链路
- [ ] 更新 POP 领域与组件测试、类型检查和构建验证
- [ ] 用真实浏览器验证冰箱/烤箱切换、组内单选、编辑、上传和生成
- **状态：** completed

## 阶段 7 决策
| 决策 | 理由 |
|------|------|
| 产品类型决定整套 POP 模板，不提供跨品类模板选择 | 当前品牌资料仅定义冰箱与烤箱两套工程模板 |
| Sticker 组和组内变体均固定，Canvas 不支持新增、删除或拖动 | 对齐资料模板的固定数量和固定版式 |
| 全局只选择一个具体 Sticker 变体用于单次 AI 贴装生成 | 避免一个组内多个候选造型同时进入模型，符合用户单选要求 |

### 阶段 8：烤箱 POP 参考图校正
- [x] Main Sticker / Hero A/B 图文边缘对齐，B 底部三段 bullet 使用右圆弧嵌套连接
- [x] Corner Sticker 合并为单一固定方案，同时呈现蓝色品牌面与灰色设计面
- [x] Body Sticker 按圆形、横条、方图加右侧文字弹三种固定几何重画
- [x] Wobbler 改为两组上下连续的图片加标题/副标题弹
- [x] Top Sticker 改为灰图与顶部对齐的右圆角文字弹
- [x] 定向测试、全量测试、类型检查、生产构建与 HTTP 健康检查
- **状态：** completed

### 阶段 9：烤箱 POP 第二轮几何细化
- [x] Main A/B 改为 3:2 横向比例，Main B 增加 Subheading Space
- [x] Body A 蓝条上移并缩短，Body B 改为 8:1 且边框与蓝条共线，Body C 改为 4:1 并校正图文长度比
- [x] Inner Display 蓝条左对齐、缩短且底部保留灰色留白
- [x] Wobbler 两段蓝条改为覆盖在各自灰图底边
- [x] 完成 SVG 坐标回归、全量测试、类型检查、生产构建与 HTTP 健康检查
- **状态：** completed

## 2026-07-16 Seedream 与产品视频扩展

- [x] 为白底多角度、手机图标准化、SKU 替换、风格迁移、POP 和本地化加入 OpenAI / Seedream 图片模型选择。
- [x] 接入 Seedream 5.0 Lite 方舟图片 API，并保持本地输出与成本台账逻辑。
- [x] 新增即梦 Seedance 2.0 Fast 产品视频页面、任务创建/轮询、15 秒 Hero Film 默认提示词和本地 MP4 缓存。
- [x] 增加侧边栏与首页入口，补充 `.env.local` 配置说明。
- [x] 通过 139 项全量测试、类型检查、生产构建与 localhost HTTP 冒烟验证。
### 阶段 10：Seedance 1.5 Pro 与 SKU 局部替换工作台
- [x] 核对 Seedance 1.5 Pro 的方舟模型 ID 与时长约束
- [x] 将产品视频默认模型切换为 `doubao-seedance-1-5-pro-251215`，并把请求时长调整到模型支持范围
- [x] 建立 SKU 三类替换的领域模型、提示词与图像蒙版链路
- [x] 实现双图部件替换、画笔/自动选区颜色替换、画笔/自动选区样式替换工作台
- [x] 补齐 API、组件、领域和供应商测试
- [x] 完成全量测试、类型检查、生产构建与 HTTP 冒烟验证
- **状态：** completed

## 当前阶段（2026-07-17）
阶段 10：Seedance 1.5 Pro 与 SKU 局部替换工作台| `rg` 搜索命令中的 PowerShell 双引号转义破坏正则分组 | 1 | 改用单引号包裹正则后成功定位图像模型与上传调用 || PowerShell 首轮文本替换把 `` `r`n `` 当作字面量，未匹配 image-provider | 1 | 改为使用 `[Environment]::NewLine` 与稳定单行锚点 |
| `src/domain/types.ts` 的换行格式与组合锚点不一致 | 1 | 改为单行锚点并立即补回 `document` 与三个 SKU 类型 || PowerShell `foreach { ... } | Format-*` 在当前版本解析为空管道 | 2 | 先累积到 `$rows`，循环结束后再格式化 |
| `pnpm start -- -p 3000` 将 `--` 传给 Next 并被当作项目目录 | 1 | 改用 `PORT=3000` 环境变量后后台启动成功 |
| `Invoke-WebRequest` 读取 400 错误响应流时阻塞 | 1 | 改用 Node `fetch` 并设置命令超时，两个 400 校验均通过 || 未授权环境下读取全部 `Win32_Process` 命令行被拒绝 | 1 | 改为用 `netstat -ano` 精确锁定 3000 端口的 node PID 后停止 |
### 阶段 11：SKU 选区画布长宽比修复
- [x] 核对上传图片原始尺寸与页面实际显示比例
- [x] 移除只限制高度导致的 Canvas 横向拉伸
- [x] 让底图、覆盖层、指针坐标和导出蒙版共用同一比例
- [x] 补充比例计算测试并完成类型检查、构建和 HTTP 验证
- **状态：** completed

## 当前阶段（2026-07-17）
阶段 11：SKU 选区画布长宽比修复

| PowerShell `try/finally` 结果直接接管道再次触发空管道解析错误 | 1 | 先保存 `$result`，再在语句结束后格式化输出 |
### 阶段 12：Icon Design VI 模板应用工作区
- [x] 建立 VI 色彩规范、Icon 规范、源 Icon 三类专用素材与六个固定输出规格
- [x] 实现视觉模型解析 VI 并生成可编辑提示词模板的 API
- [x] 实现 OpenAI / Seedream 可选的 4 种颜色版本与 2 种图文版式批量生成
- [x] 增加独立页面、侧边栏和首页入口，并持久化上传素材
- [x] 补齐领域、服务、组件和导航测试，完成类型检查、构建与 HTTP 验证
- **状态：** completed

## 阶段 12 错误记录
| 错误 | 次数 | 处理 |
|---|---:|---|
| `apply_patch` 在 Windows 受限沙箱中无法准备可写根目录 | 1 | 按用户已授权范围改用仅限当前项目的 PowerShell/.NET UTF-8 文件编辑 |
| PowerShell 首次使用单引号包裹换行锚点，导致按字面量匹配失败 | 1 | 改用 `[Environment]::NewLine` 组合精确锚点后完成修改 |

| PowerShell 临时变量 `$home` 与只读内置变量冲突 | 1 | 改用 `$homeContent` 后完成首页写入 |

| 通用 imageModel 锚点同时命中本地化输入，产生重复 `size` 字段 | 1 | 删除本地化类型中的重复字段并保留原有尺寸联合类型 |

### 阶段 13：PPT Keywords 驱动的图像风格迁移工作台
- [x] 解析三份 PPT 的幻灯片文本、图片关系与视频页边界
- [x] 建立 7 套风格 Keywords、提示词模板与 PPT 原始代表性参考图资产
- [x] 实现专用风格迁移页面、关键词匹配、产品选择和每风格 3 张输出
- [x] 接入 OpenAI / Seedream 多参考图生成 API 与成本台账
- [x] 补齐领域、服务、组件测试，完成类型检查、构建和 HTTP 验证
- **状态：** completed

#### 阶段 13 错误记录
| 错误 | 次数 | 处理 |
|---|---:|---|
| PPT 渲染脚本在 Windows 默认 GBK 下解码失败 | 1 | 强制 UTF-8 后确认真实错误并改用后台 PowerPoint COM 导出指定页 |
| artifact-tool 渲染器未定位到绑定运行时包 | 1 | 不重复调用，改用 PowerPoint COM 与 PPTX XML 双重核对 |
| montage 工具临时目录权限失败 | 2 | 放弃 montage，改为压缩单页缩略图逐页视觉检查 |
| `apply_patch` 更新既有文件时被 Windows 受限沙箱拒绝 | 2 | 新文件继续使用 `apply_patch`，既有文件按用户授权改用工作区内 PowerShell/.NET UTF-8 精确替换 |
| Vitest / Next 构建工作进程在受限沙箱中 `spawn EPERM` | 2 | 使用获批的项目级 `pnpm test` 与 `pnpm build` 执行完整验证 |
### 阶段 14：首页紧凑玻璃工作台重构（2026-07-21）
- [x] 将主工作台缩小到参考图约 72vw × 76vh 的占比并保持响应式
- [x] 首页问候与说明改为 Gotham 英文文案
- [x] 中部改为三个等宽玻璃功能块并接入指定视觉素材和缓慢流动效果
- [x] 右上角增加动态日期与顺德实时天气玻璃块
- [x] 底部改为更多小型工具块和黑色滑块控制的横向轨道
- [x] 左侧栏增加持续流动的底光
- [x] 完成首页测试、类型检查与构建验证
- **状态：** completed

#### 阶段 14 错误记录
| 错误 | 次数 | 处理 |
|---|---:|---|
| Next.js Route 额外导出天气映射函数导致生产构建类型失败 | 1 | 将映射函数移动到 src/domain/weather.ts，Route 仅保留允许的 HTTP 导出 |
| 后台 next dev 受旧 Node 进程与 .next 状态干扰，持续停在 Starting | 2 | 结束本次创建的进程，重新完成生产构建并改用 next start 验证 |
| Codex 命令结束后回收后台预览进程 | 3 | 不再重复启动；记录 HTTP 200 验证结果，由用户终端长期运行服务 |
### 阶段 15：全站紧凑玻璃外壳与可读性统一（2026-07-21）
- [x] 核对首页与功能页工作台、侧栏、按钮和字号差异
- [x] 将首页与全部功能页统一为相同工作台和侧栏尺寸
- [x] 将侧栏底光改为两条左上至右下循环流光并统一当前页高亮
- [x] 修正全站浅灰按钮文字对比度，压缩子页字号并放宽内容间距
- [x] 完成定向测试、类型检查与生产构建
- **状态：** completed
### 阶段 16：全站视觉细节与 POP/PDP 图片工作流（2026-07-21）
- [x] 定位流光、图框、下拉框、风格预设状态和 Canvas 数据流
- [x] 加宽双流光并统一图像框、下拉框和首页滑杆样式
- [x] 压缩风格迁移页面并修复日式明亮展厅选择状态
- [x] 压缩 Icon Design VI 预览并隐藏提示词模板编辑
- [x] 实现 POP/PDP 共用的图片缩放、居中和裁切编辑器
- [x] 优化 POP 选中方案图片替换的局部刷新
- [x] 更新 PDP Brand、可编辑文案和纵向长图导出
- [x] 完成定向测试、全量测试、类型检查与生产构建
- **状态：** completed

#### 阶段 16 错误记录
| 错误 | 次数 | 处理 |
|---|---:|---|
| PowerShell 多行锚点混用 LF/CRLF，首次 CSS 精确替换未命中 | 2 | 改用换行兼容的正则单次替换，并在写入后执行类型检查与生产构建 |
| 新增 PDP 品牌图缓存时只读元组与可写元组类型不兼容 | 1 | 将缓存入口显式统一为 `[string, string | undefined]` 后过滤为 `[string, string]` |
| 旧 POP 上传测试未确认新增裁切弹窗 | 1 | 增加 Canvas `toBlob` 模拟并点击“应用裁切”，验证裁切后资产写回 |
### 阶段 17：玻璃主题收口、首页重排与 POP 本地贴装编辑器（2026-07-22）
- [ ] 核对首页、AppShell、SKU、风格迁移与 POP 当前结构
- [ ] 恢复中性文字色并应用用户指定灰白边框/流光默认值
- [ ] 压缩全站外壳高度并统一普通按钮、菜单和首页卡片边框
- [ ] 重排首页信息区、4:3 功能卡和 3:4 快捷卡，隐藏参数调节器
- [ ] 修复 SKU 生成按钮在窄宽度/Mac 下溢出
- [ ] 优化菜单、风格预设和 SKU 模式切换性能
- [ ] 将 POP 从 AI 写实生成改为指定产品底图上的拖动/缩放本地贴装
- [ ] 更新测试并完成类型、CSS 与定向回归验证
- **状态：** in_progress

### 阶段 18：CreativeStudio AI 封面页迁移（2026-07-22）
- [x] 创建独立功能分支 `codex/cover-page`
- [x] 核对源封面页面组件、样式、动效和静态素材依赖
- [x] 将现有工作台首页迁移到独立路由并保持所有入口可用
- [x] 将封面页迁入根路由，Start now 导航到工作台
- [x] 复制最小必要素材并补充路由/交互测试
- [x] 使用 npm 完成类型检查、定向测试和生产构建
- **状态：** completed

### 阶段 19：封面边界 AI 聊天入口（2026-07-22）
- [x] 核对 Luma 风格参考、封面边界结构和现有文本模型网络链路
- [x] 定义聊天消息协议、页面意图映射和服务端模型调用
- [x] 在蓝/白页面交界处加入随页面自然滚走的悬浮聊天框
- [x] 加入 4 个常用页面直达入口与 1 个省略号按钮
- [x] 补充聊天、跳转和错误状态测试
- [x] 使用 npm 完成类型检查、定向测试和生产构建
- **状态：** completed

## Stage 20 - Brand.ai-style video section (completed)
- [x] Replace the complete Imagine / Shape / Share workflow section.
- [x] Add the requested headline, supporting copy, and Start Now route to `/studio-home`.
- [x] Copy and verify the supplied 1920x1080 hero video under `public/midea-ai/`.
- [x] Match the warm off-white, centered black typography, compact dark CTA, and rounded video composition.
- [x] Verify with npm typecheck, a focused Vitest test, and HTTP checks without opening a browser.

## Stage 21 - Alternating execution video showcase (completed)
- [x] Insert a new section between the Brand hero video and the final city section.
- [x] Build three alternating rows with video positions left, right, and left.
- [x] Use the supplied demo1, demo2, and demo3 videos with the exact requested copy.
- [x] Match the reference with spacious two-column composition, dotted media canvases, thin borders, and restrained typography.
- [x] Verify with npm typecheck, focused Vitest coverage, HTTP order checks, and video asset responses.
## Stage 22 - POP transparency and compact homepage header (completed)
- [x] Remove the full-canvas white background from every refrigerator and oven POP SVG.
- [x] Preserve alpha while rasterizing POP artwork to PNG.
- [x] Remove the requested studio-home supporting sentence.
- [x] Add content-width responsive behavior for the background, date, and weather controls.
- [x] Verify with npm typecheck, focused Vitest coverage, and HTTP 200 checks without opening a browser.

## Stage 23 - Demo modification brief assessment (2026-09-26)
- [x] Inspect the supplied PDF text and whole-page visual.
- [x] Inspect the four workflow mockups at readable resolution and map them to current code.
- [x] Run relevant baseline checks without paid generation or application changes.
- [x] Prepare recommended scope, dependencies, risks, and effort assumptions for the assessment response.
- Scope: assessment first; preserve current business code and existing user changes.
- Status: completed (assessment only; implementation has not started).
- Diagnostic note: the 3840x3522 PNG could be verified with Pillow but the image viewer rejected it twice; a 2400px JPEG rendered from the same PDF was readable. Use JPEG crops for detailed inspection.
- Verification note: Vitest initially could not spawn esbuild in the sandbox (EPERM). The authorized elevated local run completed: 12 files, 41 passing tests and one failing pre-existing POP interaction test. TypeScript passed. No production build, live-browser acceptance, or real image generation was performed for this assessment.

## Stage 24 - Approved navigation, settings, and preset style-transfer update
- User approved the preceding bounded design and requested these three areas be completed; no new subsystem, model training, or changes to the other production workflows.
- [x] Add failing tests for grouped route access, settings persistence, asset selection/upload, output counts, and retry behavior.
- [x] Consolidate navigation and personalized controls across homepage and feature pages.
- [x] Implement brief-aligned preset style transfer with in-page material selection and a complete result flow.
- [x] Run focused and full regression tests, TypeScript, build, and local visual checks.
- [x] Review the diff, record limitations, and deliver the changed version.
- Preserve all pre-existing user files and the known unrelated POP test baseline failure.
- Status: completed; scoped workflows verified. Existing unrelated tests still have the five reproduced baseline failures.

## Stage 25 - Investigate reported OpenAI multipart 400
- [x] Trace the failed style-transfer request and validate multipart transport with local parsing and safe non-generation probes if needed.
- [x] Reproduce any confirmed serializer defect in a focused regression test before making a narrow fix.
- [x] Verify affected providers, rebuild, and state the remaining live-generation acceptance boundary.
- Preserve the completed UI changes, user data, credentials, and existing unrelated test failures. No paid generation without a clear need and user direction.
- Status: completed for the multipart defect. Production-minified regression, rebuilt direct/proxy request parsing, and the authorized invalid-model upstream check passed. Actual valid-model image generation remains untested by explicit scope.
- Verification: focused 8/8 tests passed; full low-concurrency suite 219/224 passed with exactly the five previously reproduced baseline failures; production build/type validation passed; preview restored on 127.0.0.1:3101 and style-transfer GET returned 200.
