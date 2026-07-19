import { describe, expect, it, vi } from "vitest";
import { extractSellingPointsFromPdf } from "./selling-point-extractor";

const pdfBytes = Buffer.from("%PDF-1.4 fake selling point sheet");

describe("extractSellingPointsFromPdf", () => {
  it("sends the pdf to the language model and normalizes the JSON reply", async () => {
    const complete = vi.fn().mockResolvedValue(
      JSON.stringify({
        sellingPoints: [
          {
            title: "SPACE Master Large Capacity",
            shortLabel: "640L Capacity",
            benefit: "Larger space to store food",
            technicalProof: "23 cu.ft. / 640L"
          },
          { name: "Auto Ice Maker", description: "Fresh ice anytime" }
        ]
      })
    );

    const result = await extractSellingPointsFromPdf({
      pdfBytes,
      filename: "冰箱卖点.pdf",
      productName: "SPACE Master BCD-640",
      apiKey: "test-key",
      model: "gpt-4o-mini",
      complete
    });

    expect(complete).toHaveBeenCalledTimes(1);
    const request = complete.mock.calls[0][0];
    expect(request.model).toBe("gpt-4o-mini");
    expect(request.filename).toBe("冰箱卖点.pdf");
    expect(request.pdfBase64).toBe(pdfBytes.toString("base64"));
    expect(request.userPrompt).toContain("SPACE Master BCD-640");

    expect(result.isFallback).toBe(false);
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.sellingPoints).toHaveLength(2);
    expect(result.sellingPoints[0]).toMatchObject({
      title: "SPACE Master Large Capacity",
      shortLabel: "640L Capacity",
      technicalProof: "23 cu.ft. / 640L",
      priority: 1
    });
    expect(result.sellingPoints[1]).toMatchObject({
      title: "Auto Ice Maker",
      benefit: "Fresh ice anytime",
      priority: 2
    });
  });

  it("accepts a bare JSON array reply", async () => {
    const complete = vi.fn().mockResolvedValue(
      JSON.stringify([{ title: "Quiet Cooling", benefit: "39dB low noise" }])
    );

    const result = await extractSellingPointsFromPdf({
      pdfBytes,
      filename: "points.pdf",
      apiKey: "test-key",
      complete
    });

    expect(result.sellingPoints).toHaveLength(1);
    expect(result.sellingPoints[0].title).toBe("Quiet Cooling");
  });

  it("throws when the model reply is unusable", async () => {
    const complete = vi.fn().mockResolvedValue("sorry, I cannot help with that");

    await expect(
      extractSellingPointsFromPdf({
        pdfBytes,
        filename: "points.pdf",
        apiKey: "test-key",
        complete
      })
    ).rejects.toThrow(/无法解析/);
  });

  it("throws when no api key is configured", async () => {
    await expect(
      extractSellingPointsFromPdf({ pdfBytes, filename: "points.pdf", apiKey: "" })
    ).rejects.toThrow(/OPENAI_API_KEY/);
  });
});
