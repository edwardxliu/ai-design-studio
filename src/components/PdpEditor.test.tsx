import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoProducts } from "@/src/domain/test-fixtures";
import { PdpEditor } from "./PdpEditor";

const fetchMock = vi.fn();
const canvasContext = {
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  clip: vi.fn(),
  drawImage: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  lineTo: vi.fn(),
  measureText: vi.fn((value: string) => ({ width: value.length * 7 })),
  moveTo: vi.fn(),
  rect: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  setLineDash: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn()
} as unknown as CanvasRenderingContext2D;

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    if (String(input) === "/api/pdp/export") {
      return {
        ok: true,
        json: async () => ({
          taskId: "task-export",
          url: "/generated/pdp-canvas.svg",
          templateVersion: "pdp-canvas-v4",
          sectionCount: demoProducts[0].profile.detectedFeatures.length,
          missingImageSlots: []
        })
      };
    }

    return {
      ok: true,
      json: async () => ({ assets: demoProducts.flatMap((product) => product.assets) })
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(canvasContext);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("PdpEditor canvas interaction", () => {
  it("renders an actual canvas and removes the legacy selling-point row form", async () => {
    render(<PdpEditor products={demoProducts} />);
    await act(async () => {
      await Promise.resolve();
    });

    const canvas = screen.getByTestId("pdp-canvas");
    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas).toHaveAttribute("role", "application");
    expect(screen.queryByTestId("pdp-point-row")).not.toBeInTheDocument();
    expect(screen.getByLabelText("卖点标题")).toHaveValue("640L Capacity");
  });

  it("adds a selling-point block and opens it in the contextual inspector", async () => {
    const user = userEvent.setup();
    render(<PdpEditor products={demoProducts} />);

    await user.click(screen.getByRole("button", { name: "新增卖点" }));

    expect(screen.getByLabelText("卖点标题")).toHaveValue("New selling point");
    const selectedLayer = screen.getByLabelText("当前图层") as HTMLSelectElement;
    expect(selectedLayer.value).toContain("feature-custom-");
  });

  it("edits only the selected canvas block", async () => {
    const user = userEvent.setup();
    render(<PdpEditor products={demoProducts} />);

    const title = screen.getByLabelText("卖点标题");
    await user.clear(title);
    await user.type(title, "Priority Capacity");

    expect(title).toHaveValue("Priority Capacity");
    expect(screen.getByText(/P1 · SP1/)).toBeInTheDocument();
  });

  it("submits the live canvas layout and edited points during export", async () => {
    const user = userEvent.setup();
    render(<PdpEditor products={demoProducts} />);

    const canvas = screen.getByTestId("pdp-canvas");
    canvas.focus();
    await user.keyboard("{ArrowRight}");
    await user.click(screen.getByRole("button", { name: "导出长图" }));

    const exportCall = fetchMock.mock.calls.find(
      ([url]) => String(url) === "/api/pdp/export"
    );
    expect(exportCall).toBeDefined();
    const request = exportCall?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body));

    expect(payload.templateVersion).toBe("pdp-canvas-v4");
    expect(payload.layout.blocks.some((block: { kind: string }) => block.kind === "brand")).toBe(true);
    expect(
      payload.layout.blocks.some(
        (block: { kind: string; sellingPointId?: string }) =>
          block.kind === "selling-point" && block.sellingPointId === "feature-capacity"
      )
    ).toBe(true);
    expect(payload.sellingPoints[0].shortLabel).toBe("640L Capacity");
    expect(await screen.findByText("打开导出文件")).toBeInTheDocument();
  });

  it("removes a selected selling-point block directly from the inspector", async () => {
    const user = userEvent.setup();
    render(<PdpEditor products={demoProducts} />);

    await user.click(screen.getByRole("button", { name: "移除卖点" }));

    expect(screen.getByLabelText("卖点标题")).not.toHaveValue("640L Capacity");
    expect(screen.queryByText("640L Capacity")).not.toBeInTheDocument();
  });
});

