import type { SellingPoint } from "./types";

export type PdpCover = {
  title: string;
  subtitle?: string;
  imageAssetId: string;
};

export type PdpSectionLayout = "image-left" | "image-right" | "image-full";

export type PdpSection = {
  id: string;
  sellingPointId: string;
  order: number;
  blackTitle: string;
  narrowGrayText: string;
  largeImageAssetId?: string;
  layout: PdpSectionLayout;
};

export type PdpDocument = {
  id: string;
  productId: string;
  country: string;
  language: string;
  templateVersion: string;
  cover: PdpCover;
  sections: PdpSection[];
  moreFeatures: SellingPoint[];
};

export type BuildPdpInput = {
  id: string;
  productId: string;
  country: string;
  language: string;
  templateVersion: string;
  cover: PdpCover;
  sellingPoints: SellingPoint[];
  sectionImageBySellingPointId: Record<string, string | undefined>;
};

export function buildPdpDocument(input: BuildPdpInput): PdpDocument {
  const selected = input.sellingPoints
    .filter((point) => point.enabled !== false)
    .sort((a, b) => a.priority - b.priority);

  // The template is dynamic: every enabled selling point becomes a section and
  // the canvas grows with the count — no fixed cap.
  const sections = selected.map((point, index): PdpSection => {
    return {
      id: `pdp-section-${point.id}`,
      sellingPointId: point.id,
      order: index + 1,
      blackTitle: point.shortLabel || point.title,
      narrowGrayText: point.technicalProof || point.benefit,
      largeImageAssetId: input.sectionImageBySellingPointId[point.id],
      layout: index % 2 === 0 ? "image-right" : "image-left"
    };
  });

  return {
    id: input.id,
    productId: input.productId,
    country: input.country,
    language: input.language,
    templateVersion: input.templateVersion,
    cover: input.cover,
    sections,
    moreFeatures: []
  };
}

export function getMissingPdpImageSlots(document: PdpDocument): string[] {
  return document.sections
    .filter((section) => !section.largeImageAssetId)
    .map((section) => section.sellingPointId);
}

