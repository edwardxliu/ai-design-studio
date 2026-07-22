import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalizePanel } from "./LocalizePanel";

const fetchMock = vi.fn();
let objectUrlIndex = 0;

beforeEach(() => {
  objectUrlIndex = 0;
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/settings") && init?.method === "PUT") {
      return { ok: true, json: async () => ({ settings: JSON.parse(String(init.body)) }) };
    }
    if (url.includes("/api/settings")) {
      return {
        ok: true,
        json: async () => ({ settings: { country: "Mexico", language: "Spanish" } })
      };
    }
    if (url.includes("/api/localize")) {
      const form = init?.body as FormData;
      const image = form.get("image") as File;
      return {
        ok: true,
        json: async () => ({
          url: `/generated/localized-${image.name}`,
          model: "gpt-image-1",
          sourceUrl: `upload:${image.name}`
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
        objectUrlIndex += 1;
        return `blob:localized-${objectUrlIndex}`;
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
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
    callback(new Blob(["png"], { type: "image/png" }));
  });
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

  it("batch-converts user-uploaded images with multipart form data", async () => {
    const user = userEvent.setup();
    render(<LocalizePanel />);

    const input = await screen.findByLabelText("上传待转换图片");
    await user.upload(input, [
      new File(["one"], "one.png", { type: "image/png" }),
      new File(["two"], "two.webp", { type: "image/webp" })
    ]);
    await screen.findByText("one.png");
    await screen.findByText("two.webp");
    await user.selectOptions(screen.getByLabelText("目标语言"), "Arabic");
    await user.selectOptions(screen.getByLabelText("图像模型"), "doubao");
    await user.click(screen.getByRole("button", { name: "转换上传图片（2）" }));

    await waitFor(() => {
      const localizeCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes("/api/localize")
      );
      expect(localizeCalls).toHaveLength(2);
      for (const [, init] of localizeCalls) {
        expect(init?.headers).toBeUndefined();
        const form = init?.body as FormData;
        expect(form.get("language")).toBe("Arabic");
        expect(form.get("imageModel")).toBe("doubao");
        expect(form.get("image")).toBeInstanceOf(File);
      }
    });

    expect(await screen.findAllByAltText(/本地化结果/)).toHaveLength(2);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/api/outputs"))).toBe(false);
  });

  it("rasterizes an uploaded SVG before sending it to the API", async () => {
    const user = userEvent.setup();
    render(<LocalizePanel />);

    const input = await screen.findByLabelText("上传待转换图片");
    await user.upload(
      input,
      new File(
        ['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"/>'],
        "long-artwork.svg",
        { type: "image/svg+xml" }
      )
    );
    await screen.findByText("long-artwork.svg");
    await user.click(screen.getByRole("button", { name: "转换上传图片（1）" }));

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([url]) =>
        String(url).includes("/api/localize")
      );
      expect(call).toBeDefined();
      const form = call![1].body as FormData;
      const image = form.get("image") as File;
      expect(image.name).toBe("long-artwork.png");
      expect(image.type).toBe("image/png");
    });
  });

  it("has no mock toggle anywhere", async () => {
    render(<LocalizePanel />);
    await screen.findByText("系统语言设置");

    expect(document.body.textContent).not.toMatch(/[Mm]ock/);
  });
});