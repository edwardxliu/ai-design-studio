export type ProjectStatus = "draft" | "ready" | "generating" | "review" | "archived";

export type AssetType =
  | "product-photo"
  | "phone-shot"
  | "brand-guide"
  | "template-reference"
  | "feature-icon"
  | "background"
  | "pop-input"
  | "pdp-input"
  | "document";

export type AssetSource = "uploaded" | "demo-seed" | "generated";

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  productIds: string[];
  targetCountries: string[];
  targetLanguages: string[];
  createdAt: string;
};

export type Product = {
  id: string;
  projectId: string;
  category?: string;
  brand?: string;
  modelName?: string;
  displayName?: string;
  profileId?: string;
};

export type Asset = {
  id: string;
  projectId: string;
  productId?: string;
  type: AssetType;
  filename: string;
  url: string;
  source: AssetSource;
  metadata?: Record<string, string>;
};

export type SellingPoint = {
  id: string;
  title: string;
  shortLabel: string;
  benefit: string;
  technicalProof?: string;
  priority: number;
  sourceAssetId?: string;
  enabled?: boolean;
};

export type ProductProfile = {
  id: string;
  productId: string;
  category: string;
  detectedFeatures: SellingPoint[];
  brandSlogan?: string;
  targetAudience?: string;
  valueProposition?: string;
  localizationHints: string[];
  confidence: number;
};

export type ProductWithProfile = Product & {
  profile: ProductProfile;
  assets: Asset[];
  acceptsUserUploads: boolean;
};

export type GenerationTaskStatus = "queued" | "running" | "done" | "failed" | "fallback";

export type GenerationTaskType =
  | "white-background"
  | "standardize-phone-shot"
  | "sku-variant"
  | "style-transfer"
  | "pop-render"
  | "pop-product-scene"
  | "pdp-render"
  | "localization"
  | "motion-storyboard";

export type GenerationTask = {
  id: string;
  projectId: string;
  productId: string;
  type: GenerationTaskType;
  status: GenerationTaskStatus;
  inputs: Record<string, unknown>;
  outputArtifactIds: string[];
};

export type OutputArtifact = {
  id: string;
  taskId: string;
  projectId: string;
  productId: string;
  type: "image" | "template" | "storyboard" | "json" | "report";
  url: string;
  label: {
    productName: string;
    country: string;
    language: string;
    templateType?: "POP" | "PDP";
    templateVersion?: string;
  };
  provenance: {
    model?: string;
    prompt?: string;
    sourceAssetIds: string[];
    generatedAt: string;
    isFallback: boolean;
  };
};

