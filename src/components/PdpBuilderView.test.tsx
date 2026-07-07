import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getPrimaryDemoProduct } from "@/src/domain/demo-data";
import { buildPdpDocument } from "@/src/domain/pdp";
import { PdpBuilderView } from "./PdpBuilderView";

describe("PdpBuilderView", () => {
  it("shows dynamic PDP sections from selling points", () => {
    const product = getPrimaryDemoProduct();
    const document = buildPdpDocument({
      id: "pdp-test-view",
      productId: product.id,
      country: "Mexico",
      language: "Spanish",
      templateVersion: "pdp-dynamic-v1",
      cover: {
        title: product.displayName ?? "Product",
        subtitle: product.profile.valueProposition,
        imageAssetId: "asset-cover"
      },
      sellingPoints: product.profile.detectedFeatures.slice(0, 2),
      sectionImageBySellingPointId: {
        "feature-capacity": "asset-capacity"
      }
    });

    render(<PdpBuilderView document={document} productName={product.displayName ?? "Product"} />);

    expect(screen.getByText("Dynamic PDP Builder")).toBeInTheDocument();
    expect(screen.getByText("640L Capacity")).toBeInTheDocument();
    expect(screen.getByText("Counter Depth Optimization")).toBeInTheDocument();
    expect(screen.getByText("Missing image: feature-slot-in")).toBeInTheDocument();
  });
});

