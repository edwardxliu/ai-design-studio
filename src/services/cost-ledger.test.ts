import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createCostLedger } from "./cost-ledger";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { force: true, recursive: true })));
  tempRoots.length = 0;
});

describe("createCostLedger", () => {
  it("appends generation records and reads them back newest first", async () => {
    const root = await mkdtemp(join(tmpdir(), "midea-ledger-"));
    tempRoots.push(root);
    const ledger = createCostLedger({ dataDir: root });

    await ledger.appendRecord({
      taskId: "task-pop-1",
      task: "POP product scene",
      model: "gpt-image-2",
      mode: "openai",
      country: "Mexico",
      language: "Spanish",
      estimatedUnits: 1,
      isFallback: false,
      sourceAssetIds: ["asset-product", "asset-pop"]
    });
    await ledger.appendRecord({
      taskId: "task-pdp-1",
      task: "PDP long image",
      model: "template-engine",
      mode: "deterministic",
      country: "Mexico",
      language: "Spanish",
      estimatedUnits: 0,
      isFallback: false,
      sourceAssetIds: ["asset-cover"]
    });

    const records = await ledger.readRecords();

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      taskId: "task-pdp-1",
      model: "template-engine"
    });
    expect(records[1]).toMatchObject({
      taskId: "task-pop-1",
      sourceAssetIds: ["asset-product", "asset-pop"]
    });
    expect(records[1].createdAt).toMatch(/2026|20\d\d/);
  });
});
