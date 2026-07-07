import { describe, expect, it } from "vitest";
import {
  buildPopScenePrompt,
  defaultPopTemplates,
  renderPopFlatPayload
} from "./pop";

describe("defaultPopTemplates", () => {
  it("provides fixed templates with editable text and image slots", () => {
    expect(defaultPopTemplates.length).toBeGreaterThanOrEqual(4);

    const featureTemplate = defaultPopTemplates.find(
      (template) => template.id === "main-sticker-feature"
    );

    expect(featureTemplate).toBeDefined();
    expect(featureTemplate?.slots.some((slot) => slot.type === "text" && slot.editable)).toBe(
      true
    );
    expect(featureTemplate?.slots.some((slot) => slot.type === "image" && slot.editable)).toBe(
      true
    );
  });
});

describe("renderPopFlatPayload", () => {
  it("preserves user-edited text and image slot choices", () => {
    const payload = renderPopFlatPayload({
      templateId: "main-sticker-feature",
      country: "Mexico",
      language: "Spanish",
      textValues: {
        headline: "640L, same kitchen footprint",
        subline: "More storage without remodeling"
      },
      imageValues: {
        featureImage: "asset-capacity-icon"
      }
    });

    expect(payload.templateId).toBe("main-sticker-feature");
    expect(payload.textValues.headline).toBe("640L, same kitchen footprint");
    expect(payload.imageValues.featureImage).toBe("asset-capacity-icon");
    expect(payload.templateVersion).toBe("1.0");
  });

  it("throws when a requested fixed template does not exist", () => {
    expect(() =>
      renderPopFlatPayload({
        templateId: "missing-template",
        country: "Mexico",
        language: "Spanish",
        textValues: {},
        imageValues: {}
      })
    ).toThrow("Unknown POP template: missing-template");
  });
});

describe("buildPopScenePrompt", () => {
  it("describes realistic product photography and preserves product details", () => {
    const prompt = buildPopScenePrompt({
      productName: "Uploaded product",
      placement: "front panel",
      flatPopAssetId: "pop-flat-1"
    });

    expect(prompt).toContain("realistic product photography");
    expect(prompt).toContain("front panel");
    expect(prompt).toContain("Preserve the product shape");
    expect(prompt).toContain("Do not invent additional text");
  });
});

