import { getPrimaryDemoProduct } from "@/src/domain/demo-data";
import { buildPopScenePrompt } from "@/src/domain/pop";
import { buildPdpDocument, type PdpDocument } from "@/src/domain/pdp";
import {
  createImageProvider,
  type ImageProviderResult
} from "@/src/services/image-provider";
import type { CostLedger, CostLedgerRecord } from "@/src/services/cost-ledger";
import { createDefaultCostLedger } from "@/src/services/cost-ledger";
import type { LocalAssetStore } from "@/src/services/local-asset-store";

export type GenerateDemoImageInput = {
  taskId: string;
  taskLabel?: string;
  prompt: string;
  sourceAssetIds: string[];
  country?: string;
  language?: string;
  forceMock?: boolean;
  imageStore?: LocalAssetStore;
  costLedger?: CostLedger;
};

export type GenerateDemoPopSceneInput = {
  taskId: string;
  productName: string;
  placement: string;
  flatPopAssetId: string;
  country?: string;
  language?: string;
  forceMock?: boolean;
  imageStore?: LocalAssetStore;
  costLedger?: CostLedger;
};

export type BuildDemoPdpInput = {
  country: string;
  language: string;
};

export type DemoCostRecord = {
  taskId?: string;
  task: string;
  model: string;
  mode: string;
  country: string;
  language: string;
  estimatedUnits: number;
  isFallback?: boolean;
  sourceAssetIds?: string[];
  createdAt?: string;
};

export async function generateDemoImage(
  input: GenerateDemoImageInput
): Promise<ImageProviderResult> {
  const provider = createImageProvider({
    forceMock: input.forceMock ?? process.env.DEMO_USE_MOCK === "true",
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2",
    imageStore: input.imageStore
  });

  const result = await provider.generateImage({
    taskId: input.taskId,
    prompt: input.prompt,
    sourceAssetIds: input.sourceAssetIds
  });

  await recordGenerationCost(input, result, input.taskLabel ?? "Image generation");

  return result;
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
    model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2",
    imageStore: input.imageStore
  });

  const result = await provider.editImage({
    taskId: input.taskId,
    prompt,
    sourceAssetIds: [input.flatPopAssetId]
  });

  await recordGenerationCost(
    {
      taskId: input.taskId,
      taskLabel: "POP product scene",
      sourceAssetIds: [input.flatPopAssetId],
      country: input.country,
      language: input.language,
      costLedger: input.costLedger
    },
    result,
    "POP product scene"
  );

  return result;
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

export async function readDemoCostRecords(
  ledger: CostLedger = createDefaultCostLedger()
): Promise<DemoCostRecord[]> {
  const liveRecords = await ledger.readRecords();
  return [...liveRecords.map(toDemoCostRecord), ...getDemoCostRecords()];
}

async function recordGenerationCost(
  input: Pick<
    GenerateDemoImageInput,
    "taskId" | "taskLabel" | "sourceAssetIds" | "country" | "language" | "costLedger"
  >,
  result: ImageProviderResult,
  fallbackTaskLabel: string
): Promise<void> {
  if (!input.costLedger) {
    return;
  }

  await input.costLedger.appendRecord({
    taskId: input.taskId,
    task: input.taskLabel ?? fallbackTaskLabel,
    model: result.model,
    mode: result.isFallback ? "mock fallback" : "openai",
    country: input.country ?? "Demo market",
    language: input.language ?? "Demo language",
    estimatedUnits: 1,
    isFallback: result.isFallback,
    sourceAssetIds: result.sourceAssetIds
  });
}

function toDemoCostRecord(record: CostLedgerRecord): DemoCostRecord {
  return {
    taskId: record.taskId,
    task: record.task,
    model: record.model,
    mode: record.mode,
    country: record.country,
    language: record.language,
    estimatedUnits: record.estimatedUnits,
    isFallback: record.isFallback,
    sourceAssetIds: record.sourceAssetIds,
    createdAt: record.createdAt
  };
}

