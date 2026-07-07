import { describe, expect, it, vi } from "vitest";
import {
  buildDemoPdp,
  generateDemoImage,
  generateDemoPopScene,
  getDemoCostRecords
} from "./demo-api";

describe("demo API helpers", () => {
  it("generates mock image output when requested", async () => {
    const result = await generateDemoImage({
      taskId: "task-api-image",
      prompt: "Generate a product image",
      sourceAssetIds: ["asset-1"],
      forceMock: true
    });

    expect(result.url).toBe("/mock/generated/task-api-image.png");
    expect(result.isFallback).toBe(true);
  });

  it("records image generation cost details when a ledger is supplied", async () => {
    const appendRecord = vi.fn().mockResolvedValue(undefined);

    await generateDemoImage({
      taskId: "task-cost-image",
      taskLabel: "Hero image",
      prompt: "Generate a product image",
      sourceAssetIds: ["asset-1"],
      country: "Mexico",
      language: "Spanish",
      forceMock: true,
      costLedger: { appendRecord, readRecords: vi.fn() }
    });

    expect(appendRecord).toHaveBeenCalledWith({
      taskId: "task-cost-image",
      task: "Hero image",
      model: "mock-image-provider",
      mode: "mock fallback",
      country: "Mexico",
      language: "Spanish",
      estimatedUnits: 1,
      isFallback: true,
      sourceAssetIds: ["asset-1"]
    });
  });

  it("generates a POP product-scene prompt and mock output", async () => {
    const result = await generateDemoPopScene({
      taskId: "task-pop-api",
      productName: "Uploaded product",
      placement: "front panel",
      flatPopAssetId: "pop-flat-asset",
      forceMock: true
    });

    expect(result.prompt).toContain("front panel");
    expect(result.url).toBe("/mock/generated/task-pop-api.png");
  });

  it("builds a PDP document with dynamic sections", () => {
    const document = buildDemoPdp({
      country: "Mexico",
      language: "Spanish"
    });

    expect(document.sections.length).toBeGreaterThanOrEqual(3);
    expect(document.cover.title).toContain("SPACE Master");
  });

  it("returns cost records for the demo ledger", () => {
    const records = getDemoCostRecords();

    expect(records.length).toBeGreaterThanOrEqual(3);
    expect(records[0]).toHaveProperty("task");
    expect(records[0]).toHaveProperty("mode");
  });
});
