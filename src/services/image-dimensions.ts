import sharp from "sharp";
import type { ImageProviderInput } from "@/src/services/image-provider";

export type PixelDimensions = {
  width: number;
  height: number;
};

const MAX_OUTPUT_PIXELS = 80_000_000;

export async function readImageDimensions(bytes: Buffer): Promise<PixelDimensions> {
  const metadata = await sharp(bytes, { limitInputPixels: MAX_OUTPUT_PIXELS }).metadata();
  const width = metadata.width;
  const height = metadata.height;
  if (!width || !height || width < 1 || height < 1) {
    throw new Error("无法读取原图的像素尺寸。");
  }
  return { width, height };
}

export function chooseImageProviderSize(
  dimensions: PixelDimensions
): NonNullable<ImageProviderInput["size"]> {
  const ratio = dimensions.width / dimensions.height;
  if (ratio > 1.15) {
    return "1536x1024";
  }
  if (ratio < 0.87) {
    return "1024x1536";
  }
  return "1024x1024";
}

export async function resizeImageToExactDimensions(
  bytes: Buffer,
  dimensions: PixelDimensions
): Promise<Buffer> {
  if (dimensions.width * dimensions.height > MAX_OUTPUT_PIXELS) {
    throw new Error("原图尺寸过大，无法在本地安全完成尺寸校正。");
  }
  return sharp(bytes, { limitInputPixels: MAX_OUTPUT_PIXELS })
    .resize(dimensions.width, dimensions.height, {
      fit: "cover",
      position: "centre"
    })
    .png()
    .toBuffer();
}