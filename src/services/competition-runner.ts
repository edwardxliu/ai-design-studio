import { Buffer } from "node:buffer";
import {
  buildCompetitionPrompt,
  getCompetitionTaskSpec,
  type CompetitionOutputSpec,
  type CompetitionTaskId,
  type CompetitionTaskSpec
} from "@/src/domain/competition-tasks";
import type { ImageModelChoice } from "@/src/domain/generation-models";
import {
  buildWhiteBackgroundPrompt,
  type WhiteBackgroundSourceState
} from "@/src/domain/white-background";
import { buildPhoneStandardizationPrompt } from "@/src/domain/phone-standardization";
import type {
  GenerationTaskType,
  OutputArtifact,
  ProductWithProfile,
  SellingPoint
} from "@/src/domain/types";
import type { CostLedger } from "@/src/services/cost-ledger";
import { createDefaultCostLedger } from "@/src/services/cost-ledger";
import { generateDemoImage } from "@/src/services/demo-api";
import type { ImageProvider } from "@/src/services/image-provider";
import type { LocalAssetStore } from "@/src/services/local-asset-store";
import { createDefaultLocalAssetStore } from "@/src/services/local-asset-store";
import { mapWithConcurrency } from "@/src/lib/concurrency";

const GENERATION_CONCURRENCY = 4;

export type CompetitionRunnerInput = {
  taskId: CompetitionTaskId;
  /** Replaces every image output's source assets, e.g. a phone shot uploaded on stage. */
  sourceAssetIdOverride?: string;
  /** The product (from the registry) the capability runs against. */
  productOverride: ProductWithProfile;
  imageModel?: ImageModelChoice;
  provider?: ImageProvider;
  imageStore?: LocalAssetStore;
  costLedger?: CostLedger;
};

export type CompetitionOutputArtifact = OutputArtifact & {
  requirement: string;
  spec: {
    id: string;
    label: string;
    kind: CompetitionOutputSpec["kind"];
    angle?: string;
    styleName?: string;
    skuReplacementKind?: string;
    sourceState?: WhiteBackgroundSourceState;
  };
  metadata: Record<string, unknown>;
};

export type CompetitionTaskRunResult = {
  task: CompetitionTaskSpec;
  outputs: CompetitionOutputArtifact[];
  generatedAt: string;
};

export async function runCompetitionTask(
  input: CompetitionRunnerInput
): Promise<CompetitionTaskRunResult> {
  const task = getCompetitionTaskSpec(input.taskId);
  const imageStore = input.imageStore ?? createDefaultLocalAssetStore();
  const costLedger = input.costLedger ?? createDefaultCostLedger();

  // Outputs are independent; run them in parallel with a small worker pool.
  const outputs = await mapWithConcurrency(task.outputs, GENERATION_CONCURRENCY, (spec) =>
    runOutputSpec({
      task,
      spec,
      sourceAssetIdOverride: input.sourceAssetIdOverride,
      productOverride: input.productOverride,
      imageModel: input.imageModel,
      provider: input.provider,
      imageStore,
      costLedger
    })
  );

  return {
    task,
    outputs,
    generatedAt: new Date().toISOString()
  };
}

export type CompetitionOutputRunInput = {
  taskId: CompetitionTaskId;
  outputId: string;
  sourceAssetIdOverride?: string;
  sourceState?: WhiteBackgroundSourceState;
  productOverride: ProductWithProfile;
  /** System-wide target market used for labels and the cost ledger. */
  locale?: { country: string; language: string };
  imageModel?: ImageModelChoice;
  provider?: ImageProvider;
  imageStore?: LocalAssetStore;
  costLedger?: CostLedger;
};

export type CompetitionOutputRunResult = {
  task: CompetitionTaskSpec;
  output: CompetitionOutputArtifact;
  totalOutputs: number;
};

