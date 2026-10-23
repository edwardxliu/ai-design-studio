import { describe, expect, it } from "vitest";
import { parseWhiteBackgroundRequest, validateWhiteBackgroundReferences, buildMultiAngleWhitePrompt } from "./white-background";
import type { Asset } from "./types";
const valid = { productId: "p", referenceAssetIds: ["a"], angle: "back", sourceState: "as-reference", autoRemoveBackground: true, whiteBackground: true, naturalShadow: true, width: 1920, height: 1080, imageModel: "doubao" };
function asset(id: string, type: Asset["type"] = "product-photo", productId = "p"): Asset { return { id, type, productId, projectId: "project", filename: `${id}.png`, url: `/${id}.png`, source: "uploaded" }; }
describe("white background request boundaries", () => {
  it("accepts six-angle requests and rejects malformed controls and dimensions", () => {
    expect(parseWhiteBackgroundRequest(valid)).toEqual(valid);
    for (const patch of [{ width: 0 }, { width: 5000 }, { height: 100.5 }, { angle: "other" }, { autoRemoveBackground: "false" }, { referenceAssetIds: [] }, { referenceAssetIds: ["a", "b", "c", "d"] }, { imageModel: "unsupported" }]) {
      expect(() => parseWhiteBackgroundRequest({ ...valid, ...patch })).toThrow();
    }
  });
  it("rejects another product and incompatible reference states", () => {
    expect(() => validateWhiteBackgroundReferences({ ...valid, referenceAssetIds: ["a"] }, [asset("a", "product-photo", "other")])).toThrow(/当前产品/);
    expect(() => validateWhiteBackgroundReferences({ ...valid, referenceAssetIds: ["a", "b"] }, [asset("a", "white-background-open"), asset("b", "white-background-closed")])).toThrow(/开门.*关门/);
    expect(() => validateWhiteBackgroundReferences({ ...valid, sourceState: "closed" }, [asset("a", "white-background-open")])).toThrow(/状态/);
  });
  it("carries camera, silhouette, background, shadow and state into the prompt", () => {
    const prompt = buildMultiAngleWhitePrompt({ ...valid, angle: "top", sourceState: "open", autoRemoveBackground: false, whiteBackground: false, naturalShadow: false });
    expect(prompt).toContain("俯视"); expect(prompt).toContain("门体开启角度");
    expect(prompt).toContain("不进行额外的自动抠图"); expect(prompt).toContain("保留参考图原背景"); expect(prompt).toContain("不添加投影"); expect(prompt).toContain("Logo");
  });
});
