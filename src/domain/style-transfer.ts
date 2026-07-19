export const STYLE_TRANSFER_STYLE_IDS = [
  "latin-american",
  "lab",
  "premium-universal",
  "nordic-editorial",
  "nordic-home",
  "japanese-dark",
  "japanese-light"
] as const;

export type StyleTransferStyleId = (typeof STYLE_TRANSFER_STYLE_IDS)[number];

export type StyleTransferReference = {
  id: string;
  url: string;
  alt: string;
};

export type StyleTransferPreset = {
  id: StyleTransferStyleId;
  label: string;
  sourceLabel: string;
  summary: string;
  keywords: string;
  matchTerms: string[];
  stylePrompt: string;
  peoplePrompt: string;
  references: StyleTransferReference[];
};

export const STYLE_TRANSFER_VARIANTS = [
  {
    id: "hero-scene",
    label: "产品主视觉",
    composition:
      "Create a premium hero key visual. Show the complete product clearly as the dominant subject, use a stable three-quarter or frontal composition, and reserve restrained negative space for later layout."
  },
  {
    id: "architectural-scene",
    label: "建筑空间",
    composition:
      "Create a wider architectural scene with accurate perspective and strong spatial depth. Keep the product visually prominent and naturally integrated into the environment rather than isolated or reduced to background decoration."
  },
  {
    id: "lifestyle-scene",
    label: "生活方式",
    composition:
      "Create a closer lifestyle scene or product interaction moment. A person may appear only when appropriate to the selected style, must not look at the camera, and must never obscure or compete with the product."
  }
] as const;

export type StyleTransferVariantId = (typeof STYLE_TRANSFER_VARIANTS)[number]["id"];

