import type { AssetType } from "./types";
import { additionalPopTemplates } from "./pop-template-sets";
import { renderAdditionalPopTemplateSvg } from "./pop-variant-renderers";
import { nestedBulletPath, nestedBulletTextX } from "./pop-svg-primitives";

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

const imageSlotAssetTypes: AssetType[] = [
  "product-photo",
  "phone-shot",
  "feature-icon",
  "background",
  "pop-input"
];

function textSlot(id: string, label: string, _defaultValue: string, maxLength: number): PopSlot {
  const defaultValue = id.toLowerCase().includes("subheading")
    ? "Subheading Space"
    : "Headline Space";
  return { id, type: "text", label, defaultValue, maxLength, editable: true };
}

function imageSlot(id: string, label: string): PopSlot {
  return { id, type: "image", label, acceptedAssetTypes: imageSlotAssetTypes, editable: true };
}

/**
 * The four fixed POP templates from the brand material list.
 * Blue gradient bands hold user-edited feature text; gray blocks hold user images.
 */
export const defaultPopTemplates: PopTemplate[] = [
  {
    id: "main-sticker-usp",
    name: "Main Sticker - USP",
    version: "2.0",
    aspectRatio: "4:5",
    placementHints: ["front panel", "door surface", "retail display"],
    slots: [
      imageSlot("uspImage", "USP 主图"),
      textSlot("headline", "Headline", "Counter depth optimization", 28),
      textSlot("subheading", "Subheading", "640L storage capacity", 44)
    ]
  },
  {
    id: "main-sticker-feature",
    name: "Main Sticker - Feature",
    version: "2.0",
    aspectRatio: "16:9",
    placementHints: ["front panel", "door surface", "side panel"],
    slots: [
      imageSlot("featureImage1", "特性图 1"),
      textSlot("headline1", "Headline 1", "Bigger volume", 22),
      imageSlot("featureImage2", "特性图 2"),
      textSlot("headline2", "Headline 2", "Quiet cooling", 22),
      imageSlot("featureImage3", "特性图 3"),
      textSlot("headline3", "Headline 3", "Energy saving", 22)
    ]
  },
  {
    id: "inner-sticker-display",
    name: "Inner Sticker & Display",
    version: "2.0",
    aspectRatio: "16:9",
    placementHints: ["inner panel", "display area", "inside door"],
    slots: [
      imageSlot("featureImage", "特性大图"),
      textSlot("headline", "Headline", "Fresh keeping technology", 28),
      textSlot("subheading", "Subheading", "Multi-zone humidity control", 44)
    ]
  },
  {
    id: "side-sticker",
    name: "Side Sticker",
    version: "2.0",
    aspectRatio: "5:2",
    placementHints: ["side panel", "body side", "shelf edge"],
    slots: [
      imageSlot("featureImage", "特性图"),
      textSlot("headline", "Headline", "Slot-in installation", 24)
    ]
  }
];

export const allPopTemplates: PopTemplate[] = [
  ...defaultPopTemplates,
  ...additionalPopTemplates
];

export function getPopTemplate(templateId: string): PopTemplate {
  const template = allPopTemplates.find((item) => item.id === templateId);

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

export type RenderPopFlatSvgInput = {
  templateId: string;
  textValues: Record<string, string>;
  imageDataUris: Record<string, string>;
};

const GRADIENT_DEFS = `<defs>
    <linearGradient id="popBlue" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1B5FAA"/>
      <stop offset="1" stop-color="#2EA7E0"/>
    </linearGradient>
  </defs>`;

/** Renders the flat POP artwork exactly as the fixed template layout defines it. */
export function renderPopFlatSvg(input: RenderPopFlatSvgInput): string {
  const template = getPopTemplate(input.templateId);
  const text = (slotId: string): string => {
    const slot = template.slots.find(
      (item) => item.id === slotId && item.type === "text"
    );
    const fallback = slot && slot.type === "text" ? slot.defaultValue : "";
    return input.textValues[slotId]?.trim() || fallback;
  };

  switch (template.id) {
    case "main-sticker-usp":
      return renderUspSticker(text, input.imageDataUris);
    case "main-sticker-feature":
      return renderFeatureSticker(text, input.imageDataUris);
    case "inner-sticker-display":
      return renderInnerSticker(text, input.imageDataUris);
    case "side-sticker":
      return renderSideSticker(text, input.imageDataUris);
    default: {
      const additionalSvg = renderAdditionalPopTemplateSvg(
        template.id,
        text,
        input.imageDataUris
      );
      if (additionalSvg) {
        return additionalSvg;
      }
      throw new Error(`No layout defined for POP template: ${template.id}`);
    }
  }
}

type TextResolver = (slotId: string) => string;

function renderUspSticker(text: TextResolver, images: Record<string, string>): string {
  const width = 800;
  const height = 1000;
  const bandX = 24;
  const bandY = 810;
  const bandWidth = 752;
  const bandHeight = 132;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${GRADIENT_DEFS}
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  ${imageBlock(images.uspImage, "USP Image", 24, 24, 752, 918, 0, 34)}
  <path d="${rightRoundedBandPath(bandX, bandY, bandWidth, bandHeight)}" fill="url(#popBlue)"/>
  <text x="58" y="${bandY + 50}" font-family="Arial, sans-serif" font-size="40" font-weight="800" fill="#ffffff">${escapeXml(text("headline"))}</text>
  <text x="58" y="${bandY + 91}" font-family="Arial, sans-serif" font-size="22" fill="#dff0fb">${escapeXml(text("subheading"))}</text>
</svg>`;
}
function renderFeatureSticker(text: TextResolver, images: Record<string, string>): string {
  const width = 1066;
  const height = 600;
  const margin = 48;
  const segmentWidth = (width - margin * 2) / 3;
  const imageTop = 128;
  const imageHeight = 330;
  const bandTop = imageTop + imageHeight;
  const bandHeight = 64;

  const columns = [1, 2, 3]
    .map((index) => {
      const x = margin + (index - 1) * segmentWidth;
      const isFirst = index === 1;
      return `
  ${imageBlock(images[`featureImage${index}`], `Feature Image ${index}`, x + 2, imageTop, segmentWidth - 4, imageHeight, 0, 24)}
  <path d="${nestedBulletPath(x, x + segmentWidth, bandTop, bandHeight, isFirst)}" fill="url(#popBlue)"/>
  <text x="${nestedBulletTextX(x, bandHeight, isFirst)}" y="${bandTop + 40}" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">${escapeXml(text(`headline${index}`))}</text>`;
    })
    .join("");

  const titleY = 78;
  const lineY = titleY - 9;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${GRADIENT_DEFS}
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="none" stroke="#bfe0f2" stroke-width="3"/>
  <line x1="${margin}" y1="${lineY}" x2="${width / 2 - 130}" y2="${lineY}" stroke="#1B5FAA" stroke-width="2"/>
  <line x1="${width / 2 + 130}" y1="${lineY}" x2="${width - margin}" y2="${lineY}" stroke="#1B5FAA" stroke-width="2"/>
  <text x="${width / 2}" y="${titleY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#1B5FAA">Main Feature</text>
  ${columns}
