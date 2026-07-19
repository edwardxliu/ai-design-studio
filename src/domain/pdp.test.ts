import { describe, expect, it } from "vitest";
import { getPrimaryDemoProduct } from "./test-fixtures";
import { buildPdpDocument, getMissingPdpImageSlots } from "./pdp";

const product = getPrimaryDemoProduct();

describe("buildPdpDocument", () => {
  it("creates a cover and one section per selected selling point", () => {
    const document = buildPdpDocument({
      id: "pdp-doc-1",
      productId: product.id,
      country: "Mexico",
      language: "Spanish",
      templateVersion: "pdp-dynamic-v1",
      cover: {
        title: product.displayName ?? "Product",
        subtitle: product.profile.valueProposition,
        imageAssetId: "asset-cover"
      },
      sellingPoints: product.profile.detectedFeatures.slice(0, 3),
      sectionImageBySellingPointId: {
        "feature-capacity": "asset-capacity",
        "feature-slot-in": "asset-slot-in",
        "feature-low-noise": "asset-low-noise"
      }
    });

    expect(document.cover.title).toContain("SPACE Master");
    expect(document.sections).toHaveLength(3);
    expect(document.sections[0]).toMatchObject({
      blackTitle: "640L Capacity",
      narrowGrayText: "23 cu.ft. / 640L, with 434L refrigerator and 206L freezer zones.",
      largeImageAssetId: "asset-capacity"
    });
  });

  it("alternates section layouts and preserves user-controlled image slots", () => {
    const document = buildPdpDocument({
      id: "pdp-doc-2",
      productId: product.id,
      country: "Brazil",
      language: "Portuguese",
      templateVersion: "pdp-dynamic-v1",
      cover: {
        title: "Localized cover",
        imageAssetId: "asset-cover"
      },
      sellingPoints: product.profile.detectedFeatures.slice(0, 4),
      sectionImageBySellingPointId: {
        "feature-capacity": "asset-1",
        "feature-slot-in": "asset-2",
        "feature-low-noise": "asset-3",
        "feature-energy": "asset-4"
      }
    });

    expect(document.sections.map((section) => section.layout)).toEqual([
      "image-right",
      "image-left",
      "image-right",
      "image-left"
    ]);
    expect(document.sections.map((section) => section.largeImageAssetId)).toEqual([
      "asset-1",
      "asset-2",
      "asset-3",
      "asset-4"
    ]);
  });

  it("creates a section for every enabled selling point without a fixed cap", () => {
    const expanded = [
      ...product.profile.detectedFeatures,
      {
        id: "feature-extra-1",
        title: "Auto Ice Maker",
        shortLabel: "Fresh Ice",
        benefit: "Quick access to fresh ice anytime.",
        priority: 5
      },
      {
        id: "feature-extra-2",
        title: "IoT Connectivity",
        shortLabel: "Remote Control",
        benefit: "Control the appliance remotely.",
        priority: 6
      }
    ];

    const document = buildPdpDocument({
      id: "pdp-doc-3",
      productId: product.id,
      country: "Mexico",
      language: "English",
      templateVersion: "pdp-dynamic-v1",
      cover: {
        title: "Feature rich PDP",
        imageAssetId: "asset-cover"
      },
      sellingPoints: expanded,
      sectionImageBySellingPointId: {}
    });

    expect(document.sections).toHaveLength(expanded.length);
    expect(document.moreFeatures).toHaveLength(0);
  });
});

describe("getMissingPdpImageSlots", () => {
  it("returns sections without user-provided large images", () => {
    const document = buildPdpDocument({
      id: "pdp-doc-missing",
      productId: product.id,
      country: "Mexico",
      language: "English",
      templateVersion: "pdp-dynamic-v1",
      cover: {
        title: "Missing images",
        imageAssetId: "asset-cover"
      },
      sellingPoints: product.profile.detectedFeatures.slice(0, 2),
      sectionImageBySellingPointId: {
        "feature-capacity": "asset-capacity"
      }
    });

    expect(getMissingPdpImageSlots(document)).toEqual(["feature-slot-in"]);
  });
});

