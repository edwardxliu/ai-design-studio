import { describe, expect, it } from "vitest";
import {
  buildPopScenePrompt,
  defaultPopTemplates,
  getPopTemplate,
  renderPopFlatPayload,
  renderPopFlatSvg
} from "./pop";

describe("defaultPopTemplates", () => {
  it("provides exactly the four fixed templates from the brand material", () => {
    expect(defaultPopTemplates.map((template) => template.name)).toEqual([
      "Main Sticker - USP",
      "Main Sticker - Feature",
      "Inner Sticker & Display",
      "Side Sticker"
    ]);
  });

  it("gives every template editable blue text slots and gray image slots", () => {
    for (const template of defaultPopTemplates) {
      expect(template.slots.some((slot) => slot.type === "text" && slot.editable)).toBe(true);
      expect(template.slots.some((slot) => slot.type === "image" && slot.editable)).toBe(true);
    }
  });

  it("gives the feature template three image slots with matching headline bands", () => {
    const template = getPopTemplate("main-sticker-feature");
    const imageSlots = template.slots.filter((slot) => slot.type === "image");
    const textSlots = template.slots.filter((slot) => slot.type === "text");

    expect(imageSlots.map((slot) => slot.id)).toEqual([
      "featureImage1",
      "featureImage2",
      "featureImage3"
    ]);
    expect(textSlots.map((slot) => slot.id)).toEqual(["headline1", "headline2", "headline3"]);
  });
  it("uses neutral placeholder copy and keeps USP plan B to one whole image", () => {
    for (const template of defaultPopTemplates) {
      for (const slot of template.slots) {
        if (slot.type !== "text") {
          continue;
        }
        expect(slot.defaultValue).toBe(
          slot.id.toLowerCase().includes("subheading")
            ? "Subheading Space"
            : "Headline Space"
        );
      }
    }

    const overlay = getPopTemplate("main-sticker-usp-footer");
    expect(overlay.slots.filter((slot) => slot.type === "image").map((slot) => slot.id)).toEqual([
      "uspImage"
    ]);
  });
});

