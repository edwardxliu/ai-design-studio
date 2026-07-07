import { getPrimaryDemoProduct } from "@/src/domain/demo-data";
import { buildPopScenePrompt } from "@/src/domain/pop";
import { buildPdpDocument, type PdpDocument } from "@/src/domain/pdp";
import {
  createImageProvider,
  type ImageProviderResult
} from "@/src/services/image-provider";

export type GenerateDemoImageInput = {
  taskId: string;
  prompt: string;
  sourceAssetIds: string[];
  forceMock?: boolean;
};

export type GenerateDemoPopSceneInput = {
  taskId: string;
  productName: string;
  placement: string;
  flatPopAssetId: string;
  forceMock?: boolean;
};

export type BuildDemoPdpInput = {
  country: string;
  language: string;
};

export type DemoCostRecord = {
  task: string;
  model: string;
  mode: string;
  country: string;
  language: string;
  estimatedUnits: number;
};

export async function generateDemoImage(
  input: GenerateDemoImageInput
): Promise<ImageProviderResult> {
  const provider = createImageProvider({
    forceMock: input.forceMock ?? process.env.DEMO_USE_MOCK === "true",
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2"
  });

  return provider.generateImage({
    taskId: input.taskId,
    prompt: input.prompt,
    sourceAssetIds: input.sourceAssetIds
  });
}

export async function generateDemoPopScene(
  input: GenerateDemoPopSceneInput
): Promise<ImageProviderResult> {
  const prompt = buildPopScenePrompt({
    productName: input.productName,
    placement: input.placement,
    flatPopAssetId: input.flatPopAssetId
  });

  const provider = createImageProvider({
    forceMock: input.forceMock ?? process.env.DEMO_USE_MOCK === "true",
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2"
  });

  return provider.editImage({
    taskId: input.taskId,
    prompt,
    sourceAssetIds: [input.flatPopAssetId]
  });
}

export function buildDemoPdp(input: BuildDemoPdpInput): PdpDocument {
  const product = getPrimaryDemoProduct();

  return buildPdpDocument({
    id: `pdp-${input.country.toLowerCase()}-${input.language.toLowerCase()}`,
    productId: product.id,
    country: input.country,
    language: input.language,
    templateVersion: "pdp-dynamic-v1",
    cover: {
      title: product.displayName ?? "Uploaded product",
      subtitle: product.profile.valueProposition,
      imageAssetId: "asset-cover"
    },
    sellingPoints: product.profile.detectedFeatures,
    sectionImageBySellingPointId: {
      "feature-capacity": "asset-capacity",
      "feature-slot-in": "asset-slot-in",
      "feature-low-noise": "asset-low-noise",
      "feature-energy": "asset-energy"
    }
  });
}

export function getDemoCostRecords(): DemoCostRecord[] {
  return [
    {
      task: "POP scene",
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2",
      mode: process.env.DEMO_USE_MOCK === "false" ? "openai-ready" : "mock fallback",
      country: "Mexico",
      language: "Spanish",
      estimatedUnits: 1
    },
    {
      task: "PDP render",
      model: "template-engine",
      mode: "deterministic",
      country: "Mexico",
      language: "Spanish",
      estimatedUnits: 0
    },
    {
      task: "Localization variants",
      model: "rules + future LLM",
      mode: "mock fallback",
      country: "Brazil",
      language: "Portuguese",
      estimatedUnits: 1
    }
  ];
}

