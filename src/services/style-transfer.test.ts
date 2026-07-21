import { describe, expect, it } from "vitest";
import { STYLE_TRANSFER_PRESETS } from "@/src/domain/style-transfer";
import { loadStyleTransferReferences } from "./style-transfer";

describe("style transfer references", () => {
  it("loads every PPT-derived reference in declared order", async () => {
    for (const preset of STYLE_TRANSFER_PRESETS) {
      const references = await loadStyleTransferReferences(preset.id);

      expect(references).toHaveLength(preset.references.length);
      expect(references.map((reference) => reference.sourceId)).toEqual(
        preset.references.map((reference) => `style-reference:${reference.id}`)
      );
      expect(references.every((reference) => reference.bytes.length > 0)).toBe(true);
      expect(references.map((reference) => reference.contentType)).toEqual(
        preset.references.map((reference) =>
          reference.url.endsWith(".png") ? "image/png" : "image/jpeg"
        )
      );
    }
  });
});
