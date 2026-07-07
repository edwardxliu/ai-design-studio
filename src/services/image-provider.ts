import type { LocalAssetStore } from "@/src/services/local-asset-store";

export type ImageProviderInput = {
  taskId: string;
  prompt: string;
  sourceAssetIds: string[];
};

export type ImageProviderResult = {
  url: string;
  model: string;
  prompt: string;
  sourceAssetIds: string[];
  isFallback: boolean;
  generatedAt: string;
};

export type ImageProvider = {
  generateImage(input: ImageProviderInput): Promise<ImageProviderResult>;
  editImage(input: ImageProviderInput): Promise<ImageProviderResult>;
};

export type ImageGenerationRequest = {
  model: string;
  prompt: string;
  size: "1024x1024";
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
  };
};

export type CreateImageProviderOptions = {
  forceMock?: boolean;
  apiKey?: string;
  model?: string;
  imageStore?: LocalAssetStore;
  clientFactory?: (apiKey: string) => ImageApiClient | Promise<ImageApiClient>;
};

class MockImageProvider implements ImageProvider {
  async generateImage(input: ImageProviderInput): Promise<ImageProviderResult> {
    return createMockResult(input);
  }

  async editImage(input: ImageProviderInput): Promise<ImageProviderResult> {
    return createMockResult(input);
  }
}

class OpenAIImageProvider implements ImageProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly imageStore?: LocalAssetStore,
    private readonly clientFactory?: (apiKey: string) => ImageApiClient | Promise<ImageApiClient>
  ) {}

  async generateImage(input: ImageProviderInput): Promise<ImageProviderResult> {
    try {
      const client = await this.createClient();
      const response = await client.images.generate({
        model: this.model,
        prompt: input.prompt,
        size: "1024x1024"
      });
      const output = response.data?.[0];
      const url = await this.resolveOutputUrl(input.taskId, output);

      if (!url) {
        return createMockResult(input);
      }

      return {
        url,
        model: this.model,
        prompt: input.prompt,
        sourceAssetIds: input.sourceAssetIds,
        isFallback: false,
        generatedAt: new Date().toISOString()
      };
    } catch {
      return createMockResult(input);
    }
  }

  async editImage(input: ImageProviderInput): Promise<ImageProviderResult> {
    return this.generateImage(input);
  }

  private async createClient(): Promise<ImageApiClient> {
    if (this.clientFactory) {
      return this.clientFactory(this.apiKey);
    }

    const { default: OpenAI } = await import("openai");
    return new OpenAI({ apiKey: this.apiKey }) as unknown as ImageApiClient;
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
  const apiKey = options.apiKey?.trim();

  if (options.forceMock || !apiKey) {
    return new MockImageProvider();
  }

  return new OpenAIImageProvider(
    apiKey,
    options.model ?? "gpt-image-2",
    options.imageStore,
    options.clientFactory
  );
}

function createMockResult(input: ImageProviderInput): ImageProviderResult {
  return {
    url: `/mock/generated/${input.taskId}.png`,
    model: "mock-image-provider",
    prompt: input.prompt,
    sourceAssetIds: input.sourceAssetIds,
    isFallback: true,
    generatedAt: "2026-07-07T00:00:00.000Z"
  };
}
