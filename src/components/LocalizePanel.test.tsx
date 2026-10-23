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
    if (url === "/api/upload") return { ok: true, json: async () => ({ assets: [{ id: "poster", filename: "poster.png", url: "/uploads/poster.png", type: "pop-input", source: "uploaded", projectId: "project" }] }) };
    if (url === "/uploads/poster.png") return { ok: true, blob: async () => new Blob(["poster"], { type: "image/png" }) };
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
  it("keeps task-specific targets separate from global settings", async () => {
    render(<LocalizePanel />);
    expect(screen.queryByLabelText("系统语言")).not.toBeInTheDocument();
    expect(screen.getByLabelText("目标语言")).toBeEnabled();
    expect(screen.getByLabelText("目标国家")).toBeEnabled();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/settings", expect.anything()));
  });

  it("batch-converts user-uploaded images with multipart form data", async () => {
    const user = userEvent.setup();
    render(<LocalizePanel />);
    await user.click(screen.getByRole("button", { name: "物料组合包" }));

    const input = await screen.findByLabelText("上传待转换图片");
    await user.upload(input, [
      new File(["one"], "one.png", { type: "image/png" }),
      new File(["two"], "two.webp", { type: "image/webp" })
    ]);
    await screen.findByAltText("原图 one.png");
    await screen.findByAltText("原图 two.webp");
    await user.selectOptions(screen.getByLabelText("目标语言"), "Arabic");
    await user.selectOptions(screen.getByLabelText("图像模型"), "doubao");
    await user.click(screen.getByRole("button", { name: "生成适配图片（2）" }));

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
    await screen.findByAltText("原图 long-artwork.svg");
    await user.click(screen.getByRole("button", { name: "生成适配图片（1）" }));

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
    await screen.findByText("选择原始素材");

    expect(document.body.textContent).not.toMatch(/[Mm]ock/);
  });

  it("uses saved market defaults and selects actual library material", async () => {
    const user = userEvent.setup();
    const original = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input, init) => String(input) === "/api/settings" ? { ok: true, json: async () => ({ settings: { country: "Saudi Arabia", language: "Arabic" } }) } : original(input, init));
    render(<LocalizePanel />);
    await waitFor(() => expect(screen.getByLabelText("目标语言")).toHaveValue("Arabic"));
    expect(screen.getByLabelText("目标国家")).toHaveValue("Saudi Arabia");
    await user.click(screen.getByRole("button", { name: "从素材库选择" }));
    await user.click(await screen.findByRole("button", { name: "选择素材 poster.png" }));
    expect(await screen.findByAltText("原图 poster.png")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "生成适配图片（1）" }));
    expect(await screen.findByAltText("本地化结果 poster.png")).toBeInTheDocument();
    const form = fetchMock.mock.calls.find(([url]) => url === "/api/localize")![1].body as FormData;
    expect((form.get("image") as File).name).toBe("poster.png");
    expect(form.get("language")).toBe("Arabic");
  });

  it("pairs clean bases per material and retries only failures using the original market snapshot", async () => {
    const user = userEvent.setup();
    let first = true;
    const original = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input, init) => {
      if (String(input) === "/api/localize" && ((init.body as FormData).get("image") as File)?.name === "two.png" && first) {
        first = false;
        return { ok: false, json: async () => ({ error: "temporary error" }) };
      }
      return original(input, init);
    });
    render(<LocalizePanel />);
    await user.click(screen.getByRole("button", { name: "物料组合包" }));
    await user.upload(screen.getByLabelText("上传待转换图片"), [new File(["one"], "one.png", { type: "image/png" }), new File(["two"], "two.png", { type: "image/png" })]);
    await user.upload(await screen.findByLabelText("上传底图 one.png"), new File(["clean"], "clean.png", { type: "image/png" }));
    await screen.findByAltText("底图 one.png");
    await user.upload(screen.getByLabelText("上传底图 two.png"), new File(["clean-two"], "clean-two.png", { type: "image/png" }));
    await screen.findByAltText("底图 two.png");
    await user.click(screen.getByRole("button", { name: "生成适配图片（2）" }));
    await screen.findByText(/temporary error/);
    expect(screen.getByAltText("本地化结果 one.png")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("目标语言"), "Arabic");
    await user.click(screen.getByRole("button", { name: "移除底图 two.png" }));
    await user.click(screen.getByRole("button", { name: "重试失败项（1）" }));
    await screen.findByAltText("本地化结果 two.png");
    const calls = fetchMock.mock.calls.filter(([url]) => url === "/api/localize");
    expect(calls).toHaveLength(3);
    const forms = calls.map(([, init]) => init.body as FormData);
    expect((forms[0].get("baseImage") as File).name).toBe("clean.png");
    expect((forms[1].get("baseImage") as File).name).toBe("clean-two.png");
    expect((forms[2].get("image") as File).name).toBe("two.png");
    expect(forms[2].get("language")).toBe("Spanish");
    expect((forms[2].get("baseImage") as File).name).toBe("clean-two.png");
    expect(screen.getByAltText("本地化结果 one.png")).toBeInTheDocument();
  });

  it("limits the current bundle to 20 actual materials and prevents silent truncation on mode switch", async () => {
    const user = userEvent.setup();
    render(<LocalizePanel />);
    await user.click(screen.getByRole("button", { name: "物料组合包" }));
    await user.upload(screen.getByLabelText("上传待转换图片"), Array.from({ length: 21 }, (_, index) => new File(["pixels"], `${index}.png`, { type: "image/png" })));
    expect(await screen.findAllByAltText(/^原图 /)).toHaveLength(20);
    expect(screen.getByRole("alert")).toHaveTextContent("20");
    await user.click(screen.getByRole("button", { name: "单张素材" }));
    expect(screen.getByRole("alert")).toHaveTextContent("先移除多余物料");
    expect(screen.getByRole("button", { name: "物料组合包" })).toHaveAttribute("aria-pressed", "true");
  });

  it("locks all batch inputs until pending requests finish", async () => {
    const user = userEvent.setup();
    const original = fetchMock.getMockImplementation()!;
    let finish!: () => void;
    fetchMock.mockImplementation(async (input, init) => {
      if (String(input) === "/api/localize") await new Promise<void>(resolve => { finish = resolve; });
      return original(input, init);
    });
    render(<LocalizePanel />);
    await user.upload(screen.getByLabelText("上传待转换图片"), new File(["one"], "one.png", { type: "image/png" }));
    await screen.findByAltText("原图 one.png");
    await user.click(screen.getByRole("button", { name: "生成适配图片（1）" }));
    expect(screen.getByLabelText("目标语言")).toBeDisabled();
    expect(screen.getByLabelText("上传底图 one.png")).toBeDisabled();
    expect(screen.getByRole("button", { name: "物料组合包" })).toBeDisabled();
    expect(screen.getByLabelText("上传待转换图片")).toBeDisabled();
    finish();
    await screen.findByAltText("本地化结果 one.png");
  });

  it("releases removed, cleared and replaced previews including replaced clean bases", async () => {
    const user = userEvent.setup();
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    render(<LocalizePanel />);
    const upload = screen.getByLabelText("上传待转换图片");
    await user.upload(upload, new File(["one"], "one.png", { type: "image/png" }));
    const originalUrl = (await screen.findByAltText("原图 one.png")).getAttribute("src")!;
    await user.upload(screen.getByLabelText("上传底图 one.png"), new File(["base"], "base.png", { type: "image/png" }));
    const firstBase = (await screen.findByAltText("底图 one.png")).getAttribute("src")!;
    await user.upload(screen.getByLabelText("上传底图 one.png"), new File(["replacement"], "replacement.png", { type: "image/png" }));
    await waitFor(() => expect(revoke).toHaveBeenCalledWith(firstBase));
    const secondBase = screen.getByAltText("底图 one.png").getAttribute("src")!;
    expect(revoke).not.toHaveBeenCalledWith(originalUrl);
    expect(revoke).not.toHaveBeenCalledWith(secondBase);
    await user.upload(upload, new File(["two"], "two.png", { type: "image/png" }));
    const secondUrl = (await screen.findByAltText("原图 two.png")).getAttribute("src")!;
    await waitFor(() => expect(revoke).toHaveBeenCalledWith(originalUrl));
    expect(revoke).toHaveBeenCalledWith(secondBase);
    expect(revoke).not.toHaveBeenCalledWith(secondUrl);
    await user.click(screen.getByRole("button", { name: "移除 two.png" }));
    expect(revoke).toHaveBeenCalledWith(secondUrl);
    await user.click(screen.getByRole("button", { name: "物料组合包" }));
    await user.upload(upload, [new File(["three"], "three.png", { type: "image/png" }), new File(["four"], "four.png", { type: "image/png" })]);
    const bundleUrls = (await screen.findAllByAltText(/^原图 /)).map(image => image.getAttribute("src")!);
    await user.click(screen.getByRole("button", { name: "清空" }));
    for (const url of bundleUrls) expect(revoke).toHaveBeenCalledWith(url);
  });

  it("retains run references after inputs clear and releases them when the next run replaces it", async () => {
    const user = userEvent.setup();
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const { unmount } = render(<LocalizePanel />);
    const upload = screen.getByLabelText("上传待转换图片");
    await user.upload(upload, new File(["one"], "one.png", { type: "image/png" }));
    const originalUrl = (await screen.findByAltText("原图 one.png")).getAttribute("src")!;
    await user.upload(screen.getByLabelText("上传底图 one.png"), new File(["base"], "base.png", { type: "image/png" }));
    const baseUrl = (await screen.findByAltText("底图 one.png")).getAttribute("src")!;
    await user.click(screen.getByRole("button", { name: "生成适配图片（1）" }));
    await screen.findByAltText("本地化结果 one.png");
    await user.click(screen.getByRole("button", { name: "清空" }));
    expect(revoke).not.toHaveBeenCalledWith(originalUrl);
    expect(revoke).not.toHaveBeenCalledWith(baseUrl);
    expect(screen.getByAltText("结果对照原图 one.png")).toHaveAttribute("src", originalUrl);
    await user.upload(upload, new File(["two"], "two.png", { type: "image/png" }));
    const secondUrl = (await screen.findByAltText("原图 two.png")).getAttribute("src")!;
    expect(revoke).not.toHaveBeenCalledWith(originalUrl);
    await user.click(screen.getByRole("button", { name: "生成适配图片（1）" }));
    await screen.findByAltText("本地化结果 two.png");
    expect(revoke).toHaveBeenCalledWith(originalUrl);
    expect(revoke).toHaveBeenCalledWith(baseUrl);
    expect(revoke).not.toHaveBeenCalledWith(secondUrl);
    unmount();
    expect(revoke).toHaveBeenCalledWith(secondUrl);
  });

  it("does not revoke a newly prepared batch preview while a later SVG is still rasterizing", async () => {
    const user = userEvent.setup();
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    let finishSvg!: () => void;
    vi.stubGlobal("Image", class {
      naturalWidth = 1200; naturalHeight = 600; width = 1200; height = 600;
      onload: (() => void) | null = null;
      set src(_url: string) { finishSvg = () => this.onload?.(); }
    });
    render(<LocalizePanel />);
    await user.click(screen.getByRole("button", { name: "物料组合包" }));
    await user.upload(screen.getByLabelText("上传待转换图片"), [new File(["png"], "one.png", { type: "image/png" }), new File(["<svg/>"], "two.svg", { type: "image/svg+xml" })]);
    await waitFor(() => expect(finishSvg).toBeTypeOf("function"));
    expect(revoke).not.toHaveBeenCalledWith("blob:localized-1");
    finishSvg();
    const images = await screen.findAllByAltText(/^原图 /);
    expect(images).toHaveLength(2);
    for (const image of images) expect(revoke).not.toHaveBeenCalledWith(image.getAttribute("src"));
  });
});
