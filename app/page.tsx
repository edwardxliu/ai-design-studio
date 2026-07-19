const pipeline = [
  {
    step: "01",
    href: "/assets",
    title: "素材库",
    detail: "上传并管理产品信息、品牌规范、模板资料与样例素材。素材决定后续所有功能的输入。"
  },
  {
    step: "02",
    href: "/products",
    title: "产品档案",
    detail: "从产品信息识别卖点,可手工修正。档案驱动 PDP 段落与产品图生成提示词。"
  },
  {
    step: "03",
    href: "/white-background",
    title: "图像生成",
    detail: "白底多角度、手机图标准化、SKU 替换、风格迁移、视频方向,每项都是独立功能页。"
  },
  {
    step: "04",
    href: "/icon-design",
    title: "Icon Design",
    detail: "解析上传的 VI 色彩与 Icon 规范，把任意功能符号统一为四种官方颜色和两种图文版式。"
  },
  {
    step: "05",
    href: "/product-video",
    title: "产品视频",
    detail: "选择产品档案中的上传图片，用豆包 Seedance 1.5 Pro 生成 12 秒高端 Hero Product Film。"
  },
  {
    step: "06",
    href: "/pop",
    title: "POP 设计",
    detail: "固定模板 + 可编辑文字 + 可替换图片,生成贴着 POP 的写实产品图。"
  },
  {
    step: "07",
    href: "/pdp",
    title: "PDP 构建",
    detail: "按卖点数量动态生成模板段落,排序 / 增删 / 换图后合成长图。"
  },
  {
    step: "08",
    href: "/localize",
    title: "本地化",
    detail: "选择国家与语言,把已生成图片中的文字替换成目标市场语言,其余保持不变。"
  },
  {
    step: "09",
    href: "/costs",
    title: "资源消耗",
    detail: "每次生成记录模型、模式、国家、语言与源素材,支持多维度查看。"
  }
];

const principles = [
  {
    title: "品类无关",
    detail: "新建产品并上传素材,即可获得全部生成能力,不限品类。"
  },
  {
    title: "输出可追溯",
    detail: "所有输出带产品 / 国家 / 语言 / 模板类型 / 版本标注,来源素材全程可查。"
  },
  {
    title: "联网实时生成",
    detail: "全部图像与卖点提取均实时调用在线模型;调用失败会明确显示原因。"
  }
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Overseas Product Marketing</p>
          <h1>Midea AI Content Studio</h1>
          <p className="lede">
            面向海外产品营销的 AI 设计平台:素材入库 → 卖点档案 → 图像生成 → POP / PDP 模板 →
            带标注交付与资源台账,一条链路完成。
          </p>
        </div>
        <div className="status-pill">本地运行 · 单机演示</div>
      </section>

      <section className="workflow-panel">
        <h2>工作流</h2>
        <div className="feature-grid">
          {pipeline.map((item) => (
            <a className="feature-link" href={item.href} key={item.href}>
              <strong>
                {item.step} · {item.title}
              </strong>
              <span>{item.detail}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="metric-grid" aria-label="平台原则">
        {principles.map((item) => (
          <article className="metric-card" key={item.title}>
            <span>{item.title}</span>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>
    </main>
  );
}