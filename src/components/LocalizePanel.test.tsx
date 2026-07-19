import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalizePanel } from "./LocalizePanel";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/generated/c/three.svg")) {
      return {
        ok: true,
        text: async () =>
          '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"></svg>'
      };
    }
    if (url.includes("/api/settings") && init?.method === "PUT") {
      return { ok: true, json: async () => ({ settings: JSON.parse(String(init.body)) }) };
    }
    if (url.includes("/api/settings")) {
      return { ok: true, json: async () => ({ settings: { country: "Mexico", language: "Spanish" } }) };
    }
    if (url.includes("/api/outputs")) {
      return {
        ok: true,
        json: async () => ({
          outputs: [
            { url: "/generated/a/one.png", filename: "one.png", taskId: "a", modifiedAt: "" },
            { url: "/generated/b/two.png", filename: "two.png", taskId: "b", modifiedAt: "" },
            { url: "/generated/c/three.svg", filename: "three.svg", taskId: "c", modifiedAt: "" }
          ]
        })
      };
    }
    if (url.includes("/api/localize")) {
      const body = JSON.parse(String(init?.body));
      return {
        ok: true,
        json: async () => ({
          url: `${body.outputUrl}.localized.png`,
          model: "gpt-image-1",
          sourceUrl: body.outputUrl
        })
      };
    }
    return { ok: true, json: async () => ({}) };
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal(
    "Image",
    class {
      naturalHeight = 600;
      naturalWidth = 1200;
      height = 600;
      width = 1200;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
  );
  vi.stubGlobal(
    "URL",
    class TestURL extends URL {
      static createObjectURL() {
        return "blob:localized-svg";
      }

      static revokeObjectURL() {
        return undefined;
      }
    }
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: "#ffffff"
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/png;base64,c3Zn"
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("LocalizePanel", () => {
  it("saves the system-wide market language", async () => {
    const user = userEvent.setup();
    render(<LocalizePanel />);

    await user.selectOptions(await screen.findByLabelText("系统语言"), "Portuguese");
    await user.selectOptions(screen.getByLabelText("系统国家"), "Brazil");
    await user.click(screen.getByRole("button", { name: "保存系统语言" }));

    const putCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).includes("/api/settings") && init?.method === "PUT"
    );
    expect(putCall).toBeDefined();
    expect(JSON.parse(String(putCall![1].body))).toEqual({
      country: "Brazil",
      language: "Portuguese"
    });
  });

  it("batch-converts every selected image into the target language", async () => {
    const user = userEvent.setup();
    render(<LocalizePanel />);

    await user.click(await screen.findByLabelText("选择 one.png"));
    await user.click(screen.getByLabelText("选择 two.png"));
    await user.selectOptions(screen.getByLabelText("目标语言"), "Arabic");
    await user.selectOptions(screen.getByLabelText("图像模型"), "doubao");
    await user.click(screen.getByRole("button", { name: /批量转换所选\(2\)/ }));

    await waitFor(() => {
      const localizeCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes("/api/localize")
      );
      expect(localizeCalls).toHaveLength(2);
      for (const [, init] of localizeCalls) {
        expect(JSON.parse(String(init.body))).toMatchObject({
          language: "Arabic",
          imageModel: "doubao"
        });
      }
    });

    expect(await screen.findAllByAltText("本地化结果")).toHaveLength(2);
  });

  it("rasterizes generated SVG artwork before language conversion", async () => {
    const user = userEvent.setup();
    render(<LocalizePanel />);

    await user.click(await screen.findByLabelText("选择 three.svg"));
    await user.click(screen.getByRole("button", { name: /批量转换所选\(1\)/ }));

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes("/api/localize") &&
          JSON.parse(String(init?.body)).outputUrl.endsWith("three.svg")
      );
      expect(call).toBeDefined();
      expect(JSON.parse(String(call![1].body))).toMatchObject({
        imageBase64: "c3Zn",
        imageContentType: "image/png",
        size: "1536x1024"
      });
    });
  });
  it("has no mock toggle anywhere", async () => {
    render(<LocalizePanel />);
    await screen.findByText("系统语言设置");

    expect(document.body.textContent).not.toMatch(/[Mm]ock/);
  });
});
