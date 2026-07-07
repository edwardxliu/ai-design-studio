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

export type CreateImageProviderOptions = {
  forceMock?: boolean;
  apiKey?: string;
  model?: string;
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
    private readonly model: string
  ) {}

  async generateImage(input: ImageProviderInput): Promise<ImageProviderResult> {
    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: this.apiKey });
      const response = await client.images.generate({
        model: this.model,
        prompt: input.prompt,
        size: "1024x1024"
      });
      const url = response.data?.[0]?.url;

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
}

export function createImageProvider(options: CreateImageProviderOptions): ImageProvider {
  const apiKey = options.apiKey?.trim();

  if (options.forceMock || !apiKey) {
    return new MockImageProvider();
  }

  return new OpenAIImageProvider(apiKey, options.model ?? "gpt-image-2");
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

