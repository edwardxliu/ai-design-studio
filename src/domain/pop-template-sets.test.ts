import { describe, expect, it } from "vitest";
import { demoProducts } from "./test-fixtures";
import {
  allPopTemplates,
  getPopTemplate,
  renderPopFlatSvg
} from "./pop";
import {
  getPopTemplateIds,
  getPopTemplateSet,
  inferPopProductType,
  popTemplateSets
} from "./pop-template-sets";

describe("POP product template sets", () => {
  it("keeps the refrigerator groups and fixed variant counts from the reference", () => {
    const templateSet = getPopTemplateSet("refrigerator");

    expect(templateSet.groups.map((group) => group.name)).toEqual([
      "Main Sticker - USP",
      "Main Sticker - Feature",
      "Inner Sticker & Display",
      "Side Sticker"
    ]);
    expect(templateSet.groups.map((group) => group.variants.length)).toEqual([
      2, 2, 3, 1
    ]);
  });

  it("keeps the oven groups and fixed variant counts from the reference", () => {
    const templateSet = getPopTemplateSet("oven");

    expect(templateSet.groups.map((group) => group.name)).toEqual([
      "Main Sticker",
      "Corner Sticker",
      "Inner Display",
      "Wobbler",
      "Body Sticker",
      "Top Sticker"
    ]);
    expect(templateSet.groups.map((group) => group.variants.length)).toEqual([
      2, 1, 1, 1, 3, 1
    ]);
    expect(templateSet.groups[1].variants[0]).toMatchObject({
      templateId: "oven-corner-brand",
      label: "固定方案"
    });
  });

  it("associates the two demo products with their own template sets", () => {
    expect(inferPopProductType(demoProducts[0])).toBe("refrigerator");
    expect(inferPopProductType(demoProducts[1])).toBe("oven");
  });

  it("registers every fixed variant once and preserves the old refrigerator IDs", () => {
    const ids = popTemplateSets.flatMap(getPopTemplateIds);

    expect(ids).toHaveLength(17);
    expect(new Set(ids).size).toBe(17);
    expect(allPopTemplates).toHaveLength(17);
    expect(ids).toContain("main-sticker-usp");
    expect(ids).toContain("main-sticker-feature");
    expect(ids).toContain("inner-sticker-display");
    expect(ids).toContain("side-sticker");
  });

  it("renders every configured variant through the shared flat-artwork entrypoint", () => {
    for (const templateSet of popTemplateSets) {
      for (const templateId of getPopTemplateIds(templateSet)) {
        const template = getPopTemplate(templateId);
        const textValues = Object.fromEntries(
          template.slots
            .filter((slot) => slot.type === "text")
            .map((slot) => [
              slot.id,
              slot.type === "text" ? slot.defaultValue : ""
            ])
        );
        const svg = renderPopFlatSvg({
          templateId,
          textValues,
          imageDataUris: {}
        });

        expect(svg, templateId).toContain("<svg");
        expect(svg, templateId).toContain("popBlue");
        expect(svg, templateId).toMatch(
          /<rect width="\d+" height="\d+" fill="none"\/>/
        );
        expect(svg, templateId).not.toMatch(
          /<rect width="\d+" height="\d+" fill="#ffffff"\/>/
        );
      }
    }
  });

  it("matches the oven reference geometry and right-rounded bullet chain", () => {
    const hero = renderPopFlatSvg({
      templateId: "oven-main-hero",
      textValues: { headline: "Headline Space", subheading: "Subheading Space" },
      imageDataUris: {}
    });
    const featureGrid = renderPopFlatSvg({
      templateId: "oven-main-feature",
      textValues: {
        headline: "Headline Space",
        subheading: "Subheading Space",
        featureText1: "Headline Space",
        featureText2: "Headline Space",
        featureText3: "Headline Space"
      },
      imageDataUris: {}
    });
    const corner = renderPopFlatSvg({
      templateId: "oven-corner-brand",
      textValues: { headline: "Headline Space" },
      imageDataUris: {}
    });
    const innerDisplay = renderPopFlatSvg({
      templateId: "oven-inner-display",
      textValues: { headline: "Headline Space", subheading: "Subheading Space" },
      imageDataUris: {}
    });
    const wobbler = renderPopFlatSvg({
      templateId: "oven-wobbler",
      textValues: {
        headline1: "Headline Space",
        subheading1: "Subheading Space",
        headline2: "Headline Space",
        subheading2: "Subheading Space"
      },
      imageDataUris: {}
    });
    const bodyRound = renderPopFlatSvg({
      templateId: "oven-body-round",
      textValues: { headline: "Headline Space" },
      imageDataUris: {}
    });
    const bodyStrip = renderPopFlatSvg({
      templateId: "oven-body-strip",
      textValues: { headline: "Headline Space" },
      imageDataUris: {}
    });
    const bodyFeature = renderPopFlatSvg({
      templateId: "oven-body-feature",
      textValues: { headline: "Headline Space", subheading: "Subheading Space" },
      imageDataUris: {}
    });
    const top = renderPopFlatSvg({
      templateId: "oven-top-sticker",
      textValues: { headline: "Headline Space", subheading: "Subheading Space" },
      imageDataUris: {}
    });

    expect(getPopTemplate("oven-main-hero").aspectRatio).toBe("3:2");
    expect(getPopTemplate("oven-main-feature").aspectRatio).toBe("3:2");
    expect(getPopTemplate("oven-main-feature").slots.map((slot) => slot.id)).toContain(
      "subheading"
    );
    expect(hero).toContain('<rect x="24" y="24" width="952" height="612"');
    expect(hero).toContain("M 24 438");
    expect(featureGrid).toContain("Subheading Space");
    expect(featureGrid.match(/A 39.5 39.5 0 0 0/g)).toHaveLength(2);
    expect(corner).toContain("Design Area");
    expect(getPopTemplate("oven-corner-brand").slots.map((slot) => slot.id)).toEqual([
      "featureImage",
      "headline"
    ]);
    expect(innerDisplay).toContain("M 20 420");
    expect(innerDisplay).toContain('<rect x="20" y="20" width="760" height="520"');
    expect(wobbler).toContain('<rect x="44" y="38" width="352" height="374"');
    expect(wobbler).toContain("M 44 300");
    expect(wobbler).toContain('<rect x="44" y="412" width="352" height="400"');
    expect(wobbler).toContain("M 44 700");
    expect(bodyRound).toContain("M 70 470");
    expect(getPopTemplate("oven-body-strip").aspectRatio).toBe("8:1");
    expect(bodyStrip).toContain("M 744 13 H 24 V 113 H 744");
    expect(bodyStrip).toContain("M 744 13");
    expect(getPopTemplate("oven-body-feature").aspectRatio).toBe("4:1");
    expect(bodyFeature).toContain("M 530 55");
    expect(top).toContain("M 444 24");
  });

  it("embeds a replacement image in an oven gray slot", () => {
    const dataUri = "data:image/png;base64,cGhvdG8=";
    const svg = renderPopFlatSvg({
      templateId: "oven-top-sticker",
      textValues: { headline: "Smart control" },
      imageDataUris: { featureImage: dataUri }
    });

    expect(svg).toContain('href="' + dataUri + '"');
    expect(svg).not.toContain("Feature Image</text>");
  });
});
