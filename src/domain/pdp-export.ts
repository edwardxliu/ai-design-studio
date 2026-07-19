import type { PdpDocument, PdpSection } from "./pdp";
import {
  buildDefaultPdpCanvasLayout,
  getPdpCanvasColumnLabel,
  type PdpCanvasBlock,
  type PdpCanvasLayout
} from "./pdp-canvas-layout";

const MIDEA_BLUE = "#005eb8";

export type RenderPdpSvgOptions = {
  imageDataUris?: Record<string, string>;
  specification?: Array<[string, string]>;
  layout?: PdpCanvasLayout;
};

export function renderPdpSvg(
  document: PdpDocument,
  productName: string,
  options: RenderPdpSvgOptions = {}
): string {
  const imageDataUris = options.imageDataUris ?? {};
  const specification = options.specification ?? [];
  const layout =
    options.layout ??
    buildDefaultPdpCanvasLayout(
      document.sections.map((section) => ({
        id: section.sellingPointId,
        priority: section.order,
        enabled: true
      }))
    );
  const sectionById = new Map(
    document.sections.map((section) => [section.sellingPointId, section])
  );

  const headers = uniqueColumnHeaders(layout.blocks)
    .map(
      (block) => `  <text x="${block.x}" y="${Math.max(18, block.y - 24)}" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="${
        block.kind === "selling-point" ? "#087f8c" : "#5f6c7b"
      }">${escapeXml(getPdpCanvasColumnLabel(block))}</text>
  <rect x="${block.x}" y="${Math.max(25, block.y - 16)}" width="${block.width}" height="1" fill="#c8d1da"/>`
    )
    .join("\n");

  const blocks = layout.blocks
    .map((block) =>
      renderBlock(
        block,
        document,
        productName,
        sectionById,
        imageDataUris,
        specification
      )
    )
    .filter(Boolean)
    .join("\n");

  const label = `${productName} | ${document.country} / ${document.language} | PDP ${document.templateVersion}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
  <defs>
    <pattern id="pdp-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e4e9ee" stroke-width="1"/>
    </pattern>
    <filter id="pdp-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#17202a" flood-opacity="0.10"/>
    </filter>
  </defs>
  <rect width="${layout.width}" height="${layout.height}" fill="#f2f4f7"/>
  <rect width="${layout.width}" height="${layout.height}" fill="url(#pdp-grid)"/>
${headers}
${blocks}
  <text x="40" y="${layout.height - 22}" font-family="Arial, sans-serif" font-size="12" fill="#5f6c7b">${escapeXml(label)}</text>
</svg>`;
}

function renderBlock(
  block: PdpCanvasBlock,
  document: PdpDocument,
  productName: string,
  sectionById: Map<string, PdpSection>,
  imageDataUris: Record<string, string>,
  specification: Array<[string, string]>
): string {
  let body = "";

  if (block.kind === "brand") {
    body = brandBlock(block, document, productName);
  } else if (block.kind === "kv") {
    body = kvBlock(
      block,
      document,
      productName,
      imageDataUris[document.cover.imageAssetId]
    );
  } else if (block.kind === "selling-point" && block.sellingPointId) {
    const section = sectionById.get(block.sellingPointId);
    if (!section) {
      return "";
    }
    body = sellingPointBlock(
      block,
      section,
      section.largeImageAssetId
        ? imageDataUris[section.largeImageAssetId]
        : undefined
    );
  } else if (block.kind === "features") {
    body = featuresBlock(block, document);
  } else if (block.kind === "specification") {
    body = specificationBlock(block, specification);
  }

  return `  <g data-block-id="${escapeXml(block.id)}" data-kind="${block.kind}" transform="translate(${block.x} ${block.y})" filter="url(#pdp-shadow)">
${body}
  </g>`;
}

