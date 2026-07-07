import type { AssetType } from "./types";

export type PopSlot =
  | {
      id: string;
      type: "text";
      label: string;
      defaultValue: string;
      maxLength: number;
      editable: true;
    }
  | {
      id: string;
      type: "image";
      label: string;
      acceptedAssetTypes: AssetType[];
      editable: true;
    };

export type PopTemplate = {
  id: string;
  name: string;
  version: string;
  aspectRatio: string;
  slots: PopSlot[];
  placementHints: string[];
};

export type RenderPopFlatInput = {
  templateId: string;
  country: string;
  language: string;
  textValues: Record<string, string>;
  imageValues: Record<string, string>;
};

export type PopFlatPayload = RenderPopFlatInput & {
  templateVersion: string;
  aspectRatio: string;
  slots: PopSlot[];
};

export type BuildPopScenePromptInput = {
  productName: string;
  placement: string;
  flatPopAssetId: string;
};

export const defaultPopTemplates: PopTemplate[] = [
  {
    id: "main-sticker-feature",
    name: "Main Sticker - Feature",
    version: "1.0",
    aspectRatio: "4:5",
    placementHints: ["front panel", "door surface", "side panel"],
    slots: [
      {
        id: "headline",
        type: "text",
        label: "Headline",
        defaultValue: "Same size, bigger volume",
        maxLength: 48,
        editable: true
      },
      {
        id: "subline",
        type: "text",
        label: "Subline",
        defaultValue: "Large capacity in a standard footprint",
        maxLength: 72,
        editable: true
      },
      {
        id: "featureImage",
        type: "image",
        label: "Feature image",
        acceptedAssetTypes: ["feature-icon", "product-photo", "pop-input"],
        editable: true
      }
    ]
  },
  {
    id: "main-sticker-usp",
    name: "Main Sticker - USP",
    version: "1.0",
    aspectRatio: "1:1",
    placementHints: ["front panel", "top right door", "retail display"],
    slots: [
      {
        id: "usp",
        type: "text",
        label: "USP",
        defaultValue: "Counter depth optimization",
        maxLength: 42,
        editable: true
      },
      {
        id: "proof",
        type: "text",
        label: "Proof",
        defaultValue: "640L storage capacity",
        maxLength: 42,
        editable: true
      },
      {
        id: "badge",
        type: "image",
        label: "Badge",
        acceptedAssetTypes: ["feature-icon", "pop-input"],
        editable: true
      }
    ]
  },
  {
    id: "inner-sticker-display",
    name: "Inner Sticker & Display",
    version: "1.0",
    aspectRatio: "16:9",
    placementHints: ["inner panel", "display area", "inside door"],
    slots: [
      {
        id: "headline",
        type: "text",
        label: "Headline",
        defaultValue: "Smart cooling, quieter living",
        maxLength: 54,
        editable: true
      },
      {
        id: "detailImage",
        type: "image",
        label: "Detail image",
        acceptedAssetTypes: ["product-photo", "feature-icon", "pop-input"],
        editable: true
      }
    ]
  },
  {
    id: "side-sticker",
    name: "Side Sticker",
    version: "1.0",
    aspectRatio: "3:8",
    placementHints: ["side panel", "left side", "right side"],
    slots: [
      {
        id: "featureList",
        type: "text",
        label: "Feature list",
        defaultValue: "Large capacity / Low noise / Energy saving",
        maxLength: 90,
        editable: true
      },
      {
        id: "sideGraphic",
        type: "image",
        label: "Side graphic",
        acceptedAssetTypes: ["feature-icon", "pop-input"],
        editable: true
      }
    ]
  }
];

export function getPopTemplate(templateId: string): PopTemplate {
  const template = defaultPopTemplates.find((item) => item.id === templateId);

  if (!template) {
    throw new Error(`Unknown POP template: ${templateId}`);
  }

  return template;
}

export function renderPopFlatPayload(input: RenderPopFlatInput): PopFlatPayload {
  const template = getPopTemplate(input.templateId);

  return {
    ...input,
    templateVersion: template.version,
    aspectRatio: template.aspectRatio,
    slots: template.slots
  };
}

export function buildPopScenePrompt(input: BuildPopScenePromptInput): string {
  return [
    `Create a realistic product photography image for ${input.productName}.`,
    `Attach the completed POP artwork from ${input.flatPopAssetId} to the ${input.placement}.`,
    "Preserve the product shape, logo, panel layout, color, proportions, and key physical details.",
    "Do not invent additional text; the POP artwork already contains the exact text.",
    "Use clean studio lighting and a believable retail display style."
  ].join(" ");
}

