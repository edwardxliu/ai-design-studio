import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";
import { PdpEditor } from "./PdpEditor";
import { demoProducts } from "@/src/domain/test-fixtures";
vi.mock("next/navigation", () => ({ usePathname: () => "/style-transfer" }));
const requests: RequestInit[] = [];
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  requests.length = 0; window.localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async (_input, init) => {
    if (init?.method === "PUT") requests.push(init);
    return new Response(JSON.stringify({ settings: init?.method === "PUT" ? JSON.parse(String(init.body)) : { country: "Mexico", language: "Spanish" } }));
  }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); window.localStorage.clear(); });
describe("shared user settings", () => {
  it("updates the open PDP market without discarding its edits", async () => {
    const user = userEvent.setup();
    render(<AppShell><PdpEditor products={demoProducts} /></AppShell>);
    const title = screen.getByLabelText("卖点标题");
    await user.clear(title);
    await user.type(title, "Keep my draft");
    await user.click(screen.getByRole("button", { name: "用户设置" }));
    await user.click(screen.getByRole("tab", { name: "默认市场" }));
    await waitFor(() => expect(screen.getByLabelText("系统国家")).toBeEnabled());
    await user.selectOptions(screen.getByLabelText("系统国家"), "Brazil");
    await user.selectOptions(screen.getByLabelText("系统语言"), "Portuguese");
    await user.click(screen.getByRole("button", { name: "保存默认市场" }));
    await screen.findByText(/默认市场已保存/);
    await user.keyboard("{Escape}");
    expect(screen.getByText("Brazil / Portuguese")).toBeInTheDocument();
    expect(title).toHaveValue("Keep my draft");
  });
  it("keeps market-load retry available after changing appearance", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("读取默认市场失败"));
    const user = userEvent.setup();
    render(<AppShell><h1>Test</h1></AppShell>);
    await user.click(screen.getByRole("button", { name: "用户设置" }));
    await screen.findByText("读取默认市场失败");
    await user.click(screen.getByRole("button", { name: "使用Midea 蓝底图" }));
    await user.click(screen.getByRole("tab", { name: "默认市场" }));
    await user.click(screen.getByRole("button", { name: "重新读取设置" }));
    await waitFor(() => expect(screen.getByLabelText("系统国家")).toBeEnabled());
  });
  it("saves market defaults and restores focus when closed", async () => {
    const user = userEvent.setup();
    render(<AppShell><h1>Test</h1></AppShell>);
    const trigger = screen.getByRole("button", { name: "用户设置" });
    await user.click(trigger);
    const dialog = within(screen.getByRole("dialog", { name: "用户设置" }));
    await user.click(dialog.getByRole("tab", { name: "默认市场" }));
    await waitFor(() => expect(dialog.getByLabelText("系统国家")).toBeEnabled());
    await user.selectOptions(dialog.getByLabelText("系统国家"), "Brazil");
    await user.selectOptions(dialog.getByLabelText("系统语言"), "Portuguese");
    await user.click(dialog.getByRole("button", { name: "保存默认市场" }));
    expect(await dialog.findByText(/默认市场已保存/)).toBeInTheDocument();
    expect(JSON.parse(String(requests[0].body))).toEqual({ country: "Brazil", language: "Portuguese" });
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(trigger).toHaveFocus();
  });
  it("applies and persists appearance on a feature page", async () => {
    const user = userEvent.setup();
    render(<AppShell><h1>Test</h1></AppShell>);
    await user.click(screen.getByRole("button", { name: "用户设置" }));
    await user.click(screen.getByRole("button", { name: "使用Midea 蓝底图" }));
    expect(screen.getByRole("main").style.getPropertyValue("--studio-background")).toContain("studio-background-blue.webp");
    await user.click(screen.getByRole("tab", { name: "玻璃与边框" }));
    fireEvent.change(screen.getByLabelText("主窗透明度"), { target: { value: "0.32" } });
    expect(screen.getByRole("main").style.getPropertyValue("--home-frame-opacity")).toBe("0.32");
    expect(JSON.parse(window.localStorage.getItem("midea-home-glass-tuner-v2") ?? "{}").frameOpacity).toBe(0.32);
  });
  it("retains edits after a settings save failure", async () => {
    vi.mocked(fetch).mockImplementation(async (_input, init) => new Response(JSON.stringify(init?.method === "PUT" ? { error: "磁盘暂不可写" } : { settings: { country: "Mexico", language: "Spanish" } }), { status: init?.method === "PUT" ? 500 : 200 }));
    const user = userEvent.setup();
    render(<AppShell><h1>Test</h1></AppShell>);
    await user.click(screen.getByRole("button", { name: "用户设置" }));
    await user.click(screen.getByRole("tab", { name: "默认市场" }));
    await waitFor(() => expect(screen.getByLabelText("系统语言")).toBeEnabled());
    await user.selectOptions(screen.getByLabelText("系统语言"), "Arabic");
    await user.click(screen.getByRole("button", { name: "保存默认市场" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("磁盘暂不可写");
    expect(screen.getByLabelText("系统语言")).toHaveValue("Arabic");
  });
});
