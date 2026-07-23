import { describe, expect, it } from "vitest";
import type { SellingPoint } from "./types";
import { buildDefaultPdpCanvasLayout, getSellingPointBlockId, movePdpCanvasBlock } from "./pdp-canvas-layout";
import { buildPdpDocument } from "./pdp";
import { buildVerticalPdpExportLayout, renderPdpSvg } from "./pdp-export";

function makePoints(count: number): SellingPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `feature-${index + 1}`,
    title: `Feature ${index + 1}`,
    shortLabel: `Label ${index + 1}`,
    benefit: `Benefit sentence ${index + 1}`,
    technicalProof: index === 0 ? "640L" : undefined,
    priority: index + 1
  }));
}

function makeDocument(pointCount: number, images: Record<string, string> = {}) {
  return buildPdpDocument({
    id: `pdp-test-${pointCount}`,
    productId: "product-test",
    country: "Mexico",
    language: "Spanish",
    templateVersion: "pdp-tree-v3",
    cover: {
      title: "Uploaded Product",
      subtitle: "Editable KV supporting copy",
      imageAssetId: "asset-cover"
    },
    brandMessage: "Demo brand statement",
    sellingPoints: makePoints(pointCount),
    sectionImageBySellingPointId: images
  });
}

function svgSize(svg: string): { width: number; height: number } {
  const width = Number(svg.match(/<svg[^>]*\swidth="(\d+)"/)?.[1] ?? 0);
  const height = Number(svg.match(/<svg[^>]*\sheight="(\d+)"/)?.[1] ?? 0);
  return { width, height };
}

describe("renderPdpSvg (vertical long image)", () => {
  it("stacks brand, KV, selling points, features, and specification vertically", () => {
    const svg = renderPdpSvg(makeDocument(4), "Uploaded Product", {
      specification: [["Capacity", "640L"]]
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("Uploaded Product");
    expect(svg).toContain("Feature 1");
    expect(svg).toContain("Feature 4");
    expect(svg).toContain("More Features");
    expect(svg).toContain("Specification");
    expect(svg).toContain("640L");
  });

  it("uses the supplied brand image and editable brand statement", () => {
    const brandUri = `data:image/png;base64,${Buffer.from("brand").toString("base64")}`;
    const svg = renderPdpSvg(makeDocument(2), "Uploaded Product", {
      brandImageDataUri: brandUri
    });

    expect(svg).toContain(`href="${brandUri}"`);
    expect(svg).toContain("Demo brand statement");
    expect(svg).toContain("Editable KV supporting copy");
  });
  it("keeps a fixed export width and grows height with selling-point count", () => {
    const small = svgSize(renderPdpSvg(makeDocument(2), "P"));
    const large = svgSize(renderPdpSvg(makeDocument(8), "P"));

    expect(large.width).toBe(small.width);
    expect(large.height).toBeGreaterThan(small.height);
    expect(small.width).toBe(920);
  });

  it("uses content-driven heights for summary blocks instead of preserving canvas whitespace", () => {
    const layout = buildVerticalPdpExportLayout(
      buildDefaultPdpCanvasLayout(makePoints(7)),
      { sellingPointCount: 7, specificationCount: 7 }
    );
    const brand = layout.blocks.find((block) => block.kind === "brand");
    const features = layout.blocks.find((block) => block.kind === "features");
    const specification = layout.blocks.find((block) => block.kind === "specification");

    expect(brand?.height).toBe(895);
    expect(features?.height).toBe(326);
    expect(specification?.height).toBe(308);
    expect(layout.height).toBeLessThan(7_500);
  });

  it("uses a gray page background and preserves source block aspect ratios", () => {
    const source = buildDefaultPdpCanvasLayout(makePoints(7));
    const layout = buildVerticalPdpExportLayout(source, {
      sellingPointCount: 7,
      specificationCount: 7
    });
    const sourceKv = source.blocks.find((block) => block.kind === "kv")!;
    const exportKv = layout.blocks.find((block) => block.kind === "kv")!;
    const sourceSelling = source.blocks.find((block) => block.kind === "selling-point")!;
    const exportSelling = layout.blocks.find((block) => block.kind === "selling-point")!;
    const svg = renderPdpSvg(makeDocument(2, { "feature-1": "asset-feature" }), "P", {
      imageDataUris: { "asset-feature": "data:image/png;base64,c2VjdGlvbg==" }
    });

    expect(exportKv.width / exportKv.height).toBeCloseTo(
      sourceKv.width / sourceKv.height,
      3
    );
    expect(exportSelling.width / exportSelling.height).toBeCloseTo(
      sourceSelling.width / sourceSelling.height,
      3
    );
    expect(svg).toContain('fill="#d3d6da"');
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(svg).not.toMatch(/<rect[^>]+fill="#17202a"/);
  });
  it("renders every selling point even beyond five", () => {
    const svg = renderPdpSvg(makeDocument(7), "P");

    for (let index = 1; index <= 7; index += 1) {
      expect(svg).toContain(`Feature ${index}`);
    }
  });

  it("embeds user images into the wide gray blocks", () => {
    const coverUri = `data:image/png;base64,${Buffer.from("cover").toString("base64")}`;
    const sectionUri = `data:image/png;base64,${Buffer.from("section").toString("base64")}`;
    const document = makeDocument(2, { "feature-1": "asset-capacity" });

    const svg = renderPdpSvg(document, "Uploaded Product", {
      imageDataUris: {
        "asset-cover": coverUri,
        "asset-capacity": sectionUri
      }
    });

    expect(svg).toContain(`href="${coverUri}"`);
    expect(svg).toContain(`href="${sectionUri}"`);
  });

  it("renders an icon for each selling point in the features column", () => {
    const svg = renderPdpSvg(makeDocument(6), "P");
    const circles = svg.match(/<circle/g) ?? [];

    expect(circles.length).toBeGreaterThanOrEqual(6);
  });

  it("stamps the output label with product, market, and template info", () => {
    const svg = renderPdpSvg(makeDocument(3), "Uploaded Product");

    expect(svg).toContain("Mexico / Spanish");
    expect(svg).toContain("pdp-tree-v3");
  });

  it("normalizes moved canvas blocks into one vertical column", () => {
    const layout = movePdpCanvasBlock(
      buildDefaultPdpCanvasLayout(makePoints(3)),
      getSellingPointBlockId("feature-1"),
      111,
      99
    );
    const svg = renderPdpSvg(makeDocument(3), "P", { layout });

    expect(svg).toContain('data-block-id="pdp-block-sp-feature-1"');
    expect(svg).not.toContain('transform="translate(111 99)"');
    const xPositions = Array.from(svg.matchAll(/transform="translate\((\d+) (\d+)\)"/g)).map(
      (match) => Number(match[1])
    );
    expect(new Set(xPositions)).toEqual(new Set([44]));
  });
});
