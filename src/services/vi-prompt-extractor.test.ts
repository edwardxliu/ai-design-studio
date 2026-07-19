import { describe, expect, it, vi } from "vitest";
import { extractIconViPromptTemplate } from "./vi-prompt-extractor";

const brandImage = {
  bytes: Buffer.from("brand"),
  contentType: "image/png",
  filename: "brand.png"
};
const iconImage = {
  bytes: Buffer.from("icon-vi"),
  contentType: "image/webp",
  filename: "icon-vi.webp"
};

describe("extractIconViPromptTemplate", () => {
  it("passes two ordered VI references and preserves the feature-title placeholder", async () => {
    const complete = vi.fn(async (request) => {
      expect(request.brandColorImage).toBe(brandImage);
      expect(request.iconGuidelineImage).toBe(iconImage);
      expect(request.userPrompt).toContain("Image 1");
      expect(request.userPrompt).toContain("Image 2");
      expect(request.userPrompt).toContain("image 3");
      return "Use blue lines. Feature title: 【Replace Here】";
    });

    const result = await extractIconViPromptTemplate({
      brandColorImage: brandImage,
      iconGuidelineImage: iconImage,
      model: "gpt-4o-mini",
      complete
    });

    expect(result.model).toBe("gpt-4o-mini");
    expect(result.template).toContain("{{FEATURE_TITLE}}");
    expect(complete).toHaveBeenCalledOnce();
  });

  it("adds the required placeholder when the model omits it", async () => {
    const result = await extractIconViPromptTemplate({
      brandColorImage: brandImage,
      iconGuidelineImage: iconImage,
      complete: async () => "Use uniform rounded strokes and the supplied colors."
    });

    expect(result.template).toContain("{{FEATURE_TITLE}}");
  });
});