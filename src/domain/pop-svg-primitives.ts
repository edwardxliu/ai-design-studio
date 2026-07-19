/** Shared SVG path builders for POP sticker bands. */

/** Gap between nested bullets; the white background shows through the arc seam. */
const BULLET_GAP = 6;

/** Band with a square left edge and a fully rounded right end. */
export function rightRoundedBandPath(
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

/**
 * One bullet of a nested bullet chain spanning [xStart, xEnd].
 * The first bullet has a square left edge; every following bullet's left edge
 * is a concave arc hugging the previous bullet's rounded right end.
 */
export function nestedBulletPath(
  xStart: number,
  xEnd: number,
  y: number,
  height: number,
  isFirst: boolean
): string {
  const radius = height / 2;

  if (isFirst) {
    return rightRoundedBandPath(xStart, y, xEnd - xStart, height);
  }

  // Previous bullet's right arc is centered at (xStart - radius, y + radius);
  // this bullet's left edge follows a concentric circle radius + gap outside it.
  const centerX = xStart - radius;
  const centerY = y + radius;
  const outerRadius = radius + BULLET_GAP;
  const inset = Math.sqrt(outerRadius * outerRadius - radius * radius);
  const leftX = round2(centerX + inset);

  return [
    `M ${leftX} ${y}`,
    `H ${xEnd - radius}`,
    `A ${radius} ${radius} 0 0 1 ${xEnd} ${centerY}`,
    `A ${radius} ${radius} 0 0 1 ${xEnd - radius} ${y + height}`,
    `H ${leftX}`,
    `A ${outerRadius} ${outerRadius} 0 0 0 ${leftX} ${y}`,
    "Z"
  ].join(" ");
}

/** X where a nested bullet's usable content starts. */
export function nestedBulletTextX(xStart: number, height: number, isFirst: boolean): number {
  return isFirst ? xStart + 16 : xStart + height / 2 + BULLET_GAP + 4;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
