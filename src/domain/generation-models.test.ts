import { describe, expect, it } from "vitest";
import {
  DEFAULT_IMAGE_MODEL_CHOICE,
  getImageModelOption,
  inferImageModelChoice,
  parseImageModelChoice
} from "./generation-models";

describe("generation model choices", () => {
  it("accepts supported choices and defaults safely", () => {
    expect(parseImageModelChoice("openai")).toBe("openai");
    expect(parseImageModelChoice("doubao")).toBe("doubao");
    expect(parseImageModelChoice("unknown")).toBe(DEFAULT_IMAGE_MODEL_CHOICE);
  });

  it("maps model identifiers to their provider", () => {
    expect(inferImageModelChoice("gpt-image-1")).toBe("openai");
    expect(inferImageModelChoice("doubao-seedream-5-0-lite-260128")).toBe("doubao");
    expect(getImageModelOption("doubao").label).toBe("Seedream 5.0 Lite");
  });
});