/** Runs one output of a capability, so clients can generate in parallel with live progress. */
export async function runCompetitionOutput(
  input: CompetitionOutputRunInput
): Promise<CompetitionOutputRunResult> {
  const task = getCompetitionTaskSpec(input.taskId);
  const spec = task.outputs.find((item) => item.id === input.outputId);

  if (!spec) {
    throw new Error(`Unknown output ${input.outputId} for capability ${input.taskId}`);
  }

  const runtimeSpec: CompetitionOutputSpec = {
    ...spec,
    ...(input.locale ? { country: input.locale.country, language: input.locale.language } : {}),
    ...(input.sourceState ? { sourceState: input.sourceState } : {})
  };

  const output = await runOutputSpec({
    task,
    spec: runtimeSpec,
    sourceAssetIdOverride: input.sourceAssetIdOverride,
    productOverride: input.productOverride,
    imageModel: input.imageModel,
    provider: input.provider,
    imageStore: input.imageStore ?? createDefaultLocalAssetStore(),
    costLedger: input.costLedger ?? createDefaultCostLedger()
  });

  return { task, output, totalOutputs: task.outputs.length };
}

async function runOutputSpec(input: {
  task: CompetitionTaskSpec;
  spec: CompetitionOutputSpec;
  sourceAssetIdOverride?: string;
  productOverride: ProductWithProfile;
  imageModel?: ImageModelChoice;
  provider?: ImageProvider;
  imageStore: LocalAssetStore;
  costLedger: CostLedger;
}): Promise<CompetitionOutputArtifact> {
  const product = input.productOverride;

  if (input.spec.kind === "motion-storyboard") {
    return exportMotionStoryboard(input.task, input.spec, product, input.imageStore, input.costLedger);
  }

  const sourceAssetIds = input.sourceAssetIdOverride
    ? [input.sourceAssetIdOverride]
    : defaultSourceAssetIds(product, input.spec.generationType);

  const prompt =
    input.spec.generationType === "white-background" && input.spec.sourceState
      ? buildWhiteBackgroundPrompt(input.spec.sourceState, input.spec.angle)
      : input.spec.generationType === "standardize-phone-shot"
        ? buildPhoneStandardizationPrompt(input.spec.angle)
        : buildCompetitionPrompt(product, input.spec);
  const runScope = buildRunScopedTaskId(input.task.id, input.spec.id, input.spec.sourceState);

  const result = await generateDemoImage({
    taskId: runScope,
    taskLabel: input.task.title,
    prompt,
    imageModel: input.imageModel,
    provider: input.provider,
    sourceAssetIds,
    country: input.spec.country,
    language: input.spec.language,
    imageStore: input.imageStore,
    costLedger: input.costLedger
  });

  return {
    id: `${input.task.id}-${input.spec.id}${input.spec.sourceState ? `-${input.spec.sourceState}` : ""}`,
    taskId: input.task.id,
    projectId: product.projectId,
    productId: product.id,
    type: "image",
    url: result.url,
    label: buildArtifactLabel(product, input.spec),
    provenance: {
      model: result.model,
      prompt: result.prompt,
      sourceAssetIds: result.sourceAssetIds,
      generatedAt: result.generatedAt,
      isFallback: result.isFallback,
      failureReason: result.failureReason
    },
    requirement: input.task.requirement,
    spec: buildArtifactSpec(input.spec),
    metadata: {
      phase: input.task.phase,
      coverageTags: input.task.coverageTags,
      generationType: input.spec.generationType,
      sourceState: input.spec.sourceState
    }
  };
}

async function exportMotionStoryboard(
  task: CompetitionTaskSpec,
  spec: CompetitionOutputSpec,
  product: ProductWithProfile,
  imageStore: LocalAssetStore,
  costLedger: CostLedger
): Promise<CompetitionOutputArtifact> {
  const storyboard = renderMotionStoryboardSvg(product, spec);
  const taskId = buildRunScopedTaskId(task.id, spec.id);
  const saved = await imageStore.saveGeneratedImage({
    taskId,
    filename: `${spec.id}.svg`,
    contentType: "image/svg+xml",
    bytes: Buffer.from(storyboard, "utf8")
  });

  await costLedger.appendRecord({
    taskId,
    task: task.title,
    model: "storyboard-engine",
    mode: "deterministic",
    country: spec.country,
    language: spec.language,
    estimatedUnits: 0,
    isFallback: false,
    sourceAssetIds: spec.sourceAssetIds
  });

  return {
    id: `${task.id}-${spec.id}`,
    taskId: task.id,
    projectId: product.projectId,
    productId: product.id,
    type: "storyboard",
    url: saved.url,
    label: buildArtifactLabel(product, spec),
    provenance: {
      model: "storyboard-engine",
      prompt: buildCompetitionPrompt(product, spec),
      sourceAssetIds: spec.sourceAssetIds,
      generatedAt: new Date().toISOString(),
      isFallback: false
    },
    requirement: task.requirement,
    spec: buildArtifactSpec(spec),
    metadata: {
      phase: task.phase,
      coverageTags: task.coverageTags,
      fixedStructure: ["Hook", "Product reveal", "Selling-point proof", "Lifestyle use", "Local CTA", "Packshot end card"],
      keyInputs: ["Product profile", "Target market", "Language", "Selling-point order", "Brand restrictions"],
      reusableModules: ["Packshot", "Feature proof card", "Lifestyle scene", "POP sticker overlay", "End card"],
      variantGeneration: ["Swap language copy", "Swap market hierarchy", "Swap product asset", "Swap background style"]
    }
  };
}

