# Midea Overseas Product Marketing AI Assistant Demo Design

## 目标

搭建一套本机运行的 Next.js AI 内容生产 DEMO，用于现场展示“用户上传任意产品资料后，系统如何承接素材、识别产品卖点、生成产品图、套用 POP/PDP 模板、本地化、多语言输出、记录消耗并复用到其他品类”。

系统不写死冰箱、烤箱、空调等品类。冰箱和烤箱只作为内置演示样例包，真实产品入口必须支持用户上传任意家电或其他产品素材。

## 运行形态

- 架构：本机 B/S。
- 前端：Next.js 工作台，浏览器访问 `localhost`。
- 后端：Next.js API routes/server actions，负责文件接收、任务编排、OpenAI 调用、mock fallback、资源消耗记录。
- 存储：DEMO 阶段优先使用本地文件系统 + JSON 数据；后续可替换 SQLite/Postgres。
- AI：OpenAI 图像生成/编辑能力封装为 provider。联网且配置 API key 时走真实调用；失败或未配置时返回预置 mock 结果，并记录 fallback。

## 核心演示流程

1. 用户创建项目或选择内置演示项目。
2. 用户上传产品图片、产品资料、品牌规范、模板参考和可选素材。
3. 系统生成 `ProductProfile`，识别品类、型号、卖点、目标市场、语言和可生成任务。
4. 用户进入 AI 任务中心，选择白底图、标准化产品图、SKU 替换、风格迁移、POP、PDP、本地化或动态延展任务。
5. 系统生成结果，并把每个结果标记产品名称、国家版本、语言版本、模板类型、模板版本和生成方式。
6. 用户可编辑模板文字、替换图片、重新生成或导出。
7. 系统记录每个任务的调用、耗时、模型、fallback 状态和估算资源消耗。

## 数据模型

```ts
type Project = {
  id: string;
  name: string;
  status: "draft" | "ready" | "generating" | "review" | "archived";
  productIds: string[];
  targetCountries: string[];
  targetLanguages: string[];
  createdAt: string;
};

type Product = {
  id: string;
  projectId: string;
  category?: string;
  brand?: string;
  modelName?: string;
  displayName?: string;
  profileId?: string;
};

type Asset = {
  id: string;
  projectId: string;
  productId?: string;
  type:
    | "product-photo"
    | "phone-shot"
    | "brand-guide"
    | "template-reference"
    | "feature-icon"
    | "background"
    | "pop-input"
    | "pdp-input"
    | "document";
  filename: string;
  url: string;
  source: "uploaded" | "demo-seed" | "generated";
  metadata?: Record<string, string>;
};

type ProductProfile = {
  id: string;
  productId: string;
  category: string;
  detectedFeatures: SellingPoint[];
  brandSlogan?: string;
  targetAudience?: string;
  valueProposition?: string;
  localizationHints: string[];
  confidence: number;
};

type SellingPoint = {
  id: string;
  title: string;
  shortLabel: string;
  benefit: string;
  technicalProof?: string;
  priority: number;
  sourceAssetId?: string;
};

type GenerationTask = {
  id: string;
  projectId: string;
  productId: string;
  type:
    | "white-background"
    | "standardize-phone-shot"
    | "sku-variant"
    | "style-transfer"
    | "pop-render"
    | "pop-product-scene"
    | "pdp-render"
    | "localization"
    | "motion-storyboard";
  status: "queued" | "running" | "done" | "failed" | "fallback";
  inputs: Record<string, unknown>;
  outputArtifactIds: string[];
};

type OutputArtifact = {
  id: string;
  taskId: string;
  projectId: string;
  productId: string;
  type: "image" | "template" | "storyboard" | "json" | "report";
  url: string;
  label: {
    productName: string;
    country: string;
    language: string;
    templateType?: "POP" | "PDP";
    templateVersion?: string;
  };
  provenance: {
    model?: string;
    prompt?: string;
    sourceAssetIds: string[];
    generatedAt: string;
    isFallback: boolean;
  };
};
```

## POP 模块设计

### 业务目标

POP 功能用于生成“贴着 POP 物料的写实产品图”。它不是单纯导出一张平面海报，而是两段式流程：

1. 用户在固定 POP 模板里替换图片、编辑文字。
2. 系统把完成后的 POP 作为参考素材，生成一张写实风格产品图，呈现 POP 贴在产品指定位置上的效果。

### POP 模板

系统默认提供几套固定模板。模板来自赛道资料里的 POP 类型，但实现上保持品类无关。

示例模板：

- `main-sticker-feature`
- `main-sticker-usp`
- `inner-sticker-display`
- `side-sticker`
- `corner-sticker`
- `body-sticker`
- `top-sticker`

每个模板定义：

```ts
type PopTemplate = {
  id: string;
  name: string;
  version: string;
  aspectRatio: string;
  slots: PopSlot[];
  placementHints: string[];
};

type PopSlot =
  | {
      id: string;
      type: "text";
      label: string;
      defaultValue: string;
      maxLength: number;
      editable: true;
    }
  | {
      id: string;
      type: "image";
      label: string;
      acceptedAssetTypes: Asset["type"][];
      editable: true;
    };
```

### POP 用户流程

1. 用户选择产品和 POP 模板。
2. 系统展示模板编辑器。
3. 用户替换模板内图片槽位，例如产品局部图、icon、卖点图。
4. 用户编辑模板内文字，例如 headline、USP、feature label、说明文字。
5. 系统先生成一张平面 POP 预览图。
6. 用户选择 POP 贴附位置，例如门体、面板、侧面、内胆、机身顶部。
7. 用户点击“生成贴附产品图”。
8. 后端把产品图、POP 平面图、贴附位置和写实风格 prompt 传给图像 provider。
9. 输出写实图，并记录 `pop-product-scene` 任务。

