import { randomUUID } from "node:crypto";
import { fetch as undiciFetch, ProxyAgent } from "undici";
import type { LocalAssetStore } from "@/src/services/local-asset-store";

export type SourceImage = {
  bytes: Buffer;
  contentType: string;
  filename: string;
};

export type ImageProviderInput = {
  taskId: string;
  prompt: string;
  sourceAssetIds: string[];
  sourceImages?: SourceImage[];
  maskImage?: SourceImage;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
};

export type ImageProviderResult = {
  url: string;
  model: string;
  prompt: string;
  sourceAssetIds: string[];
  isFallback: boolean;
  generatedAt: string;
  failureReason?: string;
};

export type ImageProvider = {
  generateImage(input: ImageProviderInput): Promise<ImageProviderResult>;
  editImage(input: ImageProviderInput): Promise<ImageProviderResult>;
};

export type ImageGenerationRequest = {
  model: string;
  prompt: string;
  size: string;
};

export type ImageEditRequest = {
  model: string;
  prompt: string;
  size: string;
  images: SourceImage[];
  mask?: SourceImage;
};

export type ImageGenerationResponse = {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
};

export type ImageGenerationOutput = NonNullable<ImageGenerationResponse["data"]>[number];

export type ImageApiClient = {
  images: {
    generate(input: ImageGenerationRequest): Promise<ImageGenerationResponse>;
    edit(input: ImageEditRequest): Promise<ImageGenerationResponse>;
  };
};

export type CreateImageProviderOptions = {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  imageStore?: LocalAssetStore;
  clientFactory?: (apiKey: string) => ImageApiClient | Promise<ImageApiClient>;
};

export const DEFAULT_IMAGE_MODEL = "gpt-image-1";

class OpenAIImageProvider implements ImageProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl?: string,
    private readonly imageStore?: LocalAssetStore,
    private readonly clientFactory?: (apiKey: string) => ImageApiClient | Promise<ImageApiClient>
  ) {}

  async generateImage(input: ImageProviderInput): Promise<ImageProviderResult> {
    if (!this.apiKey) {
      throw new Error("未配置 OPENAI_API_KEY,系统需要联网使用图像模型。");
    }

    try {
      const client = await this.createClient();
      const size = input.size ?? "1024x1024";
      const response = input.sourceImages?.length
        ? await client.images.edit({
            model: this.model,
            prompt: input.prompt,
            size,
            images: input.sourceImages,
            mask: input.maskImage
          })
        : await client.images.generate({
            model: this.model,
            prompt: input.prompt,
            size
          });
      const output = response.data?.[0];
      const url = await this.resolveOutputUrl(input.taskId, output);

      if (!url) {
        throw new Error("OpenAI response contained no image data.");
      }

      return {
        url,
        model: this.model,
        prompt: input.prompt,
        sourceAssetIds: input.sourceAssetIds,
        isFallback: false,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      const failureReason = error instanceof Error ? error.message : String(error);
      console.error(`[image-provider] OpenAI call failed for ${input.taskId}: ${failureReason}`);
      throw error instanceof Error ? error : new Error(failureReason);
    }
  }

  async editImage(input: ImageProviderInput): Promise<ImageProviderResult> {
    return this.generateImage(input);
  }

  private async createClient(): Promise<ImageApiClient> {
    if (this.clientFactory) {
      return this.clientFactory(this.apiKey);
    }

    return createFetchImageApiClient(this.apiKey, this.baseUrl);
  }

  private async resolveOutputUrl(
    taskId: string,
    output: ImageGenerationOutput | undefined
  ): Promise<string | undefined> {
    if (!output) {
      return undefined;
    }

    if (output.url) {
      return output.url;
    }

    if (!output.b64_json) {
      return undefined;
    }

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
}

export function createImageProvider(options: CreateImageProviderOptions): ImageProvider {
  const apiKey = options.apiKey?.trim() ?? "";

  return new OpenAIImageProvider(
    apiKey,
    options.model ?? DEFAULT_IMAGE_MODEL,
    options.baseUrl,
    options.imageStore,
    options.clientFactory
  );
}

export function createFetchImageApiClient(apiKey: string, baseUrl?: string): ImageApiClient {
  const apiRoot = normalizeApiRoot(baseUrl ?? process.env.OPENAI_BASE_URL);
  const dispatcher = createProxyDispatcher();

  async function parseResponse(response: Response): Promise<ImageGenerationResponse> {
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`OpenAI API ${response.status}: ${text.slice(0, 400)}`);
    }

    return JSON.parse(text) as ImageGenerationResponse;
  }

  return {
    images: {
      async generate(input) {
        const response = await fetchOpenAi(`${apiRoot}/images/generations`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: input.model,
            prompt: input.prompt,
            size: input.size
          })
        }, dispatcher);
        return parseResponse(response);
      },

      async edit(input) {
        const multipart = createImageEditMultipartBody(input);
        const response = await fetchOpenAi(`${apiRoot}/images/edits`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": multipart.contentType
          },
          body: multipart.body as unknown as BodyInit
        }, dispatcher);
        return parseResponse(response);
      }
    }
  };
}