function buildArtifactLabel(product: ProductWithProfile, spec: CompetitionOutputSpec) {
  return {
    productName: product.displayName ?? "Uploaded product",
    country: spec.country,
    language: spec.language,
    templateType: spec.templateType,
    templateVersion: spec.templateVersion
  };
}

function buildArtifactSpec(spec: CompetitionOutputSpec): CompetitionOutputArtifact["spec"] {
  return {
    id: spec.id,
    label: spec.label,
    kind: spec.kind,
    angle: spec.angle,
    styleName: spec.styleName,
    skuReplacementKind: spec.skuReplacementKind,
    sourceState: spec.sourceState
  };
}

function defaultSourceAssetIds(
  product: ProductWithProfile,
  generationType: GenerationTaskType
): string[] {
  const rasterAssets = product.assets.filter((asset) =>
    /\.(png|jpe?g|webp)$/i.test(asset.url)
  );
  const photos = rasterAssets.filter((asset) => asset.type === "product-photo");
  const phoneShots = rasterAssets.filter((asset) => asset.type === "phone-shot");
  const preferred =
    generationType === "standardize-phone-shot"
      ? [...phoneShots, ...photos]
      : [...photos, ...phoneShots];
  return preferred.slice(0, 1).map((asset) => asset.id);
}

function buildRunScopedTaskId(
  taskId: string,
  outputId: string,
  sourceState?: WhiteBackgroundSourceState
): string {
  return `${taskId}-${outputId}${sourceState ? `-${sourceState}` : ""}`;
}

function renderMotionStoryboardSvg(product: ProductWithProfile, spec: CompetitionOutputSpec): string {
  const width = 1320;
  const height = 760;
  const frames = [
    ["01 Hook", "Family kitchen need"],
    ["02 Reveal", product.displayName ?? "Product reveal"],
    ["03 Proof", product.profile.detectedFeatures[0]?.shortLabel ?? "Key selling point"],
    ["04 Use", "Localized lifestyle"],
    ["05 CTA", `${spec.country} / ${spec.language}`],
    ["06 End card", product.profile.brandSlogan ?? "Midea"]
  ];
  const frameSvg = frames
    .map(([title, copy], index) => {
      const x = 48 + (index % 3) * 408;
      const y = 118 + Math.floor(index / 3) * 270;
      return `
  <g transform="translate(${x} ${y})">
    <rect width="360" height="210" rx="8" fill="${index % 2 === 0 ? "#f7f8fa" : "#eef6f7"}" stroke="#cbd5e1"/>
    <rect x="22" y="24" width="112" height="28" rx="0" fill="#111827"/>
    <text x="34" y="44" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#ffffff">${escapeXml(title)}</text>
    <text x="22" y="100" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#17202a">${escapeXml(copy)}</text>
    <text x="22" y="148" font-family="Arial, sans-serif" font-size="15" fill="#5f6c7b">${escapeXml("Reusable module + market copy + product asset")}</text>
  </g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <text x="48" y="62" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#17202a">${escapeXml("Product Video Direction / Dynamic Extension")}</text>
  <text x="48" y="92" font-family="Arial, sans-serif" font-size="18" fill="#5f6c7b">${escapeXml("Fixed structure: hook, reveal, proof, lifestyle, CTA, end card. Variants swap product, market, language, and selling-point order.")}</text>
${frameSvg}
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
