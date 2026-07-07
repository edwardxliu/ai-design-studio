import { describe, expect, it } from "vitest";
import { demoProducts, demoProject } from "./demo-data";

describe("demo data", () => {
  it("keeps the platform product-category agnostic", () => {
    expect(demoProject.productIds.length).toBeGreaterThan(0);
    expect(
      demoProducts.every((product) => product.category !== "hardcoded-fridge")
    ).toBe(true);
  });

  it("includes editable selling points for PDP generation", () => {
    const product = demoProducts[0];

    expect(product.profile.detectedFeatures.length).toBeGreaterThanOrEqual(3);
    expect(product.profile.detectedFeatures[0]).toHaveProperty("title");
    expect(product.profile.detectedFeatures[0]).toHaveProperty("benefit");
    expect(product.profile.detectedFeatures[0]).toHaveProperty("priority");
  });

  it("contains both demo-seed and upload-ready asset sources", () => {
    const product = demoProducts[0];
    const sources = product.assets.map((asset) => asset.source);

    expect(sources).toContain("demo-seed");
    expect(product.acceptsUserUploads).toBe(true);
  });
});

