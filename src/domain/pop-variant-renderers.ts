import { nestedBulletPath, nestedBulletTextX } from "./pop-svg-primitives";

type TextResolver = (slotId: string) => string;

const GRADIENT_DEFS = `<defs>
  <linearGradient id="popBlue" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#1B5FAA"/>
    <stop offset="1" stop-color="#2EA7E0"/>
  </linearGradient>
</defs>`;

export function renderAdditionalPopTemplateSvg(
  templateId: string,
  text: TextResolver,
  images: Record<string, string>
): string | undefined {
  switch (templateId) {
    case "main-sticker-usp-footer":
      return renderUspFooter(text, images);
    case "main-sticker-feature-duo":
      return renderFeatureDuo(text, images);
    case "inner-sticker-display-left":
      return renderInnerOverlay(text, images, "left");
    case "inner-sticker-display-right":
      return renderInnerOverlay(text, images, "right");
    case "oven-main-hero":
      return renderOvenMainHero(text, images);
    case "oven-main-feature":
      return renderOvenMainFeature(text, images);
    case "oven-corner-brand":
      return renderOvenCornerBrand(text, images);
    case "oven-inner-display":
      return renderOvenInnerDisplay(text, images);
    case "oven-wobbler":
      return renderOvenWobbler(text, images);
    case "oven-body-round":
      return renderOvenBodyRound(text, images);
    case "oven-body-strip":
      return renderOvenBodyStrip(text, images);
    case "oven-body-feature":
      return renderOvenBodyFeature(text, images);
    case "oven-top-sticker":
      return renderOvenTopSticker(text, images);
    default:
      return undefined;
  }
}

