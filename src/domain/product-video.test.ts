import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRODUCT_VIDEO_PROMPT,
  PRODUCT_VIDEO_MODEL_LABEL,
  PRODUCT_VIDEO_OUTPUT
} from "./product-video";

describe("product video defaults", () => {
  it("keeps one editable copy of the requested 15-second hero-film brief", () => {
    expect(DEFAULT_PRODUCT_VIDEO_PROMPT.match(/使用上传的产品图片作为唯一产品参考/g)).toHaveLength(1);
    expect(DEFAULT_PRODUCT_VIDEO_PROMPT).toContain("第三镜");
    expect(PRODUCT_VIDEO_MODEL_LABEL).toBe("豆包 Seedance 1.5 Pro");
    expect(PRODUCT_VIDEO_OUTPUT).toEqual({
      durationSeconds: 12,
      aspectRatio: "16:9",
      resolution: "720p"
    });
  });
});