</svg>`;
}
function renderInnerSticker(text: TextResolver, images: Record<string, string>): string {
  const width = 1066;
  const height = 600;
  const bandX = 24;
  const bandY = 472;
  const bandWidth = 650;
  const bandHeight = 104;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${GRADIENT_DEFS}
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  ${imageBlock(images.featureImage, "Feature Image", 24, 24, 1018, 552, 0, 40)}
  <path d="${rightRoundedBandPath(bandX, bandY, bandWidth, bandHeight)}" fill="url(#popBlue)"/>
  <text x="58" y="${bandY + 43}" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#ffffff">${escapeXml(text("headline"))}</text>
  <text x="58" y="${bandY + 78}" font-family="Arial, sans-serif" font-size="20" fill="#dff0fb">${escapeXml(text("subheading"))}</text>
</svg>`;
}
function renderSideSticker(text: TextResolver, images: Record<string, string>): string {
  const width = 1000;
  const height = 400;
  const blockY = 116;
  const blockHeight = 168;
  const imageX = 30;
  const imageWidth = 470;
  const textX = 516;
  const textWidth = 454;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${GRADIENT_DEFS}
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  ${imageBlock(images.featureImage, "Feature Image", imageX, blockY, imageWidth, blockHeight, 0, 28)}
  <path d="${rightRoundedBandPath(textX, blockY, textWidth, blockHeight)}" fill="#d9d9d9"/>
  <text x="${textX + 30}" y="${blockY + blockHeight / 2 + 12}" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#ffffff">${escapeXml(text("headline"))}</text>
</svg>`;
}

function rightRoundedBandPath(
  x: number,
  y: number,
  width: number,
  height: number
): string {
  const radius = Math.min(height / 2, width / 2);
  return [
    `M ${x} ${y}`,
    `H ${x + width - radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + width} ${y + radius}`,
    `V ${y + height - radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + width - radius} ${y + height}`,
    `H ${x}`,
    "Z"
  ].join(" ");
}
/** Gray placeholder block, or the user's uploaded image clipped to the block. */
function imageBlock(
  dataUri: string | undefined,
  placeholderLabel: string,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  labelSize: number
): string {
  const clipId = `clip-${Math.abs(hashCode(`${placeholderLabel}-${x}-${y}`))}`;

  if (dataUri) {
    return `<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}"/></clipPath>
  <image href="${dataUri}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`;
  }

  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="#d9d9d9"/>
  <text x="${x + width / 2}" y="${y + height / 2 + labelSize / 3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${labelSize}" fill="#ffffff">${escapeXml(placeholderLabel)}</text>`;
}

function hashCode(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildPopScenePrompt(input: BuildPopScenePromptInput): string {
  return [
    `Create a realistic product photography image for ${input.productName}.`,
    `Attach the completed POP artwork from ${input.flatPopAssetId} to the ${input.placement}.`,
    "Preserve the product shape, logo, panel layout, color, proportions, and key physical details.",
    "Do not invent additional text; the POP artwork already contains the exact text.",
    "Attach only this selected sticker artwork and do not add alternate sticker designs.",
    "Use clean studio lighting and a believable retail display style."
  ].join(" ");
}
