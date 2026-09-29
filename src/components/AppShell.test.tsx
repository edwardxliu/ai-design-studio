import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";
vi.mock("next/navigation", () => ({ usePathname: () => "/sku-variants" }));
describe("grouped navigation", () => {
  it("preserves all routes and exposes the active tool", async () => {
    const user = userEvent.setup();
    render(<AppShell><h1>Workbench</h1></AppShell>);
    const nav = within(screen.getByRole("navigation", { name: "平台导航" }));
    expect(nav.getByRole("button", { name: "创作中心" })).toHaveAttribute("aria-expanded", "true");
    expect(nav.getByRole("link", { name: "SKU 替换" })).toHaveAttribute("aria-current", "page");
    await user.click(nav.getByRole("button", { name: "资产中心" }));
    await user.click(nav.getByRole("button", { name: "品牌管理" }));
    expect(new Set(nav.getAllByRole("link").map(link => link.getAttribute("href")))).toEqual(new Set([
      "/studio-home", "/assets", "/products", "/white-background", "/phone-standardize", "/sku-variants",
      "/style-transfer", "/icon-design", "/product-video", "/pop", "/pdp", "/localize", "/costs"
    ]));
    await user.click(nav.getByRole("button", { name: "创作中心" }));
    expect(nav.queryByRole("link", { name: "SKU 替换" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "用户设置" })).toBeInTheDocument();
  });
});
