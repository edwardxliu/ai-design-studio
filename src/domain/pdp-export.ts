import type { PdpDocument } from "./pdp";

const width = 1080;
const coverHeight = 420;
const sectionHeight = 450;

export function renderPdpSvg(document: PdpDocument, productName: string): string {
  const height = coverHeight + document.sections.length * sectionHeight;
  const sections = document.sections
    .map((section, index) => {
      const y = coverHeight + index * sectionHeight;
      const imageX = section.layout === "image-left" ? 0 : 420;
      const copyX = section.layout === "image-left" ? 660 : 60;

      return `
  <g transform="translate(0 ${y})">
    <rect x="0" y="0" width="${width}" height="${sectionHeight}" fill="${index % 2 === 0 ? "#ffffff" : "#f7f8fa"}"/>
    <rect x="${imageX}" y="48" width="420" height="320" rx="0" fill="#d9dde3"/>
    <text x="${imageX + 32}" y="210" font-family="Arial, sans-serif" font-size="30" fill="#5f6c7b">${escapeXml(section.largeImageAssetId ?? "Missing image")}</text>
    <rect x="${copyX}" y="92" width="330" height="74" rx="0" fill="#111827"/>
    <text x="${copyX + 24}" y="138" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">${escapeXml(section.blackTitle)}</text>
    <rect x="${copyX}" y="190" width="330" height="74" rx="0" fill="#eceff3"/>
    <text x="${copyX + 24}" y="236" font-family="Arial, sans-serif" font-size="24" fill="#17202a">${escapeXml(section.narrowGrayText)}</text>
  </g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <rect x="0" y="0" width="${width}" height="${coverHeight}" fill="#17202a"/>
  <text x="64" y="118" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#ffffff">${escapeXml(document.cover.title)}</text>
  <text x="64" y="178" font-family="Arial, sans-serif" font-size="28" fill="#cbd5e1">${escapeXml(document.cover.subtitle ?? productName)}</text>
  <rect x="638" y="64" width="330" height="270" fill="#d9dde3"/>
  <text x="676" y="208" font-family="Arial, sans-serif" font-size="28" fill="#5f6c7b">${escapeXml(document.cover.imageAssetId)}</text>
  <text x="64" y="320" font-family="Arial, sans-serif" font-size="22" fill="#9fb0c6">${escapeXml(document.country)} / ${escapeXml(document.language)} / ${escapeXml(document.templateVersion)}</text>${sections}
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