export const STYLE_TRANSFER_PRESETS: StyleTransferPreset[] = [
  {
    id: "latin-american",
    label: "拉美温暖极简",
    sourceLabel: "拉美风格 PPT",
    summary: "热带现代主义、洞石、深胡桃木与低饱和暖色自然光。",
    keywords:
      "极简、高级、阳光、柔和、写实、热带现代、温润、自然采光、森林绿、藕粉色、胡桃木、哑光黑",
    matchTerms: [
      "拉美",
      "热带",
      "森林绿",
      "藕粉",
      "胡桃木",
      "洞石",
      "tropical",
      "latin"
    ],
    stylePrompt:
      "A luxurious warm-minimalist interior with tropical modernism. Use warm beige, sand, milk-white travertine, deep walnut, matte black, restrained forest green and lotus pink accents. Soft realistic afternoon sunlight enters from the side, with controlled reflections, clean geometry, quiet organic luxury, high-end international appliance campaign photography, realistic materials, cool-neutral white balance and high dynamic range without an HDR look.",
    peoplePrompt:
      "When a person is included, use red-brown, off-white, denim blue, deep green, cream or another low-saturation warm outfit. The action is natural and continuous, never a rigid pose and never looking at the camera.",
    references: makeReferences("latin-american", 3, "拉美温暖极简风格参考")
  },
  {
    id: "lab",
    label: "建筑实验室",
    sourceLabel: "Lab 风格 PPT",
    summary: "纯白巨型空间、石墨灰体块、黑色金属与实验室般秩序。",
    keywords:
      "极简、高端、建筑感、现代、白色空间、纯白、浅灰、石墨灰、黑色金属、安静、理性、纯净、实验室与真实家居结合",
    matchTerms: [
      "lab",
      "实验室",
      "白色空间",
      "石墨灰",
      "黑色金属",
      "理性",
      "建筑感",
      "laboratory"
    ],
    stylePrompt:
      "A high-end minimal architectural appliance environment inside a vast luminous white space rather than a conventional room. Restrict the palette to pure white, light grey, graphite grey, black metal and only tiny warm natural-wood accents. Use sparse glassware or white ceramics, laboratory-level order and precision, large-area white diffused light, no direct sun and no yellow cast. Create realistic commercial architectural photography with a low-distortion 50mm perspective, deep focus, controlled stone, glass and metal reflections, large negative space and an atmosphere that combines an appliance design laboratory, gallery and believable home.",
    peoplePrompt:
      "When a person is included, use clean black, grey, white or beige clothing. The adult subject is quiet, focused and naturally interacting with the product, never posing or looking at the camera.",
    references: makeReferences("lab", 3, "建筑实验室风格参考")
  },
  {
    id: "premium-universal",
    label: "高端通用",
    sourceLabel: "高端通用风格 PPT",
    summary: "电影感建筑空间、午后侧逆光、木色暖棕与金属银。",
    keywords:
      "高端、现代、克制、建筑感、电影感、下午、侧后方阳光、明暗对比、整体偏暗、木色、米白、暖棕、金属银、低饱和、沉稳、细腻真实",
    matchTerms: [
      "高端通用",
      "电影感",
      "侧后方",
      "暖棕",
      "金属银",
      "沉稳",
      "cinematic",
      "premium"
    ],
    stylePrompt:
      "A premium international appliance key visual in a modern restrained architectural interior. Use cinematic commercial photography around 3 p.m.; sunlight enters from the side and rear, creating soft light patches and controlled contrast on walls, stone, glass and brushed metal. The scene remains slightly dark while the product is clear and sharp. Use low-saturation wood, off-white, warm brown and metallic silver, realistic fine material detail, restrained negative space and a subtle depth of field without obscuring the product.",
    peoplePrompt:
      "When a person is included, use a natural, confident modern adult with dark hair and a simple fitted dark-brown or black outfit. Keep the action believable and secondary to the product.",
    references: makeReferences("premium-universal", 3, "高端通用风格参考")
  },
  {
    id: "nordic-editorial",
    label: "北欧时尚编辑",
    sourceLabel: "北欧风格 PPT",
    summary: "轻盈、柔和、诗意的时尚杂志式家电视觉。",
    keywords:
      "时尚编辑广告、高级、安静、轻盈、柔和、杂志感、低对比、克制、现代、精致、诗意、自然光、淡淡逆光",
    matchTerms: [
      "北欧编辑",
      "时尚编辑",
      "杂志感",
      "轻盈",
      "诗意",
      "淡淡逆光",
      "editorial",
      "poetic"
    ],
    stylePrompt:
      "A premium fashion-editorial appliance key visual rather than a retail appliance advertisement. The mood is quiet, light, elegant, modern, soft, refined and slightly poetic. Use pale mist blue, champagne, soft pink or pale orange transitions only where supported by the reference images, with gentle natural light and subtle backlight. Treat the product like a sculptural fashion object with delicate material highlights, generous background area and no hard contrast, theatrical drama, cluttered kitchen, oppressive dark mass or cheap saturated color.",
    peoplePrompt:
      "When a person is included, present a relaxed Nordic lifestyle moment with simple low-saturation clothing and natural interaction. Avoid direct eye contact, exaggerated smiles and staged gestures.",
    references: makeReferences("nordic-editorial", 3, "北欧时尚编辑风格参考")
  },
  {
    id: "nordic-home",
    label: "北欧丹麦住宅",
    sourceLabel: "北欧风格 PPT",
    summary: "浅橡木、暖白、冬季漫反射与通透丹麦住宅。",
    keywords:
      "现代丹麦住宅、空间宽敞通透、建筑线条简洁、倾斜屋顶、暖色自然光、冬季雪景、暖白、奶油白、浅灰、浅橡木、室内设计杂志摄影",
    matchTerms: [
      "丹麦",
      "北欧住宅",
      "浅橡木",
      "冬季",
      "雪景",
      "倾斜屋顶",
      "danish",
      "nordic home"
    ],
    stylePrompt:
      "A spacious modern Danish residence with clean architectural lines, comfortable proportions and a pitched or triangular roof. Use small amounts of pale natural oak, warm-white matte surfaces, cream white and light grey with restrained black-metal accents. Winter daylight enters through large windows and snow creates soft even bounce light, while limited warm interior lighting keeps the atmosphere comfortable. Render realistic high-end residential architecture photography with genuine scale, spatial depth and magazine restraint; no showroom stiffness, clutter, HDR, obvious CG, exaggerated volumetric light or generic cheap Scandinavian decor.",
    peoplePrompt:
      "When a person is included, show a natural European adult in an off-white knit, light-grey sweater, linen shirt or another simple low-saturation outfit, interacting with the product in a candid close or medium-close moment without looking at the camera.",
    references: makeReferences("nordic-home", 2, "北欧丹麦住宅风格参考")
  },
  {
    id: "japanese-dark",
    label: "日式暗场展厅",
    sourceLabel: "日式风格 PPT",
    summary: "纯黑无边空间、暖白障子墙与仪式感舞台构图。",
    keywords:
      "极简、克制、未来感、展厅化、高级品牌、艺术装置、建筑几何、日式、国际化、黑、白、暖木、灰、深色石材、仪式感",
    matchTerms: [
      "日式暗",
      "暗场",
      "纯黑",
      "障子",
      "仪式感",
      "艺术装置",
      "japanese dark",
      "showroom"
    ],
    stylePrompt:
      "A minimal restrained futuristic Japanese showroom or art-installation space, not an ordinary home kitchen. Inside a pure black infinite room, three large warm-white luminous wall planes evoke simple Japanese shoji sliding doors and form a clean ceremonial stage. Use strong architectural geometry, central depth, dark reflective stone flooring, black, white, warm wood, grey and dark stone. Keep props almost absent, lines ordered and negative space generous. The product is a clearly lit modern design object with realistic metal, glass, lacquer or stone material response.",
    peoplePrompt:
      "When a person is included, use an elegant Asian adult in simple fashion-forward black, beige or restrained red clothing. The gesture is natural and minimal; the person establishes scale without competing with the product.",
    references: makeReferences("japanese-dark", 3, "日式暗场展厅风格参考")
  },
  {
    id: "japanese-light",
    label: "日式明亮展厅",
    sourceLabel: "日式风格 PPT",
    summary: "明亮无边空间、日式推拉木门、对称秩序与留白。",
    keywords:
      "极简、克制、未来感、展厅化、高级品牌、艺术装置、建筑几何、日式、明亮、白、黑、暖木、灰、深色石材、对称、留白",
    matchTerms: [
      "日式明",
      "明亮日式",
      "推拉木门",
      "对称",
      "留白",
      "明亮展厅",
      "japanese light",
      "bright showroom"
    ],
    stylePrompt:
      "A bright infinite Japanese-inspired showroom or art-installation space with strong architectural geometry and stage-like order. Three large wall planes evoke minimal Japanese sliding timber doors, creating a pure, quiet ceremonial environment. Use a frontal symmetric or near-symmetric composition, strong central depth, abundant white space, pale warm wood, white, black, grey and dark stone. The scene is bright but controlled, realistic and international, with almost no props. Present the product clearly as a modern design object integrated beside or into a restrained island or cabinet system.",
    peoplePrompt:
      "When a person is included, show an elegant Japanese or Asian adult wearing a simple Muji-like or Yohji-inspired black, beige or restrained red outfit, naturally leaning or interacting without looking at the camera.",
    references: makeReferences("japanese-light", 4, "日式明亮展厅风格参考")
  }
];

