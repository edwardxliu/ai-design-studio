import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STYLE_TRANSFER_VARIANTS } from "@/src/domain/style-transfer";
import { demoProducts } from "@/src/domain/test-fixtures";
import { StyleTransferStudio } from "./StyleTransferStudio";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("StyleTransferStudio", () => {
  it("matches Keywords and submits all three static scene variants", async () => {
    const postBodies: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/products") {
        return new Response(JSON.stringify({ products: [demoProducts[0]] }), { status: 200 });
      }
      if (url === "/api/style-transfer" && init?.method === "POST") {
        const body = JSON.parse(String(init.body)) as Record<string, string>;
        postBodies.push(body);
        return new Response(
          JSON.stringify({
            output: {
              id: `output-${body.variantId}`,
              url: `/generated/${body.variantId}.png`,
              model: "doubao-seedream-5-0-lite",
              prompt: "test prompt",
              sourceAssetIds: [body.productAssetId, "style-reference:lab-ref-1"],
              generatedAt: "2026-07-18T12:00:00.000Z",
              isFallback: false
            }
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ error: "unexpected request" }), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<StyleTransferStudio />);

    const keywordInput = await screen.findByLabelText("场景 Keywords");
    await user.clear(keywordInput);
    await user.type(keywordInput, "石墨灰 黑色金属 建筑实验室");
    expect(screen.getByText("当前匹配：银色旗舰")).toBeInTheDocument();

    const selectors = screen.getAllByRole("combobox");
    await user.selectOptions(selectors[2], "doubao");
    const generateButton = screen.getByRole("button", { name: "生成 3 张场景图" });
    await waitFor(() => expect(generateButton).toBeEnabled());
    await user.click(generateButton);

    await screen.findByText("3/3 已完成");
    expect(postBodies).toHaveLength(3);
    expect(new Set(postBodies.map((body) => body.variantId))).toEqual(
      new Set(STYLE_TRANSFER_VARIANTS.map((variant) => variant.id))
    );
    expect(
      postBodies.every(
        (body) =>
          body.styleId === "lab" &&
          body.imageModel === "doubao" &&
          body.productAssetId === demoProducts[0].assets[0].id &&
          body.keywords === "石墨灰 黑色金属 建筑实验室"
      )
    ).toBe(true);

    const results = screen.getByRole("region", { name: "风格迁移结果" });
    expect(within(results).getAllByRole("img", { name: /风格迁移输出/ })).toHaveLength(3);
  });

  it("keeps the unified Japanese aesthetic preset active", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ products: [demoProducts[0]] }), { status: 200 }))
    );
    const user = userEvent.setup();
    render(<StyleTransferStudio />);

    const japanese = await screen.findByRole("button", { name: /日式美学风格/ });
    await user.click(japanese);

    expect(japanese).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("当前匹配：日式美学风格")).toBeInTheDocument();
    const references = screen.getAllByRole("img", { name: /日式美学风格参考/ });
    expect(references.length).toBeGreaterThanOrEqual(4);
    expect(references.every((image) => image.getAttribute("src")?.includes("japanese-aesthetic"))).toBe(true);
  });
  it("routes an empty workspace to the asset library", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ products: [] }), { status: 200 }))
    );

    render(<StyleTransferStudio />);

    expect(await screen.findByRole("link", { name: "到素材库上传产品图" })).toHaveAttribute(
      "href",
      "/assets"
    );
  });
});
