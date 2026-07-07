import { describe, expect, it } from "vitest";
import { buildPdpDocument } from "./pdp";
import { renderPdpSvg } from "./pdp-export";

describe("renderPdpSvg", () => {
  it("renders a long screenshot-like SVG with cover and dynamic selling point blocks", () => {
    const document = buildPdpDocument({
      id: "pdp-test",
      productId: "product-test",
      country: "Mexico",
      language: "Spanish",
      templateVersion: "pdp-dynamic-v1",
      cover: {
        title: "Uploaded Product",
        subtitle: "Demo value proposition",
        imageAssetId: "asset-cover"
      },
      sellingPoints: [
        {
          id: "feature-1",
          title: "Large Capacity",
          shortLabel: "Large Capacity",
          benefit: "Store more products in the same footprint",
          technicalProof: "640L",
          priority: 1
        },
        {
          id: "feature-2",
          title: "Low Noise",
          shortLabel: "Low Noise",
          benefit: "Quiet daily operation",
          priority: 2
        }
      ],
      sectionImageBySellingPointId: {
        "feature-1": "asset-capacity",
        "feature-2": "asset-noise"
      }
    });

    const svg = renderPdpSvg(document, "Uploaded Product");

    expect(svg).toContain("<svg");
    expect(svg).toContain('width="1080"');
    expect(svg).toContain('height="1320"');
    expect(svg).toContain("Uploaded Product");
    expect(svg).toContain("Large Capacity");
    expect(svg).toContain("Low Noise");
    expect(svg).toContain("asset-capacity");
    expect(svg).toContain("asset-noise");
  });
});
