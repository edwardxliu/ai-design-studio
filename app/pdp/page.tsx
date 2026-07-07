import { AppShell } from "@/src/components/AppShell";
import { PdpBuilderView } from "@/src/components/PdpBuilderView";
import { getPrimaryDemoProduct } from "@/src/domain/demo-data";
import { buildPdpDocument } from "@/src/domain/pdp";

export default function PdpPage() {
  const product = getPrimaryDemoProduct();
  const document = buildPdpDocument({
    id: "pdp-demo",
    productId: product.id,
    country: "Mexico",
    language: "Spanish",
    templateVersion: "pdp-dynamic-v1",
    cover: {
      title: product.displayName ?? "Uploaded product",
      subtitle: product.profile.valueProposition,
      imageAssetId: "asset-cover"
    },
    sellingPoints: product.profile.detectedFeatures,
    sectionImageBySellingPointId: {
      "feature-capacity": "asset-capacity",
      "feature-slot-in": "asset-slot-in",
      "feature-low-noise": "asset-low-noise"
    }
  });

  return (
    <AppShell>
      <PdpBuilderView document={document} productName={product.displayName ?? "Uploaded product"} />
    </AppShell>
  );
}

