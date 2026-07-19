import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoProducts } from "@/src/domain/test-fixtures";
import { PopCanvasStudio } from "./PopCanvasStudio";

const fetchMock = vi.fn();
const canvasContext = {
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  closePath: vi.fn(),
  drawImage: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  lineTo: vi.fn(),
  measureText: vi.fn((value: string) => ({ width: value.length * 7 })),
  moveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  setTransform: vi.fn(),
  stroke: vi.fn()
} as unknown as CanvasRenderingContext2D;

class MockImage {
  height = 600;
  naturalHeight = 600;
  naturalWidth = 800;
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;
  width = 800;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === "/api/pop/generate-scene") {
        return {
          ok: true,
          json: async () => ({
            flatUrl: "/generated/selected-flat.svg",
            flatPngUrl: "/generated/selected-flat.png",
            templateId: "oven-body-strip",
            templateVersion: "3.0",
            scene: {
              url: "/generated/selected-scene.png",
              model: "gpt-image-1",
              isFallback: false
            }
          })
        };
      }

      if (String(input) === "/api/upload" && init?.method === "POST") {
        return {
          ok: true,
          json: async () => ({
            assets: [
              {
                id: "asset-uploaded-pop",
                projectId: demoProducts[0].projectId,
                productId: demoProducts[0].id,
                type: "pop-input",
                filename: "feature-upload.png",
                url: "/uploads/feature-upload.png",
                source: "uploaded"
              }
            ]
          })
        };
      }

      return {
        ok: true,
        json: async () => ({
          assets: demoProducts.flatMap((product) => product.assets)
        })
      };
    }
  );

  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("Image", MockImage);
  vi.stubGlobal("PointerEvent", MouseEvent);
  vi.stubGlobal(
    "URL",
    class MockURL extends URL {
      static createObjectURL() {
        return "blob:pop-preview";
      }

      static revokeObjectURL() {
        return undefined;
      }
    }
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    canvasContext
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/png;base64,cG9w"
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("PopCanvasStudio", () => {
  it("renders the refrigerator fixed template set in an actual Canvas", async () => {
    render(<PopCanvasStudio products={demoProducts} />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("pop-template-canvas").tagName).toBe("CANVAS");
    expect(screen.getByTestId("pop-product-type")).toHaveTextContent("冰箱模板");
    expect(
      screen.getByLabelText("当前 Sticker").querySelectorAll("option")
    ).toHaveLength(8);
    expect(screen.getByLabelText("Headline")).toBeInTheDocument();
    expect(screen.getByLabelText("USP 主图")).toBeInTheDocument();
  });

  it("switches to the oven set when the oven product is selected", async () => {
    const user = userEvent.setup();
    render(<PopCanvasStudio products={demoProducts} />);

    await user.selectOptions(screen.getByLabelText("产品"), "product-mega-oven");

    expect(screen.getByTestId("pop-product-type")).toHaveTextContent("烤箱模板");
    expect(
      screen.getByLabelText("当前 Sticker").querySelectorAll("option")
    ).toHaveLength(9);
    expect(screen.getByLabelText("当前 Sticker")).toHaveValue("oven-main-hero");
  });

  it("selects exactly one concrete Sticker variant by clicking the Canvas", async () => {
    render(<PopCanvasStudio products={demoProducts} />);
    const canvas = screen.getByTestId("pop-template-canvas");

    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      bottom: 800,
      height: 800,
      left: 0,
      right: 1320,
      top: 0,
      width: 1320,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });

    fireEvent.pointerDown(canvas, {
      clientX: 320,
      clientY: 320
    });

    await waitFor(() => {
      expect(canvas).toHaveAttribute(
        "data-selected-template-id",
        "main-sticker-usp-footer"
      );
    });
    expect(screen.getByLabelText("当前 Sticker")).toHaveValue(
      "main-sticker-usp-footer"
    );
    expect(screen.getByLabelText("USP 主图")).toBeInTheDocument();
    expect(screen.queryByLabelText("底部辅助图")).not.toBeInTheDocument();
    expect(screen.getByLabelText("主标题")).toHaveValue("Headline Space");
    expect(screen.getByLabelText("副标题")).toHaveValue("Subheading Space");
  });

  it("zooms the Canvas without reducing its backing resolution", async () => {
    const user = userEvent.setup();
    render(<PopCanvasStudio products={demoProducts} />);
    const canvas = screen.getByTestId("pop-template-canvas");

    expect(canvas).toHaveStyle({ width: "1320px" });
    expect(screen.getByLabelText("POP 画布缩放")).toHaveValue("100");

    await user.click(screen.getByRole("button", { name: "放大 POP 画布" }));

    expect(canvas).toHaveStyle({ width: "1650px" });
    expect(screen.getByLabelText("POP 画布缩放")).toHaveValue("125");
  });
  it("uploads a replacement image directly into the selected gray slot", async () => {
    const user = userEvent.setup();
    render(<PopCanvasStudio products={demoProducts} />);

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await user.click(screen.getByRole("button", { name: "上传USP 主图" }));
    await user.upload(
      fileInput,
      new File(["image"], "feature-upload.png", { type: "image/png" })
    );

    await waitFor(() => {
      expect(screen.getByLabelText("USP 主图")).toHaveValue(
        "asset-uploaded-pop"
      );
    });
  });

  it("submits only the currently selected Sticker to the AI scene route", async () => {
    const user = userEvent.setup();
    render(<PopCanvasStudio products={demoProducts} />);

    await user.selectOptions(screen.getByLabelText("图像模型"), "doubao");

    await user.selectOptions(screen.getByLabelText("产品"), "product-mega-oven");
    await user.selectOptions(
      screen.getByLabelText("当前 Sticker"),
      "oven-body-strip"
    );
    await user.click(
      screen.getByRole("button", { name: "生成所选 Sticker 贴装图" })
    );

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url]) => String(url) === "/api/pop/generate-scene"
        )
      ).toBe(true);
    });

    const generationCall = fetchMock.mock.calls.find(
      ([url]) => String(url) === "/api/pop/generate-scene"
    );
    const request = generationCall?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body));

    expect(payload.templateId).toBe("oven-body-strip");
    expect(payload.imageModel).toBe("doubao");
    expect(payload.popImageBase64).toBe("cG9w");
    expect(payload.textValues).toEqual({
      headline: "Headline Space"
    });
    expect(await screen.findByAltText("POP 写实贴装场景")).toHaveAttribute(
      "src",
      "/generated/selected-scene.png"
    );
  });
});
