export type CropPlacementInput = {
  imageWidth: number;
  imageHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  zoom?: number;
  panX?: number;
  panY?: number;
};

export type CropPlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
  maxPanX: number;
  maxPanY: number;
};

export function computeCoverCropPlacement(input: CropPlacementInput): CropPlacement {
  const imageWidth = Math.max(1, input.imageWidth);
  const imageHeight = Math.max(1, input.imageHeight);
  const viewportWidth = Math.max(1, input.viewportWidth);
  const viewportHeight = Math.max(1, input.viewportHeight);
  const zoom = clamp(input.zoom ?? 1, 0.25, 4);
  const panX = clamp(input.panX ?? 0, -1, 1);
  const panY = clamp(input.panY ?? 0, -1, 1);
  const scale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight) * zoom;
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const maxPanX = Math.abs(width - viewportWidth) / 2;
  const maxPanY = Math.abs(height - viewportHeight) / 2;

  return {
    x: (viewportWidth - width) / 2 + panX * maxPanX,
    y: (viewportHeight - height) / 2 + panY * maxPanY,
    width,
    height,
    maxPanX,
    maxPanY
  };
}

export function parseAspectRatio(value: string, fallback = 1): number {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/);
  if (!match) {
    return fallback;
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  return width > 0 && height > 0 ? width / height : fallback;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}