import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { demoProducts } from "@/src/domain/test-fixtures";
import { SkuReplacementStudio } from "./SkuReplacementStudio";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SkuReplacementStudio", () => {
  it("requires and submits the second image for reference-part replacement", async () => {
    const product = demoProducts[0];
    const referenceAsset = {
      id: "asset-reference-panel",
      projectId: product.projectId,
      productId: product.id,
      type: "sku-reference-part",
      filename: "panel.png",
      url: "/uploads/panel.png",
      source: "uploaded"
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/products") {
        return new Response(JSON.stringify({ products: [product] }), { status: 200 });
      }
      if (url === "/api/upload" && init?.method === "POST") {
        return new Response(JSON.stringify({ assets: [referenceAsset] }), { status: 200 });
      }
      if (url === "/api/sku-replacement" && init?.method === "POST") {
        return new Response(JSON.stringify({ output: {
          id: "sku-reference-part-1",
          mode: "reference-part",
          url: "/generated/sku-output.png",
          model: "doubao-seedream-5-0-lite-260128",
          prompt: "replace panel",
          sourceAssetIds: [product.assets[0].id, referenceAsset.id],
          generatedAt: "2026-07-17T00:00:00.000Z"
        } }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: "unexpected request" }), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<SkuReplacementStudio />);
    const generateButton = await screen.findByRole("button", { name: "生成替换结果" });
    expect(screen.queryByLabelText("目标产品")).not.toBeInTheDocument();
    expect(generateButton).toBeDisabled();

    await user.upload(
      screen.getByLabelText("上传image 2 · 新配件 / 部件图"),
      new File(["panel"], "panel.png", { type: "image/png" })
    );
    await user.selectOptions(screen.getByLabelText("图像模型"), "doubao");
    await waitFor(() => expect(generateButton).toBeEnabled());
    await user.click(generateButton);

    await screen.findByAltText("SKU 局部替换结果");
    const request = fetchMock.mock.calls.find(
      ([url, init]) => String(url) === "/api/sku-replacement" && init?.method === "POST"
    );
    expect(request).toBeDefined();
    expect(JSON.parse(String(request![1]?.body))).toMatchObject({
      mode: "reference-part",
      imageModel: "doubao",
      baseAssetId: product.assets[0].id,
      referenceAssetId: referenceAsset.id
    });
  });

  it("clears the selection between mask modes and can undo canvas edits", async () => {
    class MockImage {
      naturalHeight = 2;
      naturalWidth = 4;
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    const createPixels = (width: number, height: number) => {
      const data = new Uint8ClampedArray(width * height * 4);
      for (let offset = 0; offset < data.length; offset += 4) {
        data[offset] = 48;
        data[offset + 1] = 48;
        data[offset + 2] = 48;
        data[offset + 3] = 255;
      }
      return data;
    };
    const context = {
      clearRect: vi.fn(),
      createImageData: vi.fn((width: number, height: number) => ({
        data: new Uint8ClampedArray(width * height * 4),
        height,
        width
      })),
      drawImage: vi.fn(),
      getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({
        data: createPixels(width, height),
        height,
        width
      })),
      putImageData: vi.fn()
    } as unknown as CanvasRenderingContext2D;

    vi.stubGlobal("Image", MockImage);
    vi.stubGlobal("PointerEvent", MouseEvent);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ products: [demoProducts[0]] }), { status: 200 })
    ));

    const user = userEvent.setup();
    render(<SkuReplacementStudio />);
    await user.click(await screen.findByRole("tab", { name: /配件颜色替换/ }));

    const canvas = await screen.findByLabelText("SKU 部件选区画布");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      bottom: 200,
      height: 200,
      left: 0,
      right: 400,
      toJSON: () => ({}),
      top: 0,
      width: 400,
      x: 0,
      y: 0
    });
    expect(screen.getByRole("button", { name: "撤销上一步" })).toBeDisabled();

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 20, pointerId: 1 });
    await screen.findByText("选区已准备");
    expect(screen.getByRole("button", { name: "撤销上一步" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "撤销上一步" }));
    await screen.findByText("请在左侧画布选择部件");
    expect(screen.getByRole("button", { name: "撤销上一步" })).toBeDisabled();

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 20, pointerId: 2 });
    await screen.findByText("选区已准备");
    await user.click(screen.getByRole("tab", { name: /配件样式替换/ }));

    await screen.findByText("请在左侧画布选择部件");
    expect(screen.getByRole("button", { name: "撤销上一步" })).toBeDisabled();
  });

  it("exposes color and style mask workflows as separate modes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ products: [demoProducts[0]] }), { status: 200 })
    ));
    const user = userEvent.setup();
    render(<SkuReplacementStudio />);

    const colorTab = await screen.findByRole("tab", { name: /配件颜色替换/ });
    await user.click(colorTab);
    expect(screen.getByLabelText("选中部件说明")).toHaveValue("顶部银色金属包边和下方把手");
    expect(screen.getByText("请在左侧画布选择部件")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /配件样式替换/ }));
    expect(screen.getByLabelText("选中部件说明")).toHaveValue("下方把手");
  });
});