function brandBlock(
  block: PdpCanvasBlock,
  document: PdpDocument,
  productName: string
): string {
  const brandHeight = Math.round(block.height * 0.58);
  const tileGap = 8;
  const tileWidth = (block.width - 28 - tileGap * 3) / 4;
  const tileY = brandHeight + 76;
  const productLines = wrapText(productName, Math.max(12, Math.floor(block.width / 12)), 2);
  const titleLines = wrapText(
    document.cover.title,
    Math.max(10, Math.floor(block.width / 11)),
    3
  );

  return `    <rect width="${block.width}" height="${block.height}" fill="#ffffff" stroke="#cfd7df"/>
    <rect width="${block.width}" height="${brandHeight}" fill="${MIDEA_BLUE}"/>
    <text x="18" y="54" font-family="Arial, sans-serif" font-size="${Math.max(
      24,
      Math.round(block.width * 0.14)
    )}" font-weight="800" fill="#ffffff">Midea</text>
    <text x="18" y="78" font-family="Arial, sans-serif" font-size="13" fill="#d9efff">make yourself at home</text>
${svgTextLines(titleLines, 18, 116, 20, 18, "#ffffff", 700)}
    <rect x="14" y="${brandHeight + 14}" width="${block.width - 28}" height="42" fill="#ffffff" stroke="#9ebbd5"/>
${svgTextLines(productLines, 24, brandHeight + 30, 15, 12, "#17202a", 600)}
${Array.from({ length: 4 }, (_, index) => {
  const x = 14 + index * (tileWidth + tileGap);
  return `    <rect x="${x}" y="${tileY}" width="${tileWidth}" height="54" fill="${
    index === 0 ? "#e6f8fc" : "#f4f6f8"
  }" stroke="#b9c4ce"/>`;
}).join("\n")}`;
}

function kvBlock(
  block: PdpCanvasBlock,
  document: PdpDocument,
  productName: string,
  imageDataUri: string | undefined
): string {
  const titleHeight = 54;
  const subtitleHeight = 40;
  const imageHeight = block.height - titleHeight - subtitleHeight;
  const titleLines = wrapText(
    document.cover.title || productName,
    Math.max(16, Math.floor(block.width / 10)),
    2
  );

  return `    <rect width="${block.width}" height="${block.height}" fill="#ffffff" stroke="#cfd7df"/>
${imageBlock(imageDataUri, 0, 0, block.width, imageHeight, block.id, "KV")}
    <rect y="${imageHeight}" width="${block.width}" height="${titleHeight}" fill="#17202a"/>
${svgTextLines(titleLines, 16, imageHeight + 20, 18, 16, "#ffffff", 800)}
    <rect y="${imageHeight + titleHeight}" width="${block.width}" height="${subtitleHeight}" fill="#d9dde3"/>
    <text x="16" y="${block.height - 14}" font-family="Arial, sans-serif" font-size="12" fill="#3c4b5d">${escapeXml(
      `${document.country} / ${document.language}`
    )}</text>`;
}

function sellingPointBlock(
  block: PdpCanvasBlock,
  section: PdpSection,
  imageDataUri: string | undefined
): string {
  const titleHeight = clamp(Math.round(block.height * 0.18), 30, 48);
  const proofHeight = clamp(Math.round(block.height * 0.16), 26, 42);
  const imageHeight = Math.max(42, block.height - titleHeight - proofHeight);
  const fontSize = clamp(Math.round(block.width / 17), 11, 17);
  const titleLines = wrapText(
    section.blackTitle,
    Math.max(10, Math.floor((block.width - 50) / (fontSize * 0.58))),
    titleHeight > 38 ? 2 : 1
  );
  const proofLines = wrapText(
    section.narrowGrayText,
    Math.max(12, Math.floor(block.width / 7)),
    proofHeight > 32 ? 2 : 1
  );

  return `    <rect width="${block.width}" height="${block.height}" fill="#ffffff" stroke="#cfd7df"/>
    <rect width="${block.width}" height="${titleHeight}" fill="#17202a"/>
${svgTextLines(titleLines, 12, 10, fontSize + 2, fontSize, "#ffffff", 800)}
    <rect x="${block.width - 38}" y="7" width="30" height="20" fill="#00a6d6"/>
    <text x="${block.width - 23}" y="21" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="800" fill="#ffffff">P${section.order}</text>
    <rect y="${titleHeight}" width="${block.width}" height="${proofHeight}" fill="#d9dde3"/>
${svgTextLines(proofLines, 12, titleHeight + 7, 13, 11, "#3c4b5d", 500)}
${imageBlock(
    imageDataUri,
    0,
    titleHeight + proofHeight,
    block.width,
    imageHeight,
    block.id,
    "IMAGE"
  )}`;
}

function featuresBlock(block: PdpCanvasBlock, document: PdpDocument): string {
  const headerHeight = 44;
  const columns = 3;
  const cellWidth = block.width / columns;
  const rowHeight = 86;
  const icons = document.sections
    .map((section, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const centerX = column * cellWidth + cellWidth / 2;
      const centerY = headerHeight + 32 + row * rowHeight;
      const labelLines = wrapText(section.blackTitle, 13, 2);
      return `    <circle cx="${centerX}" cy="${centerY}" r="18" fill="#ffffff" stroke="#9aa7b4"/>
    <text x="${centerX}" y="${centerY + 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="800" fill="#057ca2">${index + 1}</text>