### POP 生成逻辑

POP 有两个输出物：

- `pop-flat-render`：模板平面图，使用前端 canvas/SVG/HTML-to-image 渲染，稳定可控。
- `pop-product-scene`：贴在产品上的写实图，使用 OpenAI 图像编辑/生成，失败时 fallback 到 mock 图。

POP prompt 需要包含：

- 保持产品主体不变。
- 将用户完成的 POP 贴在指定位置。
- 写实摄影风格。
- 不改变产品品牌、面板、比例、颜色和关键结构。
- 不生成额外文字；POP 上的文字以用户输入图为准。

## PDP 模块设计

### 业务目标

PDP 功能用于把产品信息结构里的卖点自动转成“长截图式产品详情页”。它比 POP 更复杂，重点是动态模板：

- 系统识别 `产品信息结构-REF` 里的产品卖点。
- 根据卖点数量自动生成 PDP 区块。
- 黑色矩形框和窄灰色矩形框填入识别到的卖点标题、短描述或技术证明。
- 灰色大矩形框由用户上传图片填入。
- 封面和卖点区块合并为一张长图。

### PDP 输入

PDP 的输入来自两个来源：

1. AI 识别出的 `ProductProfile.detectedFeatures`。
2. 用户上传的区块图片，例如产品场景图、卖点图、细节图、icon 图。

用户可以在 PDP 编辑器里调整：

- 是否启用某个卖点。
- 卖点顺序。
- 黑色框标题。
- 窄灰色框说明。
- 每个卖点对应的大图。
- 封面图。
- 国家和语言。

### PDP 动态模板结构

```ts
type PdpDocument = {
  id: string;
  productId: string;
  country: string;
  language: string;
  templateVersion: string;
  cover: PdpCover;
  sections: PdpSection[];
};

type PdpCover = {
  title: string;
  subtitle?: string;
  imageAssetId: string;
};

type PdpSection = {
  id: string;
  sellingPointId: string;
  order: number;
  blackTitle: string;
  narrowGrayText: string;
  largeImageAssetId?: string;
  layout: "image-left" | "image-right" | "image-full";
};
```

### PDP 生成规则

1. 若卖点数量为 1-2 个：生成封面 + 每个卖点一个大区块。
2. 若卖点数量为 3-5 个：生成封面 + 交错布局区块，避免长图单调。
3. 若卖点数量超过 5 个：优先选择高优先级卖点生成主区块，其余进入 `More Features & Icon Specification` 区域。
4. 黑色矩形框填入卖点短标题，例如 `Counter Depth Optimization`。
5. 窄灰色矩形框填入利益点或技术证明，例如 `23 cu.ft. / 640L capacity`。
6. 灰色大矩形框必须由用户上传图片或已生成图片填充；如果缺少图片，显示占位并阻止最终导出。
7. 生成的 PDP 是一张长图，导出为 PNG/WebP。

### PDP 渲染逻辑

PDP 不优先使用 AI 直接生成整张详情页。理由：

- 用户要求具体框位填入识别卖点和上传图片，版式需要可控。
- 长图对文字排版、图片槽位、标签位置要求稳定。
- AI 直接生成整图容易出现文字错误。

因此 PDP 采用确定性渲染：

1. AI 负责识别卖点、建议顺序、本地化文案。
2. 用户确认或编辑文案和图片。
3. 前端以 HTML/CSS 或 canvas 渲染 PDP 预览。
4. 后端导出长图。

后续可增加 AI 辅助生成 PDP 区块配图，但长图合成仍由模板引擎完成。

## 页面结构

DEMO 使用侧边栏工作台，减少现场切换成本：

- `/`：项目驾驶舱。
- `/intake`：资料上传与结构化识别。
- `/tasks`：AI 任务中心。
- `/pop`：POP 模板编辑与写实贴图生成。
- `/pdp`：PDP 卖点识别、动态模板编辑和长图导出。
- `/localization`：国家、语言、本地化变体。
- `/costs`：资源消耗与追溯台账。

## API 结构

```txt
POST /api/upload
POST /api/intake/analyze
GET  /api/projects/:id
GET  /api/products/:id/profile
POST /api/generate/image
POST /api/generate/edit
POST /api/pop/render-flat
POST /api/pop/generate-scene
POST /api/pdp/build
POST /api/pdp/export
GET  /api/costs
```

## OpenAI Provider

```ts
type ImageProvider = {
  generateImage(input: GenerateImageInput): Promise<ImageResult>;
  editImage(input: EditImageInput): Promise<ImageResult>;
};
```

配置：

```txt
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-2
DEMO_USE_MOCK=false
```

规则：

- 没有 `OPENAI_API_KEY` 时自动 mock。
- 调用失败或超时时自动 mock，并记录 fallback。
- 每次调用都写入 `CostRecord`。
- 前端不接触 API key。

## 演示样例与真实上传

系统同时保留两种入口：

- `Use demo pack`：加载美的样例数据，保证现场稳定。
- `Upload product assets`：用户上传任意产品素材，触发结构化识别流程。

所有模块都基于通用 `ProductProfile` 工作，不能依赖具体品类名称。

## 验证标准

- 可以从上传或样例包进入项目。
- 可以看到结构化产品资料和识别出的卖点。
- POP 可以选择模板、替换图片、编辑文字、生成平面预览和写实贴附图。
- PDP 可以根据卖点数量动态生成模板区块，并导出一张长图。
- 输出物标记产品名称、国家、语言、模板类型、模板版本。
- 资源消耗页面能展示任务、模型、调用、fallback、国家、语言和估算成本。
- 没有 OpenAI key 或网络失败时，系统仍可完成演示。

