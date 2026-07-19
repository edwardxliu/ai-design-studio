import { describe, expect, it, vi } from "vitest";
import type { Asset, ProductWithProfile } from "@/src/domain/types";
import type { CostLedger } from "@/src/services/cost-ledger";
import type { ImageProvider, ImageProviderInput } from "@/src/services/image-provider";
import type { LocalAssetStore } from "@/src/services/local-asset-store";
import { runCompetitionOutput, runCompetitionTask } from "./competition-runner";

function createUserProduct(): ProductWithProfile {
  return {
    id: "product-user-washer",
    projectId: "project-user-workspace",
    category: "Laundry appliance",
    displayName: "SmartWash 洗衣机 X1",
    profile: {
      id: "profile-product-user-washer",
      productId: "product-user-washer",
      category: "Laundry appliance",
      detectedFeatures: [
        {
          id: "feature-steam",
          title: "Steam Care",
          shortLabel: "Steam Care",
          benefit: "Removes wrinkles and allergens",
          priority: 1
        }
      ],
      localizationHints: [],
      confidence: 0.9
    },
    assets: [
      {
        id: "asset-washer-photo",
        projectId: "project-user-workspace",
        productId: "product-user-washer",
        type: "product-photo",
        filename: "washer.png",
        url: "/uploads/project-user-workspace/asset-washer-photo.png",
        source: "uploaded"
      },
      {
        id: "asset-washer-phone",
        projectId: "project-user-workspace",
        productId: "product-user-washer",
        type: "phone-shot",
        filename: "washer-phone.jpg",
        url: "/uploads/project-user-workspace/asset-washer-phone.jpg",
        source: "uploaded"
      }
    ],
    acceptsUserUploads: true
  };
}

function createFakeStore(): LocalAssetStore {
  return {
    saveUploadedAsset: vi.fn(),
    readAssetManifest: vi.fn(async () => [] as Asset[]),
    readAssetBytes: vi.fn(async () => null),
    removeAsset: vi.fn(async () => false),
    saveGeneratedImage: vi.fn(async (input) => ({
      id: `saved-${input.taskId}`,
      url: `/generated/${input.taskId}/${input.filename ?? "generated.png"}`,
      filePath: `public/generated/${input.taskId}/${input.filename ?? "generated.png"}`
    }))
  };
}

function createFakeLedger(): CostLedger {
  return {
    appendRecord: vi.fn(async (input) => ({
      id: `cost-${input.taskId}`,
      createdAt: "2026-07-07T00:00:00.000Z",
      ...input
    })),
    readRecords: vi.fn(async () => [])
  };
}

function createStubProvider(): ImageProvider {
  const respond = async (input: ImageProviderInput) => ({
    url: `/generated/${input.taskId}/out.png`,
    model: "gpt-image-1",
    prompt: input.prompt,
    sourceAssetIds: input.sourceAssetIds,
    isFallback: false,
    generatedAt: new Date().toISOString()
  });
  return { generateImage: vi.fn(respond), editImage: vi.fn(respond) };
}