describe("renderPopFlatPayload", () => {
  it("preserves user-edited text and image slot choices", () => {
    const payload = renderPopFlatPayload({
      templateId: "main-sticker-usp",
      country: "Mexico",
      language: "Spanish",
      textValues: {
        headline: "640L, same kitchen footprint",
        subheading: "More storage without remodeling"
      },
      imageValues: {
        uspImage: "asset-capacity-icon"
      }
    });

    expect(payload.templateId).toBe("main-sticker-usp");
    expect(payload.textValues.headline).toBe("640L, same kitchen footprint");
    expect(payload.imageValues.uspImage).toBe("asset-capacity-icon");
    expect(payload.templateVersion).toBe("2.0");
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

describe("renderPopFlatSvg", () => {
  it("renders the USP template with a blue gradient band holding headline and subheading", () => {
    const svg = renderPopFlatSvg({
      templateId: "main-sticker-usp",
      textValues: {
        headline: "640L, same kitchen footprint",
        subheading: "More storage without remodeling"
      },
      imageDataUris: {}
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("linearGradient");
    expect(svg).toContain("640L, same kitchen footprint");
    expect(svg).toContain("More storage without remodeling");
    expect(svg).toContain("USP Image");
  });

  it("renders the feature template with the Main Feature header and three headline bands", () => {
    const svg = renderPopFlatSvg({
      templateId: "main-sticker-feature",
      textValues: {
        headline1: "Bigger volume",
        headline2: "Quiet cooling",
        headline3: "Energy saving"
      },
      imageDataUris: {}
    });

    expect(svg).toContain("Main Feature");
    expect(svg).toContain("Bigger volume");
    expect(svg).toContain("Quiet cooling");
    expect(svg).toContain("Energy saving");
    expect(svg).toContain("Feature Image 1");
    expect(svg).toContain("Feature Image 3");
  });

  it("embeds uploaded images into the gray slots", () => {
    const dataUri = `data:image/png;base64,${Buffer.from("photo").toString("base64")}`;
    const svg = renderPopFlatSvg({
      templateId: "inner-sticker-display",
      textValues: {},
      imageDataUris: { featureImage: dataUri }
    });

    expect(svg).toContain(`href="${dataUri}"`);
    expect(svg).not.toContain("Feature Image</text>");
  });

  it("renders the side sticker as image plus headline pill", () => {
    const svg = renderPopFlatSvg({
      templateId: "side-sticker",
      textValues: { headline: "Slot-in installation" },
      imageDataUris: {}
    });

    expect(svg).toContain("Slot-in installation");
    expect(svg).toContain("Feature Image");
  });

  it("renders right-rounded text bands and the corrected refrigerator structures", () => {
    const usp = renderPopFlatSvg({
      templateId: "main-sticker-usp-footer",
      textValues: {},
      imageDataUris: {}
    });
    const feature = renderPopFlatSvg({
      templateId: "main-sticker-feature",
      textValues: {},
      imageDataUris: {}
    });
    const side = renderPopFlatSvg({
      templateId: "side-sticker",
      textValues: {},
      imageDataUris: {}
    });

    expect(usp).toContain('<path d="M 24 700 H');
    expect(usp).not.toContain("Support Image");
    expect(feature.match(/<path d="M /g)).toHaveLength(3);
    expect(side).toContain('fill="#d9d9d9"');
    expect(side).toContain("Headline Space");
  });
  it("escapes XML-unsafe user text", () => {
    const svg = renderPopFlatSvg({
      templateId: "main-sticker-usp",
      textValues: { headline: `Big & "cool" <deal>` },
      imageDataUris: {}
    });

    expect(svg).toContain("Big &amp; &quot;cool&quot; &lt;deal&gt;");
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

describe("sticker band alignment fixes", () => {
  const empty = { textValues: {}, imageDataUris: {} };

  it("anchors the USP (A) blue band to the bottom of the gray image", () => {
    const svg = renderPopFlatSvg({ templateId: "main-sticker-usp", ...empty });
    // image 24..942, band height 132 => band starts at 810
    expect(svg).toContain("M 24 810");
  });

  it("drops the USP overlay (B) band lower while keeping gray visible below", () => {
    const svg = renderPopFlatSvg({ templateId: "main-sticker-usp-footer", ...empty });
    expect(svg).toContain("M 24 700");
  });

  it("nests feature bullets: first square-left, later ones concave-left", () => {
    const svg = renderPopFlatSvg({ templateId: "main-sticker-feature", ...empty });
    // three bullets => two concave joints (outer radius = r + 6 = 38)
    expect(svg.match(/A 38 38 0 0 0/g)).toHaveLength(2);

    const duo = renderPopFlatSvg({ templateId: "main-sticker-feature-duo", ...empty });
    expect(duo.match(/A 40 40 0 0 0/g)).toHaveLength(1);
  });

  it("anchors the inner sticker (A) band to the bottom of the gray image", () => {
    const svg = renderPopFlatSvg({ templateId: "inner-sticker-display", ...empty });
    // image 24..576, band height 104 => band starts at 472
    expect(svg).toContain("M 24 472");
  });

  it("aligns the inner sticker (C) band with the image right edge and bottom", () => {
    const svg = renderPopFlatSvg({ templateId: "inner-sticker-display-right", ...empty });
    // image 28..548 x, 52..548 y; band 132 tall starting at image right edge
    expect(svg).toContain("M 548 416");
  });

  it("widens the gap between the side sticker gray blocks", () => {
    const svg = renderPopFlatSvg({ templateId: "side-sticker", ...empty });
    // image ends at 500; gray text band now starts at 516
    expect(svg).toContain("M 516");
  });
});
