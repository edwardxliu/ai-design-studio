import {
  createProxyDispatcher,
  fetchOpenAi,
  normalizeApiRoot
} from "@/src/services/image-provider";

export const DEFAULT_COVER_CHAT_MODEL = "gpt-4o-mini";

export type CoverChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CoverNavigationTarget = {
  href: string;
  label: string;
};

export type CoverChatReply = {
  reply: string;
  model?: string;
  navigation?: CoverNavigationTarget;
};

export type CoverChatCompletion = (input: {
  history: CoverChatHistoryMessage[];
  message: string;
  model: string;
}) => Promise<string>;

export type CreateCoverChatReplyInput = {
  history?: CoverChatHistoryMessage[];
  message: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  complete?: CoverChatCompletion;
};

type Destination = CoverNavigationTarget & {
  keywords: RegExp;
};

const DESTINATIONS: Destination[] = [
  { href: "/pop", label: "POP 设计", keywords: /\bpop\b|sticker|贴纸|海报/i },
  { href: "/pdp", label: "PDP 构建", keywords: /\bpdp\b|详情页|详情长图|产品长图/i },
  {
    href: "/white-background",
    label: "白底多角度",
    keywords: /白底多角度|白底图|三视角|多角度|catalog/i
  },
  {
    href: "/phone-standardize",
    label: "手机图标准化",
    keywords: /手机图标准化|手机拍摄|随手拍|非标准产品图|标准化/i
  },
  {
    href: "/sku-variants",
    label: "SKU 替换",
    keywords: /\bsku\b|局部替换|配件替换|部件替换|颜色替换|样式替换/i
  },
  {
    href: "/style-transfer",
    label: "风格迁移",
    keywords: /风格迁移|场景图|场景生成|style transfer|lifestyle/i
  },
  {
    href: "/icon-design",
    label: "Icon Design",
    keywords: /icon design|\bicon\b|图标设计|图标规范|标识设计/i
  },
  {
    href: "/product-video",
    label: "产品视频",
    keywords: /产品视频|视频生成|hero film|product film|product video/i
  },
  {
    href: "/localize",
    label: "本地化",
    keywords: /本地化|多语言|语言转换|翻译图片|localization/i
  },
  { href: "/assets", label: "素材库", keywords: /素材库|资产库|asset library/i },
  { href: "/products", label: "产品档案", keywords: /产品档案|产品信息|product profile/i },
  { href: "/costs", label: "资源消耗", keywords: /资源消耗|生成记录|成本记录|cost/i },
  { href: "/studio-home", label: "工作台", keywords: /工作台|系统首页|studio home|dashboard/i }
];

const NAVIGATION_ACTION =
  /打开|进入|跳转|带我去|前往|去到|我要去|我想去|我要做|我想做|开始做|开始制作|帮我做|帮我生成|open|go to|take me|navigate|start|create|make|design/i;

const SYSTEM_PROMPT = [
  "You are the concise bilingual assistant for Midea Overseas AI Content Studio.",
  "Reply in the language used by the user, unless they request another language.",
  "Help with product marketing creative workflows, prompts, planning, and choosing the right module.",
  "Keep most replies to 1-3 short sentences and no more than 100 words.",
  "Available modules include POP Design, PDP Builder, white-background multi-view images, phone-photo standardization, SKU replacement, style transfer, Icon Design, product video, localization, assets, and product profiles.",
  "Do not claim that you navigated anywhere; navigation is handled separately by the application."
].join(" ");

export function resolveCoverNavigation(message: string): CoverNavigationTarget | undefined {
  const normalized = message.trim();
  if (!normalized || !NAVIGATION_ACTION.test(normalized)) {
    return undefined;
  }

  const destination = DESTINATIONS.find((item) => item.keywords.test(normalized));
  return destination ? { href: destination.href, label: destination.label } : undefined;
}

export async function createCoverChatReply(
  input: CreateCoverChatReplyInput
): Promise<CoverChatReply> {
  const message = input.message.trim();
  const navigation = resolveCoverNavigation(message);
  if (navigation) {
    return {
      reply: `好的，正在为你打开${navigation.label}。`,
      navigation
    };
  }

  const apiKey = (input.apiKey ?? process.env.OPENAI_API_KEY ?? "").trim();
  const model =
    input.model?.trim() || process.env.OPENAI_TEXT_MODEL?.trim() || DEFAULT_COVER_CHAT_MODEL;
  if (!apiKey && !input.complete) {
    throw new Error("未配置 OPENAI_API_KEY，暂时无法进行普通对话。");
  }

  const history = (input.history ?? [])
    .slice(-10)
    .map((item) => ({ role: item.role, content: item.content.slice(0, 2_000) }));
  const complete = input.complete ?? createDefaultCompletion(apiKey, input.baseUrl);
  const reply = (await complete({ history, message, model })).trim();
  if (!reply) {
    throw new Error("模型没有返回可显示的内容。");
  }

  return { reply, model };
}

function createDefaultCompletion(apiKey: string, baseUrl?: string): CoverChatCompletion {
  const apiRoot = normalizeApiRoot(baseUrl ?? process.env.OPENAI_BASE_URL);
  const dispatcher = createProxyDispatcher();

  return async ({ history, message, model }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    try {
      const response = await fetchOpenAi(
        `${apiRoot}/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...history,
              { role: "user", content: message }
            ],
            temperature: 0.45,
            max_tokens: 240
          }),
          signal: controller.signal
        },
        dispatcher
      );

      const text = await response.text();
      if (!response.ok) {
        throw new Error(`OpenAI Chat API ${response.status}: ${text.slice(0, 400)}`);
      }

      const payload = JSON.parse(text) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return payload.choices?.[0]?.message?.content ?? "";
    } finally {
      clearTimeout(timeout);
    }
  };
}
