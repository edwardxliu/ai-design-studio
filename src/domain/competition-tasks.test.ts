import { describe, expect, it } from "vitest";
import {
  buildCompetitionPrompt,
  competitionTasks,
  getCompetitionCoverageSummary,
  getCompetitionTaskSpec
} from "./competition-tasks";
import { demoProducts } from "./test-fixtures";

describe("competition task specs", () => {
  it("keeps only non-redundant image-production and marketing capabilities", () => {
    expect(competitionTasks.map((task) => task.id)).toEqual([
      "task1-white-background-6",
      "task1-phone-to-studio-6",
      "task1-sku-replacement-group",
      "task2-style-transfer-3",
      "task2-motion-direction"
    ]);
    expect(getCompetitionTaskSpec("task1-white-background-6").outputs).toHaveLength(3);
    expect(getCompetitionTaskSpec("task1-phone-to-studio-6").outputs).toHaveLength(3);
    expect(getCompetitionTaskSpec("task1-sku-replacement-group").outputs.length).toBeGreaterThanOrEqual(3);
    expect(getCompetitionTaskSpec("task2-style-transfer-3").outputs).toHaveLength(3);
  });

  it("summarizes capability coverage for the studio header", () => {
    const coverage = getCompetitionCoverageSummary();

    expect(coverage.taskCount).toBe(5);
    expect(coverage.outputCount).toBe(13);
    expect(coverage.coverageTags).toEqual(
      expect.arrayContaining(["task2-style-transfer", "task1-white-background"])
    );
  });

  it("presents capabilities as platform features, not numbered competition tasks", () => {
    for (const task of competitionTasks) {
      expect(task.title).not.toMatch(/任务[一二三]/);
    }

    expect(getCompetitionTaskSpec("task1-white-background-6").title).toContain("白底三视角");
  });

  it("forces a pure white background on every white-background output", () => {
    const whiteBackgroundOutputs = competitionTasks
      .flatMap((task) => task.outputs)
      .filter((output) => output.generationType === "white-background");

    expect(whiteBackgroundOutputs.length).toBe(3);
    for (const output of whiteBackgroundOutputs) {
      const prompt = buildCompetitionPrompt(demoProducts[0], output);
      expect(prompt).toContain("pure white seamless background (#FFFFFF)");
    }
  });

  it("keeps the generator product-aware instead of category hardcoded", () => {
    const output = getCompetitionTaskSpec("task1-white-background-6").outputs[0];
    const oven = demoProducts.find((product) => product.id === "product-mega-oven")!;
    const prompt = buildCompetitionPrompt(oven, output);

    expect(prompt).toContain("MEGA SERIES");
    expect(prompt).toContain("Cooking appliance");
    expect(prompt).not.toContain("SPACE Master");
  });
});
