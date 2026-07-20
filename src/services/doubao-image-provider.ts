import type { LocalAssetStore } from "@/src/services/local-asset-store";
import {
  createProxyDispatcher,
  fetchOpenAi,
  type ImageGenerationOutput,
  type ImageGenerationResponse,
  type ImageProvider,
  type ImageProviderInput,
  type ImageProviderResult
} from "@/src/services/image-provider";

export const DEFAULT_DOUBAO_IMAGE_MODEL = "doubao-seedream-5-0-lite-260128";
export const DEFAULT_ARK_API_ROOT = "https://ark.cn-beijing.volces.com/api/v3";

type DoubaoImageProviderOptions = {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  imageStore?: LocalAssetStore;
};

class DoubaoImageProvider implements ImageProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl: string,
    private readonly imageStore?: LocalAssetStore
  ) {}

  async generateImage(input: ImageProviderInput): Promise<ImageProviderResult> {
    if (!this.apiKey) {
      throw new Error("未配置 ARK_API_KEY，无法调用豆包 Seedream 图像模型。");
    }

    const sourceImages = [
      ...(input.sourceImages ?? []),
      ...(input.maskImage ? [input.maskImage] : [])
    ];
    const response = await fetchOpenAi(
      `${this.baseUrl}/images/generations`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          prompt: input.prompt,
          size: toDoubaoSize(input.size ?? "1024x1024"),
          ...(sourceImages.length
            ? {
                image: sourceImages.map(
                  (image) => `data:${image.contentType};base64,${image.bytes.toString("base64")}`
                )
              }
            : {}),
          sequential_image_generation: "disabled",
          stream: false,
          response_format: "b64_json",
          watermark: false
        })
      },
      createProxyDispatcher(process.env.ARK_PROXY_URL)
    );

    const payload = await parseDoubaoResponse(response);
    const output = payload.data?.[0];
    const url = await this.resolveOutputUrl(input.taskId, output);
    if (!url) {
      throw new Error("豆包 Seedream 响应中没有可用的图像数据。");
    }

    return {
      url,
      model: payload.model ?? this.model,
      prompt: input.prompt,
      sourceAssetIds: input.sourceAssetIds,
      isFallback: false,
      generatedAt: new Date().toISOString()
    };
  }

  editImage(input: ImageProviderInput): Promise<ImageProviderResult> {
    return this.generateImage(input);
  }

  private async resolveOutputUrl(
    taskId: string,
    output: ImageGenerationOutput | undefined
  ): Promise<string | undefined> {
    if (!output) {
      return undefined;
    }
    if (output.b64_json) {
      if (!this.imageStore) {
        return `data:image/png;base64,${output.b64_json}`;
      }
      const saved = await this.imageStore.saveGeneratedImage({
        taskId,
        filename: `${taskId}.png`,
        contentType: "image/png",
        bytes: Buffer.from(output.b64_json, "base64")
      });
      return saved.url;
    }
    return output.url;
  }
}

type DoubaoImageResponse = ImageGenerationResponse & { model?: string };

async function parseDoubaoResponse(response: Response): Promise<DoubaoImageResponse> {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`豆包 Seedream API ${response.status}: ${text.slice(0, 400)}`);
  }
  try {
    return JSON.parse(text) as DoubaoImageResponse;
  } catch {
    throw new Error("豆包 Seedream API 返回了无法解析的响应。");
  }
}

export function createDoubaoImageProvider(options: DoubaoImageProviderOptions): ImageProvider {
  return new DoubaoImageProvider(
    options.apiKey?.trim() ?? "",
    options.model?.trim() || DEFAULT_DOUBAO_IMAGE_MODEL,
    normalizeArkApiRoot(options.baseUrl),
    options.imageStore
  );
}

export function normalizeArkApiRoot(value: string | undefined): string {
  return (value?.trim() || DEFAULT_ARK_API_ROOT).replace(/\/+$/, "");
}

export function toDoubaoSize(size: NonNullable<ImageProviderInput["size"]>): string {
  if (size === "1536x1024") {
    return "2400x1600";
  }
  if (size === "1024x1536") {
    return "1600x2400";
  }
  return "2048x2048";
}