function createImageEditMultipartBody(input: ImageEditRequest): {
  body: Buffer;
  contentType: string;
} {
  const boundary = `----midea-openai-${randomUUID()}`;
  const chunks: Buffer[] = [];

  appendMultipartText(chunks, boundary, "model", input.model);
  appendMultipartText(chunks, boundary, "prompt", input.prompt);
  appendMultipartText(chunks, boundary, "size", input.size);
  for (const image of input.images) {
    appendMultipartFile(chunks, boundary, "image[]", image);
  }
  if (input.mask) {
    appendMultipartFile(chunks, boundary, "mask", input.mask);
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`, "utf8"));

  return {
    body: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

function appendMultipartText(
  chunks: Buffer[],
  boundary: string,
  name: string,
  value: string
): void {
  chunks.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${escapeMultipartValue(name)}"\r\n\r\n${value}\r\n`,
      "utf8"
    )
  );
}

function appendMultipartFile(
  chunks: Buffer[],
  boundary: string,
  name: string,
  image: SourceImage
): void {
  chunks.push(
    Buffer.from(
      [
        `--${boundary}`,
        `Content-Disposition: form-data; name="${escapeMultipartValue(name)}"; filename="${escapeMultipartValue(image.filename)}"`,
        `Content-Type: ${image.contentType}`,
        "",
        ""
      ].join("\r\n"),
      "utf8"
    )
  );
  chunks.push(Buffer.from(image.bytes));
  chunks.push(Buffer.from("\r\n", "utf8"));
}

function escapeMultipartValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}
export function normalizeApiRoot(baseUrl: string | undefined): string {
  const trimmed = baseUrl?.trim();
  return (trimmed || "https://api.openai.com/v1").replace(/\/+$/, "");
}

export function createProxyDispatcher(configuredProxyUrl?: string): ProxyAgent | undefined {
  const proxyUrl = normalizeProxyUrl(
    configuredProxyUrl ??
      process.env.OPENAI_PROXY_URL ??
      process.env.HTTPS_PROXY ??
      process.env.HTTP_PROXY ??
      process.env.ALL_PROXY
  );

  return proxyUrl ? new ProxyAgent({ uri: proxyUrl }) : undefined;
}

function normalizeProxyUrl(proxyUrl: string | undefined): string | undefined {
  const trimmed = proxyUrl?.trim();
  if (!trimmed || trimmed.toLowerCase().startsWith("socks")) {
    return undefined;
  }
  return trimmed;
}

export async function fetchOpenAi(
  url: string,
  init: RequestInit,
  dispatcher: ProxyAgent | undefined
): Promise<Response> {
  try {
    if (!dispatcher) {
      return await fetch(url, init);
    }

    const undiciInit = { ...init, dispatcher } as unknown as Parameters<typeof undiciFetch>[1];
    return (await undiciFetch(url, undiciInit)) as unknown as Response;
  } catch (error) {
    const connectionMode = dispatcher ? "configured HTTP proxy" : "direct connection";
    throw new Error(
      `Network request to ${getRequestHost(url)} failed via ${connectionMode}: ${describeNetworkError(error)}`,
      { cause: error }
    );
  }
}

export function describeNetworkError(error: unknown): string {
  const messages: string[] = [];
  const visited = new Set<unknown>();
  let current: unknown = error;

  while (current && !visited.has(current)) {
    visited.add(current);
    const detail = current as {
      message?: unknown;
      code?: unknown;
      errno?: unknown;
      syscall?: unknown;
      address?: unknown;
      port?: unknown;
      cause?: unknown;
    };

    if (typeof detail.message === "string" && detail.message.trim()) {
      messages.push(detail.message.trim());
    }

    const connectionDetails = [
      ["code", detail.code],
      ["errno", detail.errno],
      ["syscall", detail.syscall],
      ["address", detail.address],
      ["port", detail.port]
    ]
      .filter((entry): entry is [string, string | number] =>
        typeof entry[1] === "string" || typeof entry[1] === "number"
      )
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");

    if (connectionDetails) {
      messages.push(connectionDetails);
    }

    current = detail.cause;
  }

  return [...new Set(messages)].join("; ") || String(error);
}

function getRequestHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