${svgTextLines(
  labelLines,
  column * cellWidth + 4,
  centerY + 26,
  10,
  8,
  "#3c4b5d",
  600,
  "middle",
  centerX
)}`;
    })
    .join("\n");

  return `    <rect width="${block.width}" height="${block.height}" fill="#ffffff" stroke="#cfd7df"/>
    <rect width="${block.width}" height="${headerHeight}" fill="#17202a"/>
    <text x="14" y="28" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">More Features</text>
${icons}`;
}

function specificationBlock(
  block: PdpCanvasBlock,
  specification: Array<[string, string]>
): string {
  const headerHeight = 44;
  const rowHeight = Math.min(
    42,
    Math.max(28, (block.height - headerHeight - 12) / Math.max(specification.length, 1))
  );
  const rows = specification
    .map(([name, value], index) => {
      const y = headerHeight + index * rowHeight;
      return `    <rect y="${y}" width="${block.width}" height="${rowHeight}" fill="${
        index % 2 === 0 ? "#ffffff" : "#eef1f4"
      }" stroke="#d9dde3"/>
    <text x="8" y="${y + rowHeight / 2 + 3}" font-family="Arial, sans-serif" font-size="8" font-weight="700" fill="#17202a">${escapeXml(
      truncate(name, 18)
    )}</text>
    <text x="${block.width * 0.48}" y="${y + rowHeight / 2 + 3}" font-family="Arial, sans-serif" font-size="8" fill="#5f6c7b">${escapeXml(
      truncate(value, 20)
    )}</text>`;
    })
    .join("\n");

  return `    <rect width="${block.width}" height="${block.height}" fill="#ffffff" stroke="#cfd7df"/>
    <rect width="${block.width}" height="${headerHeight}" fill="#17202a"/>
    <text x="14" y="28" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">Specification</text>
${rows}`;
}

function imageBlock(
  dataUri: string | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  clipKey: string,
  label: string
): string {
  if (dataUri) {
    const clipId = `pdp-clip-${clipKey.replace(/[^a-zA-Z0-9-]/g, "")}`;
    return `    <clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath>
    <image href="${escapeXml(dataUri)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`;
  }

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  return `    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#d9dde3"/>
    <rect x="${centerX - 17}" y="${centerY - 14}" width="34" height="28" fill="none" stroke="#b9c4ce"/>
    <path d="M ${centerX - 13} ${centerY + 9} L ${centerX - 2} ${centerY - 2} L ${centerX + 5} ${centerY + 5} L ${centerX + 13} ${centerY - 5}" fill="none" stroke="#b9c4ce"/>
    <text x="${centerX}" y="${centerY + 30}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="700" fill="#7d8a98">${label}</text>`;
}

function svgTextLines(
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  fontSize: number,
  color: string,
  weight: number,
  anchor: "start" | "middle" = "start",
  anchorX?: number
): string {
  const textX = anchorX ?? x;
  return `    <text x="${textX}" y="${y}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="${color}">${lines
    .map(
      (line, index) =>
        `<tspan x="${textX}" dy="${index === 0 ? lineHeight : lineHeight}">${escapeXml(
          line
        )}</tspan>`
    )
    .join("")}</text>`;
}

function wrapText(value: string, maxChars: number, maxLines: number): string[] {
  const clean = value.trim();
  if (!clean) {
    return [""];
  }

  const tokens = clean.includes(" ") ? clean.split(/\s+/) : Array.from(clean);
  const joiner = clean.includes(" ") ? " " : "";
  const lines: string[] = [];
  let current = "";

  for (const token of tokens) {
    const next = current ? `${current}${joiner}${token}` : token;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = token;
      if (lines.length === maxLines) {
        break;
      }
    } else {
      current = next;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (lines.length === maxLines && lines.join(joiner).length < clean.length) {
    lines[maxLines - 1] = truncate(lines[maxLines - 1], Math.max(2, maxChars));
  }

  return lines;
}

function uniqueColumnHeaders(blocks: PdpCanvasBlock[]): PdpCanvasBlock[] {
  const seen = new Set<string>();
  return blocks
    .slice()
    .sort((left, right) => left.x - right.x || left.y - right.y)
    .filter((block) => {
      const key =
        block.kind === "selling-point" ? `selling-point-${block.level ?? 1}` : block.kind;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