export function isStyleTransferStyleId(value: unknown): value is StyleTransferStyleId {
  return STYLE_TRANSFER_STYLE_IDS.includes(value as StyleTransferStyleId);
}

export function isStyleTransferVariantId(value: unknown): value is StyleTransferVariantId {
  return STYLE_TRANSFER_VARIANTS.some((variant) => variant.id === value);
}

export function getStyleTransferPreset(id: StyleTransferStyleId): StyleTransferPreset {
  const preset = STYLE_TRANSFER_PRESETS.find((item) => item.id === id);
  if (!preset) {
    throw new Error(`Unknown style transfer preset: ${id}`);
  }
  return preset;
}

export function getStyleTransferVariant(id: StyleTransferVariantId) {
  const variant = STYLE_TRANSFER_VARIANTS.find((item) => item.id === id);
  if (!variant) {
    throw new Error(`Unknown style transfer variant: ${id}`);
  }
  return variant;
}

export function matchStyleTransferPreset(
  keywords: string,
  fallback: StyleTransferStyleId = "premium-universal"
): StyleTransferPreset {
  const normalized = keywords.trim().toLowerCase();
  if (!normalized) {
    return getStyleTransferPreset(fallback);
  }

  const ranked = STYLE_TRANSFER_PRESETS.map((preset) => ({
    preset,
    score: preset.matchTerms.reduce(
      (score, term) => score + (normalized.includes(term.toLowerCase()) ? term.length : 0),
      0
    )
  })).sort((left, right) => right.score - left.score);

  return ranked[0].score > 0 ? ranked[0].preset : getStyleTransferPreset(fallback);
}

export function buildStyleTransferPrompt(input: {
  preset: StyleTransferPreset;
  variantId: StyleTransferVariantId;
  keywords: string;
  productName?: string;
}): string {
  const variant = getStyleTransferVariant(input.variantId);
  const keywords = input.keywords.trim() || input.preset.keywords;
  const productName = input.productName?.trim() || "the uploaded product";

  return [
    `Create one static, photorealistic commercial scene image containing ${productName}.`,
    "IMAGE REFERENCE ORDER AND AUTHORITY:",
    "- Image 1 is the only authoritative product reference. Reconstruct exactly the same product, not a similar design.",
    "- Images 2 and later are style references only. Learn their palette, lighting, material mood, architecture and composition language. Never copy, merge or reproduce any appliance or branded object from those style references.",
    "PRODUCT IDENTITY LOCK:",
    "Keep the product geometry, dimensions, proportions, doors, panels, handles, controls, vents, seams, materials, colors and logo position completely consistent with Image 1. Do not redesign, simplify, add, remove, mirror or relocate any part. Keep the product readable and unobstructed.",
    `USER KEYWORDS (high priority): ${keywords}.`,
    `STYLE SYSTEM: ${input.preset.stylePrompt}`,
    `COMPOSITION VERSION (${variant.label}): ${variant.composition}`,
    input.preset.peoplePrompt,
    "Use realistic perspective, commercial-grade material response, controlled light and a clean high-resolution finish. Integrate the product naturally by matching contact shadows, reflections, exposure and color temperature to the environment.",
    "OUTPUT RESTRICTIONS: output exactly one still image. No video, storyboard, split screen, contact sheet, before-and-after panel, motion blur, camera-motion notation, captions, typography, logos other than the unchanged logo already present on the product, watermark or UI."
  ].join("\n\n");
}

function makeReferences(
  styleId: StyleTransferStyleId,
  count: number,
  alt: string
): StyleTransferReference[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${styleId}-ref-${index + 1}`,
    url: `/style-references/${styleId}/ref-${index + 1}.jpg`,
    alt: `${alt} ${index + 1}`
  }));
}
