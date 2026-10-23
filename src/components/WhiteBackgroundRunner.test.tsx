import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductWithProfile } from "@/src/domain/types";
import { WhiteBackgroundRunner } from "./WhiteBackgroundRunner";

const product: ProductWithProfile = {
  id: "washer", projectId: "project", displayName: "洗衣机 X1", acceptsUserUploads: true,
  profile: { id: "profile", productId: "washer", category: "washer", detectedFeatures: [], localizationHints: [], confidence: 1 },
  assets: ["one", "two", "three", "four"].map((id) => ({ id, projectId: "project", productId: "washer", type: "product-photo", filename: `${id}.png`, url: `/uploads/${id}.png`, source: "uploaded" }))
};
const fetchMock = vi.fn();
let requests: Array<Record<string, unknown>>;
let failFront: boolean;
beforeEach(() => {
  requests = []; failFront = false;
  fetchMock.mockReset().mockImplementation(async (url, init) => {
    if (url === "/api/products") return { ok: true, json: async () => ({ products: [product] }) };
    if (url === "/api/white-background") {
      const body = JSON.parse(init.body); requests.push(body);
      if (failFront && body.angle === "front") return { ok: false, json: async () => ({ error: "角度生成失败" }) };
      return { ok: true, json: async () => ({ output: { angle: body.angle, url: `/generated/${body.angle}.png`, model: "test-model", width: body.width, height: body.height, sourceAssetIds: body.referenceAssetIds } }) };
    }
    if (url === "/api/upload") return { ok: true, json: async () => ({ assets: [{ ...product.assets[0], id: "new", filename: "new.png" }] }) };
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());
async function selectReference(name = "one.png") {
  await userEvent.click(await screen.findByRole("button", { name: "从素材库选择" }));
  await userEvent.click(screen.getByRole("checkbox", { name }));
  await userEvent.click(screen.getByRole("button", { name: "完成选择" }));
}
describe("white background reference workflow", () => {
  it("requires explicit reference selection and removes selections without deleting assets", async () => {
    render(<WhiteBackgroundRunner />);
    expect(await screen.findByRole("button", { name: "生成 3 张多角度图" })).toBeDisabled();
    await selectReference();
    await userEvent.click(screen.getByRole("button", { name: "移除参考图 one.png" }));
    await selectReference();
    expect(screen.getByRole("button", { name: "移除参考图 one.png" })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(false);
  });
  it("sends selected angles, references, processing controls, size and model", async () => {
    render(<WhiteBackgroundRunner />); await selectReference();
    await userEvent.click(screen.getByRole("button", { name: "右侧 · 90°" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "自动抠图" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "保留自然阴影" }));
    await userEvent.click(screen.getByRole("button", { name: /16:9/ }));
    await userEvent.selectOptions(screen.getByLabelText("图像模型"), "doubao");
    await userEvent.click(screen.getByRole("button", { name: "生成 4 张多角度图" }));
    await screen.findByRole("link", { name: "下载 正面 · 0°" });
    expect(requests.map((r) => r.angle)).toEqual(["front", "left-45", "right-45", "right-90"]);
    expect(requests.every((r) => JSON.stringify(r.referenceAssetIds) === '["one"]' && r.width === 1920 && r.height === 1080 && r.imageModel === "doubao" && r.autoRemoveBackground === false && r.naturalShadow === false && r.whiteBackground === true)).toBe(true);
  });
  it("retries only failed angles against the original settings snapshot", async () => {
    render(<WhiteBackgroundRunner />); await selectReference(); failFront = true;
    await userEvent.click(screen.getByRole("button", { name: "生成 3 张多角度图" }));
    await screen.findByRole("button", { name: "仅重试 1 张失败图" });
    await userEvent.click(screen.getByRole("button", { name: /16:9/ })); failFront = false;
    await userEvent.click(screen.getByRole("button", { name: "仅重试 1 张失败图" }));
    await waitFor(() => expect(requests).toHaveLength(4));
    expect(requests[3]).toMatchObject({ angle: "front", width: 2000, height: 2000, referenceAssetIds: ["one"] });
    await screen.findByRole("link", { name: "下载 正面 · 0°" });
    expect(screen.getAllByRole("link", { name: /^下载 / })).toHaveLength(3);
  });
  it("locks inputs while generation is in progress", async () => {
    render(<WhiteBackgroundRunner />); await selectReference();
    fetchMock.mockImplementation(() => new Promise(() => undefined));
    await userEvent.click(screen.getByRole("button", { name: "生成 3 张多角度图" }));
    expect(screen.getByLabelText("目标产品")).toBeDisabled();
    expect(screen.getByLabelText("自动抠图")).toBeDisabled();
    expect(screen.getByRole("button", { name: "右侧 · 90°" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "从素材库选择" })).toBeDisabled();
  });
  it("replaces a selected upload while preserving the prior asset in the library", async () => {
    render(<WhiteBackgroundRunner />); await selectReference();
    await userEvent.upload(screen.getByLabelText("替换 one.png"), new File(["pixels"], "new.png", { type: "image/png" }));
    await screen.findByRole("button", { name: "移除参考图 new.png" });
    await userEvent.click(screen.getByRole("button", { name: "从素材库选择" }));
    expect(screen.getByRole("checkbox", { name: "one.png" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "new.png" })).toBeChecked();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(false);
  });
  it("caps references at three and enables a fourth only after removal", async () => {
    render(<WhiteBackgroundRunner />);
    await userEvent.click(await screen.findByRole("button", { name: "从素材库选择" }));
    for (const name of ["one.png", "two.png", "three.png"]) await userEvent.click(screen.getByRole("checkbox", { name }));
    expect(screen.getByRole("checkbox", { name: "four.png" })).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox", { name: "two.png" }));
    expect(screen.getByRole("checkbox", { name: "four.png" })).toBeEnabled();
  });
  it("does not generate invalid custom dimensions or an empty angle set", async () => {
    render(<WhiteBackgroundRunner />); await selectReference();
    await userEvent.click(screen.getByRole("button", { name: /自定义/ }));
    await userEvent.clear(screen.getByLabelText("宽度"));
    expect(screen.getByRole("button", { name: "生成 3 张多角度图" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("宽度"), "1200");
    await userEvent.clear(screen.getByLabelText("高度")); await userEvent.type(screen.getByLabelText("高度"), "900");
    for (const name of ["正面 · 0°", "左前 · 45°", "右前 · 45°"]) await userEvent.click(screen.getByRole("button", { name }));
    expect(screen.getByRole("button", { name: "生成 0 张多角度图" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "背面 · 180°" }));
    await userEvent.click(screen.getByRole("button", { name: "生成 1 张多角度图" }));
    await screen.findByRole("link", { name: "下载 背面 · 180°" });
    expect(requests[0]).toMatchObject({ width: 1200, height: 900, angle: "back" });
  });
});