function renderUspFooter(text: TextResolver, images: Record<string, string>): string {
  return svg(
    800,
    1000,
    [
      imageBlock(images.uspImage, "USP Image", 24, 24, 752, 952, 0, 34),
      blueBand(24, 700, 752, 132, text("headline"), text("subheading"), "left")
    ].join("")
  );
}
function renderFeatureDuo(text: TextResolver, images: Record<string, string>): string {
  const width = 1066;
  const height = 600;
  const margin = 54;
  const columnWidth = (width - margin * 2) / 2;
  const body = [1, 2]
    .map((index) => {
      const x = margin + (index - 1) * columnWidth;
      return [
        imageBlock(
          images["featureImage" + index],
          "Feature Image " + index,
          x + 2,
          138,
          columnWidth - 4,
          318,
          0,
          24
        ),
        `<path d="${nestedBulletPath(x, x + columnWidth, 456, 68, index === 1)}" fill="url(#popBlue)"/>`,
        textElement(
          text("headline" + index),
          nestedBulletTextX(x, 68, index === 1) + 6,
          456 + 43,
          columnWidth * 0.8,
          24,
          "#ffffff",
          "start",
          800
        )
      ].join("");
    })
    .join("");

  return svg(
    width,
    height,
    [
      '<rect x="12" y="12" width="1042" height="576" fill="none" stroke="#bfe0f2" stroke-width="3"/>',
      '<line x1="54" y1="88" x2="410" y2="88" stroke="#1B5FAA" stroke-width="2"/>',
      '<line x1="656" y1="88" x2="1012" y2="88" stroke="#1B5FAA" stroke-width="2"/>',
      '<text x="533" y="98" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#1B5FAA">Main Feature</text>',
      body
    ].join("")
  );
}
function renderInnerOverlay(
  text: TextResolver,
  images: Record<string, string>,
  direction: "left" | "right"
): string {
  const band =
    direction === "left"
      ? blueBand(28, 278, 1008, 126, text("headline"), text("subheading"), "left")
      : blueBand(548, 416, 490, 132, text("headline"), text("subheading"), "left");
  const image =
    direction === "left"
      ? imageBlock(images.featureImage, "Feature Image", 380, 58, 560, 484, 18, 38)
      : imageBlock(images.featureImage, "Feature Image", 28, 52, 520, 496, 18, 38);

  return svg(1066, 600, [band, image].join(""));
}
function renderOvenMainHero(text: TextResolver, images: Record<string, string>): string {
  return svg(
    1000,
    660,
    [
      imageBlock(images.featureImage, "Feature Image", 24, 24, 952, 612, 0, 34),
      blueBand(24, 438, 438, 132, text("headline"), text("subheading"), "left")
    ].join("")
  );
}
function renderOvenMainFeature(
  text: TextResolver,
  images: Record<string, string>
): string {
  const startX = 24;
  const contentWidth = 952;
  const itemWidth = contentWidth / 3;
  const rowY = 414;
  const bandY = 569;
  const bandHeight = 67;
  const mini = [1, 2, 3]
    .map((index) => {
      const x = startX + (index - 1) * itemWidth;
      const endX = startX + index * itemWidth;
      const isFirst = index === 1;
      return [
        imageBlock(
          images["featureImage" + index],
          "Feature Image " + index,
          x + 1,
          rowY,
          itemWidth - 2,
          155,
          0,
          18
        ),
        `<path d="${nestedBulletPath(x, endX, bandY, bandHeight, isFirst)}" fill="url(#popBlue)"/>`,
        textElement(
          text("featureText" + index),
          nestedBulletTextX(x, bandHeight, isFirst),
          bandY + 43,
          itemWidth * 0.65,
          20,
          "#ffffff",
          "start",
          800
        )
      ].join("");
    })
    .join("");

  return svg(
    1000,
    660,
    [
      imageBlock(images.heroImage, "Feature Image", 24, 24, 952, 390, 0, 34),
      blueBand(24, 292, 400, 122, text("headline"), text("subheading"), "left"),
      mini
    ].join("")
  );
}
function renderOvenCornerBrand(
  text: TextResolver,
  images: Record<string, string>
): string {
  return svg(
    1000,
    600,
    [
      '<path d="M 48 52 H 420 V 486 Q 420 514 394 520 L 48 456 Z" fill="url(#popBlue)"/>',
      '<circle cx="300" cy="122" r="28" fill="none" stroke="#ffffff" stroke-width="8"/>',
      '<path d="M 282 123 Q 300 98 318 123" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>',
      '<text x="332" y="137" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#ffffff">Midea</text>',
      '<rect x="500" y="52" width="452" height="500" fill="#f2f2f2"/>',
      imageBlock(images.featureImage, "Design Area", 518, 72, 416, 348, 0, 34),
      '<path d="M 558 118 L 660 220 M 558 118 L 582 124 M 558 118 L 566 142 M 894 374 L 792 272 M 894 374 L 870 368 M 894 374 L 886 350" fill="none" stroke="#eeeeee" stroke-width="5" stroke-linecap="round"/>',
      textElement(text("headline"), 726, 504, 408, 42, "#30343b", "middle", 800)
    ].join("")
  );
}
function renderOvenInnerDisplay(
  text: TextResolver,
  images: Record<string, string>
): string {
  return svg(
    800,
    620,
    [
      imageBlock(images.featureImage, "Feature Image", 20, 20, 760, 520, 0, 34),
      blueBand(20, 420, 460, 96, text("headline"), text("subheading"), "left")
    ].join("")
  );
}
function renderOvenWobbler(text: TextResolver, images: Record<string, string>): string {
  return svg(
    440,
    820,
    [
      imageBlock(images.featureImage1, "Feature Image 1", 44, 38, 352, 374, 10, 24),
      blueBand(44, 300, 352, 112, text("headline1"), text("subheading1"), "left"),
      imageBlock(images.featureImage2, "Feature Image 2", 44, 412, 352, 400, 0, 24),
      blueBand(44, 700, 352, 112, text("headline2"), text("subheading2"), "left")
    ].join("")
  );
}
function renderOvenBodyRound(
  text: TextResolver,
  images: Record<string, string>
): string {
  return svg(
    700,
    700,
    [
      '<clipPath id="ovenBodyRoundClip"><circle cx="350" cy="330" r="285"/></clipPath>',
      circleImage(images.featureImage, "Feature Image", 350, 330, 285, 30),
      `<path d="${rightRoundedBandPath(70, 470, 365, 82)}" fill="url(#popBlue)" clip-path="url(#ovenBodyRoundClip)"/>`,
      textElement(text("headline"), 140, 522, 225, 24, "#ffffff", "start", 800)
    ].join("")
  );
}
function renderOvenBodyStrip(
  text: TextResolver,
  images: Record<string, string>
): string {
  return svg(
    1000,
    126,
    [
      imageBlock(images.featureImage, "Feature Image", 24, 13, 720, 100, 0, 22),
      '<path d="M 744 13 H 24 V 113 H 744" fill="none" stroke="url(#popBlue)" stroke-width="6"/>',
      blueBand(744, 13, 232, 100, text("headline"), "", "left")
    ].join("")
  );
}
function renderOvenBodyFeature(
  text: TextResolver,
  images: Record<string, string>
): string {
  return svg(
    1000,
    250,
    [
      imageBlock(images.featureImage, "Feature Image", 40, 5, 490, 240, 0, 28),
      blueBand(530, 55, 430, 140, text("headline"), text("subheading"), "left")
    ].join("")
  );
}
function renderOvenTopSticker(
  text: TextResolver,
  images: Record<string, string>
): string {
  return svg(
    1000,
    420,
    [
      imageBlock(images.featureImage, "Feature Image", 24, 24, 420, 372, 0, 34),
      blueBand(444, 24, 532, 180, text("headline"), text("subheading"), "left")
    ].join("")
  );
}
function svg(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${GRADIENT_DEFS}
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  ${body}
</svg>`;
}

function blueBand(
  x: number,
  y: number,
  width: number,
  height: number,
  headline: string,
  subheading: string,
  align: "left" | "center"
): string {
  const center = align === "center";
  const textX = center ? x + width / 2 : x + Math.max(22, width * 0.065);
  const anchor = center ? "middle" : "start";
  const headlineY = subheading ? y + height * 0.46 : y + height * 0.61;
  const headlineSize = fitFontSize(headline, width * 0.84, Math.min(40, height * 0.3), 18);
  const subheadingSize = fitFontSize(
    subheading,
    width * 0.84,
    Math.min(24, height * 0.18),
    13
  );

  return [
    `<path d="${rightRoundedBandPath(x, y, width, height)}" fill="url(#popBlue)"/>`,
    textElement(headline, textX, headlineY, width * 0.84, headlineSize, "#ffffff", anchor, 800),
    subheading
      ? textElement(
          subheading,
          textX,
          y + height * 0.73,
          width * 0.84,
          subheadingSize,
          "#dff0fb",
          anchor,
          400
        )
      : ""
  ].join("");
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
function textElement(
  value: string,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  fill: string,
  anchor: "start" | "middle",
  weight: number
): string {
  const fitted = fitFontSize(value, width, fontSize, Math.min(12, fontSize));
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="${fitted}" font-weight="${weight}" fill="${fill}">${escapeXml(value)}</text>`;
}

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
  const clipId = "clip-" + Math.abs(hashCode(placeholderLabel + "-" + x + "-" + y));

  if (dataUri) {
    return `<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}"/></clipPath>
  <image href="${dataUri}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`;
  }

  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="#d9d9d9"/>
  <text x="${x + width / 2}" y="${y + height / 2 + labelSize / 3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${labelSize}" fill="#ffffff">${escapeXml(placeholderLabel)}</text>`;
}

function circleImage(
  dataUri: string | undefined,
  placeholderLabel: string,
  cx: number,
  cy: number,
  radius: number,
  labelSize: number
): string {
  const clipId = "circle-" + Math.abs(hashCode(placeholderLabel + "-" + cx + "-" + cy));

  if (dataUri) {
    return `<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${radius}"/></clipPath>
  <image href="${dataUri}" x="${cx - radius}" y="${cy - radius}" width="${radius * 2}" height="${radius * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`;
  }

  return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#d9d9d9"/>
  <text x="${cx}" y="${cy + labelSize / 3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${labelSize}" fill="#ffffff">${escapeXml(placeholderLabel)}</text>`;
}

function fitFontSize(
  value: string,
  availableWidth: number,
  preferred: number,
  minimum: number
): number {
  if (!value) {
    return preferred;
  }
  const estimated = availableWidth / Math.max(value.length * 0.58, 1);
  return Math.max(minimum, Math.min(preferred, Math.floor(estimated)));
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
