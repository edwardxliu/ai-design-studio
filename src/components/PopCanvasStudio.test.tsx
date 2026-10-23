import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoProducts } from "@/src/domain/test-fixtures";
import { PopCanvasStudio } from "./PopCanvasStudio";

const fetchMock = vi.fn();
const objectUrlBlobs = new Map<string, Blob>();
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
  source = "";

  set src(value: string) {
    this.source = value;
    queueMicrotask(() => this.onload?.());
  }
}

beforeEach(() => {
  fetchMock.mockReset();
  objectUrlBlobs.clear();
  fetchMock.mockImplementation(
    async (input: RequestInfo | URL, init?: RequestInit) => {
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

      if (String(input).endsWith(".png")) {
        return { ok: true, blob: async () => new Blob(["local-image"], { type: "image/png" }) };
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
      static createObjectURL(blob: Blob) {
        const url = `blob:pop-preview-${objectUrlBlobs.size}`;
        objectUrlBlobs.set(url, blob);
        return url;
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
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    (callback) => {
      callback(new Blob(["cropped"], { type: "image/png" }));
    }
  );
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("PopCanvasStudio", () => {
  it("renders the refrigerator fixed template set in an actual Canvas", async () => {
    render(<PopCanvasStudio products={demoProducts} />);
    await act(async () => {
      await Promise.resolve();
    });
    await userEvent.click(screen.getByRole("button", { name: "展开编辑 Main Sticker - USP" }));

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
    await user.click(screen.getByRole("button", { name: "展开编辑 Main Sticker" }));

    expect(screen.getByTestId("pop-product-type")).toHaveTextContent("烤箱模板");
    expect(
      screen.getByLabelText("当前 Sticker").querySelectorAll("option")
    ).toHaveLength(9);
    expect(screen.getByLabelText("当前 Sticker")).toHaveValue("oven-main-hero");
  });

  it("selects exactly one concrete Sticker variant by clicking the Canvas", async () => {
    render(<PopCanvasStudio products={demoProducts} />);
    await userEvent.click(screen.getByRole("button", { name: "展开编辑 Main Sticker - USP" }));
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
    await user.click(screen.getByRole("button", { name: "展开编辑 Main Sticker - USP" }));
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
    await user.click(screen.getByRole("button", { name: "展开编辑 Main Sticker - USP" }));

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await user.click(screen.getByRole("button", { name: "上传USP 主图" }));
    await user.upload(
      fileInput,
      new File(["image"], "feature-upload.png", { type: "image/png" })
    );

    expect(screen.getByLabelText("图片缩放")).toHaveAttribute("min", "0.25");
    await user.click(screen.getByRole("button", { name: "缩小图片" }));
    expect(screen.getByLabelText("图片缩放")).toHaveValue("0.9");
    const applyCropButton = await screen.findByRole("button", {
      name: "应用裁切"
    });
    await waitFor(() => expect(applyCropButton).toBeEnabled());
    await user.click(applyCropButton);

    await waitFor(() => {
      expect(screen.getByLabelText("USP 主图")).toHaveValue(
        "asset-uploaded-pop"
      );
    });
  });

  it("keeps one choice per group and generates every chosen and fixed material locally", async () => {
    const user = userEvent.setup();
    render(<PopCanvasStudio products={demoProducts} />);

    await user.selectOptions(screen.getByLabelText("产品"), "product-mega-oven");
    await user.click(screen.getByRole("radio", { name: "Main Sticker 方案 B" }));
    await user.click(screen.getByRole("button", { name: "展开编辑 Main Sticker" }));
    await user.clear(screen.getByLabelText("主标题"));
    await user.type(screen.getByLabelText("主标题"), "Chosen oven message");
    await user.click(screen.getByRole("radio", { name: "Body Sticker 方案 C" }));
    expect(screen.getByRole("radio", { name: "Main Sticker 方案 B" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Main Sticker 方案 A" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Body Sticker 方案 C" })).toBeChecked();
    expect(screen.getAllByText("固定模板")).toHaveLength(4);
    expect(screen.queryByLabelText("图像模型")).not.toBeInTheDocument();
    expect(screen.getByText("本地模板模式 · 拖拽贴装预览")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "生成整套 POP 物料" }));
    const results = await screen.findByRole("region", { name: "整套 POP 物料" });
    expect(within(results).getAllByRole("link", { name: /下载 PNG/ })).toHaveLength(6);
    expect(within(results).getAllByRole("link", { name: /下载 SVG/ }).map((link) => link.getAttribute("download"))).toEqual([
      "oven-main-feature.svg", "oven-corner-brand.svg", "oven-inner-display.svg",
      "oven-wobbler.svg", "oven-body-feature.svg", "oven-top-sticker.svg"
    ]);
    const svgLink = within(results).getByRole("link", { name: "下载 SVG · Main Sticker / Feature Grid" });
    const exportedSvg = await readBlob(objectUrlBlobs.get(svgLink.getAttribute("href")!)!);
    expect(exportedSvg).toContain("Chosen oven message");
    expect(fetchMock.mock.calls.some(([url]) => String(url) === "/api/pop/generate-scene")).toBe(false);
  });

  it("uses the selected product photo for placement and clears old material output on product switch", async () => {
    const user = userEvent.setup();
    render(<PopCanvasStudio products={demoProducts} />);
    expect(screen.getByAltText("SPACE Master BCD-640 本地贴装产品图")).toHaveAttribute("src", "/demo-assets/space-master-front.png");
    await user.click(screen.getByRole("button", { name: "生成整套 POP 物料" }));
    await screen.findByRole("region", { name: "整套 POP 物料" });
    await user.selectOptions(screen.getByLabelText("产品"), "product-mega-oven");
    expect(screen.getByAltText("MEGA SERIES 2.0 Freestanding Oven 本地贴装产品图")).toHaveAttribute("src", "/demo-assets/mega-oven-front.png");
    expect(screen.queryByRole("region", { name: "整套 POP 物料" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "导出当前贴装图" }));
    await screen.findByRole("link", { name: "再次下载" });
    const compositionDraw = vi.mocked(canvasContext.drawImage).mock.calls.find(([image]) => (image as unknown as MockImage).source === "/demo-assets/mega-oven-front.png");
    expect(compositionDraw).toBeDefined();
  });

  it("shows a missing product photo instead of substituting another product", async () => {
    const product = { ...demoProducts[1], id: "product-empty-oven", assets: [] };
    render(<PopCanvasStudio products={[product]} />);
    await screen.findByText("当前产品暂无产品图，请先在资产中心补充产品图片。");
    expect(screen.queryByRole("img", { name: /本地贴装产品图/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出当前贴装图" })).toBeDisabled();
  });

  it("keeps each inline preview's image clip local to that SVG instance", async () => {
    const user = userEvent.setup();
    const { container } = render(<PopCanvasStudio products={demoProducts} />);
    await user.click(screen.getByRole("button", { name: "展开编辑 Main Sticker - USP" }));
    await user.selectOptions(screen.getByLabelText("USP 主图"), "asset-space-master-front");
    await user.click(screen.getByRole("radio", { name: "Main Sticker - USP 方案 B" }));
    await user.selectOptions(screen.getByLabelText("USP 主图"), "asset-space-master-front");
    const group = screen.getByRole("region", { name: "Main Sticker - USP" });
    await waitFor(() => expect(group.querySelectorAll("svg image")).toHaveLength(2));

    const imagePreviews = Array.from(container.querySelectorAll("svg")).filter((svg) => svg.querySelector("image"));
    expect(imagePreviews).toHaveLength(3); // USP A, USP B, and the selected compositor sticker.
    expect(imagePreviews.map((svg) => {
      const clipId = svg.querySelector("image")!.getAttribute("clip-path")!.match(/url\(#([^)]*)\)/)![1];
      const resolvedClip = document.getElementById(clipId);
      expect(resolvedClip?.closest("svg")).toBe(svg);
      return resolvedClip?.querySelector("rect")?.getAttribute("height");
    })).toEqual(["918", "952", "952"]);
    const ids = Array.from(container.querySelectorAll("svg [id]")).map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);

    await user.click(screen.getByRole("button", { name: "生成整套 POP 物料" }));
    const download = await screen.findByRole("link", { name: "下载 SVG · Main Sticker - USP / Overlay" });
    const exportedSvg = await readBlob(objectUrlBlobs.get(download.getAttribute("href")!)!);
    const flatDocument = new DOMParser().parseFromString(exportedSvg, "image/svg+xml");
    expect(flatDocument.querySelector("clipPath rect")?.getAttribute("height")).toBe("952");
    expect(flatDocument.querySelector("image")?.getAttribute("clip-path")).toBe("url(#clip-811923693)");
    expect(flatDocument.querySelector("linearGradient")?.getAttribute("id")).toBe("popBlue");
  });
});

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}