describe("competition runner", () => {
  it("runs the style-transfer capability and returns three generated image outputs", async () => {
    const result = await runCompetitionTask({
      taskId: "task2-style-transfer-3",
      productOverride: createUserProduct(),
      provider: createStubProvider(),
      imageStore: createFakeStore(),
      costLedger: createFakeLedger()
    });

    expect(result.outputs).toHaveLength(3);
    expect(result.outputs.map((output) => output.spec.styleName)).toEqual([
      "Premium studio",
      "Family kitchen",
      "Retail launch"
    ]);
    expect(result.outputs.every((output) => !output.provenance.isFallback)).toBe(true);
  });

  it("applies a source asset override to every image output of the run", async () => {
    const result = await runCompetitionTask({
      taskId: "task1-phone-to-studio-6",
      sourceAssetIdOverride: "asset-live-uploaded-phone",
      productOverride: createUserProduct(),
      provider: createStubProvider(),
      imageStore: createFakeStore(),
      costLedger: createFakeLedger()
    });

    expect(result.outputs).toHaveLength(3);
    for (const output of result.outputs) {
      expect(output.provenance.sourceAssetIds).toEqual(["asset-live-uploaded-phone"]);
    }
  });

  it("uses the dedicated cleanup and studio prompt for phone standardization", async () => {
    const result = await runCompetitionOutput({
      taskId: "task1-phone-to-studio-6",
      outputId: "standardize-phone-shot-studio-front",
      sourceAssetIdOverride: "asset-washer-phone",
      productOverride: createUserProduct(),
      provider: createStubProvider(),
      imageStore: createFakeStore(),
      costLedger: createFakeLedger()
    });

    expect(result.totalOutputs).toBe(3);
    expect(result.output.provenance.sourceAssetIds).toEqual(["asset-washer-phone"]);
    expect(result.output.provenance.prompt).toContain("环境倒影、杂乱反射、有色光照和色偏");
    expect(result.output.provenance.prompt).toContain("贴纸、价签、宣传物料");
    expect(result.output.provenance.prompt).toContain("不得删除产品原生 Logo");
    expect(result.output.provenance.prompt).toContain("纯白无缝背景（#FFFFFF）");
  });
  it("runs the capability against the selected user product", async () => {
    const result = await runCompetitionTask({
      taskId: "task1-white-background-6",
      productOverride: createUserProduct(),
      provider: createStubProvider(),
      imageStore: createFakeStore(),
      costLedger: createFakeLedger()
    });

    expect(result.outputs).toHaveLength(3);
    for (const output of result.outputs) {
      expect(output.productId).toBe("product-user-washer");
      expect(output.label.productName).toBe("SmartWash 洗衣机 X1");
      expect(output.provenance.prompt).toContain("SmartWash");
      expect(output.provenance.sourceAssetIds).toEqual(["asset-washer-photo"]);
    }
  });

  it("runs a single output and labels it with the system locale", async () => {
    const result = await runCompetitionOutput({
      taskId: "task1-white-background-6",
      outputId: "white-background-left-45",
      productOverride: createUserProduct(),
      locale: { country: "Brazil", language: "Portuguese" },
      provider: createStubProvider(),
      imageStore: createFakeStore(),
      costLedger: createFakeLedger()
    });

    expect(result.output.spec.id).toBe("white-background-left-45");
    expect(result.output.label.country).toBe("Brazil");
    expect(result.output.label.language).toBe("Portuguese");
    expect(result.totalOutputs).toBe(3);
  });

  it("keeps open and closed runs separate and uses state-specific fidelity prompts", async () => {
    const common = {
      taskId: "task1-white-background-6" as const,
      outputId: "white-background-front",
      productOverride: createUserProduct(),
      provider: createStubProvider(),
      imageStore: createFakeStore(),
      costLedger: createFakeLedger()
    };
    const closed = await runCompetitionOutput({
      ...common,
      sourceAssetIdOverride: "asset-closed",
      sourceState: "closed"
    });
    const open = await runCompetitionOutput({
      ...common,
      sourceAssetIdOverride: "asset-open",
      sourceState: "open"
    });

    expect(closed.output.id).not.toBe(open.output.id);
    expect(closed.output.id).toContain("-closed");
    expect(open.output.id).toContain("-open");
    expect(closed.output.spec.sourceState).toBe("closed");
    expect(open.output.spec.sourceState).toBe("open");
    expect(closed.output.provenance.prompt).toContain("全部门体处于关闭状态");
    expect(open.output.provenance.prompt).toContain("门体开启角度、内部结构");
  });
  it("rejects unknown output ids with a clear error", async () => {
    await expect(
      runCompetitionOutput({
        taskId: "task1-white-background-6",
        outputId: "nope",
        productOverride: createUserProduct(),
        provider: createStubProvider(),
        imageStore: createFakeStore(),
        costLedger: createFakeLedger()
      })
    ).rejects.toThrow(/Unknown output/);
  });

  it("prefers phone-shot materials for the phone standardization capability", async () => {
    const result = await runCompetitionTask({
      taskId: "task1-phone-to-studio-6",
      productOverride: createUserProduct(),
      provider: createStubProvider(),
      imageStore: createFakeStore(),
      costLedger: createFakeLedger()
    });

    for (const output of result.outputs) {
      expect(output.provenance.sourceAssetIds[0]).toBe("asset-washer-phone");
    }
  });
});
