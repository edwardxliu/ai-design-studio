import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoProducts } from "@/src/domain/test-fixtures";
import { StyleTransferStudio } from "./StyleTransferStudio";
const bodies: Array<Record<string, string>> = [];
const output = (body: Record<string, string>) => ({
  id: "output-" + body.variantId, url: "/generated/" + body.variantId + ".png", model: "doubao-seedream-5-0-lite",
  prompt: "test", sourceAssetIds: [body.productAssetId], generatedAt: "2026-09-26T12:00:00.000Z", isFallback: false
});
beforeEach(() => {
  bodies.length = 0;
  vi.stubGlobal("fetch", vi.fn(async (input, init) => {
    if (String(input) === "/api/products") return new Response(JSON.stringify({ products: demoProducts }));
    const body = JSON.parse(String(init?.body)); bodies.push(body);
    return new Response(JSON.stringify({ output: output(body) }));
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("one-click style transfer", () => {
  it.each([1, 2, 3])("generates exactly %i downloadable outputs", async count => {
    const user = userEvent.setup(); render(<StyleTransferStudio />);
    const generate = screen.getByRole("button", { name: "生成风格图" });
    await waitFor(() => expect(generate).toBeEnabled());
    await user.click(screen.getByRole("radio", { name: count + " 张" })); await user.click(generate);
    await screen.findByText(count + "/" + count + " 已完成");
    expect(bodies.map(body => body.variantId)).toEqual(["hero-scene", "architectural-scene", "lifestyle-scene"].slice(0, count));
    const results = within(screen.getByRole("region", { name: "风格迁移结果" }));
    expect(results.getAllByRole("img", { name: /风格迁移输出/ })).toHaveLength(count);
    expect(results.getAllByRole("link", { name: /下载图片/ }).every(link => link.hasAttribute("download"))).toBe(true);
  });
  it("honors an explicitly selected preset even when custom keywords mention another", async () => {
    const user = userEvent.setup(); render(<StyleTransferStudio />);
    await user.click(await screen.findByRole("button", { name: "日式美学风格" }));
    await user.click(screen.getByText("高级描述"));
    const input = screen.getByLabelText("场景 Keywords");
    await user.clear(input); await user.type(input, "石墨灰 黑色金属");
    await user.selectOptions(screen.getByLabelText("图像模型"), "doubao");
    await user.click(screen.getByRole("radio", { name: "1 张" }));
    await user.click(screen.getByRole("button", { name: "生成风格图" })); await screen.findByText("1/1 已完成");
    expect(bodies[0]).toMatchObject({ styleId: "japanese-aesthetic", imageModel: "doubao", keywords: "石墨灰 黑色金属", productAssetId: demoProducts[0].assets[0].id });
  });
  it("selects a reference belonging to another product", async () => {
    const user = userEvent.setup(); render(<StyleTransferStudio />);
    await waitFor(() => expect(screen.getByRole("button", { name: "生成风格图" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "从素材库选择" }));
    const picker = within(screen.getByRole("dialog", { name: "选择产品素材" }));
    await user.selectOptions(picker.getByLabelText("产品"), demoProducts[1].id);
    await user.click(picker.getByRole("button", { name: demoProducts[1].assets[0].filename }));
    await user.click(screen.getByRole("radio", { name: "1 张" }));
    await user.click(screen.getByRole("button", { name: "生成风格图" })); await screen.findByText("1/1 已完成");
    expect(bodies[0]).toMatchObject({ productId: demoProducts[1].id, productAssetId: demoProducts[1].assets[0].id });
  });
  it("creates and uploads a product from an empty workspace", async () => {
    const created = { ...demoProducts[0], id: "new-product", displayName: "新风扇", category: "风扇", assets: [] };
    const uploaded = { ...demoProducts[0].assets[0], id: "new-photo", productId: created.id, filename: "fan.png" };
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      if (String(input) === "/api/products") return new Response(JSON.stringify(init?.method === "POST" ? { product: created } : { products: [] }));
      const form = init?.body as FormData;
      expect(form.get("productId")).toBe("new-product"); expect(form.get("type")).toBe("product-photo");
      return new Response(JSON.stringify({ assets: [uploaded] }));
    });
    const user = userEvent.setup(); render(<StyleTransferStudio />);
    await waitFor(() => expect(screen.getByRole("button", { name: "本地上传" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "本地上传" }));
    const dialog = within(screen.getByRole("dialog", { name: "本地上传产品图" }));
    await user.type(dialog.getByLabelText("产品名称"), "新风扇"); await user.type(dialog.getByLabelText("产品品类"), "风扇");
    await user.upload(dialog.getByLabelText("产品图片"), new File(["png"], "fan.png", { type: "image/png" }));
    await user.click(dialog.getByRole("button", { name: "上传并使用" }));
    expect(await screen.findByText("fan.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "生成风格图" })).toBeEnabled(); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("retries only failures with the original request snapshot", async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      if (String(input) === "/api/products") return new Response(JSON.stringify({ products: demoProducts }));
      const body = JSON.parse(String(init?.body)); bodies.push(body);
      const fail = body.variantId === "architectural-scene" && bodies.filter(item => item.variantId === body.variantId).length === 1;
      return new Response(JSON.stringify(fail ? { error: "请稍后重试" } : { output: output(body) }), { status: fail ? 502 : 200 });
    });
    const user = userEvent.setup(); render(<StyleTransferStudio />);
    await waitFor(() => expect(screen.getByRole("button", { name: "生成风格图" })).toBeEnabled());
    await user.click(screen.getByRole("radio", { name: "2 张" })); await user.click(screen.getByRole("button", { name: "生成风格图" }));
    const retry = await screen.findByRole("button", { name: "重试失败图片" });
    await user.click(screen.getByRole("button", { name: "日式美学风格" })); await user.click(retry);
    await screen.findByText("2/2 已完成");
    expect(bodies.map(body => body.variantId)).toEqual(["hero-scene", "architectural-scene", "architectural-scene"]);
    expect(bodies[2].styleId).toBe("premium-universal");
  });
  it("locks parameters while generating", async () => {
    vi.mocked(fetch).mockImplementation(async input => String(input) === "/api/products" ? new Response(JSON.stringify({ products: demoProducts })) : new Promise(() => undefined));
    const user = userEvent.setup(); render(<StyleTransferStudio />);
    await waitFor(() => expect(screen.getByRole("button", { name: "生成风格图" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "生成风格图" }));
    expect(screen.getByRole("button", { name: "日式美学风格" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "1 张" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "本地上传" })).toBeDisabled();
  });
});
