# Midea AI Content Studio — 演示运行手册

## 本地启动

```powershell
pnpm install
pnpm build
pnpm exec next start --hostname 127.0.0.1 --port 3000
```

打开 `http://127.0.0.1:3000`。开发模式排练用 `pnpm dev`。
(注意:`pnpm start -- --hostname` 的参数透传在 next 15 下会报错,务必用 `pnpm exec next start`。)

## OpenAI 图像模式

真实配置写在 `.env.local`(git 已忽略;`.env.example` 只是模板,不要放真实 Key):

```txt
OPENAI_API_KEY=your_key
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_TEXT_MODEL=        # PDF 卖点提取模型,默认 gpt-4o-mini
OPENAI_BASE_URL=          # 可选中转,以 /v1 结尾
OPENAI_PROXY_URL=         # 可选本地代理,如 http://127.0.0.1:10808
```

**系统必须联网使用**:已移除 mock 保底;模型调用失败会在界面明确显示原因。

- 有参考图(产品照片 / POP 平面稿)自动走 `images/edits`,保证生成结果与用户上传的产品一致;无参考图走 `images/generations`。
- 白底类输出强制"纯白背景 #FFFFFF"硬约束;调用失败在界面显示具体原因。
- **演示前一天务必用真实 key 实测一遍全链路。**

## 豆包图片与即梦视频

豆包 Seedream 图片和即梦 Seedance 视频共用火山方舟 API Key。把真实值写入项目根目录 `.env.local`：

```txt
ARK_API_KEY=your_ark_api_key
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_PROXY_URL=            # 可选 HTTP/HTTPS 代理
DOUBAO_IMAGE_MODEL=doubao-seedream-5-0-lite-260128
DOUBAO_VIDEO_ENDPOINT_ID=      # 推荐：方舟控制台创建的视频推理接入点 ep-...
DOUBAO_VIDEO_MODEL=doubao-seedance-1-5-pro-251215
DOUBAO_VIDEO_FALLBACK_MODELS=doubao-seedance-1-0-pro-250528
DOUBAO_VIDEO_IMAGE_ROLE=first_frame
```

修改 `.env.local` 后必须重启 Next.js。图片生成页可在 OpenAI GPT Image 与豆包 Seedream 之间切换；`/product-video` 优先使用配置的 Endpoint ID 或 Seedance 1.5 Pro，遇到模型未开通的 404 时尝试显式配置的降级模型，并把实际模型显示在结果中。完成后自动轮询并把 MP4 缓存到 `public/generated/`。
## 平台工作流(演示主线)

侧边栏即工作流:每个生成能力都是独立页面,冰箱/烤箱等示例产品已移除,一切从用户建品开始:

1. **素材库 `/assets`** — 创建产品(可删除),上传四类资料:产品信息(PDF/txt/json)、品牌规范、模板资料、样例素材。
2. **产品档案 `/products`** — 「从产品信息识别卖点」:PDF 由大模型解析,识别结果可手工修正。
3. **白底多角度 / 手机图标准化 / SKU 替换 / 风格迁移 / 视频方向** — 五个独立功能页:选产品即生成(素材自动取自该产品),并行生成 + 实时进度条。
4. **产品视频 `/product-video`** — 选择产品档案中的上传图片，编辑 Hero Film 提示词，生成 15 秒 Seedance 成片。
5. **POP 设计 `/pop`** — 画布选 Sticker 模板 → 蓝块填文字、灰块换图 → 生成写实贴装图。
6. **PDP 构建 `/pdp`** — 横向树形动态模板,画布可拖拽调整,导出整页 PDP。
7. **本地化 `/localize`** — ①设置系统语言(所有输出的标注市场);②批量转换:勾选多张已生成图片 + 目标语言,系统把图内所有文字(含用户输入的文案)翻译成目标语言,用户无需会写外语。
8. **资源消耗 `/costs`** — 聚合 + 明细台账。

## 现场演示建议脚本(15 分钟)

1. 首页讲一遍工作流(1 分钟)。
2. 素材库:现场新建一个产品(评委指定品类),上传照片和卖点 PDF(2 分钟)。
3. 产品档案:一键识别卖点(大模型解析 PDF),现场改一条(2 分钟)。
4. 白底多角度页:选中新产品直接生成,展示并行进度条(3 分钟)。
5. POP:画布选 Sticker、蓝块改文字、灰块换图,生成写实贴装图(3 分钟)。
6. PDP:画布拖拽调整布局,导出整页(2 分钟)。
7. 本地化:批量勾选刚生成的图,转成另一门语言;资源消耗页收尾(2 分钟)。

预配置 vs 现场实时口径:预配置=POP/PDP 模板库、市场语言预设;现场实时=建品、上传、卖点识别、编辑、模型调用、批量本地化、台账记录。

## 本地产物位置

- 参考素材(不再自动加载):`public/demo-assets/`
- 用户上传:`public/uploads/`(运行时经 `/uploads` 路由服务)
- 生成结果:`public/generated/`(运行时经 `/generated` 路由服务)
- 产品档案 / 资产清单 / 消耗台账:`data/`(products.json / assets.json / cost-ledger.json)

`uploads/`、`generated/`、`data/` 已被 Git 忽略;`demo-assets/` 随仓库分发。
