export type EditableMask = {
  width: number;
  height: number;
  values: Uint8Array;
};

export function getAspectConstrainedWidth(
  width: number,
  height: number,
  maximumHeight: number
): number {
  assertDimensions(width, height);
  if (!Number.isFinite(maximumHeight) || maximumHeight <= 0) {
    throw new Error("画布最大显示高度必须大于 0。");
  }
  return Math.max(1, Math.round((maximumHeight * width) / height));
}
export function createEditableMask(width: number, height: number): EditableMask {
  assertDimensions(width, height);
  return { width, height, values: new Uint8Array(width * height) };
}

export function cloneEditableMask(mask: EditableMask): EditableMask {
  return { ...mask, values: new Uint8Array(mask.values) };
}

export function hasMaskSelection(mask: EditableMask): boolean {
  return mask.values.some((value) => value > 0);
}

export function clearEditableMask(mask: EditableMask): EditableMask {
  return createEditableMask(mask.width, mask.height);
}

export function paintMaskCircle(
  mask: EditableMask,
  centerX: number,
  centerY: number,
  radius: number,
  selected: boolean
): EditableMask {
  const next = cloneEditableMask(mask);
  paintCircleInPlace(next, centerX, centerY, radius, selected);
  return next;
}

export function paintMaskStroke(
  mask: EditableMask,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  radius: number,
  selected: boolean
): EditableMask {
  const next = cloneEditableMask(mask);
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const steps = Math.max(1, Math.ceil(distance / Math.max(2, radius / 2)));
  for (let step = 1; step <= steps; step += 1) {
    const ratio = step / steps;
    paintCircleInPlace(
      next,
      fromX + (toX - fromX) * ratio,
      fromY + (toY - fromY) * ratio,
      radius,
      selected
    );
  }
  return next;
}

export function floodSelectRegion(
  mask: EditableMask,
  pixels: Uint8ClampedArray,
  startX: number,
  startY: number,
  tolerance: number
): EditableMask {
  if (pixels.length !== mask.width * mask.height * 4) {
    throw new Error("图像像素尺寸与选区蒙版不一致。");
  }

  const x0 = clamp(Math.round(startX), 0, mask.width - 1);
  const y0 = clamp(Math.round(startY), 0, mask.height - 1);
  const start = y0 * mask.width + x0;
  const sourceOffset = start * 4;
  const sourceR = pixels[sourceOffset];
  const sourceG = pixels[sourceOffset + 1];
  const sourceB = pixels[sourceOffset + 2];
  const sourceA = pixels[sourceOffset + 3];
  const maxDistanceSquared = Math.max(1, tolerance) ** 2 * 3;
  const visited = new Uint8Array(mask.width * mask.height);
  const queue = new Int32Array(mask.width * mask.height);
  let head = 0;
  let tail = 0;
  queue[tail++] = start;
  visited[start] = 1;
  const next = cloneEditableMask(mask);

  while (head < tail) {
    const index = queue[head++];
    const offset = index * 4;
    const dr = pixels[offset] - sourceR;
    const dg = pixels[offset + 1] - sourceG;
    const db = pixels[offset + 2] - sourceB;
    const da = pixels[offset + 3] - sourceA;
    if (dr * dr + dg * dg + db * db + da * da > maxDistanceSquared) {
      continue;
    }

    next.values[index] = 255;
    const x = index % mask.width;
    const y = Math.floor(index / mask.width);
    enqueue(index - 1, x > 0);
    enqueue(index + 1, x < mask.width - 1);
    enqueue(index - mask.width, y > 0);
    enqueue(index + mask.width, y < mask.height - 1);
  }

  return next;

  function enqueue(index: number, allowed: boolean) {
    if (allowed && visited[index] === 0) {
      visited[index] = 1;
      queue[tail++] = index;
    }
  }
}

function paintCircleInPlace(
  mask: EditableMask,
  centerX: number,
  centerY: number,
  radius: number,
  selected: boolean
) {
  const safeRadius = Math.max(1, Math.round(radius));
  const minX = Math.max(0, Math.floor(centerX - safeRadius));
  const maxX = Math.min(mask.width - 1, Math.ceil(centerX + safeRadius));
  const minY = Math.max(0, Math.floor(centerY - safeRadius));
  const maxY = Math.min(mask.height - 1, Math.ceil(centerY + safeRadius));
  const radiusSquared = safeRadius * safeRadius;
  const value = selected ? 255 : 0;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= radiusSquared) {
        mask.values[y * mask.width + x] = value;
      }
    }
  }
}
function assertDimensions(width: number, height: number) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("选区蒙版尺寸必须是正整数。");
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}