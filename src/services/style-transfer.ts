import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  getStyleTransferPreset,
  type StyleTransferStyleId
} from "@/src/domain/style-transfer";
import type { SourceImage } from "@/src/services/image-provider";

export type LoadedStyleReference = SourceImage & { sourceId: string };

export async function loadStyleTransferReferences(
  styleId: StyleTransferStyleId,
  publicRoot = path.join(process.cwd(), "public")
): Promise<LoadedStyleReference[]> {
  const preset = getStyleTransferPreset(styleId);

  return Promise.all(
    preset.references.map(async (reference) => {
      const relativePath = reference.url.replace(/^\/+/, "");
      const filePath = path.resolve(publicRoot, relativePath);
      const safeRoot = `${path.resolve(publicRoot)}${path.sep}`;

      if (!filePath.startsWith(safeRoot)) {
        throw new Error(`Invalid style reference path: ${reference.url}`);
      }

      return {
        sourceId: `style-reference:${reference.id}`,
        bytes: await readFile(filePath),
        contentType: "image/jpeg",
        filename: path.basename(filePath)
      };
    })
  );
}
